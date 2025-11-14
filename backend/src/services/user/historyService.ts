import { query } from '../../config/database'

/**
 * 获取浏览历史
 */
export const getUserHistory = async (userId: string, page: number = 1, limit: number = 20) => {
  const offset = (page - 1) * limit

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM browse_history h
     INNER JOIN fortunes f ON h.fortune_id = f.id
     WHERE h.user_id = $1 AND f.status = 'active'`,
    [userId]
  )
  const total = parseInt(countResult.rows[0].total)

  // 获取列表
  const result = await query(
    `SELECT
      h.id,
      h.fortune_id,
      h.created_at,
      f.title,
      f.subtitle,
      f.category,
      f.description,
      f.price,
      f.original_price,
      f.icon,
      f.bg_color,
      f.rating,
      f.sales_count
    FROM browse_history h
    INNER JOIN fortunes f ON h.fortune_id = f.id
    WHERE h.user_id = $1 AND f.status = 'active'
    ORDER BY h.created_at DESC
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )

  return {
    items: result.rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 添加浏览记录
 */
export const addHistory = async (userId: string, fortuneId: string) => {
  // 检查商品是否存在且有效
  const fortuneResult = await query(
    'SELECT id FROM fortunes WHERE id = $1 AND status = $2',
    [fortuneId, 'active']
  )

  if (fortuneResult.rows.length === 0) {
    throw new Error('商品不存在或已下架')
  }

  // 检查是否已有浏览记录（直接删除旧记录，重新创建以更新时间）
  await query(
    'DELETE FROM browse_history WHERE user_id = $1 AND fortune_id = $2',
    [userId, fortuneId]
  )

  // 添加新记录
  const historyId = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const result = await query(
    'INSERT INTO browse_history (id, user_id, fortune_id) VALUES ($1, $2, $3) RETURNING *',
    [historyId, userId, fortuneId]
  )

  return result.rows[0]
}

/**
 * 删除单条浏览记录
 */
export const removeHistory = async (userId: string, historyId: string) => {
  const result = await query(
    'DELETE FROM browse_history WHERE id = $1 AND user_id = $2 RETURNING *',
    [historyId, userId]
  )

  if (result.rows.length === 0) {
    throw new Error('浏览记录不存在')
  }

  return result.rows[0]
}

/**
 * 清空浏览历史
 */
export const clearHistory = async (userId: string) => {
  const result = await query(
    'DELETE FROM browse_history WHERE user_id = $1 RETURNING id',
    [userId]
  )

  return {
    deletedCount: result.rows.length,
  }
}

/**
 * 批量删除浏览记录
 */
export const batchRemoveHistory = async (userId: string, historyIds: string[]) => {
  if (!historyIds || historyIds.length === 0) {
    throw new Error('请选择要删除的记录')
  }

  const placeholders = historyIds.map((_, index) => `$${index + 2}`).join(',')
  const result = await query(
    `DELETE FROM browse_history
     WHERE user_id = $1 AND id IN (${placeholders})
     RETURNING id`,
    [userId, ...historyIds]
  )

  return {
    deletedCount: result.rows.length,
    deletedIds: result.rows.map(row => row.id),
  }
}
