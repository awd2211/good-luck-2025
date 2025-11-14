import { query } from '../../config/database'

/**
 * 获取用户收藏列表
 */
export const getUserFavorites = async (userId: string, page: number = 1, limit: number = 20) => {
  const offset = (page - 1) * limit

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM favorites fav
     INNER JOIN fortunes f ON fav.fortune_id = f.id
     WHERE fav.user_id = $1 AND f.status = 'active'`,
    [userId]
  )
  const total = parseInt(countResult.rows[0].total)

  // 获取列表
  const result = await query(
    `SELECT
      fav.id,
      fav.fortune_id,
      fav.created_at,
      f.title,
      f.subtitle,
      f.category,
      f.description,
      f.price,
      f.original_price,
      f.icon,
      f.bg_color,
      f.sales_count,
      f.rating
    FROM favorites fav
    INNER JOIN fortunes f ON fav.fortune_id = f.id
    WHERE fav.user_id = $1 AND f.status = 'active'
    ORDER BY fav.created_at DESC
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
 * 添加收藏
 */
export const addFavorite = async (userId: string, fortuneId: string) => {
  // 检查商品是否存在且有效
  const fortuneResult = await query(
    'SELECT id, title FROM fortunes WHERE id = $1 AND status = $2',
    [fortuneId, 'active']
  )

  if (fortuneResult.rows.length === 0) {
    throw new Error('商品不存在或已下架')
  }

  // 检查是否已收藏
  const existingResult = await query(
    'SELECT id FROM favorites WHERE user_id = $1 AND fortune_id = $2',
    [userId, fortuneId]
  )

  if (existingResult.rows.length > 0) {
    throw new Error('已收藏该商品')
  }

  // 添加收藏
  const favoriteId = `fav_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const result = await query(
    'INSERT INTO favorites (id, user_id, fortune_id) VALUES ($1, $2, $3) RETURNING *',
    [favoriteId, userId, fortuneId]
  )

  return result.rows[0]
}

/**
 * 取消收藏
 */
export const removeFavorite = async (userId: string, fortuneId: string) => {
  const result = await query(
    'DELETE FROM favorites WHERE user_id = $1 AND fortune_id = $2 RETURNING *',
    [userId, fortuneId]
  )

  if (result.rows.length === 0) {
    throw new Error('未收藏该商品')
  }

  return result.rows[0]
}

/**
 * 检查是否已收藏
 */
export const checkFavorite = async (userId: string, fortuneId: string) => {
  const result = await query(
    'SELECT id FROM favorites WHERE user_id = $1 AND fortune_id = $2',
    [userId, fortuneId]
  )

  return {
    isFavorited: result.rows.length > 0,
  }
}

/**
 * 批量检查收藏状态
 */
export const batchCheckFavorites = async (userId: string, fortuneIds: string[]) => {
  if (!fortuneIds || fortuneIds.length === 0) {
    return {}
  }

  const placeholders = fortuneIds.map((_, index) => `$${index + 2}`).join(',')
  const result = await query(
    `SELECT fortune_id FROM favorites
     WHERE user_id = $1 AND fortune_id IN (${placeholders})`,
    [userId, ...fortuneIds]
  )

  const favoritedIds = new Set(result.rows.map(row => row.fortune_id))
  const favoriteStatus: { [key: string]: boolean } = {}

  fortuneIds.forEach(id => {
    favoriteStatus[id] = favoritedIds.has(id)
  })

  return favoriteStatus
}
