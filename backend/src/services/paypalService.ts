/**
 * PayPal 支付服务
 * 使用 @paypal/paypal-server-sdk v2.0.0
 */

import {
  Client,
  OrdersController,
  PaymentsController,
  OrderRequest,
  Order,
  Environment,
  CheckoutPaymentIntent
} from '@paypal/paypal-server-sdk'
import pool from '../config/database'

interface PayPalConfig {
  clientId: string
  clientSecret: string
  mode: Environment
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

  const mode = config.mode || (isProduction ? 'live' : 'sandbox')
  return {
    clientId: config.client_id,
    clientSecret: config.client_secret,
    mode: mode === 'live' ? Environment.Production : Environment.Sandbox,
  }
}

/**
 * 获取PayPal客户端
 */
async function getPayPalClient(isProduction: boolean = false): Promise<Client> {
  const config = await getPayPalConfig(isProduction)

  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: config.clientId,
      oAuthClientSecret: config.clientSecret,
    },
    environment: config.mode,
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
  isProduction?: boolean
}): Promise<{
  paypalOrderId: string
  approvalUrl: string
}> {
  const client = await getPayPalClient(params.isProduction)
  const ordersController = new OrdersController(client)

  const orderRequest: OrderRequest = {
    intent: CheckoutPaymentIntent.Capture,
    purchaseUnits: [
      {
        referenceId: params.orderId,
        amount: {
          currencyCode: params.currency,
          value: params.amount.toFixed(2),
        },
      },
    ],
    applicationContext: {
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
    },
  }

  const response = await ordersController.createOrder({
    body: orderRequest,
    prefer: 'return=representation',
  })

  const order = response.body as Order

  // 查找approval URL
  const approvalLink = order.links?.find((link: any) => link.rel === 'approve')
  if (!approvalLink || !approvalLink.href) {
    throw new Error('PayPal未返回approval URL')
  }

  return {
    paypalOrderId: order.id || '',
    approvalUrl: approvalLink.href,
  }
}

/**
 * 捕获PayPal订单(确认支付)
 */
export async function capturePayPalOrder(
  paypalOrderId: string,
  isProduction: boolean = false
): Promise<Order> {
  const client = await getPayPalClient(isProduction)
  const ordersController = new OrdersController(client)

  const response = await ordersController.captureOrder({
    id: paypalOrderId,
    prefer: 'return=representation',
  })

  return response.body as Order
}

/**
 * 获取PayPal订单详情
 */
export async function getPayPalOrderDetails(
  paypalOrderId: string,
  isProduction: boolean = false
): Promise<Order> {
  const client = await getPayPalClient(isProduction)
  const ordersController = new OrdersController(client)

  const response = await ordersController.getOrder({
    id: paypalOrderId,
  })

  return response.body as Order
}

/**
 * 测试PayPal配置(创建最小金额订单并立即取消)
 */
export async function testPayPalConfig(isProduction: boolean = false): Promise<boolean> {
  try {
    const client = await getPayPalClient(isProduction)
    const ordersController = new OrdersController(client)

    // 创建测试订单
    const testOrder: OrderRequest = {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: {
            currencyCode: 'USD',
            value: '0.01',
          },
        },
      ],
    }

    await ordersController.createOrder({
      body: testOrder,
    })

    return true
  } catch (error) {
    console.error('PayPal配置测试失败:', error)
    return false
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
  isProduction?: boolean
}): Promise<{
  refundId: string
  status: string
  amount: number
  currency: string
}> {
  const client = await getPayPalClient(params.isProduction)
  const paymentsController = new PaymentsController(client)

  // 准备退款请求
  const refundRequest: any = {
    id: params.captureId
  }

  // 如果指定了金额,则部分退款
  if (params.amount && params.currency) {
    refundRequest.body = {
      amount: {
        currencyCode: params.currency,
        value: params.amount.toFixed(2)
      },
      noteToPayer: params.reason || 'Refund processed'
    }
  }

  // PayPal SDK v2的退款方法 - 使用 capturesRefund 而不是 refundsCapture
  const response = await (paymentsController as any).capturesRefund(refundRequest)
  const refund = response.result || response.body as any

  return {
    refundId: refund.id,
    status: refund.status || 'PENDING',
    amount: parseFloat(refund.amount?.value || params.amount?.toString() || '0'),
    currency: refund.amount?.currency_code || params.currency || 'USD'
  }
}

// 导出用于管理后台
export { getPayPalClient }
