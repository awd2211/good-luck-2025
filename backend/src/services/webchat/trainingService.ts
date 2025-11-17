/**
 * 培训系统服务
 */

import { query } from '../../config/database';

export interface TrainingCourse {
  id: number;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  duration_minutes?: number;
  passing_score: number;
  is_mandatory: boolean;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingRecord {
  id: number;
  agent_id: number;
  course_id: number;
  started_at?: string;
  completed_at?: string;
  score?: number;
  status: string;
  attempts: number;
  created_at: string;
  updated_at: string;
  agent_name?: string;
  course_title?: string;
}

// 获取课程列表
export async function getCourses(params: {
  category?: string;
  isMandatory?: boolean;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: TrainingCourse[]; total: number; pagination: any }> {
  const { category, isMandatory, isPublished, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (category) {
    whereConditions.push(`category = $${paramIndex++}`);
    queryParams.push(category);
  }

  if (isMandatory !== undefined) {
    whereConditions.push(`is_mandatory = $${paramIndex++}`);
    queryParams.push(isMandatory);
  }

  if (isPublished !== undefined) {
    whereConditions.push(`is_published = $${paramIndex++}`);
    queryParams.push(isPublished);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM training_courses ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT * FROM training_courses
    ${whereClause}
    ORDER BY created_at DESC
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

// 获取课程详情
export async function getCourseById(id: number): Promise<TrainingCourse> {
  const result = await query(
    `SELECT * FROM training_courses WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Course not found');
  }

  return result.rows[0];
}

// 创建课程
export async function createCourse(data: {
  title: string;
  description?: string;
  content?: string;
  category?: string;
  durationMinutes?: number;
  passingScore?: number;
  isMandatory?: boolean;
  isPublished?: boolean;
  createdBy?: string;
}): Promise<TrainingCourse> {
  const {
    title,
    description,
    content,
    category,
    durationMinutes,
    passingScore = 80,
    isMandatory = false,
    isPublished = false,
    createdBy
  } = data;

  const result = await query(
    `INSERT INTO training_courses (title, description, content, category, duration_minutes, passing_score, is_mandatory, is_published, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [title, description, content, category, durationMinutes, passingScore, isMandatory, isPublished, createdBy]
  );

  return result.rows[0];
}

// 更新课程
export async function updateCourse(id: number, data: Partial<TrainingCourse>): Promise<TrainingCourse> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fieldMappings: { [key: string]: string } = {
    title: 'title',
    description: 'description',
    content: 'content',
    category: 'category',
    durationMinutes: 'duration_minutes',
    passingScore: 'passing_score',
    isMandatory: 'is_mandatory',
    isPublished: 'is_published'
  };

  for (const [key, dbField] of Object.entries(fieldMappings)) {
    if ((data as any)[key] !== undefined) {
      updates.push(`${dbField} = $${paramIndex++}`);
      values.push((data as any)[key]);
    }
  }

  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  values.push(id);

  const result = await query(
    `UPDATE training_courses
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Course not found');
  }

  return result.rows[0];
}

// 删除课程
export async function deleteCourse(id: number): Promise<void> {
  const result = await query(
    `DELETE FROM training_courses WHERE id = $1`,
    [id]
  );

  if (result.rowCount === 0) {
    throw new Error('Course not found');
  }
}

// 获取培训记录
export async function getTrainingRecords(params: {
  agentId?: number;
  courseId?: number;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: TrainingRecord[]; total: number; pagination: any }> {
  const { agentId, courseId, status, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (agentId) {
    whereConditions.push(`r.agent_id = $${paramIndex++}`);
    queryParams.push(agentId);
  }

  if (courseId) {
    whereConditions.push(`r.course_id = $${paramIndex++}`);
    queryParams.push(courseId);
  }

  if (status) {
    whereConditions.push(`r.status = $${paramIndex++}`);
    queryParams.push(status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM training_records r ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT r.*, a.display_name as agent_name, c.title as course_title
    FROM training_records r
    LEFT JOIN customer_service_agents a ON r.agent_id = a.id
    LEFT JOIN training_courses c ON r.course_id = c.id
    ${whereClause}
    ORDER BY r.created_at DESC
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

// 创建培训记录
export async function createTrainingRecord(data: {
  agentId: number;
  courseId: number;
}): Promise<TrainingRecord> {
  const { agentId, courseId } = data;

  const result = await query(
    `INSERT INTO training_records (agent_id, course_id, status)
    VALUES ($1, $2, 'not_started')
    RETURNING *`,
    [agentId, courseId]
  );

  return result.rows[0];
}

// 更新培训记录
export async function updateTrainingRecord(id: number, data: {
  status?: string;
  score?: number;
  startedAt?: string;
  completedAt?: string;
}): Promise<TrainingRecord> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }

  if (data.score !== undefined) {
    updates.push(`score = $${paramIndex++}`);
    values.push(data.score);
  }

  if (data.startedAt !== undefined) {
    updates.push(`started_at = $${paramIndex++}`);
    values.push(data.startedAt);
  }

  if (data.completedAt !== undefined) {
    updates.push(`completed_at = $${paramIndex++}`);
    values.push(data.completedAt);
  }

  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  // Increment attempts if status is changing to in_progress
  if (data.status === 'in_progress') {
    updates.push(`attempts = attempts + 1`);
  }

  values.push(id);

  const result = await query(
    `UPDATE training_records
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Training record not found');
  }

  return result.rows[0];
}

// 获取统计信息
export async function getTrainingStatistics(): Promise<{
  totalCourses: number;
  publishedCourses: number;
  mandatoryCourses: number;
  totalRecords: number;
  completedRecords: number;
  averageScore: number;
}> {
  const coursesResult = await query(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_published = true) as published,
      COUNT(*) FILTER (WHERE is_mandatory = true) as mandatory
    FROM training_courses`
  );

  const recordsResult = await query(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COALESCE(AVG(score) FILTER (WHERE score IS NOT NULL), 0) as avg_score
    FROM training_records`
  );

  return {
    totalCourses: parseInt(coursesResult.rows[0].total),
    publishedCourses: parseInt(coursesResult.rows[0].published),
    mandatoryCourses: parseInt(coursesResult.rows[0].mandatory),
    totalRecords: parseInt(recordsResult.rows[0].total),
    completedRecords: parseInt(recordsResult.rows[0].completed),
    averageScore: parseFloat(recordsResult.rows[0].avg_score)
  };
}
