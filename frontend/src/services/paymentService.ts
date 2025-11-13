import api from './api'
import type { ApiResponse } from '../types'

export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  BALANCE = 'balance',
}

// 创建支付
export const createPayment = (orderId: string, method: PaymentMethod) => {
  return api.post<ApiResponse<{
    payment_id: string
    payment_url?: string  // 支付宝/微信支付跳转链接
    qr_code?: string      // 支付二维码
  }>>('/payments', {
    order_id: orderId,
    payment_method: method,
  })
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
