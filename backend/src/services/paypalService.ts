/**
 * PayPal 支付服务
 * 使用 @paypal/paypal-server-sdk
 */

import { client as paypalClient, orders } from '@paypal/paypal-server-sdk'
import pool from '../config/database'

interface PayPalConfig {
  clientId: string
  clientSecret: string
  mode: 'sandbox' | 'live'
}

/**
 * 获取PayPal配置
 */
async function getPayPalConfig(isProduction: boolean = false): Promise<PayPalConfig> {
  const result = await pool.query(
    `SELECT config_key, config_value FROM payment_configs
     WHERE provider = 'paypal' AND is_production = $1 AND is_enabled = TRUE`,
    [isProduction]
  )

  const config: any = {}
  result.rows.forEach((row: any) => {
    config[row.config_key] = row.config_value
  })

  if (!config.client_id || !config.client_secret) {
    throw new Error('PayPal配置不完整，请在管理后台配置Client ID和Client Secret')
  }

  return {
    clientId: config.client_id,
    clientSecret: config.client_secret,
    mode: config.mode || (isProduction ? 'live' : 'sandbox'),
  }
}

/**
 * 获取PayPal客户端
 */
async function getPayPalClient(isProduction: boolean = false): Promise<PayPalClient> {
  const config = await getPayPalConfig(isProduction)

  return new PayPalClient({
    clientCredentialsAuthCredentials: {
      oAuthClientId: config.clientId,
      oAuthClientSecret: config.clientSecret,
    },
    environment: config.mode === 'live' ? 'production' : 'sandbox',
  })
}

/**
 * 创建PayPal订单
 */
export async function createPayPalOrder(params: {
  amount: number
  currency: string
  orderId: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ orderId: string; approvalUrl: string }> {
  try {
    const client = await getPayPalClient()

    const request = {
      body: {
        intent: 'CAPTURE' as const,
        purchaseUnits: [
          {
            referenceId: params.orderId,
            amount: {
              currencyCode: params.currency as any,
              value: params.amount.toFixed(2),
            },
          },
        ],
        applicationContext: {
          returnUrl: params.returnUrl,
          cancelUrl: params.cancelUrl,
          brandName: '算命平台',
          landingPage: 'BILLING' as const,
          userAction: 'PAY_NOW' as const,
        },
      },
    }

    const response = await client.orders.ordersCreate(request)

    if (response.statusCode !== 200 && response.statusCode !== 201) {
      throw new Error(`PayPal创建订单失败: ${response.statusCode}`)
    }

    const order = response.result
    const approvalUrl = order.links?.find((link) => link.rel === 'approve')?.href

    if (!approvalUrl) {
      throw new Error('未找到PayPal支付链接')
    }

    return {
      orderId: order.id || '',
      approvalUrl,
    }
  } catch (error: any) {
    console.error('创建PayPal订单失败:', error)
    throw new Error(`PayPal支付创建失败: ${error.message}`)
  }
}

/**
 * 捕获PayPal订单（确认支付）
 */
export async function capturePayPalOrder(
  paypalOrderId: string
): Promise<{
  status: string
  captureId: string
  amount: number
  currency: string
}> {
  try {
    const client = await getPayPalClient()

    const response = await client.orders.ordersCapture({
      id: paypalOrderId,
      body: {},
    })

    if (response.statusCode !== 200 && response.statusCode !== 201) {
      throw new Error(`PayPal捕获订单失败: ${response.statusCode}`)
    }

    const order = response.result
    const capture = order.purchaseUnits?.[0]?.payments?.captures?.[0]

    if (!capture) {
      throw new Error('未找到PayPal支付捕获信息')
    }

    return {
      status: capture.status || 'UNKNOWN',
      captureId: capture.id || '',
      amount: parseFloat(capture.amount?.value || '0'),
      currency: capture.amount?.currencyCode || 'USD',
    }
  } catch (error: any) {
    console.error('捕获PayPal订单失败:', error)
    throw new Error(`PayPal支付确认失败: ${error.message}`)
  }
}

/**
 * 获取PayPal订单详情
 */
export async function getPayPalOrderDetails(paypalOrderId: string): Promise<any> {
  try {
    const client = await getPayPalClient()

    const response = await client.orders.ordersGet({
      id: paypalOrderId,
    })

    if (response.statusCode !== 200) {
      throw new Error(`获取PayPal订单详情失败: ${response.statusCode}`)
    }

    return response.result
  } catch (error: any) {
    console.error('获取PayPal订单详情失败:', error)
    throw new Error(`获取PayPal订单失败: ${error.message}`)
  }
}

/**
 * PayPal退款
 */
export async function refundPayPalPayment(params: {
  captureId: string
  amount?: number
  currency?: string
  reason?: string
}): Promise<{
  refundId: string
  status: string
  amount: number
  currency: string
}> {
  try {
    const client = await getPayPalClient()

    const request: any = {
      id: params.captureId,
      body: {},
    }

    // 如果指定了金额，则部分退款
    if (params.amount) {
      request.body.amount = {
        value: params.amount.toFixed(2),
        currencyCode: params.currency || 'USD',
      }
    }

    if (params.reason) {
      request.body.note_to_payer = params.reason
    }

    const response = await client.payments.capturesRefund(request)

    if (response.statusCode !== 200 && response.statusCode !== 201) {
      throw new Error(`PayPal退款失败: ${response.statusCode}`)
    }

    const refund = response.result

    return {
      refundId: refund.id || '',
      status: refund.status || 'UNKNOWN',
      amount: parseFloat(refund.amount?.value || '0'),
      currency: refund.amount?.currencyCode || 'USD',
    }
  } catch (error: any) {
    console.error('PayPal退款失败:', error)
    throw new Error(`PayPal退款失败: ${error.message}`)
  }
}

/**
 * 验证PayPal Webhook签名
 */
export async function verifyPayPalWebhook(
  headers: any,
  body: any
): Promise<boolean> {
  // TODO: 实现PayPal Webhook签名验证
  // 需要使用 webhook_id 和 webhook_secret
  return true
}
