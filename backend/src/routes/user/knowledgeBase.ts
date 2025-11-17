/**
 * 用户端 - 知识库和帮助中心路由
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';
import { optionalUserAuth } from '../../middleware/userAuth';

const router = Router();

/**
 * @openapi
 * /api/help/categories:
 *   get:
 *     summary: 获取帮助分类列表
 *     description: 获取所有已发布的知识库分类
 *     tags:
 *       - User - Help Center
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       article_count:
 *                         type: integer
 */
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT
        kc.id,
        kc.name,
        kc.description,
        kc.icon,
        kc.sort_order,
        COUNT(ka.id) as article_count
       FROM knowledge_categories kc
       LEFT JOIN knowledge_articles ka ON ka.category_id = kc.id AND ka.is_published = true
       WHERE kc.is_active = true
       GROUP BY kc.id
       ORDER BY kc.sort_order, kc.id`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/help/articles:
 *   get:
 *     summary: 获取帮助文章列表
 *     description: 获取已发布的帮助文章，支持分类筛选和搜索
 *     tags:
 *       - User - Help Center
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: 分类ID
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/articles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
    const keyword = req.query.keyword as string;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE is_published = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (categoryId) {
      whereClause += ` AND category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (keyword) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM knowledge_articles ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取文章列表
    const result = await pool.query(
      `SELECT
        id,
        category_id,
        title,
        summary,
        tags,
        view_count,
        is_featured,
        created_at,
        updated_at
       FROM knowledge_articles
       ${whereClause}
       ORDER BY is_featured DESC, sort_order, created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/help/articles/{id}:
 *   get:
 *     summary: 获取帮助文章详情
 *     description: 获取单篇帮助文章的完整内容，自动增加浏览次数
 *     tags:
 *       - User - Help Center
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 文章不存在
 */
router.get('/articles/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // 获取文章详情
    const result = await pool.query(
      `SELECT
        id,
        category_id,
        title,
        content,
        summary,
        tags,
        view_count,
        is_featured,
        created_at,
        updated_at
       FROM knowledge_articles
       WHERE id = $1 AND is_published = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '文章不存在或已下线'
      });
    }

    // 增加浏览次数
    await pool.query(
      'UPDATE knowledge_articles SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/help/faqs:
 *   get:
 *     summary: 获取常见问题列表
 *     description: 获取所有已发布的FAQ，按分类和排序展示
 *     tags:
 *       - User - Help Center
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: 分类ID
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/faqs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
    const keyword = req.query.keyword as string;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE is_published = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (categoryId) {
      whereClause += ` AND category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (keyword) {
      whereClause += ` AND (question ILIKE $${paramIndex} OR answer ILIKE $${paramIndex})`;
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    // 获取总数
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM faqs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 获取FAQ列表
    const result = await pool.query(
      `SELECT
        id,
        category_id,
        question,
        answer,
        tags,
        view_count,
        created_at,
        updated_at
       FROM faqs
       ${whereClause}
       ORDER BY sort_order, created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/help/faqs/{id}:
 *   get:
 *     summary: 获取FAQ详情
 *     description: 获取单个FAQ的详细内容，自动增加浏览次数
 *     tags:
 *       - User - Help Center
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: FAQ不存在
 */
router.get('/faqs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        id,
        category_id,
        question,
        answer,
        tags,
        view_count,
        created_at,
        updated_at
       FROM faqs
       WHERE id = $1 AND is_published = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ不存在或已下线'
      });
    }

    // 增加浏览次数
    await pool.query(
      'UPDATE faqs SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/help/search:
 *   get:
 *     summary: 搜索帮助内容
 *     description: 在文章和FAQ中搜索关键词
 *     tags:
 *       - User - Help Center
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 搜索成功
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keyword = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }

    // 搜索文章
    const articlesResult = await pool.query(
      `SELECT
        id,
        title as text,
        summary as description,
        'article' as type,
        view_count
       FROM knowledge_articles
       WHERE is_published = true
         AND (title ILIKE $1 OR content ILIKE $1)
       ORDER BY view_count DESC
       LIMIT $2`,
      [`%${keyword}%`, limit]
    );

    // 搜索FAQ
    const faqsResult = await pool.query(
      `SELECT
        id,
        question as text,
        answer as description,
        'faq' as type,
        view_count
       FROM faqs
       WHERE is_published = true
         AND (question ILIKE $1 OR answer ILIKE $1)
       ORDER BY view_count DESC
       LIMIT $2`,
      [`%${keyword}%`, limit]
    );

    // 合并结果
    const results = [
      ...articlesResult.rows,
      ...faqsResult.rows
    ].sort((a, b) => b.view_count - a.view_count).slice(0, limit);

    res.json({
      success: true,
      data: results,
      total: results.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
