import { query } from '../../config/database'

/**
 * 用户优惠券接口
 */
export interface UserCoupon {
  id: number
  userId: string
  couponId: number
  orderId?: string
  status: 'unused' | 'used' | 'expired'
  receivedAt: string
  usedAt?: string
  expiredAt?: string
  // 优惠券详情
  coupon?: {
    code: string
    name: string
    type: 'discount' | 'fixed' | 'free_shipping'
    value: number
    minAmount?: number
    maxDiscount?: number
    validFrom: string
    validUntil: string
    applicableTypes?: string
  }
}

/**
 * 获取可领取的优惠券列表（公开）
 */
export const getAvailableCoupons = async (userId?: string) => {
  const now = new Date().toISOString()

  // 查询所有有效的优惠券
  const result = await query(
    `SELECT
       c.id, c.code, c.name, c.type, c.value,
       c.min_amount, c.max_discount,
       c.total_count, c.used_count,
       c.valid_from, c.valid_until,
       c.target_users, c.applicable_types
     FROM coupons c
     WHERE c.status = 'active'
       AND c.valid_from <= $1
       AND c.valid_until >= $1
       AND c.used_count < c.total_count
     ORDER BY c.value DESC, c.valid_until ASC`,
    [now]
  )

  const coupons = result.rows.map((row: any) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    value: parseFloat(row.value),
    minAmount: row.min_amount ? parseFloat(row.min_amount) : undefined,
    maxDiscount: row.max_discount ? parseFloat(row.max_discount) : undefined,
    totalCount: row.total_count,
    usedCount: row.used_count,
    remainingCount: row.total_count - row.used_count,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    targetUsers: row.target_users,
    applicableTypes: row.applicable_types,
  }))

  // 如果提供了userId，检查用户是否已领取
  if (userId) {
    const couponIds = coupons.map((c: any) => c.id)
    if (couponIds.length > 0) {
      const receivedResult = await query(
        `SELECT coupon_id FROM user_coupons WHERE user_id = $1 AND coupon_id = ANY($2)`,
        [userId, couponIds]
      )
      const receivedCouponIds = new Set(receivedResult.rows.map((r: any) => r.coupon_id))

      coupons.forEach((coupon: any) => {
        coupon.isReceived = receivedCouponIds.has(coupon.id)
      })
    }
  }

  return coupons
}

/**
 * 领取优惠券
 */
export const receiveCoupon = async (userId: string, couponId: number) => {
  const now = new Date().toISOString()

  // 检查优惠券是否存在且有效
  const couponResult = await query(
    `SELECT
       id, code, name, type, value, min_amount, max_discount,
       total_count, used_count, valid_from, valid_until,
       target_users, status
     FROM coupons
     WHERE id = $1`,
    [couponId]
  )

  if (couponResult.rows.length === 0) {
    throw new Error('优惠券不存在')
  }

  const coupon = couponResult.rows[0]

  if (coupon.status !== 'active') {
    throw new Error('优惠券已失效')
  }

  if (coupon.valid_from > now) {
    throw new Error('优惠券未到领取时间')
  }

  if (coupon.valid_until < now) {
    throw new Error('优惠券已过期')
  }

  if (coupon.used_count >= coupon.total_count) {
    throw new Error('优惠券已被领完')
  }

  // 检查用户是否已领取
  const receivedResult = await query(
    'SELECT id FROM user_coupons WHERE user_id = $1 AND coupon_id = $2',
    [userId, couponId]
  )

  if (receivedResult.rows.length > 0) {
    throw new Error('您已领取过该优惠券')
  }

  // 领取优惠券（使用事务）
  await query('BEGIN')
  try {
    // 插入用户优惠券记录
    const userCouponResult = await query(
      `INSERT INTO user_coupons (user_id, coupon_id, status, expired_at)
       VALUES ($1, $2, 'unused', $3)
       RETURNING *`,
      [userId, couponId, coupon.valid_until]
    )

    // 更新优惠券使用次数
    await query(
      'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
      [couponId]
    )

    await query('COMMIT')

    const userCoupon = userCouponResult.rows[0]

    return {
      id: userCoupon.id,
      userId: userCoupon.user_id,
      couponId: userCoupon.coupon_id,
      status: userCoupon.status,
      receivedAt: userCoupon.received_at,
      expiredAt: userCoupon.expired_at,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: parseFloat(coupon.value),
        minAmount: coupon.min_amount ? parseFloat(coupon.min_amount) : undefined,
        maxDiscount: coupon.max_discount ? parseFloat(coupon.max_discount) : undefined,
        validFrom: coupon.valid_from,
        validUntil: coupon.valid_until,
      },
    }
  } catch (error) {
    await query('ROLLBACK')
    throw error
  }
}

/**
 * 获取用户的优惠券列表
 */
export const getUserCoupons = async (
  userId: string,
  params: {
    status?: string
    page?: number
    limit?: number
  } = {}
) => {
  const page = params.page || 1
  const limit = params.limit || 20
  const offset = (page - 1) * limit

  // 构建查询条件
  const conditions = ['uc.user_id = $1']
  const queryParams: any[] = [userId]
  let paramIndex = 2

  if (params.status && params.status !== 'all') {
    conditions.push(`uc.status = $${paramIndex}`)
    queryParams.push(params.status)
    paramIndex++
  }

  const whereClause = conditions.join(' AND ')

  // 查询用户优惠券
  const result = await query(
    `SELECT
       uc.id, uc.user_id, uc.coupon_id, uc.order_id,
       uc.status, uc.received_at, uc.used_at, uc.expired_at,
       c.code, c.name, c.type, c.value,
       c.min_amount, c.max_discount,
       c.valid_from, c.valid_until,
       c.applicable_types
     FROM user_coupons uc
     INNER JOIN coupons c ON uc.coupon_id = c.id
     WHERE ${whereClause}
     ORDER BY
       CASE uc.status
         WHEN 'unused' THEN 1
         WHEN 'used' THEN 2
         WHEN 'expired' THEN 3
       END,
       uc.expired_at ASC,
       uc.received_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, limit, offset]
  )

  // 查询总数
  const countResult = await query(
    `SELECT COUNT(*) as total FROM user_coupons uc WHERE ${whereClause}`,
    queryParams
  )

  const total = parseInt(countResult.rows[0].total)

  const coupons = result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    couponId: row.coupon_id,
    orderId: row.order_id,
    status: row.status,
    receivedAt: row.received_at,
    usedAt: row.used_at,
    expiredAt: row.expired_at,
    coupon: {
      code: row.code,
      name: row.name,
      type: row.type,
      value: parseFloat(row.value),
      minAmount: row.min_amount ? parseFloat(row.min_amount) : undefined,
      maxDiscount: row.max_discount ? parseFloat(row.max_discount) : undefined,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      applicableTypes: row.applicable_types,
    },
  }))

  return {
    items: coupons,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 获取用户可用的优惠券（用于下单时选择）
 */
export const getUsableCoupons = async (userId: string, amount: number, fortuneType?: string) => {
  const now = new Date().toISOString()

  // 查询用户的未使用且未过期的优惠券
  const result = await query(
    `SELECT
       uc.id as user_coupon_id, uc.coupon_id, uc.expired_at,
       c.code, c.name, c.type, c.value,
       c.min_amount, c.max_discount,
       c.applicable_types
     FROM user_coupons uc
     INNER JOIN coupons c ON uc.coupon_id = c.id
     WHERE uc.user_id = $1
       AND uc.status = 'unused'
       AND uc.expired_at >= $2
     ORDER BY c.value DESC`,
    [userId, now]
  )

  // 筛选可用的优惠券
  const usableCoupons = result.rows
    .filter((row: any) => {
      // 检查最小金额限制
      if (row.min_amount && amount < parseFloat(row.min_amount)) {
        return false
      }

      // 检查适用类型
      if (row.applicable_types && fortuneType) {
        const applicableTypes = row.applicable_types.split(',')
        if (!applicableTypes.includes(fortuneType)) {
          return false
        }
      }

      return true
    })
    .map((row: any) => {
      // 计算实际优惠金额
      let discountAmount = 0
      if (row.type === 'discount') {
        // 折扣类型：value是折扣百分比（如10表示9折）
        discountAmount = amount * (parseFloat(row.value) / 100)
      } else if (row.type === 'fixed') {
        // 固定减免金额
        discountAmount = parseFloat(row.value)
      }

      // 限制最大优惠金额
      if (row.max_discount) {
        discountAmount = Math.min(discountAmount, parseFloat(row.max_discount))
      }

      // 不能超过订单金额
      discountAmount = Math.min(discountAmount, amount)

      return {
        id: row.user_coupon_id,
        couponId: row.coupon_id,
        code: row.code,
        name: row.name,
        type: row.type,
        value: parseFloat(row.value),
        minAmount: row.min_amount ? parseFloat(row.min_amount) : undefined,
        maxDiscount: row.max_discount ? parseFloat(row.max_discount) : undefined,
        expiredAt: row.expired_at,
        discountAmount: Math.round(discountAmount * 100) / 100, // 保留两位小数
      }
    })

  return usableCoupons
}

/**
 * 使用优惠券（在创建订单时调用）
 */
export const useCoupon = async (userId: string, userCouponId: number, orderId: string) => {
  // 检查优惠券
  const result = await query(
    `SELECT id, status, expired_at
     FROM user_coupons
     WHERE id = $1 AND user_id = $2`,
    [userCouponId, userId]
  )

  if (result.rows.length === 0) {
    throw new Error('优惠券不存在')
  }

  const userCoupon = result.rows[0]

  if (userCoupon.status !== 'unused') {
    throw new Error('优惠券已使用或已过期')
  }

  const now = new Date().toISOString()
  if (userCoupon.expired_at < now) {
    throw new Error('优惠券已过期')
  }

  // 更新优惠券状态
  await query(
    `UPDATE user_coupons
     SET status = 'used', order_id = $1, used_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [orderId, userCouponId]
  )

  return true
}

/**
 * 获取用户优惠券统计
 */
export const getCouponStats = async (userId: string) => {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'unused' AND expired_at >= CURRENT_TIMESTAMP) as unused_count,
       COUNT(*) FILTER (WHERE status = 'used') as used_count,
       COUNT(*) FILTER (WHERE status = 'expired' OR expired_at < CURRENT_TIMESTAMP) as expired_count
     FROM user_coupons
     WHERE user_id = $1`,
    [userId]
  )

  const stats = result.rows[0]

  return {
    unusedCount: parseInt(stats.unused_count),
    usedCount: parseInt(stats.used_count),
    expiredCount: parseInt(stats.expired_count),
  }
}
