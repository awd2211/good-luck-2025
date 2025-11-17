import { Router } from 'express'
import * as historyController from '../../controllers/user/historyController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

// 所有浏览历史接口都需要用户认证
router.use(authenticateUser)

/**
 * @openapi
 * /api/history:
 *   get:
 *     summary: 获取浏览历史
 *     description: 获取当前用户的浏览历史记录
 *     tags:
 *       - User - History
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
 *         description: 成功返回浏览历史
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
 */
router.get('/', historyController.getHistory)

/**
 * @openapi
 * /api/history:
 *   post:
 *     summary: 添加浏览记录
 *     description: 记录用户浏览的算命服务
 *     tags:
 *       - User - History
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
 *         description: 记录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', historyController.addHistory)

/**
 * @openapi
 * /api/history/{id}:
 *   delete:
 *     summary: 删除单条浏览记录
 *     description: 删除指定的浏览历史记录
 *     tags:
 *       - User - History
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 浏览记录ID
 *         example: "history-001"
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 记录不存在
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
router.delete('/:id', historyController.removeHistory)

/**
 * @openapi
 * /api/history:
 *   delete:
 *     summary: 清空浏览历史
 *     description: 清空当前用户的所有浏览历史
 *     tags:
 *       - User - History
 *     security:
 *       - UserBearerAuth: []
 *     responses:
 *       200:
 *         description: 清空成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/', historyController.clearHistory)

/**
 * @openapi
 * /api/history/batch-delete:
 *   post:
 *     summary: 批量删除浏览记录
 *     description: 批量删除多条浏览历史记录
 *     tags:
 *       - User - History
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["history-001", "history-002"]
 *                 description: 浏览记录ID数组
 *     responses:
 *       200:
 *         description: 批量删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/batch-delete', historyController.batchRemove)

export default router
