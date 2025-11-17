import { Router } from 'express'
import * as favoriteController from '../../controllers/user/favoriteController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

// 所有收藏接口都需要用户认证
router.use(authenticateUser)

/**
 * @openapi
 * /api/favorites:
 *   get:
 *     summary: 获取收藏列表
 *     description: 获取当前用户的所有收藏的算命服务
 *     tags:
 *       - User - Favorites
 *     security:
 *       - UserBearerAuth: []
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
 *     responses:
 *       200:
 *         description: 成功返回收藏列表
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
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', favoriteController.getFavorites)

/**
 * @openapi
 * /api/favorites:
 *   post:
 *     summary: 添加收藏
 *     description: 将算命服务添加到收藏夹
 *     tags:
 *       - User - Favorites
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fortune_id
 *             properties:
 *               fortune_id:
 *                 type: string
 *                 example: "fortune-001"
 *                 description: 算命服务ID
 *     responses:
 *       201:
 *         description: 收藏成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 已经收藏过或服务不存在
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
router.post('/', favoriteController.addFavorite)

/**
 * @openapi
 * /api/favorites/{fortuneId}:
 *   delete:
 *     summary: 取消收藏
 *     description: 从收藏夹中移除算命服务
 *     tags:
 *       - User - Favorites
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fortuneId
 *         required: true
 *         schema:
 *           type: string
 *         description: 算命服务ID
 *         example: "fortune-001"
 *     responses:
 *       200:
 *         description: 取消收藏成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 未找到该收藏
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
router.delete('/:fortuneId', favoriteController.removeFavorite)

/**
 * @openapi
 * /api/favorites/check/{fortuneId}:
 *   get:
 *     summary: 检查是否收藏
 *     description: 检查指定算命服务是否已收藏
 *     tags:
 *       - User - Favorites
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fortuneId
 *         required: true
 *         schema:
 *           type: string
 *         description: 算命服务ID
 *         example: "fortune-001"
 *     responses:
 *       200:
 *         description: 返回收藏状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 isFavorite:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/check/:fortuneId', favoriteController.checkFavorite)

/**
 * @openapi
 * /api/favorites/batch-check:
 *   post:
 *     summary: 批量检查收藏状态
 *     description: 批量检查多个算命服务的收藏状态
 *     tags:
 *       - User - Favorites
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fortune_ids
 *             properties:
 *               fortune_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["fortune-001", "fortune-002", "fortune-003"]
 *                 description: 算命服务ID数组
 *     responses:
 *       200:
 *         description: 返回各服务的收藏状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 favorites:
 *                   type: object
 *                   additionalProperties:
 *                     type: boolean
 *                   example:
 *                     "fortune-001": true
 *                     "fortune-002": false
 *                     "fortune-003": true
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/batch-check', favoriteController.batchCheckFavorites)

export default router
