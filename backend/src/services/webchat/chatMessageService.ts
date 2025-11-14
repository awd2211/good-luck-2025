/**
 * 聊天消息服务层
 * 负责消息的存储、查询、分页、已读状态管理等核心业务逻辑
 */

import { query } from '../../config/database';
import type { ChatMessage } from '../../types/webchat';

/**
 * 创建新消息
 */
export const createMessage = async (data: {
  sessionId: number;
  senderType: 'user' | 'agent' | 'system';
  senderId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'link' | 'quick_reply' | 'system';
  attachments?: any[];
  metadata?: any;
}): Promise<ChatMessage> => {
  const {
    sessionId,
    senderType,
    senderId,
    content,
    messageType = 'text',
    attachments = [],
    metadata = {}
  } = data;

  const result = await query(
    `INSERT INTO chat_messages
     (session_id, sender_type, sender_id, content, message_type, attachments, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [sessionId, senderType, senderId, content, messageType, JSON.stringify(attachments), JSON.stringify(metadata)]
  );

  // 更新会话的 updated_at 时间戳
  await query(
    'UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1',
    [sessionId]
  );

  return result.rows[0];
};

/**
 * 根据ID获取消息
 */
export const getMessageById = async (id: number): Promise<ChatMessage | null> => {
  const result = await query(
    'SELECT * FROM chat_messages WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
};

/**
 * 获取会话的消息列表(分页)
 */
export const getMessagesBySession = async (
  sessionId: number,
  options?: {
    page?: number;
    limit?: number;
    beforeMessageId?: number; // 用于加载更早的消息
  }
): Promise<{ messages: ChatMessage[]; total: number; hasMore: boolean }> => {
  const {
    page = 1,
    limit = 50,
    beforeMessageId
  } = options || {};

  // 构建查询条件
  let whereClause = 'WHERE session_id = $1';
  const params: any[] = [sessionId];
  let paramIndex = 2;

  if (beforeMessageId) {
    whereClause += ` AND id < $${paramIndex++}`;
    params.push(beforeMessageId);
  }

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) FROM chat_messages ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // 获取消息(按时间倒序,最新的在前)
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const dataResult = await query(
    `SELECT * FROM chat_messages
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );

  const messages = dataResult.rows.reverse(); // 反转回正序(旧→新)

  return {
    messages,
    total,
    hasMore: total > page * limit
  };
};

/**
 * 获取最近N条消息(不分页,用于初始加载)
 */
export const getRecentMessages = async (
  sessionId: number,
  limit: number = 50
): Promise<ChatMessage[]> => {
  const result = await query(
    `SELECT * FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [sessionId, limit]
  );

  return result.rows.reverse(); // 反转回正序(旧→新)
};

/**
 * 标记消息为已读
 */
export const markAsRead = async (
  messageId: number
): Promise<ChatMessage | null> => {
  const readAt = new Date();

  const result = await query(
    `UPDATE chat_messages
     SET is_read = true, read_at = $1
     WHERE id = $2 AND is_read = false
     RETURNING *`,
    [readAt, messageId]
  );

  return result.rows[0] || null;
};

/**
 * 批量标记消息为已读
 */
export const markMultipleAsRead = async (
  messageIds: number[]
): Promise<number> => {
  if (messageIds.length === 0) {
    return 0;
  }

  const readAt = new Date();

  const result = await query(
    `UPDATE chat_messages
     SET is_read = true, read_at = $1
     WHERE id = ANY($2) AND is_read = false`,
    [readAt, messageIds]
  );

  return result.rowCount || 0;
};

/**
 * 标记会话的所有消息为已读
 */
export const markSessionAsRead = async (
  sessionId: number,
  readerType: 'user' | 'agent'
): Promise<number> => {
  const readAt = new Date();

  // 只标记对方发送的消息
  const senderType = readerType === 'user' ? 'agent' : 'user';

  const result = await query(
    `UPDATE chat_messages
     SET is_read = true, read_at = $1
     WHERE session_id = $2 AND sender_type = $3 AND is_read = false`,
    [readAt, sessionId, senderType]
  );

  return result.rowCount || 0;
};

/**
 * 获取会话的未读消息数量
 */
export const getUnreadCount = async (
  sessionId: number,
  readerType: 'user' | 'agent'
): Promise<number> => {
  // 统计对方发送的未读消息
  const senderType = readerType === 'user' ? 'agent' : 'user';

  const result = await query(
    `SELECT COUNT(*) FROM chat_messages
     WHERE session_id = $1 AND sender_type = $2 AND is_read = false`,
    [sessionId, senderType]
  );

  return parseInt(result.rows[0].count);
};

/**
 * 获取客服的所有未读消息数量
 */
export const getAgentUnreadCount = async (agentId: number): Promise<number> => {
  const result = await query(
    `SELECT COUNT(*) FROM chat_messages cm
     JOIN chat_sessions cs ON cm.session_id = cs.id
     WHERE cs.agent_id = $1
       AND cm.sender_type = 'user'
       AND cm.is_read = false
       AND cs.status = 'active'`,
    [agentId]
  );

  return parseInt(result.rows[0].count);
};

/**
 * 获取用户的所有未读消息数量
 */
export const getUserUnreadCount = async (userId: string): Promise<number> => {
  const result = await query(
    `SELECT COUNT(*) FROM chat_messages cm
     JOIN chat_sessions cs ON cm.session_id = cs.id
     WHERE cs.user_id = $1
       AND cm.sender_type IN ('agent', 'system')
       AND cm.is_read = false
       AND cs.status = 'active'`,
    [userId]
  );

  return parseInt(result.rows[0].count);
};

/**
 * 删除消息(软删除,实际标记为已删除)
 */
export const deleteMessage = async (id: number): Promise<boolean> => {
  // 注意: 这里使用软删除,将content清空并标记
  const result = await query(
    `UPDATE chat_messages
     SET content = '[消息已删除]', metadata = jsonb_set(COALESCE(metadata, '{}'), '{deleted}', 'true')
     WHERE id = $1`,
    [id]
  );

  return (result.rowCount || 0) > 0;
};

/**
 * 获取会话的第一条和最后一条消息
 */
export const getSessionMessageBoundary = async (
  sessionId: number
): Promise<{ first: ChatMessage | null; last: ChatMessage | null }> => {
  const firstResult = await query(
    `SELECT * FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at ASC
     LIMIT 1`,
    [sessionId]
  );

  const lastResult = await query(
    `SELECT * FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [sessionId]
  );

  return {
    first: firstResult.rows[0] || null,
    last: lastResult.rows[0] || null
  };
};

/**
 * 搜索消息内容
 */
export const searchMessages = async (filters: {
  sessionId?: number;
  keyword: string;
  senderType?: 'user' | 'agent' | 'system';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<ChatMessage[]> => {
  const {
    sessionId,
    keyword,
    senderType,
    startDate,
    endDate,
    limit = 100
  } = filters;

  let whereConditions: string[] = ['content ILIKE $1'];
  let params: any[] = [`%${keyword}%`];
  let paramIndex = 2;

  if (sessionId !== undefined) {
    whereConditions.push(`session_id = $${paramIndex++}`);
    params.push(sessionId);
  }

  if (senderType) {
    whereConditions.push(`sender_type = $${paramIndex++}`);
    params.push(senderType);
  }

  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
  params.push(limit);

  const result = await query(
    `SELECT * FROM chat_messages
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++}`,
    params
  );

  return result.rows;
};

/**
 * 获取消息统计信息
 */
export const getMessageStatistics = async (filters?: {
  sessionId?: number;
  agentId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  total: number;
  byType: Record<string, number>;
  bySender: Record<string, number>;
  avgResponseTime?: number; // 平均响应时间(秒)
}> => {
  const { sessionId, agentId, startDate, endDate } = filters || {};

  let whereConditions: string[] = [];
  let params: any[] = [];
  let paramIndex = 1;

  if (sessionId !== undefined) {
    whereConditions.push(`cm.session_id = $${paramIndex++}`);
    params.push(sessionId);
  }

  if (agentId !== undefined) {
    whereConditions.push(`cs.agent_id = $${paramIndex++}`);
    params.push(agentId);
  }

  if (startDate) {
    whereConditions.push(`cm.created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`cm.created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // 基础统计
  const statsResult = await query(
    `SELECT
       COUNT(*) as total,
       json_object_agg(message_type, type_count) as by_type,
       json_object_agg(sender_type, sender_count) as by_sender
     FROM (
       SELECT
         cm.message_type,
         cm.sender_type,
         COUNT(*) OVER (PARTITION BY cm.message_type) as type_count,
         COUNT(*) OVER (PARTITION BY cm.sender_type) as sender_count
       FROM chat_messages cm
       LEFT JOIN chat_sessions cs ON cm.session_id = cs.id
       ${whereClause}
     ) subquery
     GROUP BY message_type, sender_type`,
    params
  );

  const row = statsResult.rows[0] || {};

  return {
    total: parseInt(row.total || '0'),
    byType: row.by_type || {},
    bySender: row.by_sender || {}
  };
};

/**
 * 计算会话的平均响应时间(客服首次回复用户消息的时间)
 */
export const calculateResponseTime = async (
  sessionId: number
): Promise<number | null> => {
  const result = await query(
    `WITH user_messages AS (
       SELECT id, created_at
       FROM chat_messages
       WHERE session_id = $1 AND sender_type = 'user'
       ORDER BY created_at
     ),
     agent_responses AS (
       SELECT um.id as user_msg_id, um.created_at as user_time, MIN(am.created_at) as agent_time
       FROM user_messages um
       LEFT JOIN chat_messages am ON am.session_id = $1 AND am.sender_type = 'agent' AND am.created_at > um.created_at
       GROUP BY um.id, um.created_at
     )
     SELECT AVG(EXTRACT(EPOCH FROM (agent_time - user_time))) as avg_response_time
     FROM agent_responses
     WHERE agent_time IS NOT NULL`,
    [sessionId]
  );

  const avgTime = result.rows[0]?.avg_response_time;
  return avgTime ? parseFloat(avgTime) : null;
};

/**
 * 获取快捷回复使用统计
 */
export const getQuickReplyStats = async (
  agentId?: number
): Promise<Array<{ templateId: number; usageCount: number }>> => {
  let whereClause = "WHERE cm.message_type = 'quick_reply'";
  const params: any[] = [];
  let paramIndex = 1;

  if (agentId !== undefined) {
    whereClause += ` AND cs.agent_id = $${paramIndex++}`;
    params.push(agentId);
  }

  const result = await query(
    `SELECT
       (cm.metadata->>'template_id')::integer as template_id,
       COUNT(*) as usage_count
     FROM chat_messages cm
     JOIN chat_sessions cs ON cm.session_id = cs.id
     ${whereClause}
     GROUP BY template_id
     ORDER BY usage_count DESC`,
    params
  );

  return result.rows;
};
