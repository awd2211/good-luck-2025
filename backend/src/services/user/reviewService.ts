import { query } from '../../config/database'

/**
 * 用户评价接口
 */
export interface Review {
  id: number
  orderId: string
  userId: string
  username: string
  fortuneType: string
  rating: number
  content?: string
  images?: string
  tags?: string
  isAnonymous: boolean
  status: 'published' | 'hidden' | 'pending'
  helpfulCount: number
  replyContent?: string
  replyAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * 创建评价
 */
export const createReview = async (
  userId: string,
  data: {
    orderId: string
    rating: number
    content?: string
    images?: string[]
    tags?: string[]
    isAnonymous?: boolean
  }
) => {
  // 检查订单是否存在且属于该用户
  const orderResult = await query(
    `SELECT o.order_id, o.user_id, o.username, o.fortune_type, o.status
     FROM orders o
     WHERE o.order_id = $1 AND o.user_id = $2`,
    [data.orderId, userId]
  )

  if (orderResult.rows.length === 0) {
    throw new Error('订单不存在')
  }

  const order = orderResult.rows[0]

  if (order.status !== 'completed') {
    throw new Error('只能评价已完成的订单')
  }

  // 检查是否已评价
  const existingReview = await query(
    'SELECT id FROM reviews WHERE order_id = $1 AND user_id = $2',
    [data.orderId, userId]
  )

  if (existingReview.rows.length > 0) {
    throw new Error('该订单已评价')
  }

  // 验证评分
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('评分必须在1-5之间')
  }

  // 创建评价
  const result = await query(
    `INSERT INTO reviews
     (order_id, user_id, username, fortune_type, rating, content, images, tags, is_anonymous, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published')
     RETURNING *`,
    [
      data.orderId,
      userId,
      order.username,
      order.fortune_type,
      data.rating,
      data.content || null,
      data.images ? data.images.join(',') : null,
      data.tags ? data.tags.join(',') : null,
      data.isAnonymous || false,
    ]
  )

  const review = result.rows[0]

  return {
    id: review.id,
    orderId: review.order_id,
    userId: review.user_id,
    username: review.is_anonymous ? '匿名用户' : review.username,
    fortuneType: review.fortune_type,
    rating: review.rating,
    content: review.content,
    images: review.images ? review.images.split(',') : [],
    tags: review.tags ? review.tags.split(',') : [],
    isAnonymous: review.is_anonymous,
    status: review.status,
    helpfulCount: review.helpful_count,
    createdAt: review.created_at,
  }
}

/**
 * 获取用户的评价列表
 */
export const getUserReviews = async (
  userId: string,
  params: {
    page?: number
    limit?: number
  } = {}
) => {
  const page = params.page || 1
  const limit = params.limit || 20
  const offset = (page - 1) * limit

  // 查询用户评价
  const result = await query(
    `SELECT
       r.id, r.order_id, r.user_id, r.username, r.fortune_type,
       r.rating, r.content, r.images, r.tags, r.is_anonymous,
       r.status, r.helpful_count, r.reply_content, r.reply_at,
       r.created_at, r.updated_at
     FROM reviews r
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )

  // 查询总数
  const countResult = await query(
    'SELECT COUNT(*) as total FROM reviews WHERE user_id = $1',
    [userId]
  )

  const total = parseInt(countResult.rows[0].total)

  const reviews = result.rows.map((row: any) => ({
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    username: row.is_anonymous ? '匿名用户' : row.username,
    fortuneType: row.fortune_type,
    rating: row.rating,
    content: row.content,
    images: row.images ? row.images.split(',') : [],
    tags: row.tags ? row.tags.split(',') : [],
    isAnonymous: row.is_anonymous,
    status: row.status,
    helpfulCount: row.helpful_count,
    replyContent: row.reply_content,
    replyAt: row.reply_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return {
    items: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 获取算命服务的评价列表（公开接口）
 */
export const getFortuneReviews = async (
  fortuneType: string,
  params: {
    page?: number
    limit?: number
    rating?: number
  } = {}
) => {
  const page = params.page || 1
  const limit = params.limit || 20
  const offset = (page - 1) * limit

  // 构建查询条件
  const conditions = ['r.fortune_type = $1', "r.status = 'published'"]
  const queryParams: any[] = [fortuneType]
  let paramIndex = 2

  if (params.rating) {
    conditions.push(`r.rating = $${paramIndex}`)
    queryParams.push(params.rating)
    paramIndex++
  }

  const whereClause = conditions.join(' AND ')

  // 查询评价
  const result = await query(
    `SELECT
       r.id, r.order_id, r.user_id, r.username, r.fortune_type,
       r.rating, r.content, r.images, r.tags, r.is_anonymous,
       r.helpful_count, r.reply_content, r.reply_at, r.created_at
     FROM reviews r
     WHERE ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, limit, offset]
  )

  // 查询总数和评分统计
  const statsResult = await query(
    `SELECT
       COUNT(*) as total,
       AVG(rating) as avg_rating,
       COUNT(*) FILTER (WHERE rating = 5) as rating_5,
       COUNT(*) FILTER (WHERE rating = 4) as rating_4,
       COUNT(*) FILTER (WHERE rating = 3) as rating_3,
       COUNT(*) FILTER (WHERE rating = 2) as rating_2,
       COUNT(*) FILTER (WHERE rating = 1) as rating_1
     FROM reviews r
     WHERE r.fortune_type = $1 AND r.status = 'published'`,
    [fortuneType]
  )

  const stats = statsResult.rows[0]
  const total = parseInt(stats.total)

  const reviews = result.rows.map((row: any) => ({
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    username: row.is_anonymous ? '匿名用户' : row.username,
    fortuneType: row.fortune_type,
    rating: row.rating,
    content: row.content,
    images: row.images ? row.images.split(',') : [],
    tags: row.tags ? row.tags.split(',') : [],
    isAnonymous: row.is_anonymous,
    helpfulCount: row.helpful_count,
    replyContent: row.reply_content,
    replyAt: row.reply_at,
    createdAt: row.created_at,
  }))

  return {
    items: reviews,
    stats: {
      total,
      avgRating: stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '0.0',
      rating5: parseInt(stats.rating_5),
      rating4: parseInt(stats.rating_4),
      rating3: parseInt(stats.rating_3),
      rating2: parseInt(stats.rating_2),
      rating1: parseInt(stats.rating_1),
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 获取评价详情
 */
export const getReviewDetail = async (reviewId: number) => {
  const result = await query(
    `SELECT
       r.id, r.order_id, r.user_id, r.username, r.fortune_type,
       r.rating, r.content, r.images, r.tags, r.is_anonymous,
       r.status, r.helpful_count, r.reply_content, r.reply_at,
       r.created_at, r.updated_at
     FROM reviews r
     WHERE r.id = $1`,
    [reviewId]
  )

  if (result.rows.length === 0) {
    throw new Error('评价不存在')
  }

  const row = result.rows[0]

  return {
    id: row.id,
    orderId: row.order_id,
    userId: row.user_id,
    username: row.is_anonymous ? '匿名用户' : row.username,
    fortuneType: row.fortune_type,
    rating: row.rating,
    content: row.content,
    images: row.images ? row.images.split(',') : [],
    tags: row.tags ? row.tags.split(',') : [],
    isAnonymous: row.is_anonymous,
    status: row.status,
    helpfulCount: row.helpful_count,
    replyContent: row.reply_content,
    replyAt: row.reply_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * 删除评价（只能删除自己的评价）
 */
export const deleteReview = async (userId: string, reviewId: number) => {
  // 检查评价是否存在且属于该用户
  const result = await query(
    'SELECT id, user_id FROM reviews WHERE id = $1',
    [reviewId]
  )

  if (result.rows.length === 0) {
    throw new Error('评价不存在')
  }

  const review = result.rows[0]

  if (review.user_id !== userId) {
    throw new Error('无权删除此评价')
  }

  // 删除评价
  await query('DELETE FROM reviews WHERE id = $1', [reviewId])

  return true
}

/**
 * 点赞评价（标记为有帮助）
 */
export const markHelpful = async (reviewId: number) => {
  // 增加helpful_count
  const result = await query(
    `UPDATE reviews
     SET helpful_count = helpful_count + 1
     WHERE id = $1
     RETURNING helpful_count`,
    [reviewId]
  )

  if (result.rows.length === 0) {
    throw new Error('评价不存在')
  }

  return {
    helpfulCount: result.rows[0].helpful_count,
  }
}

/**
 * 检查订单是否可以评价
 */
export const canReviewOrder = async (userId: string, orderId: string) => {
  // 检查订单是否存在且已完成
  const orderResult = await query(
    'SELECT order_id, status FROM orders WHERE order_id = $1 AND user_id = $2',
    [orderId, userId]
  )

  if (orderResult.rows.length === 0) {
    return { canReview: false, reason: '订单不存在' }
  }

  const order = orderResult.rows[0]

  if (order.status !== 'completed') {
    return { canReview: false, reason: '订单未完成' }
  }

  // 检查是否已评价
  const reviewResult = await query(
    'SELECT id FROM reviews WHERE order_id = $1 AND user_id = $2',
    [orderId, userId]
  )

  if (reviewResult.rows.length > 0) {
    return { canReview: false, reason: '已评价' }
  }

  return { canReview: true }
}
