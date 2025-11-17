/**
 * 用户端支付 API 路由
 * 支持PayPal、Stripe和余额支付
 */

import { Router } from 'express'
import * as paymentController from '../../controllers/user/paymentController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

// ========== 新版支付API（PayPal + Stripe + 余额） ==========

/**
 * @openapi
 * /api/payments/methods:
 *   get:
 *     summary: 获取支付方式
 *     description: 获取所有可用的支付方式列表
 *     tags:
 *       - User - Payments
 *     responses:
 *       200:
 *         description: 成功获取支付方式
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
 *                       method_code:
 *                         type: string
 *                       method_name:
 *                         type: string
 *                       provider:
 *                         type: string
 *                       is_enabled:
 *                         type: boolean
 */
router.get('/methods', paymentController.getPaymentMethods)

/**
 * @openapi
 * /api/payments/create:
 *   post:
 *     summary: 创建支付订单
 *     description: 创建支付订单,支持PayPal、Stripe和余额支付
 *     tags:
 *       - User - Payments
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *               - currency
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: integer
 *                 description: 订单ID
 *               amount:
 *                 type: number
 *                 description: 支付金额
 *               currency:
 *                 type: string
 *                 description: 货币代码
 *                 example: USD
 *               paymentMethod:
 *                 type: string
 *                 enum: [paypal, stripe, balance]
 *                 description: 支付方式
 *               returnUrl:
 *                 type: string
 *                 description: 支付成功返回URL
 *               cancelUrl:
 *                 type: string
 *                 description: 支付取消返回URL
 *     responses:
 *       200:
 *         description: 支付订单创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/create', authenticateUser, paymentController.createPaymentOrder)

/**
 * @openapi
 * /api/payments/paypal/confirm:
 *   post:
 *     summary: 确认PayPal支付
 *     description: 确认PayPal支付订单并完成支付流程
 *     tags:
 *       - User - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paypalOrderId
 *               - transactionId
 *             properties:
 *               paypalOrderId:
 *                 type: string
 *                 description: PayPal订单ID
 *               transactionId:
 *                 type: string
 *                 description: 交易记录ID
 *     responses:
 *       200:
 *         description: PayPal支付确认成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/paypal/confirm', paymentController.confirmPayPalPayment)

/**
 * @openapi
 * /api/payments/stripe/confirm:
 *   post:
 *     summary: 确认Stripe支付
 *     description: 确认Stripe支付意图并完成支付流程
 *     tags:
 *       - User - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *               - transactionId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 description: Stripe支付意图ID
 *               transactionId:
 *                 type: string
 *                 description: 交易记录ID
 *     responses:
 *       200:
 *         description: Stripe支付确认成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/stripe/confirm', paymentController.confirmStripePayment)

/**
 * @openapi
 * /api/payments/status/{transactionId}:
 *   get:
 *     summary: 查询支付状态
 *     description: 查询指定交易的支付状态
 *     tags:
 *       - User - Payments
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 交易ID
 *     responses:
 *       200:
 *         description: 成功获取支付状态
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
 *                     status:
 *                       type: string
 *                     transaction_id:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/status/:transactionId', authenticateUser, paymentController.checkPaymentStatus)

/**
 * @openapi
 * /api/payments/refund:
 *   post:
 *     summary: 申请退款
 *     description: 对已完成的支付申请退款
 *     tags:
 *       - User - Payments
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - reason
 *             properties:
 *               transactionId:
 *                 type: string
 *                 description: 交易ID
 *               amount:
 *                 type: number
 *                 description: 退款金额(可选,默认全额退款)
 *               reason:
 *                 type: string
 *                 description: 退款原因
 *     responses:
 *       200:
 *         description: 退款申请提交成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/refund', authenticateUser, paymentController.requestRefund)

/**
 * @openapi
 * /api/payments/webhook/paypal:
 *   post:
 *     summary: PayPal Webhook回调
 *     description: 接收PayPal的Webhook通知(需要验证签名)
 *     tags:
 *       - User - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook处理成功
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/webhook/paypal', paymentController.handlePayPalWebhook)

/**
 * @openapi
 * /api/payments/webhook/stripe:
 *   post:
 *     summary: Stripe Webhook回调
 *     description: 接收Stripe的Webhook通知(需要验证签名)
 *     tags:
 *       - User - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook处理成功
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/webhook/stripe', paymentController.handleStripeWebhook)

// ========== 旧版支付API（向后兼容） ==========

/**
 * @openapi
 * /api/payments:
 *   post:
 *     summary: 创建支付(旧版)
 *     description: 创建支付订单(向后兼容的旧版API)
 *     tags:
 *       - User - Payments
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - payMethod
 *             properties:
 *               orderId:
 *                 type: integer
 *                 description: 订单ID
 *               payMethod:
 *                 type: string
 *                 description: 支付方式
 *     responses:
 *       200:
 *         description: 支付创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', authenticateUser, paymentController.createPayment)

/**
 * @openapi
 * /api/payments/callback:
 *   post:
 *     summary: 支付回调
 *     description: 接收第三方支付平台的回调通知(实际应验证签名)
 *     tags:
 *       - User - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - status
 *             properties:
 *               paymentId:
 *                 type: string
 *                 description: 支付ID
 *               transactionNo:
 *                 type: string
 *                 description: 第三方交易号
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *                 description: 支付状态
 *               errorMessage:
 *                 type: string
 *                 description: 错误信息
 *     responses:
 *       200:
 *         description: 回调处理成功
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/callback', paymentController.paymentCallback)

/**
 * @openapi
 * /api/payments/{paymentId}:
 *   get:
 *     summary: 查询支付状态(旧版)
 *     description: 查询指定支付的状态信息
 *     tags:
 *       - User - Payments
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 支付ID
 *     responses:
 *       200:
 *         description: 成功获取支付状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:paymentId', authenticateUser, paymentController.getPaymentStatus)

/**
 * @openapi
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: 获取订单支付记录
 *     description: 获取指定订单的所有支付记录
 *     tags:
 *       - User - Payments
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 订单ID
 *     responses:
 *       200:
 *         description: 成功获取支付记录
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/order/:orderId', authenticateUser, paymentController.getOrderPayments)

/**
 * @openapi
 * /api/payments:
 *   get:
 *     summary: 获取支付记录列表
 *     description: 获取当前用户的支付记录列表,支持分页和筛选
 *     tags:
 *       - User - Payments
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
 *           enum: [pending, success, failed, refunded]
 *         description: 支付状态筛选
 *     responses:
 *       200:
 *         description: 成功获取支付记录
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticateUser, paymentController.getUserPaymentsOld)

/**
 * @openapi
 * /api/payments/{paymentId}/cancel:
 *   put:
 *     summary: 取消支付
 *     description: 取消待支付状态的支付订单
 *     tags:
 *       - User - Payments
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 支付ID
 *     responses:
 *       200:
 *         description: 支付取消成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:paymentId/cancel', authenticateUser, paymentController.cancelPayment)

export default router
