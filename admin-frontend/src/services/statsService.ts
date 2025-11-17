/**
 * 统计数据服务
 */

import api from './api'
import type { ApiResponse } from '../types'

export interface DashboardStats {
  users: {
    total: number
    active: number
    inactive: number
  }
  orders: {
    total: number
    today: number
    completed: number
    pending: number
    cancelled: number
  }
  revenue: {
    total: number
    today: number
    average: number
    growthRate: number
  }
  fortuneTypes: Record<string, {
    count: number
    revenue: number
  }>
}

export interface RevenueTrend {
  date: string
  revenue: number
  order_count: number
}

export interface UserGrowthTrend {
  date: string
  new_users: number
  total_users: number
}

export interface FortuneTypeDistribution {
  type: string
  count: number
  revenue: number
  percentage?: number
}

/**
 * 获取仪表板统计数据
 */
export const getDashboardStats = () => {
  return api.get<ApiResponse<DashboardStats>>('/stats/dashboard')
}

/**
 * 获取收入趋势
 */
export const getRevenueTrend = (days: number = 7) => {
  return api.get<ApiResponse<RevenueTrend[]>>('/stats/revenue', { params: { days } })
}

/**
 * 获取用户增长趋势
 */
export const getUserGrowthTrend = (days: number = 7) => {
  return api.get<ApiResponse<UserGrowthTrend[]>>('/stats/user-growth', { params: { days } })
}

/**
 * 获取算命类型分布
 */
export const getFortuneTypeDistribution = () => {
  return api.get<ApiResponse<FortuneTypeDistribution[]>>('/stats/distribution')
}
