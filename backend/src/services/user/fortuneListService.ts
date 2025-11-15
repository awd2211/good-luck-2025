import { query } from '../../config/database'

/**
 * 获取算命服务列表
 */
export const getFortuneList = async (params: {
  category?: string
  page?: number
  limit?: number
  sort?: string // price_asc, price_desc, popular, rating
  keyword?: string
}) => {
  const page = params.page || 1
  const limit = params.limit || 20
  const offset = (page - 1) * limit

  // 构建查询条件
  const conditions: string[] = ["fs.status = 'active'"]
  const values: any[] = []
  let paramIndex = 1

  // 分类筛选（支持分类ID或分类代码）
  if (params.category) {
    conditions.push(`(fc.code = $${paramIndex} OR fs.category_id::text = $${paramIndex})`)
    values.push(params.category)
    paramIndex++
  }

  // 关键词搜索
  if (params.keyword) {
    conditions.push(`(fs.name ILIKE $${paramIndex} OR fs.description ILIKE $${paramIndex} OR fc.name ILIKE $${paramIndex})`)
    values.push(`%${params.keyword}%`)
    paramIndex++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 排序
  let orderBy = 'ORDER BY fs.created_at DESC'
  switch (params.sort) {
    case 'price_asc':
      orderBy = 'ORDER BY fs.current_price ASC'
      break
    case 'price_desc':
      orderBy = 'ORDER BY fs.current_price DESC'
      break
    case 'popular':
      orderBy = 'ORDER BY fs.order_count DESC'
      break
    case 'rating':
      orderBy = 'ORDER BY fs.rating DESC, fs.order_count DESC'
      break
  }

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM fortune_services fs
     LEFT JOIN fortune_categories fc ON fs.category_id = fc.id
     ${whereClause}`,
    values
  )
  const total = parseInt(countResult.rows[0].total)

  // 获取列表
  const result = await query(
    `SELECT
      fs.id,
      fs.name as title,
      fs.subtitle,
      fc.code as category,
      fc.name as category_name,
      fs.description,
      fs.current_price as price,
      fs.original_price,
      fc.icon,
      '#F9E6D5' as bg_color,
      fs.order_count as sales_count,
      fs.rating
    FROM fortune_services fs
    LEFT JOIN fortune_categories fc ON fs.category_id = fc.id
    ${whereClause}
    ${orderBy}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...values, limit, offset]
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
 * 获取算命服务详情
 */
export const getFortuneDetail = async (fortuneId: string, userId?: string) => {
  const result = await query(
    `SELECT
      fs.id,
      fs.name as title,
      fs.subtitle,
      fc.code as category,
      fc.name as category_name,
      fs.description,
      fs.detail_content,
      fs.current_price as price,
      fs.original_price,
      fs.vip_price,
      fs.cover_image,
      fs.images,
      fc.icon,
      '#F9E6D5' as bg_color,
      fs.order_count as sales_count,
      fs.rating,
      fs.review_count,
      fs.duration,
      fs.is_free_trial,
      fs.trial_times,
      fs.tags,
      fs.is_hot,
      fs.is_new,
      fs.is_recommended,
      fs.created_at,
      fs.updated_at
    FROM fortune_services fs
    LEFT JOIN fortune_categories fc ON fs.category_id = fc.id
    WHERE fs.id = $1 AND fs.status = 'active'`,
    [fortuneId]
  )

  if (result.rows.length === 0) {
    throw new Error('商品不存在或已下架')
  }

  const fortune = result.rows[0]

  // 如果用户已登录，检查收藏状态
  let isFavorited = false
  if (userId) {
    const favoriteResult = await query(
      'SELECT id FROM favorites WHERE user_id = $1 AND fortune_id = $2',
      [userId, fortuneId]
    )
    isFavorited = favoriteResult.rows.length > 0
  }

  return {
    ...fortune,
    isFavorited,
  }
}

/**
 * 获取热门服务
 */
export const getPopularFortunes = async (limit: number = 10) => {
  const result = await query(
    `SELECT
      fs.id,
      fs.name as title,
      fs.subtitle,
      fc.code as category,
      fc.name as category_name,
      fs.description,
      fs.current_price as price,
      fs.original_price,
      fc.icon,
      '#F9E6D5' as bg_color,
      fs.order_count as sales_count,
      fs.rating
    FROM fortune_services fs
    LEFT JOIN fortune_categories fc ON fs.category_id = fc.id
    WHERE fs.status = 'active'
    ORDER BY fs.order_count DESC
    LIMIT $1`,
    [limit]
  )

  return result.rows
}

/**
 * 获取推荐服务
 */
export const getRecommendedFortunes = async (limit: number = 10) => {
  const result = await query(
    `SELECT
      fs.id,
      fs.name as title,
      fs.subtitle,
      fc.code as category,
      fc.name as category_name,
      fs.description,
      fs.current_price as price,
      fs.original_price,
      fc.icon,
      '#F9E6D5' as bg_color,
      fs.order_count as sales_count,
      fs.rating
    FROM fortune_services fs
    LEFT JOIN fortune_categories fc ON fs.category_id = fc.id
    WHERE fs.status = 'active'
    ORDER BY fs.rating DESC, fs.order_count DESC
    LIMIT $1`,
    [limit]
  )

  return result.rows
}

/**
 * 获取分类列表
 */
export const getCategories = async () => {
  const result = await query(
    `SELECT
      fc.id,
      fc.code as category,
      fc.name,
      fc.icon,
      fc.description,
      COUNT(fs.id) as count,
      MIN(fs.current_price) as min_price,
      MAX(fs.current_price) as max_price
    FROM fortune_categories fc
    LEFT JOIN fortune_services fs ON fc.id = fs.category_id AND fs.status = 'active'
    WHERE fc.status = 'active'
    GROUP BY fc.id, fc.code, fc.name, fc.icon, fc.description, fc.sort_order
    ORDER BY fc.sort_order ASC, count DESC`
  )

  return result.rows.map(row => ({
    category: row.category,
    name: row.name,
    icon: row.icon,
    description: row.description,
    count: parseInt(row.count),
    minPrice: row.min_price ? parseFloat(row.min_price) : 0,
    maxPrice: row.max_price ? parseFloat(row.max_price) : 0,
  }))
}
