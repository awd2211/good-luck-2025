/**
 * 质检服务
 * 与数据库表结构和控制器接口完全匹配
 */

import { query } from '../../config/database';

export interface QualityInspection {
  id: number;
  session_id: number;
  inspector_id: string;
  agent_id?: number;
  overall_score?: number;
  response_speed_score?: number;
  service_attitude_score?: number;
  problem_solving_score?: number;
  professionalism_score?: number;
  comments?: string;
  issues?: string[];
  suggestions?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  agent_name?: string;
}

/**
 * 创建质检记录
 */
export async function createInspection(data: {
  sessionId: number;
  inspectorId: number;
  agentId: number;
  qualityScore: number;
  serviceAttitude: number;
  responseSpeed: number;
  problemSolving: number;
  compliance: number;
  communication: number;
  issues?: string[];
  suggestions?: string;
}): Promise<QualityInspection> {
  // 计算总分 (假设每项满分20，总分100)
  const overallScore = Math.round(
    data.qualityScore * 0.2 +
    data.serviceAttitude * 0.3 +
    data.responseSpeed * 0.2 +
    data.problemSolving * 0.2 +
    data.compliance * 0.05 +
    data.communication * 0.05
  );

  const result = await query(
    `INSERT INTO chat_quality_inspections (
      session_id, inspector_id, agent_id,
      overall_score, response_speed_score, service_attitude_score,
      problem_solving_score, professionalism_score,
      comments, issues, suggestions, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
    RETURNING *`,
    [
      data.sessionId,
      data.inspectorId.toString(),
      data.agentId,
      overallScore,
      Math.round(data.responseSpeed),
      Math.round(data.serviceAttitude),
      Math.round(data.problemSolving),
      Math.round((data.compliance + data.communication) / 2),
      data.suggestions || '',
      data.issues || [],
      data.suggestions
    ]
  );

  return result.rows[0];
}

/**
 * 获取质检记录列表
 */
export async function getInspections(params: {
  agentId?: number;
  inspectorId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  minScore?: number;
  maxScore?: number;
  page?: number;
  limit?: number;
}): Promise<{ inspections: QualityInspection[]; total: number }> {
  const {
    agentId,
    inspectorId,
    startDate,
    endDate,
    status,
    minScore,
    maxScore,
    page = 1,
    limit = 20
  } = params;

  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (agentId) {
    conditions.push(`qi.agent_id = $${paramIndex++}`);
    queryParams.push(agentId);
  }

  if (inspectorId) {
    conditions.push(`qi.inspector_id = $${paramIndex++}`);
    queryParams.push(inspectorId.toString());
  }

  if (startDate) {
    conditions.push(`qi.created_at >= $${paramIndex++}`);
    queryParams.push(startDate);
  }

  if (endDate) {
    conditions.push(`qi.created_at <= $${paramIndex++}`);
    queryParams.push(endDate);
  }

  if (status) {
    conditions.push(`qi.status = $${paramIndex++}`);
    queryParams.push(status);
  }

  if (minScore !== undefined) {
    conditions.push(`qi.overall_score >= $${paramIndex++}`);
    queryParams.push(minScore);
  }

  if (maxScore !== undefined) {
    conditions.push(`qi.overall_score <= $${paramIndex++}`);
    queryParams.push(maxScore);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM chat_quality_inspections qi ${whereClause}`,
    queryParams
  );

  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT qi.*, a.display_name as agent_name
     FROM chat_quality_inspections qi
     LEFT JOIN customer_service_agents a ON qi.agent_id = a.id
     ${whereClause}
     ORDER BY qi.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...queryParams, limit, offset]
  );

  return {
    inspections: result.rows,
    total
  };
}

/**
 * 获取质检统计数据
 */
export async function getInspectionStatistics(params: {
  startDate?: string;
  endDate?: string;
  agentId?: number;
}): Promise<{
  total: number;
  avgScore: number;
  scoreDistribution: any[];
  statusDistribution: any[];
}> {
  const { startDate, endDate, agentId } = params;
  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    queryParams.push(startDate);
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    queryParams.push(endDate);
  }

  if (agentId) {
    conditions.push(`agent_id = $${paramIndex++}`);
    queryParams.push(agentId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const statsResult = await query(
    `SELECT
      COUNT(*) as total,
      ROUND(AVG(overall_score), 2) as avg_score
     FROM chat_quality_inspections
     ${whereClause}`,
    queryParams
  );

  const distributionResult = await query(
    `SELECT
      CASE
        WHEN overall_score >= 90 THEN '优秀'
        WHEN overall_score >= 80 THEN '良好'
        WHEN overall_score >= 70 THEN '合格'
        ELSE '待改进'
      END as level,
      COUNT(*) as count
     FROM chat_quality_inspections
     ${whereClause}
     GROUP BY level
     ORDER BY MIN(overall_score) DESC`,
    queryParams
  );

  const statusResult = await query(
    `SELECT status, COUNT(*) as count
     FROM chat_quality_inspections
     ${whereClause}
     GROUP BY status`,
    queryParams
  );

  return {
    total: parseInt(statsResult.rows[0].total) || 0,
    avgScore: parseFloat(statsResult.rows[0].avg_score) || 0,
    scoreDistribution: distributionResult.rows,
    statusDistribution: statusResult.rows
  };
}

/**
 * 更新质检记录
 */
export async function updateInspection(
  id: number,
  data: {
    overallScore?: number;
    responseSpeedScore?: number;
    serviceAttitudeScore?: number;
    problemSolvingScore?: number;
    professionalismScore?: number;
    comments?: string;
    issues?: string[];
    suggestions?: string;
    status?: string;
  }
): Promise<QualityInspection> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.overallScore !== undefined) {
    updates.push(`overall_score = $${paramIndex++}`);
    values.push(data.overallScore);
  }
  if (data.responseSpeedScore !== undefined) {
    updates.push(`response_speed_score = $${paramIndex++}`);
    values.push(data.responseSpeedScore);
  }
  if (data.serviceAttitudeScore !== undefined) {
    updates.push(`service_attitude_score = $${paramIndex++}`);
    values.push(data.serviceAttitudeScore);
  }
  if (data.problemSolvingScore !== undefined) {
    updates.push(`problem_solving_score = $${paramIndex++}`);
    values.push(data.problemSolvingScore);
  }
  if (data.professionalismScore !== undefined) {
    updates.push(`professionalism_score = $${paramIndex++}`);
    values.push(data.professionalismScore);
  }
  if (data.comments !== undefined) {
    updates.push(`comments = $${paramIndex++}`);
    values.push(data.comments);
  }
  if (data.issues !== undefined) {
    updates.push(`issues = $${paramIndex++}`);
    values.push(data.issues);
  }
  if (data.suggestions !== undefined) {
    updates.push(`suggestions = $${paramIndex++}`);
    values.push(data.suggestions);
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await query(
    `UPDATE chat_quality_inspections
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Quality inspection not found');
  }

  return result.rows[0];
}

/**
 * 删除质检记录
 */
export async function deleteInspection(id: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM chat_quality_inspections WHERE id = $1',
    [id]
  );

  return (result.rowCount || 0) > 0;
}
