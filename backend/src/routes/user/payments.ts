import { Router } from 'express'
import * as paymentController from '../../controllers/user/paymentController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

// ========== 新版支付API（PayPal + Stripe + 余额） ==========

/**
 * @route   GET /api/payments/methods
 * @desc    获取可用支付方式
 * @access  Public
 */
router.get('/methods', paymentController.getPaymentMethods)

/**
 * @route   POST /api/payments/create
 * @desc    创建支付（支持PayPal/Stripe/余额）
 * @access  Private (用户)
 * @body    { orderId, amount, currency, paymentMethod, returnUrl?, cancelUrl? }
 */
router.post('/create', authenticateUser, paymentController.createPaymentOrder)

/**
 * @route   POST /api/payments/paypal/confirm
 * @desc    确认PayPal支付
 * @access  Public
 * @body    { paypalOrderId, transactionId }
 */
router.post('/paypal/confirm', paymentController.confirmPayPalPayment)

/**
 * @route   POST /api/payments/stripe/confirm
 * @desc    确认Stripe支付
 * @access  Public
 * @body    { paymentIntentId, transactionId }
 */
router.post('/stripe/confirm', paymentController.confirmStripePayment)

/**
 * @route   GET /api/payments/status/:transactionId
 * @desc    查询支付状态
 * @access  Private (用户)
 */
router.get('/status/:transactionId', authenticateUser, paymentController.checkPaymentStatus)

/**
 * @route   POST /api/payments/refund
 * @desc    申请退款
 * @access  Private (用户)
 * @body    { transactionId, amount?, reason }
 */
router.post('/refund', authenticateUser, paymentController.requestRefund)

/**
 * @route   POST /api/payments/webhook/paypal
 * @desc    PayPal Webhook回调
 * @access  Public (需验证签名)
 */
router.post('/webhook/paypal', paymentController.handlePayPalWebhook)

/**
 * @route   POST /api/payments/webhook/stripe
 * @desc    Stripe Webhook回调
 * @access  Public (需验证签名)
 */
router.post('/webhook/stripe', paymentController.handleStripeWebhook)

// ========== 旧版支付API（向后兼容） ==========

/**
 * @route   POST /api/payments
 * @desc    创建支付订单（旧版）
 * @access  Private (用户)
 * @body    { orderId, payMethod }
 */
router.post('/', authenticateUser, paymentController.createPayment)

/**
 * @route   POST /api/payments/callback
 * @desc    支付回调（模拟第三方支付回调）
 * @access  Public（实际应该验证第三方签名）
 * @body    { paymentId, transactionNo?, status, errorMessage? }
 */
router.post('/callback', paymentController.paymentCallback)

/**
 * @route   GET /api/payments/:paymentId
 * @desc    查询支付状态
 * @access  Private (用户)
 */
router.get('/:paymentId', authenticateUser, paymentController.getPaymentStatus)

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    获取订单的支付记录
 * @access  Private (用户)
 */
router.get('/order/:orderId', authenticateUser, paymentController.getOrderPayments)

/**
 * @route   GET /api/payments
 * @desc    获取用户的支付记录列表
 * @access  Private (用户)
 * @query   page, limit, status
 */
router.get('/', authenticateUser, paymentController.getUserPaymentsOld)

/**
 * @route   PUT /api/payments/:paymentId/cancel
 * @desc    取消支付
 * @access  Private (用户)
 */
router.put('/:paymentId/cancel', authenticateUser, paymentController.cancelPayment)

export default router
