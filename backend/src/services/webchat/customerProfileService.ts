/**
 * 客户画像服务
 */

import { query } from '../../config/database';

export interface CustomerProfile {
  user_id: string;
  total_sessions: number;
  total_messages: number;
  avg_satisfaction_rating?: number;
  last_contact_at?: string;
  preferred_agent_id?: number;
  preferred_agent_name?: string;
  vip_level: number;
  risk_score: number;
  lifetime_value: number;
  tags_summary?: any;
  notes_count: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerBehavior {
  id: number;
  user_id: string;
  action_type: string;
  action_detail?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// 获取客户画像列表
export async function getCustomerProfiles(params: {
  vipLevel?: number;
  riskScoreMin?: number;
  riskScoreMax?: number;
  page?: number;
  limit?: number;
}): Promise<{ data: CustomerProfile[]; total: number; pagination: any }> {
  const { vipLevel, riskScoreMin, riskScoreMax, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (vipLevel !== undefined) {
    whereConditions.push(`vip_level = $${paramIndex++}`);
    queryParams.push(vipLevel);
  }

  if (riskScoreMin !== undefined) {
    whereConditions.push(`risk_score >= $${paramIndex++}`);
    queryParams.push(riskScoreMin);
  }

  if (riskScoreMax !== undefined) {
    whereConditions.push(`risk_score <= $${paramIndex++}`);
    queryParams.push(riskScoreMax);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM customer_profiles ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT p.*, a.display_name as preferred_agent_name
    FROM customer_profiles p
    LEFT JOIN customer_service_agents a ON p.preferred_agent_id = a.id
    ${whereClause}
    ORDER BY p.last_contact_at DESC NULLS LAST
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...queryParams, limit, offset]
  );

  return {
    data: result.rows,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// 获取单个客户画像
export async function getCustomerProfile(userId: string): Promise<{
  profile: CustomerProfile;
  tags: any[];
  notes: any[];
  recentSessions: any[];
  recentBehaviors: any[];
}> {
  // 获取基础画像
  const profileResult = await query(
    `SELECT p.*, a.display_name as preferred_agent_name
    FROM customer_profiles p
    LEFT JOIN customer_service_agents a ON p.preferred_agent_id = a.id
    WHERE p.user_id = $1`,
    [userId]
  );

  let profile = profileResult.rows[0];

  // 如果画像不存在，创建一个
  if (!profile) {
    const createResult = await query(
      `INSERT INTO customer_profiles (user_id)
      VALUES ($1)
      RETURNING *`,
      [userId]
    );
    profile = createResult.rows[0];
  }

  // 获取用户标签
  const tagsResult = await query(
    `SELECT t.*, ct.tag_name, ct.tag_color
    FROM user_tags t
    JOIN customer_tags ct ON t.tag_id = ct.id
    WHERE t.user_id = $1
    ORDER BY t.assigned_at DESC`,
    [userId]
  );

  // 获取用户备注
  const notesResult = await query(
    `SELECT * FROM customer_notes
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 10`,
    [userId]
  );

  // 获取最近会话
  const sessionsResult = await query(
    `SELECT s.*, a.display_name as agent_name
    FROM chat_sessions s
    LEFT JOIN customer_service_agents a ON s.agent_id = a.id
    WHERE s.user_id = $1
    ORDER BY s.created_at DESC
    LIMIT 10`,
    [userId]
  );

  // 获取最近行为
  const behaviorsResult = await query(
    `SELECT * FROM customer_behavior_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 20`,
    [userId]
  );

  return {
    profile,
    tags: tagsResult.rows,
    notes: notesResult.rows,
    recentSessions: sessionsResult.rows,
    recentBehaviors: behaviorsResult.rows
  };
}

// 更新客户画像
export async function updateCustomerProfile(userId: string, data: {
  vipLevel?: number;
  riskScore?: number;
  lifetimeValue?: number;
  preferredAgentId?: number;
}): Promise<CustomerProfile> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.vipLevel !== undefined) {
    updates.push(`vip_level = $${paramIndex++}`);
    values.push(data.vipLevel);
  }

  if (data.riskScore !== undefined) {
    updates.push(`risk_score = $${paramIndex++}`);
    values.push(data.riskScore);
  }

  if (data.lifetimeValue !== undefined) {
    updates.push(`lifetime_value = $${paramIndex++}`);
    values.push(data.lifetimeValue);
  }

  if (data.preferredAgentId !== undefined) {
    updates.push(`preferred_agent_id = $${paramIndex++}`);
    values.push(data.preferredAgentId);
  }

  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  values.push(userId);

  const result = await query(
    `UPDATE customer_profiles
    SET ${updates.join(', ')}
    WHERE user_id = $${paramIndex}
    RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Profile not found');
  }

  return result.rows[0];
}

// 记录客户行为
export async function logCustomerBehavior(data: {
  userId: string;
  actionType: string;
  actionDetail?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<CustomerBehavior> {
  const { userId, actionType, actionDetail, ipAddress, userAgent } = data;

  const result = await query(
    `INSERT INTO customer_behavior_logs (user_id, action_type, action_detail, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [userId, actionType, actionDetail ? JSON.stringify(actionDetail) : null, ipAddress, userAgent]
  );

  return result.rows[0];
}

// 获取统计信息
export async function getCustomerStatistics(): Promise<{
  totalProfiles: number;
  vipProfiles: number;
  highRiskProfiles: number;
  averageLifetimeValue: number;
  averageSatisfaction: number;
  totalBehaviors: number;
  vipDistribution: any[];
}> {
  const profilesResult = await query(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE vip_level > 0) as vip,
      COUNT(*) FILTER (WHERE risk_score > 50) as high_risk,
      COALESCE(AVG(lifetime_value), 0) as avg_ltv,
      COALESCE(AVG(avg_satisfaction_rating), 0) as avg_satisfaction
    FROM customer_profiles`
  );

  const behaviorsResult = await query(
    `SELECT COUNT(*) as total FROM customer_behavior_logs`
  );

  const vipDistResult = await query(
    `SELECT vip_level, COUNT(*) as count
    FROM customer_profiles
    GROUP BY vip_level
    ORDER BY vip_level`
  );

  return {
    totalProfiles: parseInt(profilesResult.rows[0].total),
    vipProfiles: parseInt(profilesResult.rows[0].vip),
    highRiskProfiles: parseInt(profilesResult.rows[0].high_risk),
    averageLifetimeValue: parseFloat(profilesResult.rows[0].avg_ltv),
    averageSatisfaction: parseFloat(profilesResult.rows[0].avg_satisfaction),
    totalBehaviors: parseInt(behaviorsResult.rows[0].total),
    vipDistribution: vipDistResult.rows
  };
}

// 搜索客户
export async function searchCustomers(keyword: string): Promise<CustomerProfile[]> {
  const result = await query(
    `SELECT p.*, a.display_name as preferred_agent_name
    FROM customer_profiles p
    LEFT JOIN customer_service_agents a ON p.preferred_agent_id = a.id
    WHERE p.user_id ILIKE $1
    ORDER BY p.last_contact_at DESC
    LIMIT 50`,
    [`%${keyword}%`]
  );

  return result.rows;
}
