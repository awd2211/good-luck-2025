import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export type PaymentMethod = 'paypal' | 'stripe' | 'balance'
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'refunded' | 'cancelled'

export const PaymentMethod = {
  PAYPAL: 'paypal' as const,
  STRIPE: 'stripe' as const,
  BALANCE: 'balance' as const,
}

// ========== 类型定义 ==========

export interface PaymentMethodInfo {
  method_code: string
  method_name: string
  provider: string
  is_enabled: boolean
}

export interface PaymentTransaction {
  transaction_id: string
  order_id: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  status: PaymentStatus
  created_at: string
  paid_at?: string
  payment_url?: string
  client_secret?: string
}

export interface RefundRequest {
  transactionId: string
  amount?: number
  reason: string
}

// ========== 新版支付API（推荐使用） ==========

/**
 * 获取可用支付方式
 */
export const getPaymentMethods = () => {
  return api.get<ApiResponse<PaymentMethodInfo[]>>('/payments/methods')
}

/**
 * 创建支付订单（新版）
 */
export const createPaymentOrder = (params: {
  orderId: number
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  returnUrl?: string
  cancelUrl?: string
}) => {
  return api.post<ApiResponse<{
    transactionId: string
    paymentUrl?: string
    clientSecret?: string
    status: PaymentStatus
  }>>('/payments/create', params)
}

/**
 * 确认PayPal支付
 */
export const confirmPayPalPayment = (params: {
  paypalOrderId: string
  transactionId: string
}) => {
  return api.post<ApiResponse<{
    status: PaymentStatus
    paidAt: string
  }>>('/payments/paypal/confirm', params)
}

/**
 * 确认Stripe支付
 */
export const confirmStripePayment = (params: {
  paymentIntentId: string
  transactionId: string
}) => {
  return api.post<ApiResponse<{
    status: PaymentStatus
    paidAt: string
  }>>('/payments/stripe/confirm', params)
}

/**
 * 查询支付状态（新版）
 */
export const checkPaymentStatus = (transactionId: string) => {
  return api.get<ApiResponse<{
    status: PaymentStatus
    transaction_id: string
    order_id: string
    amount: number
    payment_method: string
    paid_at?: string
  }>>(`/payments/status/${transactionId}`)
}

/**
 * 申请退款
 */
export const requestRefund = (params: RefundRequest) => {
  return api.post<ApiResponse<{
    refundId: string
    status: string
    amount: number
  }>>('/payments/refund', params)
}

/**
 * 获取用户支付记录列表
 */
export const getUserPayments = (params?: {
  page?: number
  limit?: number
  status?: PaymentStatus
}) => {
  return api.get<PaginatedResponse<PaymentTransaction>>('/payments', { params })
}

/**
 * 获取订单的支付记录
 */
export const getOrderPayments = (orderId: string) => {
  return api.get<ApiResponse<PaymentTransaction[]>>(`/payments/order/${orderId}`)
}

// ========== 旧版支付API（向后兼容） ==========

/**
 * 创建支付（旧版，向后兼容）
 */
export const createPayment = (params: {
  order_id: string
  payment_method: string
  amount: number
  return_url?: string
  cancel_url?: string
}) => {
  return api.post<ApiResponse<{
    transaction_id: string
    payment_url?: string
    client_secret?: string
    status: string
  }>>('/payments', params)
}

/**
 * 查询支付状态（旧版）
 */
export const getPaymentStatus = (paymentId: string) => {
  return api.get<ApiResponse<{
    status: PaymentStatus
    paid_at?: string
    transaction_id?: string
  }>>(`/payments/${paymentId}`)
}

/**
 * 取消支付
 */
export const cancelPayment = (paymentId: string) => {
  return api.put<ApiResponse>(`/payments/${paymentId}/cancel`)
}

/**
 * 支付回调处理（旧版）
 */
export const handlePaymentCallback = (params: {
  paymentId: string
  transactionNo?: string
  status: 'success' | 'failed'
  errorMessage?: string
}) => {
  return api.post<ApiResponse>('/payments/callback', params)
}

/**
 * 模拟支付成功（仅开发环境）
 * @deprecated 仅用于开发测试
 */
export const mockPaymentSuccess = (paymentId: string) => {
  return api.post<ApiResponse>(`/payments/${paymentId}/mock-success`)
}
