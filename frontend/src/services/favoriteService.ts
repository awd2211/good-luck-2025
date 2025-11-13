import api from './api'
import type { ApiResponse, PaginatedResponse, Favorite, BrowseHistory } from '../types'

// 获取收藏列表
export const getFavorites = (params?: {
  page?: number
  limit?: number
}) => {
  return api.get<PaginatedResponse<Favorite>>('/favorites', { params })
}

// 添加收藏
export const addFavorite = (fortuneId: string) => {
  return api.post<ApiResponse<Favorite>>('/favorites', {
    fortune_id: fortuneId,
  })
}

// 取消收藏
export const removeFavorite = (fortuneId: string) => {
  return api.delete<ApiResponse>(`/favorites/${fortuneId}`)
}

// 检查是否已收藏
export const checkFavorite = (fortuneId: string) => {
  return api.get<ApiResponse<{ is_favorite: boolean }>>(`/favorites/check/${fortuneId}`)
}

// 获取浏览历史
export const getBrowseHistory = (params?: {
  page?: number
  limit?: number
}) => {
  return api.get<PaginatedResponse<BrowseHistory>>('/history', { params })
}

// 添加浏览历史
export const addBrowseHistory = (fortuneId: string) => {
  return api.post<ApiResponse>('/history', {
    fortune_id: fortuneId,
  })
}

// 清空浏览历史
export const clearBrowseHistory = () => {
  return api.delete<ApiResponse>('/history')
}

// 删除单条浏览历史
export const removeBrowseHistory = (historyId: string) => {
  return api.delete<ApiResponse>(`/history/${historyId}`)
}
