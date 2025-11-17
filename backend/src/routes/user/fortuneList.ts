import { Router } from 'express'
import * as fortuneListController from '../../controllers/user/fortuneListController'
import { optionalUserAuth } from '../../middleware/userAuth'

const router = Router()

/**
 * @openapi
 * /api/fortunes:
 *   get:
 *     summary: 获取算命服务列表
 *     description: 公开接口,获取所有算命服务列表,支持筛选、排序和搜索
 *     tags:
 *       - User - Fortune List
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
 *         description: 分类筛选
 *         example: "bazi"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: ['price_asc', 'price_desc', 'popular', 'latest']
 *         description: 排序方式
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功返回服务列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', fortuneListController.getFortuneList)

/**
 * @openapi
 * /api/fortunes/popular:
 *   get:
 *     summary: 获取热门服务
 *     description: 公开接口,获取热门的算命服务
 *     tags:
 *       - User - Fortune List
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量
 *     responses:
 *       200:
 *         description: 成功返回热门服务
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
 *                     $ref: '#/components/schemas/Fortune'
 */
router.get('/popular', fortuneListController.getPopularFortunes)

/**
 * @openapi
 * /api/fortunes/recommended:
 *   get:
 *     summary: 获取推荐服务
 *     description: 公开接口,获取推荐的算命服务
 *     tags:
 *       - User - Fortune List
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量
 *     responses:
 *       200:
 *         description: 成功返回推荐服务
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
 *                     $ref: '#/components/schemas/Fortune'
 */
router.get('/recommended', fortuneListController.getRecommendedFortunes)

/**
 * @openapi
 * /api/fortunes/categories:
 *   get:
 *     summary: 获取分类列表
 *     description: 公开接口,获取所有算命服务分类
 *     tags:
 *       - User - Fortune List
 *     responses:
 *       200:
 *         description: 成功返回分类列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "bazi"
 *                       name:
 *                         type: string
 *                         example: "八字精批"
 *                       count:
 *                         type: integer
 *                         example: 10
 */
router.get('/categories', fortuneListController.getCategories)

/**
 * @openapi
 * /api/fortunes/{id}:
 *   get:
 *     summary: 获取算命服务详情
 *     description: 公开接口,获取指定算命服务的详细信息。如果用户已登录,会返回该用户的收藏状态
 *     tags:
 *       - User - Fortune List
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 算命服务ID
 *         example: "fortune-001"
 *     responses:
 *       200:
 *         description: 成功返回服务详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Fortune'
 *                 isFavorite:
 *                   type: boolean
 *                   example: true
 *                   description: 是否已收藏（仅登录用户返回）
 *       404:
 *         description: 服务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', optionalUserAuth, fortuneListController.getFortuneDetail)

export default router
