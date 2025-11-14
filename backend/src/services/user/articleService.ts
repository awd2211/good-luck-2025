import { query } from '../../config/database'

/**
 * 获取已发布文章列表
 */
export const getPublishedArticles = async (params: {
  page: number
  limit: number
  category?: string
}) => {
  const { page, limit, category } = params
  const offset = (page - 1) * limit

  // 构建查询条件
  const conditions = ["status = 'published'"]
  const values: any[] = []
  let paramIndex = 1

  if (category) {
    conditions.push(`category = $${paramIndex}`)
    values.push(category)
    paramIndex++
  }

  const whereClause = conditions.join(' AND ')

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total FROM articles WHERE ${whereClause}`,
    values
  )
  const total = parseInt(countResult.rows[0].total)

  // 获取列表
  const result = await query(
    `SELECT
      id,
      title,
      summary,
      category,
      cover_image,
      author,
      view_count,
      published_at,
      created_at
    FROM articles
    WHERE ${whereClause}
    ORDER BY published_at DESC NULLS LAST, created_at DESC
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
 * 获取文章详情
 */
export const getArticleById = async (articleId: number) => {
  const result = await query(
    `SELECT
      id,
      title,
      summary,
      content,
      category,
      cover_image,
      author,
      view_count,
      published_at,
      created_at,
      updated_at
    FROM articles
    WHERE id = $1 AND status = 'published'`,
    [articleId]
  )

  return result.rows[0] || null
}

/**
 * 增加文章浏览量
 */
export const incrementViewCount = async (articleId: number) => {
  await query(
    'UPDATE articles SET view_count = view_count + 1 WHERE id = $1',
    [articleId]
  )
}
