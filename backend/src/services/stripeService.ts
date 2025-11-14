/**
 * Stripe 支付服务
 * 使用 stripe SDK
 */

import Stripe from 'stripe'
import pool from '../config/database'

interface StripeConfig {
  publishableKey: string
  secretKey: string
  webhookSecret: string
}

/**
 * 获取Stripe配置
 */
async function getStripeConfig(isProduction: boolean = false): Promise<StripeConfig> {
  const result = await pool.query(
    `SELECT config_key, config_value FROM payment_configs
     WHERE provider = 'stripe' AND is_production = $1 AND is_enabled = TRUE`,
    [isProduction]
  )

  const config: any = {}
  result.rows.forEach((row: any) => {
    config[row.config_key] = row.config_value
  })

  if (!config.secret_key) {
    throw new Error('Stripe配置不完整，请在管理后台配置Secret Key')
  }

  return {
    publishableKey: config.publishable_key || '',
    secretKey: config.secret_key,
    webhookSecret: config.webhook_secret || '',
  }
}

/**
 * 获取Stripe客户端
 */
async function getStripeClient(isProduction: boolean = false): Promise<Stripe> {
  const config = await getStripeConfig(isProduction)

  // Stripe 19.x会自动使用最新的API版本
  return new Stripe(config.secretKey)
}

/**
 * 创建Stripe支付意图
 */
export async function createStripePaymentIntent(params: {
  amount: number
  currency: string
  orderId: string
  userEmail?: string
  description?: string
  metadata?: Record<string, string>
}): Promise<{
  paymentIntentId: string
  clientSecret: string
  amount: number
  currency: string
}> {
  try {
    const stripe = await getStripeClient()

    // Stripe金额需要转换为最小货币单位（分）
    const amountInCents = Math.round(params.amount * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: params.currency.toLowerCase(),
      description: params.description || `订单支付 - ${params.orderId}`,
      metadata: {
        order_id: params.orderId,
        ...params.metadata,
      },
      receipt_email: params.userEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    if (!paymentIntent.client_secret) {
      throw new Error('未能获取Stripe Client Secret')
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
      amount: params.amount,
      currency: params.currency,
    }
  } catch (error: any) {
    console.error('创建Stripe支付意图失败:', error)
    throw new Error(`Stripe支付创建失败: ${error.message}`)
  }
}

/**
 * 确认Stripe支付
 */
export async function confirmStripePayment(
  paymentIntentId: string
): Promise<{
  status: string
  paymentIntentId: string
  amount: number
  currency: string
  chargeId?: string
}> {
  try {
    const stripe = await getStripeClient()

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Stripe金额需要从最小货币单位转换回标准单位
    const amount = paymentIntent.amount / 100

    return {
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      amount,
      currency: paymentIntent.currency.toUpperCase(),
      chargeId: paymentIntent.latest_charge as string | undefined,
    }
  } catch (error: any) {
    console.error('确认Stripe支付失败:', error)
    throw new Error(`Stripe支付确认失败: ${error.message}`)
  }
}

/**
 * 获取Stripe支付详情
 */
export async function getStripePaymentDetails(paymentIntentId: string): Promise<any> {
  try {
    const stripe = await getStripeClient()

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'payment_method'],
    })

    return paymentIntent
  } catch (error: any) {
    console.error('获取Stripe支付详情失败:', error)
    throw new Error(`获取Stripe支付失败: ${error.message}`)
  }
}

/**
 * Stripe退款
 */
export async function refundStripePayment(params: {
  paymentIntentId?: string
  chargeId?: string
  amount?: number
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  metadata?: Record<string, string>
}): Promise<{
  refundId: string
  status: string
  amount: number
  currency: string
}> {
  try {
    const stripe = await getStripeClient()

    if (!params.paymentIntentId && !params.chargeId) {
      throw new Error('必须提供 paymentIntentId 或 chargeId')
    }

    const refundParams: Stripe.RefundCreateParams = {
      reason: params.reason || 'requested_by_customer',
      metadata: params.metadata,
    }

    // 优先使用 payment_intent
    if (params.paymentIntentId) {
      refundParams.payment_intent = params.paymentIntentId
    } else if (params.chargeId) {
      refundParams.charge = params.chargeId
    }

    // 如果指定了金额，则部分退款（转换为最小货币单位）
    if (params.amount) {
      refundParams.amount = Math.round(params.amount * 100)
    }

    const refund = await stripe.refunds.create(refundParams)

    return {
      refundId: refund.id,
      status: refund.status || 'unknown',
      amount: refund.amount / 100,
      currency: refund.currency.toUpperCase(),
    }
  } catch (error: any) {
    console.error('Stripe退款失败:', error)
    throw new Error(`Stripe退款失败: ${error.message}`)
  }
}

/**
 * 验证Stripe Webhook签名
 */
export async function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
  isProduction: boolean = false
): Promise<Stripe.Event> {
  try {
    const config = await getStripeConfig(isProduction)
    const stripe = await getStripeClient(isProduction)

    if (!config.webhookSecret) {
      throw new Error('Stripe Webhook Secret未配置')
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.webhookSecret
    )

    return event
  } catch (error: any) {
    console.error('验证Stripe Webhook签名失败:', error)
    throw new Error(`Webhook验证失败: ${error.message}`)
  }
}

/**
 * 获取Stripe可发布密钥（用于前端）
 */
export async function getStripePublishableKey(
  isProduction: boolean = false
): Promise<string> {
  const config = await getStripeConfig(isProduction)
  return config.publishableKey
}

/**
 * 创建Stripe客户
 */
export async function createStripeCustomer(params: {
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, string>
}): Promise<{
  customerId: string
  email: string
}> {
  try {
    const stripe = await getStripeClient()

    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata,
    })

    return {
      customerId: customer.id,
      email: customer.email || params.email,
    }
  } catch (error: any) {
    console.error('创建Stripe客户失败:', error)
    throw new Error(`创建客户失败: ${error.message}`)
  }
}

/**
 * 取消Stripe支付意图
 */
export async function cancelStripePaymentIntent(
  paymentIntentId: string
): Promise<{
  paymentIntentId: string
  status: string
}> {
  try {
    const stripe = await getStripeClient()

    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId)

    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    }
  } catch (error: any) {
    console.error('取消Stripe支付意图失败:', error)
    throw new Error(`取消支付失败: ${error.message}`)
  }
}
