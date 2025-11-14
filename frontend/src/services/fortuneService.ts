import api from './api'
import type { ApiResponse, PaginatedResponse, Fortune } from '../types'

// 获取算命服务列表
export const getFortunes = (params?: {
  page?: number
  limit?: number
  category?: string
  search?: string
  sort?: 'price' | 'rating' | 'sales'
  order?: 'asc' | 'desc'
  min_price?: number
  max_price?: number
}) => {
  return api.get<PaginatedResponse<Fortune>>('/fortunes', { params })
}

// 获取算命服务详情
export const getFortune = (fortuneId: string) => {
  return api.get<ApiResponse<Fortune>>(`/fortunes/${fortuneId}`)
}

// 获取热门服务
export const getPopularFortunes = (limit = 10) => {
  return api.get<ApiResponse<Fortune[]>>('/fortunes/popular', {
    params: { limit },
  })
}

// 获取推荐服务
export const getRecommendedFortunes = (limit = 10) => {
  return api.get<ApiResponse<Fortune[]>>('/fortunes/recommended', {
    params: { limit },
  })
}

// 获取服务分类
export const getCategories = () => {
  return api.get<ApiResponse<Array<{
    category: string
    name: string
    count: number
    minPrice: number
    maxPrice: number
  }>>>('/fortunes/categories')
}
