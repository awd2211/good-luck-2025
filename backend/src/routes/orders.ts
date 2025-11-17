import express from 'express'
import {
  getOrders,
  getOrder,
  addOrder,
  modifyOrder,
  changeOrderStatus,
  removeOrder,
  getStats,
  getTodayStats
} from '../controllers/orderController'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'

const router = express.Router()

/**
 * @openapi
 * /api/manage/orders/stats:
 *   get:
 *     summary: 获取订单统计
 *     description: 获取订单的统计信息
 *     tags:
 *       - Admin - Orders
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回订单统计
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', authenticate, requirePermission(Resource.ORDERS, Action.VIEW), getStats)

/**
 * @openapi
 * /api/manage/orders/today-stats:
 *   get:
 *     summary: 获取今日订单统计
 *     description: 获取今日订单的实时统计数据
 *     tags:
 *       - Admin - Orders
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回今日统计
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/today-stats', authenticate, requirePermission(Resource.ORDERS, Action.VIEW), getTodayStats)

/**
 * @openapi
 * /api/manage/orders:
 *   get:
 *     summary: 获取订单列表
 *     description: 管理端获取订单列表,支持搜索和筛选
 *     tags:
 *       - Admin - Orders
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['pending', 'paid', 'processing', 'completed', 'cancelled', 'refunded']
 *         description: 订单状态筛选
 *     responses:
 *       200:
 *         description: 成功返回订单列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authenticate, requirePermission(Resource.ORDERS, Action.VIEW), getOrders)

/**
 * @openapi
 * /api/manage/orders/{id}:
 *   get:
 *     summary: 获取订单详情
 *     description: 获取指定订单的详细信息
 *     tags:
 *       - Admin - Orders
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单ID
 *         example: "order-001"
 *     responses:
 *       200:
 *         description: 成功返回订单详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: 订单不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', authenticate, requirePermission(Resource.ORDERS, Action.VIEW), getOrder)

/**
 * @openapi
 * /api/manage/orders:
 *   post:
 *     summary: 创建订单
 *     description: 管理端创建新订单
 *     tags:
 *       - Admin - Orders
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - items
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: "user-001"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: 订单创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, requirePermission(Resource.ORDERS, Action.CREATE), addOrder)

/**
 * @openapi
 * /api/manage/orders/{id}:
 *   put:
 *     summary: 更新订单
 *     description: 更新订单信息
 *     tags:
 *       - Admin - Orders
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单ID
 *         example: "order-001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 订单不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', authenticate, requirePermission(Resource.ORDERS, Action.EDIT), modifyOrder)

/**
 * @openapi
 * /api/manage/orders/{id}/status:
 *   patch:
 *     summary: 修改订单状态
 *     description: 更新订单的状态
 *     tags:
 *       - Admin - Orders
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单ID
 *         example: "order-001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['pending', 'paid', 'processing', 'completed', 'cancelled', 'refunded']
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: 状态更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 订单不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id/status', authenticate, requirePermission(Resource.ORDERS, Action.EDIT), changeOrderStatus)

/**
 * @openapi
 * /api/manage/orders/{id}:
 *   delete:
 *     summary: 删除订单
 *     description: 删除指定订单(软删除)
 *     tags:
 *       - Admin - Orders
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单ID
 *         example: "order-001"
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 订单不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', authenticate, requirePermission(Resource.ORDERS, Action.DELETE), removeOrder)

export default router
