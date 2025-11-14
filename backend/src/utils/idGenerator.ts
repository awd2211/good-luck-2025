/**
 * ID生成器工具
 * 生成唯一的订单号、支付流水号等
 */

/**
 * 生成唯一ID
 * 格式: 前缀 + 时间戳 + 随机数
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 10)
  return prefix ? `${prefix}_${timestamp}_${randomStr}` : `${timestamp}_${randomStr}`
}

/**
 * 生成订单号
 * 格式: ORD + YYYYMMDD + 随机6位数
 */
export function generateOrderId(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `ORD${dateStr}${random}`
}

/**
 * 生成支付流水号
 * 格式: PAY + YYYYMMDD + 随机8位数
 */
export function generatePaymentId(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
  return `PAY${dateStr}${random}`
}

/**
 * 生成退款流水号
 * 格式: REF + YYYYMMDD + 随机8位数
 */
export function generateRefundId(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
  return `REF${dateStr}${random}`
}
