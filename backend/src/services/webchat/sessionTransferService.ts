/**
 * 会话转接管理服务
 * 提供会话转接的创建、接受、拒绝、查询等功能
 */

import { query } from '../../config/database';

interface SessionTransfer {
  id: number;
  session_id: number;
  from_agent_id: number | null;
  to_agent_id: number;
  transfer_reason: string | null;
  transfer_notes: string | null;
  transfer_type: string;
  accepted_at: string | null;
  status: string;
  created_at: string;
}

interface TransferWithDetails extends SessionTransfer {
  from_agent_name: string | null;
  to_agent_name: string;
  user_id: string;
  session_status: string;
}

interface TransferStatistics {
  totalTransfers: number;
  pendingTransfers: number;
  acceptedTransfers: number;
  rejectedTransfers: number;
  transfersThisWeek: number;
  transfersThisMonth: number;
  topTransferAgents: Array<{
    agentId: number;
    agentName: string;
    transferCount: number;
    type: 'from' | 'to';
  }>;
  recentTransfers: Array<{
    id: number;
    sessionId: number;
    fromAgentName: string | null;
    toAgentName: string;
    transferReason: string | null;
    status: string;
    createdAt: string;
  }>;
}

/**
 * 获取转接记录列表
 */
export async function getTransfers(params: {
  sessionId?: number;
  fromAgentId?: number;
  toAgentId?: number;
  status?: string;
  transferType?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: TransferWithDetails[]; total: number }> {
  const { sessionId, fromAgentId, toAgentId, status, transferType, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (sessionId) {
    whereConditions.push(`cst.session_id = $${paramIndex}`);
    queryParams.push(sessionId);
    paramIndex++;
  }

  if (fromAgentId) {
    whereConditions.push(`cst.from_agent_id = $${paramIndex}`);
    queryParams.push(fromAgentId);
    paramIndex++;
  }

  if (toAgentId) {
    whereConditions.push(`cst.to_agent_id = $${paramIndex}`);
    queryParams.push(toAgentId);
    paramIndex++;
  }

  if (status) {
    whereConditions.push(`cst.status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }

  if (transferType) {
    whereConditions.push(`cst.transfer_type = $${paramIndex}`);
    queryParams.push(transferType);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total FROM chat_session_transfers cst ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // 获取数据
  queryParams.push(limit, offset);
  const result = await query(
    `SELECT
      cst.id,
      cst.session_id,
      cst.from_agent_id,
      cst.to_agent_id,
      cst.transfer_reason,
      cst.transfer_notes,
      cst.transfer_type,
      cst.accepted_at,
      cst.status,
      cst.created_at,
      fa.display_name as from_agent_name,
      ta.display_name as to_agent_name,
      cs.user_id,
      cs.status as session_status
    FROM chat_session_transfers cst
    LEFT JOIN customer_service_agents fa ON cst.from_agent_id = fa.id
    JOIN customer_service_agents ta ON cst.to_agent_id = ta.id
    JOIN chat_sessions cs ON cst.session_id = cs.id
    ${whereClause}
    ORDER BY cst.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    queryParams
  );

  return {
    data: result.rows,
    total
  };
}

/**
 * 获取转接详情
 */
export async function getTransferById(transferId: number): Promise<TransferWithDetails | null> {
  const result = await query(
    `SELECT
      cst.id,
      cst.session_id,
      cst.from_agent_id,
      cst.to_agent_id,
      cst.transfer_reason,
      cst.transfer_notes,
      cst.transfer_type,
      cst.accepted_at,
      cst.status,
      cst.created_at,
      fa.display_name as from_agent_name,
      ta.display_name as to_agent_name,
      cs.user_id,
      cs.status as session_status
    FROM chat_session_transfers cst
    LEFT JOIN customer_service_agents fa ON cst.from_agent_id = fa.id
    JOIN customer_service_agents ta ON cst.to_agent_id = ta.id
    JOIN chat_sessions cs ON cst.session_id = cs.id
    WHERE cst.id = $1`,
    [transferId]
  );

  return result.rows[0] || null;
}

/**
 * 创建转接请求
 */
export async function createTransfer(data: {
  sessionId: number;
  fromAgentId?: number;
  toAgentId: number;
  transferReason?: string;
  transferNotes?: string;
  transferType?: string;
}): Promise<SessionTransfer> {
  const {
    sessionId,
    fromAgentId,
    toAgentId,
    transferReason,
    transferNotes,
    transferType = 'manual'
  } = data;

  // 检查会话是否存在
  const sessionCheck = await query(
    `SELECT id, status FROM chat_sessions WHERE id = $1`,
    [sessionId]
  );

  if (sessionCheck.rows.length === 0) {
    throw new Error('Session not found');
  }

  // 检查目标客服是否存在且在线
  const agentCheck = await query(
    `SELECT id, is_online FROM customer_service_agents WHERE id = $1`,
    [toAgentId]
  );

  if (agentCheck.rows.length === 0) {
    throw new Error('Target agent not found');
  }

  if (!agentCheck.rows[0].is_online) {
    throw new Error('Target agent is offline');
  }

  // 检查是否有pending状态的转接
  const pendingCheck = await query(
    `SELECT id FROM chat_session_transfers
    WHERE session_id = $1 AND status = 'pending'`,
    [sessionId]
  );

  if (pendingCheck.rows.length > 0) {
    throw new Error('Session already has a pending transfer');
  }

  const result = await query(
    `INSERT INTO chat_session_transfers (
      session_id,
      from_agent_id,
      to_agent_id,
      transfer_reason,
      transfer_notes,
      transfer_type,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING
      id,
      session_id,
      from_agent_id,
      to_agent_id,
      transfer_reason,
      transfer_notes,
      transfer_type,
      accepted_at,
      status,
      created_at`,
    [sessionId, fromAgentId || null, toAgentId, transferReason || null, transferNotes || null, transferType]
  );

  return result.rows[0];
}

/**
 * 接受转接
 */
export async function acceptTransfer(transferId: number, agentId: number): Promise<SessionTransfer> {
  // 检查转接是否存在且状态为pending
  const transferCheck = await query(
    `SELECT id, to_agent_id, session_id, status FROM chat_session_transfers WHERE id = $1`,
    [transferId]
  );

  if (transferCheck.rows.length === 0) {
    throw new Error('Transfer not found');
  }

  const transfer = transferCheck.rows[0];

  if (transfer.status !== 'pending') {
    throw new Error('Transfer is not pending');
  }

  if (transfer.to_agent_id !== agentId) {
    throw new Error('Only the target agent can accept this transfer');
  }

  // 开始事务
  await query('BEGIN');

  try {
    // 更新转接状态
    const result = await query(
      `UPDATE chat_session_transfers
      SET status = 'accepted',
          accepted_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING
        id,
        session_id,
        from_agent_id,
        to_agent_id,
        transfer_reason,
        transfer_notes,
        transfer_type,
        accepted_at,
        status,
        created_at`,
      [transferId]
    );

    // 更新会话的客服
    await query(
      `UPDATE chat_sessions
      SET agent_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2`,
      [agentId, transfer.session_id]
    );

    await query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * 拒绝转接
 */
export async function rejectTransfer(transferId: number, agentId: number): Promise<SessionTransfer> {
  // 检查转接是否存在且状态为pending
  const transferCheck = await query(
    `SELECT id, to_agent_id, status FROM chat_session_transfers WHERE id = $1`,
    [transferId]
  );

  if (transferCheck.rows.length === 0) {
    throw new Error('Transfer not found');
  }

  const transfer = transferCheck.rows[0];

  if (transfer.status !== 'pending') {
    throw new Error('Transfer is not pending');
  }

  if (transfer.to_agent_id !== agentId) {
    throw new Error('Only the target agent can reject this transfer');
  }

  const result = await query(
    `UPDATE chat_session_transfers
    SET status = 'rejected'
    WHERE id = $1
    RETURNING
      id,
      session_id,
      from_agent_id,
      to_agent_id,
      transfer_reason,
      transfer_notes,
      transfer_type,
      accepted_at,
      status,
      created_at`,
    [transferId]
  );

  return result.rows[0];
}

/**
 * 获取待处理的转接（针对特定客服）
 */
export async function getPendingTransfersForAgent(agentId: number): Promise<TransferWithDetails[]> {
  const result = await query(
    `SELECT
      cst.id,
      cst.session_id,
      cst.from_agent_id,
      cst.to_agent_id,
      cst.transfer_reason,
      cst.transfer_notes,
      cst.transfer_type,
      cst.accepted_at,
      cst.status,
      cst.created_at,
      fa.display_name as from_agent_name,
      ta.display_name as to_agent_name,
      cs.user_id,
      cs.status as session_status
    FROM chat_session_transfers cst
    LEFT JOIN customer_service_agents fa ON cst.from_agent_id = fa.id
    JOIN customer_service_agents ta ON cst.to_agent_id = ta.id
    JOIN chat_sessions cs ON cst.session_id = cs.id
    WHERE cst.to_agent_id = $1 AND cst.status = 'pending'
    ORDER BY cst.created_at DESC`,
    [agentId]
  );

  return result.rows;
}

/**
 * 获取转接统计
 */
export async function getTransferStatistics(): Promise<TransferStatistics> {
  // 总转接数
  const totalTransfersResult = await query(
    `SELECT COUNT(*) as total FROM chat_session_transfers`
  );

  // 待处理转接数
  const pendingTransfersResult = await query(
    `SELECT COUNT(*) as total FROM chat_session_transfers WHERE status = 'pending'`
  );

  // 已接受转接数
  const acceptedTransfersResult = await query(
    `SELECT COUNT(*) as total FROM chat_session_transfers WHERE status = 'accepted'`
  );

  // 已拒绝转接数
  const rejectedTransfersResult = await query(
    `SELECT COUNT(*) as total FROM chat_session_transfers WHERE status = 'rejected'`
  );

  // 本周转接数
  const transfersThisWeekResult = await query(
    `SELECT COUNT(*) as total FROM chat_session_transfers
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
  );

  // 本月转接数
  const transfersThisMonthResult = await query(
    `SELECT COUNT(*) as total FROM chat_session_transfers
    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
  );

  // 转出最多的客服 TOP 5
  const topFromAgentsResult = await query(
    `SELECT
      cst.from_agent_id as agent_id,
      csa.display_name as agent_name,
      COUNT(*) as transfer_count
    FROM chat_session_transfers cst
    JOIN customer_service_agents csa ON cst.from_agent_id = csa.id
    WHERE cst.from_agent_id IS NOT NULL
    GROUP BY cst.from_agent_id, csa.display_name
    ORDER BY transfer_count DESC
    LIMIT 5`
  );

  // 接收最多的客服 TOP 5
  const topToAgentsResult = await query(
    `SELECT
      cst.to_agent_id as agent_id,
      csa.display_name as agent_name,
      COUNT(*) as transfer_count
    FROM chat_session_transfers cst
    JOIN customer_service_agents csa ON cst.to_agent_id = csa.id
    GROUP BY cst.to_agent_id, csa.display_name
    ORDER BY transfer_count DESC
    LIMIT 5`
  );

  // 最近转接记录
  const recentTransfersResult = await query(
    `SELECT
      cst.id,
      cst.session_id,
      fa.display_name as from_agent_name,
      ta.display_name as to_agent_name,
      cst.transfer_reason,
      cst.status,
      cst.created_at
    FROM chat_session_transfers cst
    LEFT JOIN customer_service_agents fa ON cst.from_agent_id = fa.id
    JOIN customer_service_agents ta ON cst.to_agent_id = ta.id
    ORDER BY cst.created_at DESC
    LIMIT 20`
  );

  const topTransferAgents = [
    ...topFromAgentsResult.rows.map(row => ({
      agentId: row.agent_id,
      agentName: row.agent_name,
      transferCount: parseInt(row.transfer_count),
      type: 'from' as const
    })),
    ...topToAgentsResult.rows.map(row => ({
      agentId: row.agent_id,
      agentName: row.agent_name,
      transferCount: parseInt(row.transfer_count),
      type: 'to' as const
    }))
  ];

  return {
    totalTransfers: parseInt(totalTransfersResult.rows[0].total),
    pendingTransfers: parseInt(pendingTransfersResult.rows[0].total),
    acceptedTransfers: parseInt(acceptedTransfersResult.rows[0].total),
    rejectedTransfers: parseInt(rejectedTransfersResult.rows[0].total),
    transfersThisWeek: parseInt(transfersThisWeekResult.rows[0].total),
    transfersThisMonth: parseInt(transfersThisMonthResult.rows[0].total),
    topTransferAgents,
    recentTransfers: recentTransfersResult.rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      fromAgentName: row.from_agent_name,
      toAgentName: row.to_agent_name,
      transferReason: row.transfer_reason,
      status: row.status,
      createdAt: row.created_at
    }))
  };
}

/**
 * 取消转接（仅pending状态可取消）
 */
export async function cancelTransfer(transferId: number, agentId: number): Promise<void> {
  const transferCheck = await query(
    `SELECT id, from_agent_id, status FROM chat_session_transfers WHERE id = $1`,
    [transferId]
  );

  if (transferCheck.rows.length === 0) {
    throw new Error('Transfer not found');
  }

  const transfer = transferCheck.rows[0];

  if (transfer.status !== 'pending') {
    throw new Error('Only pending transfers can be cancelled');
  }

  if (transfer.from_agent_id !== agentId) {
    throw new Error('Only the initiator can cancel this transfer');
  }

  await query(
    `DELETE FROM chat_session_transfers WHERE id = $1`,
    [transferId]
  );
}
