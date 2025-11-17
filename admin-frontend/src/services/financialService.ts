/**
 * 财务管理服务
 */

import api from './api'
import type { ApiResponse } from '../types'

export interface FinancialStats {
  total_revenue: string
  today_revenue: string
  total_orders: string
  today_orders: string
  avg_order_value: number
  total_users: number
}

export interface OrderFinancial {
  date: string
  revenue: string
  order_count: string
}

export interface FinancialRecord {
  id: string
  type: 'income' | 'withdrawal' | 'refund' | 'adjustment'
  amount: number
  balance: number
  description: string
  reference_type?: string
  reference_id?: string
  created_at: string
  operator?: string
}

/**
 * 获取财务统计
 */
export const getFinancialStats = () => {
  return api.get<ApiResponse<FinancialStats>>('/financial/stats')
}

/**
 * 获取财务记录
 */
export const getFinancialData = (params?: {
  startDate?: string
  endDate?: string
  type?: string
  page?: number
  limit?: number
}) => {
  return api.get<ApiResponse<OrderFinancial[] | { list: OrderFinancial[], total: number }>>('/financial/data', { params })
}
