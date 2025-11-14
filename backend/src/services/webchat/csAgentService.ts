/**
 * 客服人员服务层
 * 负责客服的CRUD操作、状态管理、智能分配等核心业务逻辑
 */

import { query } from '../../config/database';
import type { CSAgent } from '../../types/webchat';

/**
 * 创建客服人员
 */
export const createAgent = async (data: {
  adminId: string;
  displayName: string;
  avatarUrl?: string;
  role: 'manager' | 'agent';
  managerId?: number;
  maxConcurrentChats?: number;
  specialtyTags?: string[];
}): Promise<CSAgent> => {
  const {
    adminId,
    displayName,
    avatarUrl,
    role,
    managerId,
    maxConcurrentChats = 5,
    specialtyTags = []
  } = data;

  const result = await query(
    `INSERT INTO customer_service_agents
     (admin_id, display_name, avatar_url, role, manager_id, max_concurrent_chats, specialty_tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [adminId, displayName, avatarUrl, role, managerId, maxConcurrentChats, specialtyTags]
  );

  return result.rows[0];
};

/**
 * 获取客服列表
 */
export const getAgents = async (filters?: {
  role?: 'manager' | 'agent';
  status?: 'online' | 'busy' | 'offline';
  managerId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ agents: CSAgent[]; total: number }> => {
  const {
    role,
    status,
    managerId,
    isActive,
    page = 1,
    limit = 20
  } = filters || {};

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (role) {
    whereConditions.push(`role = $${paramIndex++}`);
    params.push(role);
  }

  if (status) {
    whereConditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  if (managerId !== undefined) {
    whereConditions.push(`manager_id = $${paramIndex++}`);
    params.push(managerId);
  }

  if (isActive !== undefined) {
    whereConditions.push(`is_active = $${paramIndex++}`);
    params.push(isActive);
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) FROM customer_service_agents ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // 获取数据
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const dataResult = await query(
    `SELECT * FROM customer_service_agents
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );

  return {
    agents: dataResult.rows,
    total
  };
};

/**
 * 根据ID获取客服详情
 */
export const getAgentById = async (id: number): Promise<CSAgent | null> => {
  const result = await query(
    'SELECT * FROM customer_service_agents WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
};

/**
 * 根据admin_id获取客服详情
 */
export const getAgentByAdminId = async (adminId: string): Promise<CSAgent | null> => {
  const result = await query(
    'SELECT * FROM customer_service_agents WHERE admin_id = $1',
    [adminId]
  );

  return result.rows[0] || null;
};

/**
 * 更新客服信息
 */
export const updateAgent = async (
  id: number,
  data: Partial<Omit<CSAgent, 'id' | 'admin_id' | 'created_at' | 'updated_at'>>
): Promise<CSAgent | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return getAgentById(id);
  }

  values.push(id);

  const result = await query(
    `UPDATE customer_service_agents
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * 删除客服
 */
export const deleteAgent = async (id: number): Promise<boolean> => {
  const result = await query(
    'DELETE FROM customer_service_agents WHERE id = $1',
    [id]
  );

  return (result.rowCount || 0) > 0;
};

/**
 * 更新客服状态
 */
export const updateAgentStatus = async (
  id: number,
  status: 'online' | 'busy' | 'offline'
): Promise<CSAgent | null> => {
  const lastOnlineAt = status === 'online' ? new Date() : undefined;

  // 更新内存状态服务
  const statusService = await import('../csAgentStatusService')
  statusService.setAgentStatus(String(id), status)

  const result = await query(
    `UPDATE customer_service_agents
     SET status = $1, last_online_at = COALESCE($2, last_online_at)
     WHERE id = $3
     RETURNING *`,
    [status, lastOnlineAt, id]
  );

  return result.rows[0] || null;
};

/**
 * 增加客服当前接待数量
 */
export const incrementChatCount = async (id: number): Promise<void> => {
  await query(
    `UPDATE customer_service_agents
     SET current_chat_count = current_chat_count + 1
     WHERE id = $1`,
    [id]
  );
};

/**
 * 减少客服当前接待数量
 */
export const decrementChatCount = async (id: number): Promise<void> => {
  await query(
    `UPDATE customer_service_agents
     SET current_chat_count = GREATEST(current_chat_count - 1, 0)
     WHERE id = $1`,
    [id]
  );
};

/**
 * 获取可用客服(在线且未满载)
 */
export const getAvailableAgents = async (specialtyTag?: string): Promise<CSAgent[]> => {
  let queryText = `
    SELECT * FROM customer_service_agents
    WHERE status = 'online'
      AND is_active = true
      AND current_chat_count < max_concurrent_chats
  `;

  const params: any[] = [];

  if (specialtyTag) {
    queryText += ` AND $1 = ANY(specialty_tags)`;
    params.push(specialtyTag);
  }

  queryText += ` ORDER BY current_chat_count ASC, last_online_at DESC`;

  const result = await query(queryText, params);
  return result.rows;
};

/**
 * 智能分配客服
 * 优先分配负载最小的在线客服
 */
export const assignAgent = async (specialtyTag?: string): Promise<CSAgent | null> => {
  const availableAgents = await getAvailableAgents(specialtyTag);

  if (availableAgents.length === 0) {
    return null;
  }

  // 返回负载最小的客服
  return availableAgents[0];
};

/**
 * 获取客服团队成员(仅限客服经理查询)
 */
export const getTeamMembers = async (managerId: number): Promise<CSAgent[]> => {
  const result = await query(
    `SELECT * FROM customer_service_agents
     WHERE manager_id = $1 AND is_active = true
     ORDER BY display_name`,
    [managerId]
  );

  return result.rows;
};

/**
 * 获取在线客服统计
 */
export const getOnlineStatistics = async (): Promise<{
  total: number;
  online: number;
  busy: number;
  offline: number;
  avgLoad: number;
}> => {
  const result = await query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'online') as online,
      COUNT(*) FILTER (WHERE status = 'busy') as busy,
      COUNT(*) FILTER (WHERE status = 'offline') as offline,
      COALESCE(AVG(current_chat_count) FILTER (WHERE status IN ('online', 'busy')), 0) as avg_load
    FROM customer_service_agents
    WHERE is_active = true
  `);

  const row = result.rows[0];

  return {
    total: parseInt(row.total),
    online: parseInt(row.online),
    busy: parseInt(row.busy),
    offline: parseInt(row.offline),
    avgLoad: parseFloat(row.avg_load)
  };
};

/**
 * 批量更新客服状态为离线(系统关闭时调用)
 */
export const setAllAgentsOffline = async (): Promise<void> => {
  await query(
    `UPDATE customer_service_agents SET status = 'offline'`
  );
};

/**
 * 验证客服是否可以接待新会话
 */
export const canAcceptNewChat = async (agentId: number): Promise<boolean> => {
  const agent = await getAgentById(agentId);

  if (!agent || !agent.is_active) {
    return false;
  }

  if (agent.status !== 'online') {
    return false;
  }

  if (agent.current_chat_count >= agent.max_concurrent_chats) {
    return false;
  }

  return true;
};
