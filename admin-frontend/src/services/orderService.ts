/**
 * 订单管理服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Order {
  id: string
  order_no: string
  user_id: string
  total_amount: number
  discount_amount: number
  final_amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'refunded' | 'completed'
  payment_method?: string
  payment_status?: string
  created_at: string
  updated_at: string
  paid_at?: string
  items?: OrderItem[]
  user?: {
    id: string
    nickname?: string
    phone: string
  }
  // 后端实际返回的字段（用于兼容）
  orderId: string
  userId: string
  username: string
  fortuneType: string
  fortuneName: string
  amount: number
  createTime: string
  updateTime: string
  payMethod?: string
}

export interface OrderItem {
  id: string
  fortune_id: string
  fortune_title: string
  quantity: number
  price: number
  subtotal: number
}

export interface OrderStats {
  total: number
  pending: number
  paid: number
  cancelled: number
  refunded: number
  todayOrders: number
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
}

/**
 * 获取订单列表
 */
export const getOrders = (params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  startDate?: string
  endDate?: string
}) => {
  return api.get<PaginatedResponse<Order>>('/orders', { params })
}

/**
 * 获取单个订单
 */
export const getOrder = (id: string) => {
  return api.get<ApiResponse<Order>>(`/orders/${id}`)
}

/**
 * 创建订单
 */
export const createOrder = (orderData: Partial<Order>) => {
  return api.post<ApiResponse<Order>>('/orders', orderData)
}

/**
 * 更新订单
 */
export const updateOrder = (id: string, orderData: Partial<Order>) => {
  return api.put<ApiResponse<Order>>(`/orders/${id}`, orderData)
}

/**
 * 更新订单状态
 */
export const updateOrderStatus = (id: string, status: string) => {
  return api.patch<ApiResponse>(`/orders/${id}/status`, { status })
}

/**
 * 删除订单
 */
export const deleteOrder = (id: string) => {
  return api.delete<ApiResponse>(`/orders/${id}`)
}

/**
 * 获取订单统计
 */
export const getOrderStats = (params?: {
  startDate?: string
  endDate?: string
}) => {
  return api.get<ApiResponse<OrderStats>>('/orders/stats', { params })
}

/**
 * 获取今日订单统计
 */
export const getTodayOrderStats = () => {
  return api.get<ApiResponse<OrderStats>>('/orders/today-stats')
}
