import { Router } from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  batchUpdateStatus,
  incrementViewCount,
  getCategories,
  getTags
} from '../controllers/articles'

const router = Router()

/**
 * @openapi
 * /api/manage/articles/categories:
 *   get:
 *     summary: 获取文章分类列表
 *     description: 获取所有文章分类（公开接口，无需认证）
 *     tags:
 *       - Admin - Articles
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
 *                     type: string
 *                   example: ["运势", "命理", "风水", "生肖"]
 */
router.get('/categories', getCategories)

/**
 * @openapi
 * /api/manage/articles/tags:
 *   get:
 *     summary: 获取文章标签列表
 *     description: 获取所有文章标签（公开接口，无需认证）
 *     tags:
 *       - Admin - Articles
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
 *                     type: string
 *                   example: ["八字", "星座", "塔罗"]
 */
router.get('/tags', getTags)

/**
 * @openapi
 * /api/manage/articles/{id}/view:
 *   post:
 *     summary: 增加文章浏览次数
 *     description: 记录文章浏览（公开接口，无需认证）
 *     tags:
 *       - Admin - Articles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 文章ID
 *     responses:
 *       200:
 *         description: 记录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 浏览次数已更新
 */
router.post('/:id/view', incrementViewCount)

/**
 * @openapi
 * /api/manage/articles:
 *   get:
 *     summary: 获取文章列表
 *     description: 分页获取文章列表，支持按分类、标签、状态筛选和搜索
 *     tags:
 *       - Admin - Articles
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 按分类筛选
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: 按标签筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: 按状态筛选
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索标题或内容
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW), getArticles)

/**
 * @openapi
 * /api/manage/articles/{id}:
 *   get:
 *     summary: 获取文章详情
 *     description: 根据ID获取单篇文章的详细信息
 *     tags:
 *       - Admin - Articles
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 文章ID
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
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     category:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     status:
 *                       type: string
 *                     view_count:
 *                       type: integer
 *       404:
 *         description: 文章不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW), getArticleById)

/**
 * @openapi
 * /api/manage/articles:
 *   post:
 *     summary: 创建新文章
 *     description: 创建一篇新的文章
 *     tags:
 *       - Admin - Articles
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: 2024年生肖运势解析
 *                 description: 文章标题
 *               content:
 *                 type: string
 *                 description: 文章内容（支持HTML）
 *               category:
 *                 type: string
 *                 example: 运势
 *                 description: 文章分类
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["生肖", "运势"]
 *                 description: 文章标签
 *               cover_image:
 *                 type: string
 *                 example: https://example.com/cover.jpg
 *                 description: 封面图片URL
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *                 description: 文章状态
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE), createArticle)

/**
 * @openapi
 * /api/manage/articles/{id}:
 *   put:
 *     summary: 更新文章
 *     description: 更新指定文章的信息
 *     tags:
 *       - Admin - Articles
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 文章ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               cover_image:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 文章不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.EDIT), updateArticle)

/**
 * @openapi
 * /api/manage/articles/{id}:
 *   delete:
 *     summary: 删除文章
 *     description: 删除指定文章
 *     tags:
 *       - Admin - Articles
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 文章ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 文章不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.DELETE), deleteArticle)

/**
 * @openapi
 * /api/manage/articles/batch/status:
 *   patch:
 *     summary: 批量更新文章状态
 *     description: 批量修改多篇文章的发布状态
 *     tags:
 *       - Admin - Articles
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - status
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["article-001", "article-002"]
 *                 description: 文章ID列表
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: published
 *                 description: 新状态
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 成功更新2篇文章状态
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/batch/status', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.EDIT), batchUpdateStatus)

export default router
