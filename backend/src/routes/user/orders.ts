import { Router } from 'express'
import * as orderController from '../../controllers/user/orderController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

// 所有订单路由都需要用户认证
router.use(authenticateUser)

/**
 * @route   POST /api/orders
 * @desc    创建订单
 * @access  Private (用户)
 * @body    { items: [{ fortuneId: string, quantity: number }], payMethod?: string }
 */
router.post('/', orderController.createOrder)

/**
 * @route   GET /api/orders
 * @desc    获取用户订单列表
 * @access  Private (用户)
 * @query   page, limit, status
 */
router.get('/', orderController.getUserOrders)

/**
 * @route   GET /api/orders/stats
 * @desc    获取订单统计
 * @access  Private (用户)
 */
router.get('/stats', orderController.getOrderStats)

/**
 * @route   GET /api/orders/:id
 * @desc    获取订单详情
 * @access  Private (用户)
 */
router.get('/:id', orderController.getOrderDetail)

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    取消订单
 * @access  Private (用户)
 */
router.put('/:id/cancel', orderController.cancelOrder)

/**
 * @route   DELETE /api/orders/:id
 * @desc    删除订单
 * @access  Private (用户)
 */
router.delete('/:id', orderController.deleteOrder)

export default router
