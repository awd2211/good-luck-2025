/**
 * 客户备注管理服务
 * 提供客户备注的增删改查功能
 */

import { query } from '../../config/database';

interface CustomerNote {
  id: number;
  user_id: string;
  content: string;
  is_important: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface NoteWithCreator extends CustomerNote {
  creator_name: string;
  creator_role: string;
}

interface NoteStatistics {
  totalNotes: number;
  importantNotes: number;
  notesThisWeek: number;
  notesThisMonth: number;
  topUsers: Array<{
    userId: string;
    userName: string;
    noteCount: number;
  }>;
  recentNotes: Array<{
    id: number;
    userId: string;
    userName: string;
    content: string;
    isImportant: boolean;
    createdBy: string;
    createdAt: string;
  }>;
}

/**
 * 获取客户备注列表
 */
export async function getNotes(params: {
  userId?: string;
  isImportant?: boolean;
  createdBy?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: NoteWithCreator[]; total: number }> {
  const { userId, isImportant, createdBy, keyword, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (userId) {
    whereConditions.push(`cn.user_id = $${paramIndex}`);
    queryParams.push(userId);
    paramIndex++;
  }

  if (isImportant !== undefined) {
    whereConditions.push(`cn.is_important = $${paramIndex}`);
    queryParams.push(isImportant);
    paramIndex++;
  }

  if (createdBy) {
    whereConditions.push(`cn.created_by = $${paramIndex}`);
    queryParams.push(createdBy);
    paramIndex++;
  }

  if (keyword) {
    whereConditions.push(`cn.content ILIKE $${paramIndex}`);
    queryParams.push(`%${keyword}%`);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total FROM customer_notes cn ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // 获取数据
  queryParams.push(limit, offset);
  const result = await query(
    `SELECT
      cn.id,
      cn.user_id,
      cn.content,
      cn.is_important,
      cn.created_by,
      cn.created_at,
      cn.updated_at,
      a.username as creator_name,
      a.role as creator_role
    FROM customer_notes cn
    LEFT JOIN admins a ON cn.created_by = a.id
    ${whereClause}
    ORDER BY cn.is_important DESC, cn.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    queryParams
  );

  return {
    data: result.rows,
    total
  };
}

/**
 * 获取指定用户的所有备注
 */
export async function getUserNotes(userId: string): Promise<NoteWithCreator[]> {
  const result = await query(
    `SELECT
      cn.id,
      cn.user_id,
      cn.content,
      cn.is_important,
      cn.created_by,
      cn.created_at,
      cn.updated_at,
      a.username as creator_name,
      a.role as creator_role
    FROM customer_notes cn
    LEFT JOIN admins a ON cn.created_by = a.id
    WHERE cn.user_id = $1
    ORDER BY cn.is_important DESC, cn.created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * 获取备注详情
 */
export async function getNoteById(noteId: number): Promise<NoteWithCreator | null> {
  const result = await query(
    `SELECT
      cn.id,
      cn.user_id,
      cn.content,
      cn.is_important,
      cn.created_by,
      cn.created_at,
      cn.updated_at,
      a.username as creator_name,
      a.role as creator_role
    FROM customer_notes cn
    LEFT JOIN admins a ON cn.created_by = a.id
    WHERE cn.id = $1`,
    [noteId]
  );

  return result.rows[0] || null;
}

/**
 * 创建备注
 */
export async function createNote(data: {
  userId: string;
  content: string;
  isImportant?: boolean;
  createdBy: string;
}): Promise<CustomerNote> {
  const { userId, content, isImportant = false, createdBy } = data;

  const result = await query(
    `INSERT INTO customer_notes (user_id, content, is_important, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      user_id,
      content,
      is_important,
      created_by,
      created_at,
      updated_at`,
    [userId, content, isImportant, createdBy]
  );

  return result.rows[0];
}

/**
 * 更新备注
 */
export async function updateNote(
  noteId: number,
  data: {
    content?: string;
    isImportant?: boolean;
  }
): Promise<CustomerNote> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.content !== undefined) {
    updates.push(`content = $${paramIndex}`);
    values.push(data.content);
    paramIndex++;
  }

  if (data.isImportant !== undefined) {
    updates.push(`is_important = $${paramIndex}`);
    values.push(data.isImportant);
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(noteId);

  const result = await query(
    `UPDATE customer_notes
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING
      id,
      user_id,
      content,
      is_important,
      created_by,
      created_at,
      updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Note not found');
  }

  return result.rows[0];
}

/**
 * 删除备注
 */
export async function deleteNote(noteId: number): Promise<void> {
  const result = await query(
    `DELETE FROM customer_notes WHERE id = $1 RETURNING id`,
    [noteId]
  );

  if (result.rows.length === 0) {
    throw new Error('Note not found');
  }
}

/**
 * 切换重要状态
 */
export async function toggleImportant(noteId: number): Promise<CustomerNote> {
  const result = await query(
    `UPDATE customer_notes
    SET is_important = NOT is_important,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING
      id,
      user_id,
      content,
      is_important,
      created_by,
      created_at,
      updated_at`,
    [noteId]
  );

  if (result.rows.length === 0) {
    throw new Error('Note not found');
  }

  return result.rows[0];
}

/**
 * 获取备注统计
 */
export async function getNoteStatistics(): Promise<NoteStatistics> {
  // 总备注数
  const totalNotesResult = await query(
    `SELECT COUNT(*) as total FROM customer_notes`
  );

  // 重要备注数
  const importantNotesResult = await query(
    `SELECT COUNT(*) as total FROM customer_notes WHERE is_important = true`
  );

  // 本周备注数
  const notesThisWeekResult = await query(
    `SELECT COUNT(*) as total FROM customer_notes
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
  );

  // 本月备注数
  const notesThisMonthResult = await query(
    `SELECT COUNT(*) as total FROM customer_notes
    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
  );

  // 备注最多的客户 TOP 10
  const topUsersResult = await query(
    `SELECT
      cn.user_id,
      u.phone as user_name,
      COUNT(*) as note_count
    FROM customer_notes cn
    LEFT JOIN users u ON cn.user_id = u.id
    GROUP BY cn.user_id, u.phone
    ORDER BY note_count DESC
    LIMIT 10`
  );

  // 最近备注 TOP 20
  const recentNotesResult = await query(
    `SELECT
      cn.id,
      cn.user_id,
      u.phone as user_name,
      cn.content,
      cn.is_important,
      a.username as created_by,
      cn.created_at
    FROM customer_notes cn
    LEFT JOIN users u ON cn.user_id = u.id
    LEFT JOIN admins a ON cn.created_by = a.id
    ORDER BY cn.created_at DESC
    LIMIT 20`
  );

  return {
    totalNotes: parseInt(totalNotesResult.rows[0].total),
    importantNotes: parseInt(importantNotesResult.rows[0].total),
    notesThisWeek: parseInt(notesThisWeekResult.rows[0].total),
    notesThisMonth: parseInt(notesThisMonthResult.rows[0].total),
    topUsers: topUsersResult.rows.map(row => ({
      userId: row.user_id,
      userName: row.user_name || '未知用户',
      noteCount: parseInt(row.note_count)
    })),
    recentNotes: recentNotesResult.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name || '未知用户',
      content: row.content,
      isImportant: row.is_important,
      createdBy: row.created_by || '系统',
      createdAt: row.created_at
    }))
  };
}

/**
 * 批量删除备注
 */
export async function batchDeleteNotes(noteIds: number[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const noteId of noteIds) {
    try {
      await deleteNote(noteId);
      success++;
    } catch (error) {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * 搜索备注
 */
export async function searchNotes(params: {
  keyword: string;
  userId?: string;
  isImportant?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: NoteWithCreator[]; total: number }> {
  return getNotes(params);
}
