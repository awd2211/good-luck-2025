import api from './api'
import type { ApiResponse } from '../types'

export type PaymentMethod = 'paypal' | 'stripe' | 'balance'

export const PaymentMethod = {
  PAYPAL: 'paypal' as const,
  STRIPE: 'stripe' as const,
  BALANCE: 'balance' as const,
}

// 创建支付
export const createPayment = (params: {
  order_id: string
  payment_method: string
  amount: number
  return_url?: string
  cancel_url?: string
}) => {
  return api.post<ApiResponse<{
    transaction_id: string
    payment_url?: string  // PayPal/Stripe支付跳转链接
    client_secret?: string  // Stripe客户端密钥
    status: string
  }>>('/payments', params)
}

// 查询支付状态
export const getPaymentStatus = (paymentId: string) => {
  return api.get<ApiResponse<{
    status: 'pending' | 'success' | 'failed'
    paid_at?: string
  }>>(`/payments/${paymentId}/status`)
}

// 取消支付
export const cancelPayment = (paymentId: string) => {
  return api.post<ApiResponse>(`/payments/${paymentId}/cancel`)
}

// 模拟支付成功（仅开发环境）
export const mockPaymentSuccess = (paymentId: string) => {
  return api.post<ApiResponse>(`/payments/${paymentId}/mock-success`)
}
