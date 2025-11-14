/**
 * 聊天会话服务层
 * 负责会话的创建、分配、转接、关闭等核心业务逻辑
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database';
import type { ChatSession } from '../../types/webchat';
import * as csAgentService from './csAgentService';

/**
 * 创建新会话
 */
export const createSession = async (data: {
  userId: string;
  channel?: 'web' | 'mobile' | 'app';
  priority?: number;
  metadata?: any;
}): Promise<ChatSession> => {
  const {
    userId,
    channel = 'web',
    priority = 0,
    metadata = {}
  } = data;

  const sessionKey = uuidv4();
  const queuedAt = new Date();

  const result = await query(
    `INSERT INTO chat_sessions
     (user_id, session_key, status, channel, priority, queued_at, metadata)
     VALUES ($1, $2, 'queued', $3, $4, $5, $6)
     RETURNING *`,
    [userId, sessionKey, channel, priority, queuedAt, JSON.stringify(metadata)]
  );

  return result.rows[0];
};

/**
 * 根据ID获取会话
 */
export const getSessionById = async (id: number): Promise<ChatSession | null> => {
  const result = await query(
    'SELECT * FROM chat_sessions WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
};

/**
 * 根据session_key获取会话
 */
export const getSessionByKey = async (sessionKey: string): Promise<ChatSession | null> => {
  const result = await query(
    'SELECT * FROM chat_sessions WHERE session_key = $1',
    [sessionKey]
  );

  return result.rows[0] || null;
};

/**
 * 获取会话列表
 */
export const getSessions = async (filters?: {
  userId?: string;
  agentId?: number;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ sessions: ChatSession[]; total: number }> => {
  const {
    userId,
    agentId,
    status,
    page = 1,
    limit = 20
  } = filters || {};

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (userId) {
    whereConditions.push(`user_id = $${paramIndex++}`);
    params.push(userId);
  }

  if (agentId !== undefined) {
    whereConditions.push(`agent_id = $${paramIndex++}`);
    params.push(agentId);
  }

  if (status) {
    whereConditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) FROM chat_sessions ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // 获取数据
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const dataResult = await query(
    `SELECT * FROM chat_sessions
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );

  return {
    sessions: dataResult.rows,
    total
  };
};

/**
 * 分配客服给会话
 */
export const assignAgentToSession = async (
  sessionId: number,
  agentId: number
): Promise<ChatSession | null> => {
  // 检查客服是否可以接待
  const canAccept = await csAgentService.canAcceptNewChat(agentId);

  if (!canAccept) {
    throw new Error('客服无法接待新会话');
  }

  // 更新会话状态
  const assignedAt = new Date();

  const result = await query(
    `UPDATE chat_sessions
     SET agent_id = $1, status = 'active', assigned_at = $2, started_at = $2
     WHERE id = $3 AND status = 'queued'
     RETURNING *`,
    [agentId, assignedAt, sessionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // 增加客服接待数量
  await csAgentService.incrementChatCount(agentId);

  return result.rows[0];
};

/**
 * 自动分配客服
 */
export const autoAssignAgent = async (
  sessionId: number,
  specialtyTag?: string
): Promise<ChatSession | null> => {
  // 查找可用客服
  const agent = await csAgentService.assignAgent(specialtyTag);

  if (!agent) {
    // 没有可用客服,会话保持在队列中
    return getSessionById(sessionId);
  }

  // 分配客服
  return assignAgentToSession(sessionId, agent.id);
};

/**
 * 转接会话
 */
export const transferSession = async (
  sessionId: number,
  fromAgentId: number,
  toAgentId: number,
  reason?: string
): Promise<ChatSession | null> => {
  // 检查目标客服是否可以接待
  const canAccept = await csAgentService.canAcceptNewChat(toAgentId);

  if (!canAccept) {
    throw new Error('目标客服无法接待新会话');
  }

  // 记录转接日志
  await query(
    `INSERT INTO chat_transfer_logs (session_id, from_agent_id, to_agent_id, transfer_reason)
     VALUES ($1, $2, $3, $4)`,
    [sessionId, fromAgentId, toAgentId, reason]
  );

  // 更新会话
  const result = await query(
    `UPDATE chat_sessions
     SET agent_id = $1, status = 'active'
     WHERE id = $2
     RETURNING *`,
    [toAgentId, sessionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // 更新客服接待数量
  await csAgentService.decrementChatCount(fromAgentId);
  await csAgentService.incrementChatCount(toAgentId);

  return result.rows[0];
};

/**
 * 关闭会话
 */
export const closeSession = async (
  sessionId: number,
  reason: 'user_left' | 'agent_closed' | 'timeout' | 'resolved' | 'transferred'
): Promise<ChatSession | null> => {
  const closedAt = new Date();

  const result = await query(
    `UPDATE chat_sessions
     SET status = 'closed', closed_at = $1, close_reason = $2
     WHERE id = $3
     RETURNING *`,
    [closedAt, reason, sessionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const session = result.rows[0];

  // 如果有分配客服,减少接待数量
  if (session.agent_id) {
    await csAgentService.decrementChatCount(session.agent_id);
  }

  return session;
};

/**
 * 用户评价会话
 */
export const rateSession = async (
  sessionId: number,
  rating: number,
  feedback?: string
): Promise<ChatSession | null> => {
  if (rating < 1 || rating > 5) {
    throw new Error('评分必须在1-5之间');
  }

  const result = await query(
    `UPDATE chat_sessions
     SET user_satisfaction_rating = $1, user_feedback = $2
     WHERE id = $3
     RETURNING *`,
    [rating, feedback, sessionId]
  );

  return result.rows[0] || null;
};

/**
 * 获取队列中的会话数量
 */
export const getQueueLength = async (): Promise<number> => {
  const result = await query(
    `SELECT COUNT(*) FROM chat_sessions WHERE status = 'queued'`
  );

  return parseInt(result.rows[0].count);
};

/**
 * 获取客服的活跃会话
 */
export const getActiveSessionsByAgent = async (agentId: number): Promise<ChatSession[]> => {
  const result = await query(
    `SELECT * FROM chat_sessions
     WHERE agent_id = $1 AND status = 'active'
     ORDER BY started_at DESC`,
    [agentId]
  );

  return result.rows;
};

/**
 * 获取用户的历史会话
 */
export const getUserSessions = async (
  userId: string,
  limit: number = 10
): Promise<ChatSession[]> => {
  const result = await query(
    `SELECT * FROM chat_sessions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
};

/**
 * 获取会话统计信息
 */
export const getSessionStatistics = async (filters?: {
  agentId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  total: number;
  active: number;
  closed: number;
  avgDuration: number;
  avgSatisfaction: number;
}> => {
  const { agentId, startDate, endDate } = filters || {};

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (agentId) {
    whereConditions.push(`agent_id = $${paramIndex++}`);
    params.push(agentId);
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
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const result = await query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'active') as active,
       COUNT(*) FILTER (WHERE status = 'closed') as closed,
       COALESCE(AVG(EXTRACT(EPOCH FROM (closed_at - started_at))) FILTER (WHERE closed_at IS NOT NULL), 0) as avg_duration,
       COALESCE(AVG(user_satisfaction_rating) FILTER (WHERE user_satisfaction_rating IS NOT NULL), 0) as avg_satisfaction
     FROM chat_sessions
     ${whereClause}`,
    params
  );

  const row = result.rows[0];

  return {
    total: parseInt(row.total),
    active: parseInt(row.active),
    closed: parseInt(row.closed),
    avgDuration: parseFloat(row.avg_duration),
    avgSatisfaction: parseFloat(row.avg_satisfaction)
  };
};

/**
 * 自动关闭超时会话(30分钟无消息)
 */
export const closeTimeoutSessions = async (): Promise<number> => {
  const timeoutMinutes = 30;

  const result = await query(
    `UPDATE chat_sessions
     SET status = 'closed', closed_at = NOW(), close_reason = 'timeout'
     WHERE status IN ('active', 'queued')
       AND updated_at < NOW() - INTERVAL '${timeoutMinutes} minutes'
     RETURNING id, agent_id`,
  );

  // 更新客服接待数量
  for (const row of result.rows) {
    if (row.agent_id) {
      await csAgentService.decrementChatCount(row.agent_id);
    }
  }

  return result.rowCount || 0;
};
