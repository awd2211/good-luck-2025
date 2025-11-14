import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface FortuneResult {
  id: string
  result_id: string
  order_id?: string
  user_id: string
  fortune_id: string
  fortune_type: string
  input_data: Record<string, any>
  result_data: Record<string, any>
  created_at: string
  updated_at: string
  fortune_info?: {
    title: string
    subtitle?: string
    icon?: string
    bg_color?: string
    price: number
  }
}

/**
 * 计算并保存算命结果
 */
export const calculateAndSave = (data: {
  fortuneId: string
  fortuneType: string
  inputData: Record<string, any>
  orderId?: string
}) => {
  return api.post<ApiResponse<FortuneResult>>('/fortune-results', data)
}

/**
 * 获取单个算命结果
 */
export const getResult = (resultId: string) => {
  return api.get<ApiResponse<FortuneResult>>(`/fortune-results/${resultId}`)
}

/**
 * 获取我的算命结果列表
 */
export const getMyResults = (params?: {
  page?: number
  limit?: number
  fortuneType?: string
}) => {
  return api.get<PaginatedResponse<FortuneResult>>('/fortune-results', { params })
}

/**
 * 根据订单ID获取算命结果
 */
export const getResultsByOrderId = (orderId: string) => {
  return api.get<ApiResponse<FortuneResult[]>>(`/fortune-results/order/${orderId}`)
}

/**
 * 删除算命结果
 */
export const deleteResult = (resultId: string) => {
  return api.delete<ApiResponse<null>>(`/fortune-results/${resultId}`)
}
