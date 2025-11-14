import { query } from '../../config/database'

/**
 * 获取用户购物车
 */
export const getUserCart = async (userId: string) => {
  const result = await query(
    `SELECT
      c.id,
      c.fortune_id,
      c.quantity,
      c.price as item_price,
      c.created_at,
      f.title,
      f.subtitle,
      f.category,
      f.description,
      f.price,
      f.original_price,
      f.icon,
      f.bg_color
    FROM cart_items c
    INNER JOIN fortunes f ON c.fortune_id = f.id
    WHERE c.user_id = $1 AND f.status = 'active'
    ORDER BY c.created_at DESC`,
    [userId]
  )

  // 计算总价
  const items = result.rows
  const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)

  return {
    items,
    count: items.length,
    total: total.toFixed(2),
  }
}

/**
 * 添加到购物车
 */
export const addToCart = async (userId: string, fortuneId: string, quantity: number = 1) => {
  // 检查商品是否存在且有效
  const fortuneResult = await query(
    'SELECT id, title, price FROM fortunes WHERE id = $1 AND status = $2',
    [fortuneId, 'active']
  )

  if (fortuneResult.rows.length === 0) {
    throw new Error('商品不存在或已下架')
  }

  const fortune = fortuneResult.rows[0]

  // 检查是否已在购物车
  const existingResult = await query(
    'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND fortune_id = $2',
    [userId, fortuneId]
  )

  if (existingResult.rows.length > 0) {
    // 已存在，更新数量
    const newQuantity = existingResult.rows[0].quantity + quantity
    const result = await query(
      'UPDATE cart_items SET quantity = $1, price = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [newQuantity, fortune.price, existingResult.rows[0].id]
    )
    return result.rows[0]
  }

  // 不存在，添加新记录
  const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const result = await query(
    'INSERT INTO cart_items (id, user_id, fortune_id, quantity, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [cartItemId, userId, fortuneId, quantity, fortune.price]
  )

  return result.rows[0]
}

/**
 * 更新购物车商品数量
 */
export const updateCartItem = async (userId: string, cartItemId: string, quantity: number) => {
  if (quantity < 1) {
    throw new Error('数量必须大于0')
  }

  const result = await query(
    `UPDATE cart_items
     SET quantity = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [quantity, cartItemId, userId]
  )

  if (result.rows.length === 0) {
    throw new Error('购物车商品不存在')
  }

  return result.rows[0]
}

/**
 * 删除购物车商品
 */
export const removeFromCart = async (userId: string, cartItemId: string) => {
  const result = await query(
    'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
    [cartItemId, userId]
  )

  if (result.rows.length === 0) {
    throw new Error('购物车商品不存在')
  }

  return result.rows[0]
}

/**
 * 批量删除购物车商品
 */
export const batchRemoveFromCart = async (userId: string, cartItemIds: string[]) => {
  if (!cartItemIds || cartItemIds.length === 0) {
    throw new Error('请选择要删除的商品')
  }

  const placeholders = cartItemIds.map((_, index) => `$${index + 2}`).join(',')
  const result = await query(
    `DELETE FROM cart_items
     WHERE user_id = $1 AND id IN (${placeholders})
     RETURNING id`,
    [userId, ...cartItemIds]
  )

  return {
    deletedCount: result.rows.length,
    deletedIds: result.rows.map(row => row.id),
  }
}

/**
 * 清空购物车
 */
export const clearCart = async (userId: string) => {
  const result = await query(
    'DELETE FROM cart_items WHERE user_id = $1 RETURNING id',
    [userId]
  )

  return {
    deletedCount: result.rows.length,
  }
}
