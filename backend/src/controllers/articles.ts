import { Request, Response } from 'express'
import { query } from '../config/database'
import { redisCache } from '../config/redis'

const CACHE_KEY_PREFIX = 'articles'
const CACHE_TTL = 300 // 5 minutes

/**
 * 获取文章列表
 */
export const getArticles = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      tag,
      search
    } = req.query

    const offset = (Number(page) - 1) * Number(limit)
    const cacheKey = `${CACHE_KEY_PREFIX}:list:${page}:${limit}:${category || 'all'}:${status || 'all'}:${tag || 'all'}:${search || ''}`

    // Check cache
    const cached = await redisCache.get(cacheKey)
    if (cached) {
      return res.json({
        success: true,
        data: cached
      })
    }

    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (category) {
      whereConditions.push(`category = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (tag) {
      whereConditions.push(`$${paramIndex} = ANY(tags)`)
      queryParams.push(tag)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR summary ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM articles ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].total)

    // Get articles
    queryParams.push(Number(limit), offset)
    const result = await query(
      `SELECT * FROM articles
       ${whereClause}
       ORDER BY sort_order DESC, created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    )

    const responseData = {
      list: result.rows,
      total,
      page: Number(page),
      limit: Number(limit)
    }

    // Cache result
    await redisCache.set(cacheKey, responseData, CACHE_TTL)

    res.json({
      success: true,
      data: responseData
    })
  } catch (error: any) {
    console.error('Error fetching articles:', error)
    res.status(500).json({
      success: false,
      message: '获取文章列表失败',
      error: error.message
    })
  }
}

/**
 * 获取单个文章
 */
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const cacheKey = `${CACHE_KEY_PREFIX}:detail:${id}`

    // Check cache
    const cached = await redisCache.get(cacheKey)
    if (cached) {
      return res.json({
        success: true,
        data: cached
      })
    }

    const result = await query(
      'SELECT * FROM articles WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      })
    }

    // Cache result
    await redisCache.set(cacheKey, result.rows[0], CACHE_TTL)

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error: any) {
    console.error('Error fetching article:', error)
    res.status(500).json({
      success: false,
      message: '获取文章失败',
      error: error.message
    })
  }
}

/**
 * 创建文章
 */
export const createArticle = async (req: Request, res: Response) => {
  try {
    const {
      title,
      summary,
      content,
      cover_image,
      category,
      tags,
      status,
      author,
      sort_order,
      seo_title,
      seo_keywords,
      seo_description,
      is_featured,
      is_hot
    } = req.body

    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: '标题、内容和分类为必填项'
      })
    }

    const result = await query(
      `INSERT INTO articles
       (title, summary, content, cover_image, category, tags, status, author, sort_order,
        seo_title, seo_keywords, seo_description, is_featured, is_hot, view_count, like_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0, 0)
       RETURNING *`,
      [
        title,
        summary || null,
        content,
        cover_image || null,
        category,
        tags || [],
        status || 'draft',
        author || null,
        sort_order || 0,
        seo_title || null,
        seo_keywords || null,
        seo_description || null,
        is_featured || false,
        is_hot || false
      ]
    )

    // Clear cache
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:list:*`)

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '文章创建成功'
    })
  } catch (error: any) {
    console.error('Error creating article:', error)
    res.status(500).json({
      success: false,
      message: '创建文章失败',
      error: error.message
    })
  }
}

/**
 * 更新文章
 */
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      title,
      summary,
      content,
      cover_image,
      category,
      tags,
      status,
      author,
      sort_order,
      seo_title,
      seo_keywords,
      seo_description,
      is_featured,
      is_hot
    } = req.body

    const result = await query(
      `UPDATE articles
       SET title = COALESCE($1, title),
           summary = COALESCE($2, summary),
           content = COALESCE($3, content),
           cover_image = COALESCE($4, cover_image),
           category = COALESCE($5, category),
           tags = COALESCE($6, tags),
           status = COALESCE($7, status),
           author = COALESCE($8, author),
           sort_order = COALESCE($9, sort_order),
           seo_title = COALESCE($10, seo_title),
           seo_keywords = COALESCE($11, seo_keywords),
           seo_description = COALESCE($12, seo_description),
           is_featured = COALESCE($13, is_featured),
           is_hot = COALESCE($14, is_hot),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $15
       RETURNING *`,
      [
        title,
        summary,
        content,
        cover_image,
        category,
        tags,
        status,
        author,
        sort_order,
        seo_title,
        seo_keywords,
        seo_description,
        is_featured,
        is_hot,
        id
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      })
    }

    // Clear cache
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`)

    res.json({
      success: true,
      data: result.rows[0],
      message: '文章更新成功'
    })
  } catch (error: any) {
    console.error('Error updating article:', error)
    res.status(500).json({
      success: false,
      message: '更新文章失败',
      error: error.message
    })
  }
}

/**
 * 删除文章
 */
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await query(
      'DELETE FROM articles WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      })
    }

    // Clear cache
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`)

    res.json({
      success: true,
      message: '文章删除成功'
    })
  } catch (error: any) {
    console.error('Error deleting article:', error)
    res.status(500).json({
      success: false,
      message: '删除文章失败',
      error: error.message
    })
  }
}

/**
 * 批量更新文章状态
 */
export const batchUpdateStatus = async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的文章ID列表'
      })
    }

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      })
    }

    const placeholders = ids.map((_, index) => `$${index + 2}`).join(',')

    await query(
      `UPDATE articles
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders})`,
      [status, ...ids]
    )

    // Clear cache
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:*`)

    res.json({
      success: true,
      message: '批量更新成功'
    })
  } catch (error: any) {
    console.error('Error batch updating articles:', error)
    res.status(500).json({
      success: false,
      message: '批量更新失败',
      error: error.message
    })
  }
}

/**
 * 增加文章浏览量
 */
export const incrementViewCount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await query(
      'UPDATE articles SET view_count = view_count + 1 WHERE id = $1',
      [id]
    )

    // Clear cache
    await redisCache.delPattern(`${CACHE_KEY_PREFIX}:detail:${id}`)

    res.json({
      success: true,
      message: '浏览量更新成功'
    })
  } catch (error: any) {
    console.error('Error incrementing view count:', error)
    res.status(500).json({
      success: false,
      message: '更新浏览量失败',
      error: error.message
    })
  }
}

/**
 * 获取文章分类列表
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}:categories`

    // Check cache
    const cached = await redisCache.get(cacheKey)
    if (cached) {
      return res.json({
        success: true,
        data: cached
      })
    }

    const result = await query(
      `SELECT category, COUNT(*) as count
       FROM articles
       WHERE status = 'published'
       GROUP BY category
       ORDER BY count DESC`
    )

    // Cache result
    await redisCache.set(cacheKey, result.rows, CACHE_TTL)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      message: '获取分类列表失败',
      error: error.message
    })
  }
}

/**
 * 获取文章标签列表
 */
export const getTags = async (req: Request, res: Response) => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}:tags`

    // Check cache
    const cached = await redisCache.get(cacheKey)
    if (cached) {
      return res.json({
        success: true,
        data: cached
      })
    }

    const result = await query(
      `SELECT DISTINCT unnest(tags) as tag, COUNT(*) as count
       FROM articles
       WHERE status = 'published'
       GROUP BY tag
       ORDER BY count DESC`
    )

    // Cache result
    await redisCache.set(cacheKey, result.rows, CACHE_TTL)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error: any) {
    console.error('Error fetching tags:', error)
    res.status(500).json({
      success: false,
      message: '获取标签列表失败',
      error: error.message
    })
  }
}
