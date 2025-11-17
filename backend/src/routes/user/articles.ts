import { Router } from 'express'
import * as articleController from '../../controllers/user/articleController'

const router = Router()

/**
 * @openapi
 * /api/articles:
 *   get:
 *     summary: 获取文章列表
 *     description: 获取所有文章,支持分页和分类筛选
 *     tags:
 *       - User - Articles
 *     parameters:
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 文章分类
 *     responses:
 *       200:
 *         description: 成功获取文章列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', articleController.getArticles)

/**
 * @openapi
 * /api/articles/{id}:
 *   get:
 *     summary: 获取文章详情
 *     description: 获取指定文章的详细内容
 *     tags:
 *       - User - Articles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 文章ID
 *     responses:
 *       200:
 *         description: 成功获取文章详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', articleController.getArticleDetail)

export default router
