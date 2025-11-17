/**
 * 算命结果管理路由 (用户端)
 *
 * 文件: user/fortuneResults.ts
 * 标签: User - Fortune Results
 * 前缀: /api/fortune-results
 *
 * 已完成的路由 (5个):
 *   - POST / - 计算并保存算命结果
 *   - GET / - 获取我的算命结果列表
 *   - GET /order/:orderId - 根据订单ID获取算命结果
 *   - GET /:resultId - 获取单个算命结果
 *   - DELETE /:resultId - 删除算命结果
 */

import express from 'express'
import { authenticateUser } from '../../middleware/userAuth'
import {
  calculateAndSave,
  getResult,
  getMyResults,
  deleteResult,
  getResultsByOrderId,
} from '../../controllers/user/fortuneResultController'

const router = express.Router()

// 所有路由都需要用户认证（除了获取单个结果可以匿名访问）
router.use(authenticateUser)

/**
 * @openapi
 * /api/fortune-results:
 *   post:
 *     summary: 计算并保存算命结果
 *     description: 根据用户提供的信息计算算命结果并保存到数据库
 *     tags:
 *       - User - Fortune Results
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fortuneId
 *               - fortuneType
 *               - inputData
 *             properties:
 *               fortuneId:
 *                 type: string
 *                 description: 算命服务ID
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               fortuneType:
 *                 type: string
 *                 enum: [zodiac, bazi, career, marriage, name, yearly, health, wealth]
 *                 description: 算命类型
 *                 example: "bazi"
 *               inputData:
 *                 type: object
 *                 description: 算命所需的输入数据(根据类型不同而不同)
 *                 example: { "birthYear": 1990, "birthMonth": 5, "birthDay": 15, "birthHour": 10, "gender": "male" }
 *               orderId:
 *                 type: string
 *                 description: 关联的订单ID(可选)
 *     responses:
 *       201:
 *         description: 算命结果创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     resultId:
 *                       type: string
 *                     fortuneType:
 *                       type: string
 *                     resultData:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', calculateAndSave)

/**
 * @openapi
 * /api/fortune-results:
 *   get:
 *     summary: 获取我的算命结果列表
 *     description: 获取当前登录用户的所有算命结果记录,支持分页和类型筛选
 *     tags:
 *       - User - Fortune Results
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
 *       - in: query
 *         name: fortuneType
 *         schema:
 *           type: string
 *           enum: [zodiac, bazi, career, marriage, name, yearly, health, wealth]
 *         description: 算命类型筛选
 *     responses:
 *       200:
 *         description: 成功获取结果列表
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       fortuneId:
 *                         type: string
 *                       fortuneType:
 *                         type: string
 *                       fortuneName:
 *                         type: string
 *                       inputData:
 *                         type: object
 *                       resultData:
 *                         type: object
 *                       orderId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', getMyResults)

/**
 * @openapi
 * /api/fortune-results/order/{orderId}:
 *   get:
 *     summary: 根据订单ID获取算命结果
 *     description: 获取指定订单关联的所有算命结果
 *     tags:
 *       - User - Fortune Results
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单ID
 *     responses:
 *       200:
 *         description: 成功获取订单结果
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       fortuneId:
 *                         type: string
 *                       fortuneType:
 *                         type: string
 *                       fortuneName:
 *                         type: string
 *                       inputData:
 *                         type: object
 *                       resultData:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/order/:orderId', getResultsByOrderId)

/**
 * @openapi
 * /api/fortune-results/{resultId}:
 *   get:
 *     summary: 获取单个算命结果
 *     description: 根据结果ID获取算命结果的详细信息(需要用户认证并验证权限)
 *     tags:
 *       - User - Fortune Results
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: string
 *         description: 算命结果ID
 *     responses:
 *       200:
 *         description: 成功获取结果详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     fortuneId:
 *                       type: string
 *                     fortuneType:
 *                       type: string
 *                     fortuneName:
 *                       type: string
 *                     inputData:
 *                       type: object
 *                       description: 用户输入的数据
 *                     resultData:
 *                       type: object
 *                       description: 算命计算结果
 *                     orderId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 无权访问此结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "无权访问此算命结果"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:resultId', getResult)

/**
 * @openapi
 * /api/fortune-results/{resultId}:
 *   delete:
 *     summary: 删除算命结果
 *     description: 删除指定的算命结果记录(仅可删除自己的结果)
 *     tags:
 *       - User - Fortune Results
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: string
 *         description: 算命结果ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 无权删除此结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "无权删除此算命结果"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:resultId', deleteResult)

export default router
