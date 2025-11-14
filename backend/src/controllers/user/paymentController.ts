import { Request, Response, NextFunction } from 'express'
import * as paymentService from '../../services/user/paymentService'

/**
 * 获取可用支付方式
 * GET /api/payments/methods
 */
export const getPaymentMethods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const methods = await paymentService.getAvailablePaymentMethods()

    res.json({
      success: true,
      data: methods,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 创建新支付（支持PayPal/Stripe/余额）
 * POST /api/payments/create
 */
export const createPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      })
    }

    const { orderId, amount, currency, paymentMethod, returnUrl, cancelUrl } = req.body

    // 验证必填字段
    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: orderId, amount, paymentMethod',
      })
    }

    // 验证支付方式
    if (!['paypal', 'stripe', 'balance'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: '不支持的支付方式',
      })
    }

    // 获取用户信息
    const userEmail = req.user.email
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.get('user-agent')

    const result = await paymentService.createPayment({
      userId: req.user.id,
      orderId,
      amount,
      currency,
      paymentMethod,
      returnUrl,
      cancelUrl,
      userEmail,
      ipAddress,
      userAgent,
    })

    res.json({
      success: true,
      data: result,
      message: '支付创建成功',
    })
  } catch (error: any) {
    console.error('创建支付失败:', error)
    res.status(400).json({
      success: false,
      message: error.message || '创建支付失败',
    })
  }
}

/**
 * 确认PayPal支付
 * POST /api/payments/paypal/confirm
 */
export const confirmPayPalPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paypalOrderId, transactionId } = req.body

    if (!paypalOrderId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: paypalOrderId, transactionId',
      })
    }

    const result = await paymentService.confirmPayPalPayment(paypalOrderId, transactionId)

    res.json({
      success: true,
      data: result,
      message: result.message,
    })
  } catch (error: any) {
    console.error('确认PayPal支付失败:', error)
    res.status(400).json({
      success: false,
      message: error.message || '确认支付失败',
    })
  }
}

/**
 * 确认Stripe支付
 * POST /api/payments/stripe/confirm
 */
export const confirmStripePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentIntentId, transactionId } = req.body

    if (!paymentIntentId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: paymentIntentId, transactionId',
      })
    }

    const result = await paymentService.confirmStripePaymentService(paymentIntentId, transactionId)

    res.json({
      success: true,
      data: result,
      message: result.message,
    })
  } catch (error: any) {
    console.error('确认Stripe支付失败:', error)
    res.status(400).json({
      success: false,
      message: error.message || '确认支付失败',
    })
  }
}

/**
 * 查询支付状态（新版）
 * GET /api/payments/status/:transactionId
 */
export const checkPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      })
    }

    const { transactionId } = req.params

    const status = await paymentService.getPaymentStatus(transactionId, req.user.id)

    res.json({
      success: true,
      data: status,
    })
  } catch (error: any) {
    console.error('查询支付状态失败:', error)
    res.status(400).json({
      success: false,
      message: error.message || '查询支付状态失败',
    })
  }
}

/**
 * 申请退款
 * POST /api/payments/refund
 */
export const requestRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      })
    }

    const { transactionId, amount, reason } = req.body

    if (!transactionId || !reason) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: transactionId, reason',
      })
    }

    const result = await paymentService.processRefund({
      transactionId,
      userId: req.user.id,
      amount,
      reason,
    })

    res.json({
      success: true,
      data: result,
      message: result.message,
    })
  } catch (error: any) {
    console.error('申请退款失败:', error)
    res.status(400).json({
      success: false,
      message: error.message || '申请退款失败',
    })
  }
}

/**
 * PayPal Webhook处理
 * POST /api/payments/webhook/paypal
 */
export const handlePayPalWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = req.body
    console.log('PayPal Webhook事件:', event.event_type)

    // 根据事件类型处理
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        console.log('PayPal支付完成:', event.resource.id)
        break
      case 'PAYMENT.CAPTURE.DENIED':
        console.log('PayPal支付被拒绝:', event.resource.id)
        break
      case 'PAYMENT.CAPTURE.REFUNDED':
        console.log('PayPal退款完成:', event.resource.id)
        break
      default:
        console.log('未处理的PayPal事件类型:', event.event_type)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('处理PayPal Webhook失败:', error)
    res.status(500).json({ success: false })
  }
}

/**
 * Stripe Webhook处理
 * POST /api/payments/webhook/stripe
 */
export const handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['stripe-signature'] as string
    const event = req.body

    console.log('Stripe Webhook事件:', event.type)

    // 根据事件类型处理
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Stripe支付成功:', event.data.object.id)
        break
      case 'payment_intent.payment_failed':
        console.log('Stripe支付失败:', event.data.object.id)
        break
      case 'charge.refunded':
        console.log('Stripe退款完成:', event.data.object.id)
        break
      default:
        console.log('未处理的Stripe事件类型:', event.type)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('处理Stripe Webhook失败:', error)
    res.status(500).json({ success: false })
  }
}

// ========== 以下为旧版API（兼容旧系统） ==========

/**
 * 创建支付订单（旧版）
 */
export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      })
    }

    const { orderId, payMethod } = req.body

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({
        success: false,
        message: '订单ID不能为空'
      })
    }

    if (!payMethod || typeof payMethod !== 'string') {
      return res.status(400).json({
        success: false,
        message: '支付方式不能为空'
      })
    }

    // 验证支付方式
    const validPayMethods = ['支付宝', '微信', '银行卡']
    if (!validPayMethods.includes(payMethod)) {
      return res.status(400).json({
        success: false,
        message: '不支持的支付方式'
      })
    }

    const payment = await paymentService.createPaymentOld(
      req.user.id,
      orderId,
      payMethod
    )

    res.status(201).json({
      success: true,
      message: '支付订单创建成功',
      data: payment
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    } else {
      next(error)
    }
  }
}

/**
 * 支付成功回调（模拟第三方支付回调）
 */
export const paymentCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId, transactionNo, status } = req.body

    if (!paymentId || typeof paymentId !== 'string') {
      return res.status(400).json({
        success: false,
        message: '支付ID不能为空'
      })
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: '支付状态不能为空'
      })
    }

    if (status === 'success') {
      if (!transactionNo || typeof transactionNo !== 'string') {
        return res.status(400).json({
          success: false,
          message: '交易流水号不能为空'
        })
      }

      const result = await paymentService.paymentSuccess(paymentId, transactionNo)
      return res.json({
        success: true,
        message: '支付成功',
        data: result
      })
    } else if (status === 'failed') {
      const errorMessage = req.body.errorMessage || '支付失败'
      const result = await paymentService.paymentFailed(paymentId, errorMessage)
      return res.json({
        success: true,
        message: '支付失败已记录',
        data: result
      })
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的支付状态'
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    } else {
      next(error)
    }
  }
}

/**
 * 查询支付状态
 */
export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      })
    }

    const { paymentId } = req.params

    const payment = await paymentService.getPaymentStatusOld(req.user.id, paymentId)

    res.json({
      success: true,
      data: payment
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({
        success: false,
        message: error.message
      })
    } else {
      next(error)
    }
  }
}

/**
 * 获取订单的支付记录
 */
export const getOrderPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      })
    }

    const { orderId } = req.params

    const payments = await paymentService.getOrderPayments(req.user.id, orderId)

    res.json({
      success: true,
      data: payments
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    } else {
      next(error)
    }
  }
}

/**
 * 获取用户的支付记录列表（旧版）
 */
export const getUserPaymentsOld = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const status = req.query.status as string

    // 调用新版API
    const result = await paymentService.getUserPayments(req.user.id, page, limit)

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    } else {
      next(error)
    }
  }
}

/**
 * 取消支付
 */
export const cancelPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      })
    }

    const { paymentId } = req.params

    await paymentService.cancelPayment(req.user.id, paymentId)

    res.json({
      success: true,
      message: '支付已取消'
    })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    } else {
      next(error)
    }
  }
}
