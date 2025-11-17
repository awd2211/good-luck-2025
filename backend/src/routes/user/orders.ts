import { Router } from 'express'
import * as orderController from '../../controllers/user/orderController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

// 所有订单路由都需要用户认证
router.use(authenticateUser)

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: 创建订单
 *     description: 创建新订单，可以从购物车或直接购买
 *     tags:
 *       - User - Orders
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fortuneId:
 *                       type: string
 *                       example: "fortune-001"
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *               payMethod:
 *                 type: string
 *                 enum: ['wechat', 'alipay', 'balance']
 *                 example: "wechat"
 *                 description: 支付方式
 *               couponId:
 *                 type: string
 *                 example: "coupon-001"
 *                 description: 优惠券ID
 *     responses:
 *       201:
 *         description: 订单创建成功
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
 *       400:
 *         description: 参数错误或余额不足
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
router.post('/', orderController.createOrder)

/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: 获取用户订单列表
 *     description: 分页获取当前用户的订单列表，支持按状态筛选
 *     tags:
 *       - User - Orders
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
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', orderController.getUserOrders)

/**
 * @openapi
 * /api/orders/stats:
 *   get:
 *     summary: 获取订单统计
 *     description: 获取当前用户的订单统计信息（总数、各状态数量等）
 *     tags:
 *       - User - Orders
 *     security:
 *       - UserBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     pending:
 *                       type: integer
 *                       example: 5
 *                     paid:
 *                       type: integer
 *                       example: 10
 *                     completed:
 *                       type: integer
 *                       example: 30
 *                     cancelled:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', orderController.getOrderStats)

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     summary: 获取订单详情
 *     description: 获取指定订单的详细信息
 *     tags:
 *       - User - Orders
 *     security:
 *       - UserBearerAuth: []
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
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', orderController.getOrderDetail)

/**
 * @openapi
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: 取消订单
 *     description: 取消待支付的订单
 *     tags:
 *       - User - Orders
 *     security:
 *       - UserBearerAuth: []
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
 *         description: 订单取消成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 订单状态不允许取消
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 订单不存在
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
router.put('/:id/cancel', orderController.cancelOrder)

/**
 * @openapi
 * /api/orders/{id}:
 *   delete:
 *     summary: 删除订单
 *     description: 删除已完成或已取消的订单
 *     tags:
 *       - User - Orders
 *     security:
 *       - UserBearerAuth: []
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
 *         description: 订单删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 订单状态不允许删除
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 订单不存在
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
router.delete('/:id', orderController.deleteOrder)

export default router
