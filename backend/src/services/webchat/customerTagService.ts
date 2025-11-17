/**
 * 客户标签管理服务
 * 提供标签的增删改查、标签分配、统计等功能
 */

import { query } from '../../config/database';

interface CustomerTag {
  id: number;
  tag_name: string;
  tag_color: string;
  description?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface TagAssignment {
  id: number;
  user_id: string;
  tag_id: number;
  assigned_by: string | null;
  assigned_at: string;
}

interface TagStatistics {
  totalTags: number;
  activeTags: number;
  totalAssignments: number;
  topUsedTags: Array<{
    tagId: number;
    tagName: string;
    tagColor: string;
    usageCount: number;
  }>;
  tagsByCategory: Array<{
    category: string;
    count: number;
  }>;
  recentAssignments: Array<{
    userId: string;
    userName: string;
    tagName: string;
    assignedBy: string;
    assignedAt: string;
  }>;
}

/**
 * 获取标签列表
 */
export async function getTags(params: {
  page?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
}): Promise<{ data: CustomerTag[]; total: number }> {
  const { page = 1, limit = 20, keyword, isActive } = params;
  const offset = (page - 1) * limit;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramIndex = 1;

  if (keyword) {
    whereConditions.push(`(tag_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    queryParams.push(`%${keyword}%`);
    paramIndex++;
  }

  if (isActive !== undefined) {
    whereConditions.push(`is_active = $${paramIndex}`);
    queryParams.push(isActive);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total FROM customer_tags ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // 获取数据
  queryParams.push(limit, offset);
  const result = await query(
    `SELECT
      id,
      tag_name,
      tag_color,
      description,
      is_active,
      usage_count,
      created_at,
      updated_at
    FROM customer_tags
    ${whereClause}
    ORDER BY usage_count DESC, created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    queryParams
  );

  return {
    data: result.rows,
    total
  };
}

/**
 * 获取标签详情
 */
export async function getTagById(tagId: number): Promise<CustomerTag | null> {
  const result = await query(
    `SELECT
      id,
      tag_name,
      tag_color,
      description,
      is_active,
      usage_count,
      created_at,
      updated_at
    FROM customer_tags
    WHERE id = $1`,
    [tagId]
  );

  return result.rows[0] || null;
}

/**
 * 创建标签
 */
export async function createTag(data: {
  tagName: string;
  tagColor: string;
  description?: string;
  isActive?: boolean;
}): Promise<CustomerTag> {
  const { tagName, tagColor, description, isActive = true } = data;

  const result = await query(
    `INSERT INTO customer_tags (tag_name, tag_color, description, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      tag_name,
      tag_color,
      description,
      is_active,
      usage_count,
      created_at,
      updated_at`,
    [tagName, tagColor, description || null, isActive]
  );

  return result.rows[0];
}

/**
 * 更新标签
 */
export async function updateTag(
  tagId: number,
  data: {
    tagName?: string;
    tagColor?: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<CustomerTag> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.tagName !== undefined) {
    updates.push(`tag_name = $${paramIndex}`);
    values.push(data.tagName);
    paramIndex++;
  }

  if (data.tagColor !== undefined) {
    updates.push(`tag_color = $${paramIndex}`);
    values.push(data.tagColor);
    paramIndex++;
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex}`);
    values.push(data.description);
    paramIndex++;
  }

  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex}`);
    values.push(data.isActive);
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(tagId);

  const result = await query(
    `UPDATE customer_tags
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING
      id,
      tag_name,
      tag_color,
      description,
      is_active,
      usage_count,
      created_at,
      updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Tag not found');
  }

  return result.rows[0];
}

/**
 * 删除标签
 */
export async function deleteTag(tagId: number): Promise<void> {
  // 检查是否有用户使用该标签
  const usageCheck = await query(
    `SELECT COUNT(*) as count FROM user_tags WHERE tag_id = $1`,
    [tagId]
  );

  if (parseInt(usageCheck.rows[0].count) > 0) {
    throw new Error('Cannot delete tag that is currently assigned to users');
  }

  const result = await query(
    `DELETE FROM customer_tags WHERE id = $1 RETURNING id`,
    [tagId]
  );

  if (result.rows.length === 0) {
    throw new Error('Tag not found');
  }
}

/**
 * 为用户分配标签
 */
export async function assignTagToUser(data: {
  userId: string;
  tagId: number;
  assignedBy: string;
}): Promise<TagAssignment> {
  const { userId, tagId, assignedBy } = data;

  // 检查标签是否存在且激活
  const tagCheck = await query(
    `SELECT id FROM customer_tags WHERE id = $1 AND is_active = true`,
    [tagId]
  );

  if (tagCheck.rows.length === 0) {
    throw new Error('Tag not found or inactive');
  }

  // 检查是否已经分配
  const existingCheck = await query(
    `SELECT id FROM user_tags WHERE user_id = $1 AND tag_id = $2`,
    [userId, tagId]
  );

  if (existingCheck.rows.length > 0) {
    throw new Error('Tag already assigned to this user');
  }

  // 分配标签
  const result = await query(
    `INSERT INTO user_tags (user_id, tag_id, assigned_by)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, tag_id, assigned_by, assigned_at`,
    [userId, tagId, assignedBy]
  );

  // 更新标签使用计数
  await query(
    `UPDATE customer_tags SET usage_count = usage_count + 1 WHERE id = $1`,
    [tagId]
  );

  return result.rows[0];
}

/**
 * 移除用户标签
 */
export async function removeTagFromUser(data: {
  userId: string;
  tagId: number;
}): Promise<void> {
  const { userId, tagId } = data;

  const result = await query(
    `DELETE FROM user_tags WHERE user_id = $1 AND tag_id = $2 RETURNING tag_id`,
    [userId, tagId]
  );

  if (result.rows.length === 0) {
    throw new Error('Tag assignment not found');
  }

  // 更新标签使用计数
  await query(
    `UPDATE customer_tags
    SET usage_count = GREATEST(0, usage_count - 1)
    WHERE id = $1`,
    [tagId]
  );
}

/**
 * 获取用户的所有标签
 */
export async function getUserTags(userId: string): Promise<Array<{
  id: number;
  tagId: number;
  tagName: string;
  tagColor: string;
  assignedBy: string | null;
  assignedByName: string;
  assignedAt: string;
}>> {
  const result = await query(
    `SELECT
      ut.id,
      ut.tag_id,
      ct.tag_name,
      ct.tag_color,
      ut.assigned_by,
      a.username as assigned_by_name,
      ut.assigned_at
    FROM user_tags ut
    JOIN customer_tags ct ON ut.tag_id = ct.id
    LEFT JOIN admins a ON ut.assigned_by = a.id
    WHERE ut.user_id = $1
    ORDER BY ut.assigned_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * 批量分配标签
 */
export async function batchAssignTags(data: {
  userIds: string[];
  tagIds: number[];
  assignedBy: string;
}): Promise<{ success: number; failed: number }> {
  const { userIds, tagIds, assignedBy } = data;
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    for (const tagId of tagIds) {
      try {
        await assignTagToUser({ userId, tagId, assignedBy });
        success++;
      } catch (error) {
        failed++;
      }
    }
  }

  return { success, failed };
}

/**
 * 获取标签统计
 */
export async function getTagStatistics(): Promise<TagStatistics> {
  // 总标签数
  const totalTagsResult = await query(
    `SELECT COUNT(*) as total FROM customer_tags`
  );

  // 激活标签数
  const activeTagsResult = await query(
    `SELECT COUNT(*) as total FROM customer_tags WHERE is_active = true`
  );

  // 总分配数
  const totalAssignmentsResult = await query(
    `SELECT COUNT(*) as total FROM user_tags`
  );

  // 最常用标签 TOP 10
  const topUsedTagsResult = await query(
    `SELECT
      id as tag_id,
      tag_name,
      tag_color,
      usage_count
    FROM customer_tags
    WHERE usage_count > 0
    ORDER BY usage_count DESC
    LIMIT 10`
  );

  // 按颜色分类统计
  const tagsByCategoryResult = await query(
    `SELECT
      tag_color as category,
      COUNT(*) as count
    FROM customer_tags
    WHERE is_active = true
    GROUP BY tag_color
    ORDER BY count DESC`
  );

  // 最近分配记录
  const recentAssignmentsResult = await query(
    `SELECT
      ut.user_id,
      u.phone as user_name,
      ct.tag_name,
      a.username as assigned_by,
      ut.assigned_at
    FROM user_tags ut
    JOIN customer_tags ct ON ut.tag_id = ct.id
    LEFT JOIN users u ON ut.user_id = u.id
    LEFT JOIN admins a ON ut.assigned_by = a.id
    ORDER BY ut.assigned_at DESC
    LIMIT 20`
  );

  return {
    totalTags: parseInt(totalTagsResult.rows[0].total),
    activeTags: parseInt(activeTagsResult.rows[0].total),
    totalAssignments: parseInt(totalAssignmentsResult.rows[0].total),
    topUsedTags: topUsedTagsResult.rows.map(row => ({
      tagId: row.tag_id,
      tagName: row.tag_name,
      tagColor: row.tag_color,
      usageCount: row.usage_count
    })),
    tagsByCategory: tagsByCategoryResult.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count)
    })),
    recentAssignments: recentAssignmentsResult.rows.map(row => ({
      userId: row.user_id,
      userName: row.user_name || '未知用户',
      tagName: row.tag_name,
      assignedBy: row.assigned_by || '系统',
      assignedAt: row.assigned_at
    }))
  };
}

/**
 * 搜索带有特定标签的用户
 */
export async function searchUsersByTags(params: {
  tagIds: number[];
  matchAll?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: any[]; total: number }> {
  const { tagIds, matchAll = false, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  if (tagIds.length === 0) {
    return { data: [], total: 0 };
  }

  const tagIdList = tagIds.join(',');

  let query_text: string;
  if (matchAll) {
    // 必须包含所有标签
    query_text = `
      SELECT
        u.id,
        u.phone,
        u.created_at,
        json_agg(json_build_object(
          'tagId', ct.id,
          'tagName', ct.tag_name,
          'tagColor', ct.tag_color
        )) as tags
      FROM users u
      JOIN user_tags ut ON u.id = ut.user_id
      JOIN customer_tags ct ON ut.tag_id = ct.id
      WHERE ut.tag_id IN (${tagIdList})
      GROUP BY u.id, u.phone, u.created_at
      HAVING COUNT(DISTINCT ut.tag_id) = $1
      ORDER BY u.created_at DESC
      LIMIT $2 OFFSET $3
    `;
  } else {
    // 包含任一标签即可
    query_text = `
      SELECT DISTINCT
        u.id,
        u.phone,
        u.created_at,
        json_agg(json_build_object(
          'tagId', ct.id,
          'tagName', ct.tag_name,
          'tagColor', ct.tag_color
        )) as tags
      FROM users u
      JOIN user_tags ut ON u.id = ut.user_id
      JOIN customer_tags ct ON ut.tag_id = ct.id
      WHERE ut.tag_id IN (${tagIdList})
      GROUP BY u.id, u.phone, u.created_at
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `;
  }

  const result = await query(
    query_text,
    matchAll ? [tagIds.length, limit, offset] : [limit, offset]
  );

  // 获取总数
  let countQuery: string;
  if (matchAll) {
    countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN user_tags ut ON u.id = ut.user_id
      WHERE ut.tag_id IN (${tagIdList})
      GROUP BY u.id
      HAVING COUNT(DISTINCT ut.tag_id) = $1
    `;
  } else {
    countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      JOIN user_tags ut ON u.id = ut.user_id
      WHERE ut.tag_id IN (${tagIdList})
    `;
  }

  const countResult = await query(
    countQuery,
    matchAll ? [tagIds.length] : []
  );

  const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].total) : 0;

  return {
    data: result.rows,
    total
  };
}
