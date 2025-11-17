import { query } from '../../config/database'
import { redisCache } from '../../config/redis'
import * as emailNotifications from '../emailNotificationService'

/**
 * 用户端订单接口
 */
export interface UserOrder {
  id: string
  orderId: string
  userId: string
  username: string
  fortuneType: string
  fortuneName: string
  amount: number
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  payMethod?: string
  createTime: string
  updateTime: string
  // 关联的算命服务信息
  fortuneInfo?: {
    title: string
    subtitle?: string
    price: number
    icon?: string
    bgColor?: string
  }
}

/**
 * 生成订单号
 */
const generateOrderId = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)
  return `ORD${year}${month}${day}${timestamp}`
}

/**
 * 生成订单ID
 */
const generateId = (): string => {
  return `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 创建订单（从购物车或直接购买）
 */
export const createOrder = async (
  userId: string,
  items: Array<{ fortuneId: string; quantity: number }>,
  payMethod?: string
) => {
  // 获取算命服务信息和计算总价
  const fortuneIds = items.map(item => item.fortuneId)
  const fortuneResult = await query(
    `SELECT id, title, subtitle, price, icon, bg_color
     FROM fortunes
     WHERE id = ANY($1) AND status = 'active'`,
    [fortuneIds]
  )

  if (fortuneResult.rows.length === 0) {
    throw new Error('所选算命服务不存在或已下架')
  }

  const fortunes = fortuneResult.rows
  let totalAmount = 0
  const orderItems: Array<{
    fortuneId: string
    fortuneName: string
    fortuneType: string
    price: number
    quantity: number
  }> = []

  // 计算总价并准备订单项
  for (const item of items) {
    const fortune = fortunes.find((f: any) => f.id === item.fortuneId)
    if (!fortune) {
      throw new Error(`算命服务 ${item.fortuneId} 不存在`)
    }
    totalAmount += parseFloat(fortune.price) * item.quantity
    orderItems.push({
      fortuneId: fortune.id,
      fortuneName: fortune.title,
      fortuneType: fortune.id, // 使用ID作为类型
      price: parseFloat(fortune.price),
      quantity: item.quantity,
    })
  }

  // 获取用户信息
  const userResult = await query('SELECT id, nickname, phone, email FROM users WHERE id = $1', [userId])
  if (userResult.rows.length === 0) {
    throw new Error('用户不存在')
  }
  const user = userResult.rows[0]
  const username = user.nickname || user.phone

  // 创建订单（只支持单个算命服务的订单）
  const orderId = generateOrderId()
  const orderDbId = generateId()
  const firstItem = orderItems[0]

  const result = await query(
    `INSERT INTO orders
     (id, order_id, user_id, username, fortune_type, fortune_name, amount, status, pay_method)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      orderDbId,
      orderId,
      userId,
      username,
      firstItem.fortuneType,
      firstItem.fortuneName,
      totalAmount,
      'pending',
      payMethod || null,
    ]
  )

  const order = result.rows[0]

  // 清除用户订单列表的所有缓存（使用模糊匹配）
  const deletedCount = await redisCache.delPattern(`orders:${userId}:*`)
  console.log(`🗑️ 已清除${deletedCount}个订单缓存: orders:${userId}:*`)

  // 发送订单确认邮件（异步，不阻塞订单创建）
  if (user.email) {
    emailNotifications.sendOrderConfirmationEmail(
      user.email,
      order.order_id,
      order.fortune_name,
      parseFloat(order.amount)
    )
      .then(result => {
        if (result.success) {
          console.log(`✅ 订单确认邮件已发送至: ${user.email}`)
        } else {
          console.warn(`⚠️  订单确认邮件发送失败: ${result.error}`)
        }
      })
      .catch(err => {
        console.error('❌ 发送订单确认邮件时出错:', err)
      })
  }

  return {
    id: order.id,
    orderId: order.order_id,
    userId: order.user_id,
    username: order.username,
    fortuneType: order.fortune_type,
    fortuneName: order.fortune_name,
    amount: parseFloat(order.amount),
    status: order.status,
    payMethod: order.pay_method,
    createTime: order.create_time,
    updateTime: order.update_time,
  }
}

/**
 * 获取用户的订单列表
 * 优化: 使用Redis缓存(5分钟) + 窗口函数合并COUNT查询
 */
export const getUserOrders = async (
  userId: string,
  params: {
    page?: number
    limit?: number
    status?: string
  } = {}
) => {
  const page = params.page || 1
  const limit = params.limit || 10
  const offset = (page - 1) * limit
  const status = params.status || 'all'

  // 1. 尝试从Redis获取缓存
  const cacheKey = `orders:${userId}:${page}:${limit}:${status}`
  const cached = await redisCache.get<any>(cacheKey)

  if (cached) {
    console.log(`✅ Redis缓存命中: ${cacheKey}`)
    return cached
  }

  console.log(`⚠️ Redis缓存未命中，查询数据库: ${cacheKey}`)

  // 2. 构建查询条件
  const conditions = ['o.user_id = $1']
  const queryParams: any[] = [userId]
  let paramIndex = 2

  if (status && status !== 'all') {
    conditions.push(`o.status = $${paramIndex}`)
    queryParams.push(status)
    paramIndex++
  }

  const whereClause = conditions.join(' AND ')

  // 3. 使用窗口函数一次查询获取订单列表和总数（减少50%数据库往返）
  const result = await query(
    `SELECT
       o.id, o.order_id, o.user_id, o.username,
       o.fortune_type, o.fortune_name, o.amount, o.status, o.pay_method,
       o.create_time, o.update_time,
       f.title, f.subtitle, f.price, f.icon, f.bg_color,
       COUNT(*) OVER() as total_count
     FROM orders o
     LEFT JOIN fortunes f ON o.fortune_type = f.id
     WHERE ${whereClause}
     ORDER BY o.create_time DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, limit, offset]
  )

  // 4. 从第一行获取总数
  const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0

  // 5. 移除total_count字段并格式化订单数据
  const orders = result.rows.map((row: any) => ({
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    username: row.username,
    fortuneType: row.fortune_type,
    fortuneName: row.fortune_name,
    amount: parseFloat(row.amount),
    status: row.status,
    payMethod: row.pay_method,
    createTime: row.create_time,
    updateTime: row.update_time,
    fortuneInfo: row.title
      ? {
          title: row.title,
          subtitle: row.subtitle,
          price: row.price ? parseFloat(row.price) : 0,
          icon: row.icon,
          bgColor: row.bg_color,
        }
      : undefined,
  }))

  const response = {
    items: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }

  // 6. 写入Redis缓存（5分钟 = 300秒）
  await redisCache.set(cacheKey, response, 300)
  console.log(`📝 已写入Redis缓存: ${cacheKey}`)

  return response
}

/**
 * 获取订单详情
 */
export const getOrderDetail = async (userId: string, orderId: string) => {
  const result = await query(
    `SELECT
       o.id, o.order_id, o.user_id, o.username,
       o.fortune_type, o.fortune_name, o.amount, o.status, o.pay_method,
       o.create_time, o.update_time,
       f.title, f.subtitle, f.description, f.price, f.original_price,
       f.icon, f.bg_color, f.category
     FROM orders o
     LEFT JOIN fortunes f ON o.fortune_type = f.id
     WHERE o.id = $1 AND o.user_id = $2`,
    [orderId, userId]
  )

  if (result.rows.length === 0) {
    throw new Error('订单不存在')
  }

  const row = result.rows[0]

  return {
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    username: row.username,
    fortuneType: row.fortune_type,
    fortuneName: row.fortune_name,
    amount: parseFloat(row.amount),
    status: row.status,
    payMethod: row.pay_method,
    createTime: row.create_time,
    updateTime: row.update_time,
    fortuneInfo: row.title
      ? {
          title: row.title,
          subtitle: row.subtitle,
          description: row.description,
          price: row.price ? parseFloat(row.price) : 0,
          originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
          icon: row.icon,
          bgColor: row.bg_color,
          category: row.category,
        }
      : undefined,
  }
}

/**
 * 取消订单（只能取消待支付的订单）
 */
export const cancelOrder = async (userId: string, orderId: string) => {
  // 检查订单状态并获取用户邮箱
  const checkResult = await query(
    `SELECT o.id, o.order_id, o.fortune_name, o.amount, o.status, u.email
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.id = $1 AND o.user_id = $2`,
    [orderId, userId]
  )

  if (checkResult.rows.length === 0) {
    throw new Error('订单不存在')
  }

  const order = checkResult.rows[0]

  if (order.status !== 'pending') {
    throw new Error('只能取消待支付的订单')
  }

  // 更新订单状态
  const result = await query(
    `UPDATE orders
     SET status = 'cancelled', update_time = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [orderId, userId]
  )

  const updatedOrder = result.rows[0]

  // 发送订单取消邮件（异步，不阻塞订单取消）
  if (order.email) {
    emailNotifications.sendOrderCancelledEmail(
      order.email,
      order.order_id,
      order.fortune_name,
      parseFloat(order.amount),
      '用户主动取消'
    )
      .then(result => {
        if (result.success) {
          console.log(`✅ 订单取消邮件已发送至: ${order.email}`)
        } else {
          console.warn(`⚠️  订单取消邮件发送失败: ${result.error}`)
        }
      })
      .catch(err => {
        console.error('❌ 发送订单取消邮件时出错:', err)
      })
  }

  return {
    id: updatedOrder.id,
    orderId: updatedOrder.order_id,
    status: updatedOrder.status,
    updateTime: updatedOrder.update_time,
  }
}

/**
 * 删除订单（只能删除已取消或已完成的订单）
 */
export const deleteOrder = async (userId: string, orderId: string) => {
  // 检查订单状态
  const checkResult = await query(
    'SELECT id, status FROM orders WHERE id = $1 AND user_id = $2',
    [orderId, userId]
  )

  if (checkResult.rows.length === 0) {
    throw new Error('订单不存在')
  }

  const order = checkResult.rows[0]

  if (!['cancelled', 'completed', 'refunded'].includes(order.status)) {
    throw new Error('只能删除已取消、已完成或已退款的订单')
  }

  // 删除订单
  await query('DELETE FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId])

  return true
}

/**
 * 获取订单统计
 */
export const getOrderStats = async (userId: string) => {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
       COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
       COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
       COUNT(*) FILTER (WHERE status = 'refunded') as refunded_count,
       COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_spent
     FROM orders
     WHERE user_id = $1`,
    [userId]
  )

  const stats = result.rows[0]

  return {
    pendingCount: parseInt(stats.pending_count),
    completedCount: parseInt(stats.completed_count),
    cancelledCount: parseInt(stats.cancelled_count),
    refundedCount: parseInt(stats.refunded_count),
    totalSpent: parseFloat(stats.total_spent),
  }
}
