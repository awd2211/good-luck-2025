/**
 * 客户满意度评价服务层
 * 负责满意度评价的创建、查询、统计等业务逻辑
 */

import { query } from '../../config/database';

export interface SatisfactionRating {
  id: number;
  session_id: number;
  user_id: string;
  agent_id: number | null;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

/**
 * 创建满意度评价
 */
export const createRating = async (data: {
  sessionId: number;
  userId: string;
  agentId?: number;
  rating: number;
  comment?: string;
  tags?: string[];
  ipAddress?: string;
  userAgent?: string;
}): Promise<SatisfactionRating> => {
  const {
    sessionId,
    userId,
    agentId,
    rating,
    comment,
    tags = [],
    ipAddress,
    userAgent
  } = data;

  // 验证评分范围
  if (rating < 1 || rating > 5) {
    throw new Error('评分必须在1-5之间');
  }

  const result = await query(
    `INSERT INTO chat_satisfaction_ratings
     (session_id, user_id, agent_id, rating, comment, tags, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [sessionId, userId, agentId, rating, comment, tags, ipAddress, userAgent]
  );

  // 同时更新会话表中的满意度字段
  await query(
    `UPDATE chat_sessions
     SET satisfaction_rating = $1,
         satisfaction_comment = $2,
         rated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [rating, comment, sessionId]
  );

  return result.rows[0];
};

/**
 * 获取会话的满意度评价
 */
export const getRatingBySessionId = async (sessionId: number): Promise<SatisfactionRating | null> => {
  const result = await query(
    'SELECT * FROM chat_satisfaction_ratings WHERE session_id = $1',
    [sessionId]
  );

  return result.rows[0] || null;
};

/**
 * 查询满意度评价列表
 */
export const getRatings = async (filters?: {
  agentId?: number;
  rating?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: SatisfactionRating[]; total: number }> => {
  const {
    agentId,
    rating,
    startDate,
    endDate,
    page = 1,
    limit = 20
  } = filters || {};

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (agentId) {
    whereConditions.push(`agent_id = $${paramIndex++}`);
    params.push(agentId);
  }

  if (rating) {
    whereConditions.push(`rating = $${paramIndex++}`);
    params.push(rating);
  }

  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // 查询总数
  const countResult = await query(
    `SELECT COUNT(*) FROM chat_satisfaction_ratings ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // 查询数据
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const result = await query(
    `SELECT * FROM chat_satisfaction_ratings
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );

  return {
    data: result.rows,
    total
  };
};

/**
 * 获取客服的平均满意度
 */
export const getAgentAverageRating = async (
  agentId: number,
  startDate?: string,
  endDate?: string
): Promise<{
  avgRating: number;
  totalCount: number;
  ratingDistribution: { rating: number; count: number }[];
}> => {
  let whereConditions = ['agent_id = $1'];
  let params: any[] = [agentId];
  let paramIndex = 2;

  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = 'WHERE ' + whereConditions.join(' AND ');

  // 平均分和总数
  const avgResult = await query(
    `SELECT
       COALESCE(AVG(rating), 0) as avg_rating,
       COUNT(*) as total_count
     FROM chat_satisfaction_ratings
     ${whereClause}`,
    params
  );

  // 评分分布
  const distResult = await query(
    `SELECT
       rating,
       COUNT(*) as count
     FROM chat_satisfaction_ratings
     ${whereClause}
     GROUP BY rating
     ORDER BY rating DESC`,
    params
  );

  return {
    avgRating: parseFloat(avgResult.rows[0].avg_rating),
    totalCount: parseInt(avgResult.rows[0].total_count),
    ratingDistribution: distResult.rows.map(row => ({
      rating: row.rating,
      count: parseInt(row.count)
    }))
  };
};

/**
 * 获取满意度统计数据
 */
export const getStatistics = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalRatings: number;
  avgRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  satisfactionRate: number;  // 满意率(4-5星占比)
  topRatedAgents: { agentId: number; displayName: string; avgRating: number; count: number }[];
  lowRatedSessions: { sessionId: number; rating: number; comment: string; createdAt: Date }[];
}> => {
  const { startDate, endDate } = filters || {};

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (startDate) {
    whereConditions.push(`csr.created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`csr.created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // 总体统计
  const overallResult = await query(
    `SELECT
       COUNT(*) as total_ratings,
       COALESCE(AVG(rating), 0) as avg_rating,
       SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
       SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
       SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
       SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
       SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
       SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) * 100 as satisfaction_rate
     FROM chat_satisfaction_ratings csr
     ${whereClause}`,
    params
  );

  const stats = overallResult.rows[0];

  // Top评分客服
  const topAgentsResult = await query(
    `SELECT
       csr.agent_id,
       csa.display_name,
       AVG(csr.rating) as avg_rating,
       COUNT(*) as count
     FROM chat_satisfaction_ratings csr
     JOIN customer_service_agents csa ON csr.agent_id = csa.id
     ${whereClause}
     GROUP BY csr.agent_id, csa.display_name
     HAVING COUNT(*) >= 5
     ORDER BY avg_rating DESC, count DESC
     LIMIT 10`,
    params
  );

  // 低分会话(需要关注)
  const lowRatedResult = await query(
    `SELECT
       session_id,
       rating,
       comment,
       created_at
     FROM chat_satisfaction_ratings csr
     ${whereClause ? whereClause + ' AND' : 'WHERE'} rating <= 2
     ORDER BY created_at DESC
     LIMIT 20`,
    whereClause ? params : []
  );

  return {
    totalRatings: parseInt(stats.total_ratings),
    avgRating: parseFloat(stats.avg_rating),
    fiveStarCount: parseInt(stats.five_star || 0),
    fourStarCount: parseInt(stats.four_star || 0),
    threeStarCount: parseInt(stats.three_star || 0),
    twoStarCount: parseInt(stats.two_star || 0),
    oneStarCount: parseInt(stats.one_star || 0),
    satisfactionRate: parseFloat(stats.satisfaction_rate || 0),
    topRatedAgents: topAgentsResult.rows.map(row => ({
      agentId: row.agent_id,
      displayName: row.display_name,
      avgRating: parseFloat(row.avg_rating),
      count: parseInt(row.count)
    })),
    lowRatedSessions: lowRatedResult.rows
  };
};

/**
 * 获取评价标签统计
 */
export const getTagStatistics = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ tag: string; count: number }[]> => {
  const { startDate, endDate } = filters || {};

  let whereConditions: string[] = ['tags IS NOT NULL', 'array_length(tags, 1) > 0'];
  let params: any[] = [];
  let paramIndex = 1;

  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = 'WHERE ' + whereConditions.join(' AND ');

  const result = await query(
    `SELECT
       unnest(tags) as tag,
       COUNT(*) as count
     FROM chat_satisfaction_ratings
     ${whereClause}
     GROUP BY tag
     ORDER BY count DESC
     LIMIT 20`,
    params
  );

  return result.rows.map(row => ({
    tag: row.tag,
    count: parseInt(row.count)
  }));
};

/**
 * 删除评价(管理员功能)
 */
export const deleteRating = async (id: number): Promise<boolean> => {
  const result = await query(
    'DELETE FROM chat_satisfaction_ratings WHERE id = $1 RETURNING id',
    [id]
  );

  return (result.rowCount || 0) > 0;
};
