import api from './api'
import type { ApiResponse, PaginatedResponse, Order } from '../types'

// 创建订单
export const createOrder = (data: {
  cart_item_ids: string[]
  coupon_id?: string
  address_id?: string
}) => {
  return api.post<ApiResponse<Order>>('/orders', data)
}

// 获取订单列表
export const getOrders = (params?: {
  page?: number
  limit?: number
  status?: string
}) => {
  return api.get<PaginatedResponse<Order>>('/orders', { params })
}

// 获取订单详情
export const getOrder = (orderId: string) => {
  return api.get<ApiResponse<Order>>(`/orders/${orderId}`)
}

// 取消订单
export const cancelOrder = (orderId: string, reason?: string) => {
  return api.post<ApiResponse>(`/orders/${orderId}/cancel`, { reason })
}

// 确认收货
export const confirmOrder = (orderId: string) => {
  return api.post<ApiResponse>(`/orders/${orderId}/confirm`)
}

// 申请退款
export const requestRefund = (orderId: string, reason: string, description?: string) => {
  return api.post<ApiResponse>(`/orders/${orderId}/refund`, {
    reason,
    description,
  })
}

// 删除订单（只能删除已完成或已取消的订单）
export const deleteOrder = (orderId: string) => {
  return api.delete<ApiResponse>(`/orders/${orderId}`)
}
