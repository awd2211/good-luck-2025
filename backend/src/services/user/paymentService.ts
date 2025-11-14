/**
 * 用户端 - 支付服务
 * 统一管理PayPal、Stripe和余额支付流程
 */

import pool from '../../config/database'
import { generateId } from '../../utils/idGenerator'
import {
  createPayPalOrder,
  capturePayPalOrder,
  refundPayPalPayment,
} from '../paypalService'
import {
  createStripePaymentIntent,
  confirmStripePayment,
  refundStripePayment,
} from '../stripeService'

interface CreatePaymentParams {
  userId: string
  orderId: string
  amount: number
  currency?: string
  paymentMethod: 'paypal' | 'stripe' | 'balance'
  returnUrl?: string
  cancelUrl?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
}

interface PaymentResult {
  success: boolean
  transactionId?: string
  paymentUrl?: string
  clientSecret?: string
  message?: string
}

/**
 * 创建支付
 */
export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. 验证订单状态
    const orderCheck = await client.query(
      `SELECT id, order_id, user_id, total_amount, payment_status
       FROM orders
       WHERE order_id = $1 AND user_id = $2`,
      [params.orderId, params.userId]
    )

    if (orderCheck.rows.length === 0) {
      throw new Error('订单不存在')
    }

    const order = orderCheck.rows[0]

    if (order.payment_status === 'paid') {
      throw new Error('订单已支付')
    }

    // 2. 验证支付金额
    if (Math.abs(order.total_amount - params.amount) > 0.01) {
      throw new Error('支付金额与订单金额不符')
    }

    // 3. 生成交易ID
    const transactionId = generateId('TXN')
    const currency = params.currency || 'USD'

    // 4. 创建支付交易记录
    await client.query(
      `INSERT INTO payment_transactions
       (transaction_id, order_id, user_id, payment_method, provider, amount, currency,
        status, ip_address, user_agent, return_url, cancel_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        transactionId,
        params.orderId,
        params.userId,
        params.paymentMethod,
        params.paymentMethod === 'balance' ? 'internal' : params.paymentMethod,
        params.amount,
        currency,
        'pending',
        params.ipAddress,
        params.userAgent,
        params.returnUrl,
        params.cancelUrl,
      ]
    )

    let result: PaymentResult = { success: false }

    // 5. 根据支付方式创建支付
    if (params.paymentMethod === 'balance') {
      // 余额支付
      result = await processBalancePayment(client, params.userId, params.amount, transactionId)
    } else if (params.paymentMethod === 'paypal') {
      // PayPal支付
      const paypalResult = await createPayPalOrder({
        amount: params.amount,
        currency,
        orderId: params.orderId,
        returnUrl: params.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
        cancelUrl: params.cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
      })

      // 更新交易记录
      await client.query(
        `UPDATE payment_transactions
         SET provider_transaction_id = $1, status = $2, payment_url = $3
         WHERE transaction_id = $4`,
        [paypalResult.paypalOrderId, 'pending', paypalResult.approvalUrl, transactionId]
      )

      result = {
        success: true,
        transactionId,
        paymentUrl: paypalResult.approvalUrl,
      }
    } else if (params.paymentMethod === 'stripe') {
      // Stripe支付
      const stripeResult = await createStripePaymentIntent({
        amount: params.amount,
        currency,
        orderId: params.orderId,
        userEmail: params.userEmail,
        description: `订单支付 - ${params.orderId}`,
        metadata: {
          order_id: params.orderId,
          user_id: params.userId,
          transaction_id: transactionId,
        },
      })

      // 更新交易记录
      await client.query(
        `UPDATE payment_transactions
         SET provider_transaction_id = $1, status = $2
         WHERE transaction_id = $3`,
        [stripeResult.paymentIntentId, 'processing', transactionId]
      )

      result = {
        success: true,
        transactionId,
        clientSecret: stripeResult.clientSecret,
      }
    } else {
      throw new Error('不支持的支付方式')
    }

    await client.query('COMMIT')
    return result
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('创建支付失败:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * 余额支付处理
 */
async function processBalancePayment(
  client: any,
  userId: string,
  amount: number,
  transactionId: string
): Promise<PaymentResult> {
  // 检查余额
  const userResult = await client.query(
    `SELECT balance FROM users WHERE id = $1 FOR UPDATE`,
    [userId]
  )

  if (userResult.rows.length === 0) {
    throw new Error('用户不存在')
  }

  const balance = parseFloat(userResult.rows[0].balance)

  if (balance < amount) {
    throw new Error('余额不足')
  }

  // 扣除余额
  await client.query(`UPDATE users SET balance = balance - $1 WHERE id = $2`, [amount, userId])

  // 更新支付记录为已完成
  await client.query(
    `UPDATE payment_transactions
     SET status = $1, paid_at = CURRENT_TIMESTAMP
     WHERE transaction_id = $2`,
    ['completed', transactionId]
  )

  // 获取订单ID并更新订单状态
  const txnResult = await client.query(
    `SELECT order_id FROM payment_transactions WHERE transaction_id = $1`,
    [transactionId]
  )

  if (txnResult.rows.length > 0) {
    await client.query(
      `UPDATE orders
       SET payment_status = $1, paid_at = CURRENT_TIMESTAMP, status = $2
       WHERE order_id = $3`,
      ['paid', 'processing', txnResult.rows[0].order_id]
    )
  }

  return {
    success: true,
    transactionId,
    message: '余额支付成功',
  }
}

/**
 * 确认PayPal支付
 */
export async function confirmPayPalPayment(
  paypalOrderId: string,
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 获取交易信息
    const txnResult = await client.query(
      `SELECT id, order_id, amount, status FROM payment_transactions WHERE transaction_id = $1`,
      [transactionId]
    )

    if (txnResult.rows.length === 0) {
      throw new Error('交易记录不存在')
    }

    const transaction = txnResult.rows[0]

    if (transaction.status === 'completed') {
      await client.query('COMMIT')
      return { success: true, message: '支付已完成' }
    }

    // 捕获PayPal支付
    const captureResult = await capturePayPalOrder(paypalOrderId)

    // 更新交易记录
    await client.query(
      `UPDATE payment_transactions
       SET status = $1,
           provider_transaction_id = $2,
           completed_at = CURRENT_TIMESTAMP,
           metadata = $3
       WHERE transaction_id = $4`,
      [
        'completed',
        captureResult.id,
        JSON.stringify(captureResult),
        transactionId,
      ]
    )

    // 更新订单状态
    await client.query(
      `UPDATE orders
       SET payment_status = $1, paid_at = CURRENT_TIMESTAMP, status = $2
       WHERE order_id = $3`,
      ['paid', 'processing', transaction.order_id]
    )

    await client.query('COMMIT')

    return {
      success: true,
      message: 'PayPal支付成功',
    }
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('确认PayPal支付失败:', error)

    // 更新失败状态
    await pool.query(
      `UPDATE payment_transactions
       SET status = $1, error_message = $2
       WHERE transaction_id = $3`,
      ['failed', error.message, transactionId]
    )

    throw error
  } finally {
    client.release()
  }
}

/**
 * 确认Stripe支付
 */
export async function confirmStripePaymentService(
  paymentIntentId: string,
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 获取交易信息
    const txnResult = await client.query(
      `SELECT id, order_id, amount, status FROM payment_transactions WHERE transaction_id = $1`,
      [transactionId]
    )

    if (txnResult.rows.length === 0) {
      throw new Error('交易记录不存在')
    }

    const transaction = txnResult.rows[0]

    if (transaction.status === 'completed') {
      await client.query('COMMIT')
      return { success: true, message: '支付已完成' }
    }

    // 确认Stripe支付状态
    const stripeResult = await confirmStripePayment(paymentIntentId)

    if (stripeResult.status !== 'succeeded') {
      throw new Error(`支付未成功: ${stripeResult.status}`)
    }

    // 更新交易记录
    await client.query(
      `UPDATE payment_transactions
       SET status = $1,
           provider_status = $2,
           provider_response = $3,
           paid_at = CURRENT_TIMESTAMP
       WHERE transaction_id = $4`,
      ['completed', stripeResult.status, JSON.stringify(stripeResult), transactionId]
    )

    // 更新订单状态
    await client.query(
      `UPDATE orders
       SET payment_status = $1, paid_at = CURRENT_TIMESTAMP, status = $2
       WHERE order_id = $3`,
      ['paid', 'processing', transaction.order_id]
    )

    await client.query('COMMIT')

    return {
      success: true,
      message: 'Stripe支付成功',
    }
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('确认Stripe支付失败:', error)

    // 更新失败状态
    await pool.query(
      `UPDATE payment_transactions
       SET status = $1, error_message = $2
       WHERE transaction_id = $3`,
      ['failed', error.message, transactionId]
    )

    throw error
  } finally {
    client.release()
  }
}

/**
 * 查询支付状态
 */
export async function getPaymentStatus(transactionId: string, userId: string) {
  const result = await pool.query(
    `SELECT
       transaction_id,
       order_id,
       payment_method,
       provider,
       amount,
       currency,
       status,
       provider_transaction_id,
       provider_order_id,
       provider_status,
       error_message,
       created_at,
       paid_at
     FROM payment_transactions
     WHERE transaction_id = $1 AND user_id = $2`,
    [transactionId, userId]
  )

  if (result.rows.length === 0) {
    throw new Error('交易记录不存在')
  }

  return result.rows[0]
}

/**
 * 获取用户支付记录
 */
export async function getUserPayments(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM payment_transactions WHERE user_id = $1`,
    [userId]
  )

  const result = await pool.query(
    `SELECT
       transaction_id,
       order_id,
       payment_method,
       amount,
       currency,
       status,
       created_at,
       paid_at
     FROM payment_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )

  return {
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
    data: result.rows,
  }
}

/**
 * 获取可用支付方式
 */
export async function getAvailablePaymentMethods() {
  const result = await pool.query(
    `SELECT
       id,
       method_code,
       method_name,
       provider,
       icon,
       description,
       min_amount,
       max_amount,
       fee_type,
       fee_value
     FROM payment_methods
     WHERE is_enabled = TRUE
     ORDER BY sort_order ASC`,
    []
  )

  return result.rows
}

/**
 * 创建支付订单（旧版）
 * 使用传统的支付方式（支付宝/微信/银行卡）
 */
export async function createPaymentOld(
  userId: string,
  orderId: string,
  payMethod: string
): Promise<any> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 验证订单是否存在
    const orderResult = await client.query(
      `SELECT id, total_price FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    )

    if (orderResult.rows.length === 0) {
      throw new Error('订单不存在或不属于该用户')
    }

    const order = orderResult.rows[0]

    // 创建支付记录
    const paymentId = generateId('PAY')
    const result = await client.query(
      `INSERT INTO payments (id, user_id, order_id, amount, pay_method, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [paymentId, userId, orderId, order.total_price, payMethod, 'pending', new Date()]
    )

    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * 获取支付状态（旧版）
 */
export async function getPaymentStatusOld(
  userId: string,
  paymentId: string
): Promise<any> {
  const result = await pool.query(
    `SELECT * FROM payments WHERE id = $1 AND user_id = $2`,
    [paymentId, userId]
  )

  if (result.rows.length === 0) {
    throw new Error('支付记录不存在')
  }

  return result.rows[0]
}

/**
 * 处理退款
 */
export async function processRefund(params: {
  transactionId: string
  userId: string
  amount?: number
  reason: string
}): Promise<{ success: boolean; refundId: string; message: string }> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 获取交易信息
    const txnResult = await client.query(
      `SELECT * FROM payment_transactions
       WHERE transaction_id = $1 AND user_id = $2`,
      [params.transactionId, params.userId]
    )

    if (txnResult.rows.length === 0) {
      throw new Error('交易记录不存在')
    }

    const transaction = txnResult.rows[0]

    if (transaction.status !== 'completed') {
      throw new Error('只能退款已完成的交易')
    }

    let refundResult: any

    // 根据支付方式处理退款
    if (transaction.provider === 'paypal') {
      // PayPal退款
      refundResult = await refundPayPalPayment({
        captureId: transaction.provider_transaction_id,
        amount: params.amount,
        currency: transaction.currency,
        reason: params.reason,
        isProduction: process.env.NODE_ENV === 'production'
      })
    } else if (transaction.provider === 'stripe') {
      // Stripe退款
      refundResult = await refundStripePayment({
        paymentIntentId: transaction.provider_transaction_id,
        amount: params.amount,
        reason: 'requested_by_customer',
        metadata: {
          original_transaction_id: params.transactionId,
          reason: params.reason,
        },
      })
    } else if (transaction.provider === 'internal') {
      // 余额退款：直接增加用户余额
      const refundAmount = params.amount || transaction.amount
      await client.query(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [
        refundAmount,
        params.userId,
      ])

      refundResult = {
        refundId: generateId('REFUND'),
        status: 'completed',
        amount: refundAmount,
        currency: transaction.currency,
      }
    } else {
      throw new Error('不支持的支付方式')
    }

    // 更新交易状态
    await client.query(
      `UPDATE payment_transactions
       SET status = $1, refunded_at = CURRENT_TIMESTAMP
       WHERE transaction_id = $2`,
      ['refunded', params.transactionId]
    )

    // 创建退款记录
    await client.query(
      `INSERT INTO refunds
       (order_id, user_id, amount, reason, status, payment_transaction_id)
       SELECT order_id, user_id, $1, $2, $3, id
       FROM payment_transactions
       WHERE transaction_id = $4`,
      [refundResult.amount, params.reason, 'approved', params.transactionId]
    )

    // 更新订单状态
    await client.query(
      `UPDATE orders
       SET payment_status = $1, status = $2
       WHERE order_id = $3`,
      ['refunded', 'cancelled', transaction.order_id]
    )

    await client.query('COMMIT')

    return {
      success: true,
      refundId: refundResult.refundId,
      message: '退款成功',
    }
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('退款失败:', error)
    throw error
  } finally {
    client.release()
  }
}

// ========== 兼容旧版API（保留旧版接口以免破坏现有功能） ==========

/**
 * 生成支付ID（旧版兼容）
 */
function generatePaymentId(): string {
  return generateId('PAY')
}

/**
 * 生成第三方订单号（模拟，旧版兼容）
 */
function generateThirdPartyOrderNo(payMethod: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  const prefix = payMethod === '支付宝' ? 'ALIPAY' : payMethod === '微信' ? 'WECHAT' : 'BANK'
  return `${prefix}_${timestamp}_${random}`
}

/**
 * 支付成功回调（模拟，旧版兼容）
 */
export const paymentSuccess = async (paymentId: string, transactionNo: string) => {
  try {
    await pool.query('BEGIN')

    const paymentResult = await pool.query(
      `UPDATE payments
       SET status = 'success',
           third_party_transaction_no = $1,
           pay_time = CURRENT_TIMESTAMP
       WHERE payment_id = $2 AND status = 'pending'
       RETURNING order_id, user_id`,
      [transactionNo, paymentId]
    )

    if (paymentResult.rows.length === 0) {
      await pool.query('ROLLBACK')
      throw new Error('支付记录不存在或状态不正确')
    }

    const { order_id, user_id } = paymentResult.rows[0]

    await pool.query(`UPDATE orders SET status = 'paid' WHERE order_id = $1`, [order_id])

    const orderAmount = await pool.query(`SELECT amount FROM orders WHERE order_id = $1`, [
      order_id,
    ])
    const amount = orderAmount.rows[0].amount

    await pool.query(
      `UPDATE users
       SET order_count = order_count + 1,
           total_spent = total_spent + $1
       WHERE id = $2`,
      [amount, user_id]
    )

    await pool.query('COMMIT')

    return { success: true, orderId: order_id }
  } catch (error) {
    await pool.query('ROLLBACK')
    if (error instanceof Error) {
      throw error
    }
    throw new Error('支付成功回调处理失败')
  }
}

/**
 * 支付失败回调（旧版兼容）
 */
export const paymentFailed = async (paymentId: string, errorMessage: string) => {
  try {
    const result = await pool.query(
      `UPDATE payments
       SET status = 'failed',
           error_message = $1
       WHERE payment_id = $2 AND status = 'pending'
       RETURNING order_id`,
      [errorMessage, paymentId]
    )

    if (result.rows.length === 0) {
      throw new Error('支付记录不存在或状态不正确')
    }

    return { success: true, orderId: result.rows[0].order_id }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('支付失败回调处理失败')
  }
}

/**
 * 获取订单的支付记录（旧版兼容）
 */
export const getOrderPayments = async (userId: string, orderId: string) => {
  try {
    const result = await pool.query(
      `SELECT
        payment_id, amount, pay_method, status,
        third_party_order_no, third_party_transaction_no,
        pay_time, error_message, created_at
       FROM payments
       WHERE order_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [orderId, userId]
    )

    return result.rows
  } catch (error) {
    throw new Error('查询订单支付记录失败')
  }
}

/**
 * 取消支付（旧版兼容）
 */
export const cancelPayment = async (userId: string, paymentId: string) => {
  try {
    const result = await pool.query(
      `UPDATE payments
       SET status = 'failed',
           error_message = '用户取消支付'
       WHERE payment_id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING order_id`,
      [paymentId, userId]
    )

    if (result.rows.length === 0) {
      throw new Error('支付记录不存在或状态不允许取消')
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('取消支付失败')
  }
}
