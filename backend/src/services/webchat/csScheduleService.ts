/**
 * 客服排班服务
 */

import { query } from '../../config/database';

export interface CSSchedule {
  id: number;
  agent_id: number;
  schedule_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  agent_name?: string;
}

export interface SwapRequest {
  id: number;
  requester_id: number;
  target_id: number;
  requester_schedule_id: number;
  target_schedule_id: number;
  reason?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

// 获取排班列表
export async function getSchedules(params: {
  agentId?: number;
  startDate?: string;
  endDate?: string;
  shiftType?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: CSSchedule[]; total: number; pagination: any }> {
  const { agentId, startDate, endDate, shiftType, isActive, page = 1, limit = 50 } = params;
  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (agentId) {
    whereConditions.push(`s.agent_id = $${paramIndex++}`);
    queryParams.push(agentId);
  }

  if (startDate) {
    whereConditions.push(`s.schedule_date >= $${paramIndex++}`);
    queryParams.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`s.schedule_date <= $${paramIndex++}`);
    queryParams.push(endDate);
  }

  if (shiftType) {
    whereConditions.push(`s.shift_type = $${paramIndex++}`);
    queryParams.push(shiftType);
  }

  if (isActive !== undefined) {
    whereConditions.push(`s.is_active = $${paramIndex++}`);
    queryParams.push(isActive);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM cs_schedules s ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT s.*, a.display_name as agent_name
    FROM cs_schedules s
    LEFT JOIN customer_service_agents a ON s.agent_id = a.id
    ${whereClause}
    ORDER BY s.schedule_date DESC, s.start_time ASC
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

// 获取单个排班
export async function getScheduleById(id: number): Promise<CSSchedule> {
  const result = await query(
    `SELECT s.*, a.display_name as agent_name
    FROM cs_schedules s
    LEFT JOIN customer_service_agents a ON s.agent_id = a.id
    WHERE s.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Schedule not found');
  }

  return result.rows[0];
}

// 创建排班
export async function createSchedule(data: {
  agentId: number;
  scheduleDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  notes?: string;
  createdBy?: string;
}): Promise<CSSchedule> {
  const { agentId, scheduleDate, shiftType, startTime, endTime, notes, createdBy } = data;

  // 检查时间冲突
  const conflictCheck = await query(
    `SELECT id FROM cs_schedules
    WHERE agent_id = $1
    AND schedule_date = $2
    AND is_active = true
    AND (
      (start_time <= $3 AND end_time > $3)
      OR (start_time < $4 AND end_time >= $4)
      OR (start_time >= $3 AND end_time <= $4)
    )`,
    [agentId, scheduleDate, startTime, endTime]
  );

  if (conflictCheck.rows.length > 0) {
    throw new Error('Schedule conflict detected');
  }

  const result = await query(
    `INSERT INTO cs_schedules (agent_id, schedule_date, shift_type, start_time, end_time, notes, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [agentId, scheduleDate, shiftType, startTime, endTime, notes, createdBy]
  );

  return result.rows[0];
}

// 更新排班
export async function updateSchedule(id: number, data: Partial<{
  scheduleDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  notes: string;
}>): Promise<CSSchedule> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.scheduleDate !== undefined) {
    updates.push(`schedule_date = $${paramIndex++}`);
    values.push(data.scheduleDate);
  }
  if (data.shiftType !== undefined) {
    updates.push(`shift_type = $${paramIndex++}`);
    values.push(data.shiftType);
  }
  if (data.startTime !== undefined) {
    updates.push(`start_time = $${paramIndex++}`);
    values.push(data.startTime);
  }
  if (data.endTime !== undefined) {
    updates.push(`end_time = $${paramIndex++}`);
    values.push(data.endTime);
  }
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }
  if (data.notes !== undefined) {
    updates.push(`notes = $${paramIndex++}`);
    values.push(data.notes);
  }

  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  values.push(id);

  const result = await query(
    `UPDATE cs_schedules
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Schedule not found');
  }

  return result.rows[0];
}

// 删除排班
export async function deleteSchedule(id: number): Promise<void> {
  const result = await query(
    `DELETE FROM cs_schedules WHERE id = $1`,
    [id]
  );

  if (result.rowCount === 0) {
    throw new Error('Schedule not found');
  }
}

// 批量创建排班
export async function batchCreateSchedules(schedules: Array<{
  agentId: number;
  scheduleDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  notes?: string;
}>): Promise<CSSchedule[]> {
  const results: CSSchedule[] = [];

  for (const schedule of schedules) {
    try {
      const created = await createSchedule(schedule);
      results.push(created);
    } catch (error: any) {
      console.error(`Failed to create schedule for ${schedule.scheduleDate}:`, error.message);
    }
  }

  return results;
}

// 获取排班统计
export async function getScheduleStatistics(params: {
  startDate?: string;
  endDate?: string;
  agentId?: number;
}): Promise<{
  totalSchedules: number;
  activeSchedules: number;
  byShiftType: any[];
  byAgent: any[];
}> {
  const { startDate, endDate, agentId } = params;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (agentId) {
    whereConditions.push(`agent_id = $${paramIndex++}`);
    queryParams.push(agentId);
  }

  if (startDate) {
    whereConditions.push(`schedule_date >= $${paramIndex++}`);
    queryParams.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`schedule_date <= $${paramIndex++}`);
    queryParams.push(endDate);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const totalResult = await query(
    `SELECT COUNT(*) as total FROM cs_schedules ${whereClause}`,
    queryParams
  );

  const activeResult = await query(
    `SELECT COUNT(*) as total FROM cs_schedules ${whereClause} ${whereConditions.length > 0 ? 'AND' : 'WHERE'} is_active = true`,
    queryParams
  );

  const shiftTypeResult = await query(
    `SELECT shift_type, COUNT(*) as count
    FROM cs_schedules
    ${whereClause}
    GROUP BY shift_type
    ORDER BY count DESC`,
    queryParams
  );

  // 如果是普通客服，不返回团队统计
  let agentResult;
  if (agentId) {
    agentResult = await query(
      `SELECT a.id, a.display_name as name, COUNT(s.id) as schedule_count
      FROM customer_service_agents a
      LEFT JOIN cs_schedules s ON a.id = s.agent_id ${whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : ''}
      WHERE a.id = $1
      GROUP BY a.id, a.display_name`,
      [agentId]
    );
  } else {
    agentResult = await query(
      `SELECT a.id, a.display_name as name, COUNT(s.id) as schedule_count
      FROM customer_service_agents a
      LEFT JOIN cs_schedules s ON a.id = s.agent_id ${whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : ''}
      GROUP BY a.id, a.display_name
      ORDER BY schedule_count DESC
      LIMIT 10`,
      queryParams
    );
  }

  return {
    totalSchedules: parseInt(totalResult.rows[0].total),
    activeSchedules: parseInt(activeResult.rows[0].total),
    byShiftType: shiftTypeResult.rows,
    byAgent: agentResult.rows
  };
}

// 获取调班请求列表
export async function getSwapRequests(params: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: SwapRequest[]; total: number; pagination: any }> {
  const { status, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let whereClause = '';
  const queryParams: any[] = [];

  if (status) {
    whereClause = 'WHERE r.status = $1';
    queryParams.push(status);
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM schedule_swap_requests r ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  const paramIndex = queryParams.length + 1;
  const result = await query(
    `SELECT r.*,
      ra.display_name as requester_name,
      ta.display_name as target_name
    FROM schedule_swap_requests r
    LEFT JOIN customer_service_agents ra ON r.requester_id = ra.id
    LEFT JOIN customer_service_agents ta ON r.target_id = ta.id
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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

// 创建调班请求
export async function createSwapRequest(data: {
  requesterId: number;
  targetId: number;
  requesterScheduleId: number;
  targetScheduleId: number;
  reason?: string;
}): Promise<SwapRequest> {
  const { requesterId, targetId, requesterScheduleId, targetScheduleId, reason } = data;

  const result = await query(
    `INSERT INTO schedule_swap_requests (requester_id, target_id, requester_schedule_id, target_schedule_id, reason)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [requesterId, targetId, requesterScheduleId, targetScheduleId, reason]
  );

  return result.rows[0];
}

// 审批调班请求
export async function reviewSwapRequest(id: number, status: string, reviewedBy: string): Promise<SwapRequest> {
  await query('BEGIN');

  try {
    const result = await query(
      `UPDATE schedule_swap_requests
      SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *`,
      [status, reviewedBy, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Swap request not found');
    }

    const swapRequest = result.rows[0];

    // 如果批准，交换排班
    if (status === 'approved') {
      // 获取两个排班的详细信息
      const schedule1 = await query(
        `SELECT * FROM cs_schedules WHERE id = $1`,
        [swapRequest.requester_schedule_id]
      );
      const schedule2 = await query(
        `SELECT * FROM cs_schedules WHERE id = $1`,
        [swapRequest.target_schedule_id]
      );

      if (schedule1.rows.length === 0 || schedule2.rows.length === 0) {
        throw new Error('Schedule not found');
      }

      // 交换 agent_id
      await query(
        `UPDATE cs_schedules SET agent_id = $1 WHERE id = $2`,
        [schedule2.rows[0].agent_id, swapRequest.requester_schedule_id]
      );
      await query(
        `UPDATE cs_schedules SET agent_id = $1 WHERE id = $2`,
        [schedule1.rows[0].agent_id, swapRequest.target_schedule_id]
      );
    }

    await query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

// 通过管理员ID获取客服代理ID
export async function getAgentIdByAdminId(adminId: string): Promise<{ id: number } | null> {
  const result = await query(
    `SELECT id FROM customer_service_agents WHERE admin_id = $1`,
    [adminId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}
