/**
 * 横幅管理服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Banner {
  id: number
  title: string
  subtitle?: string
  image_url?: string
  link_url?: string
  bg_color: string
  text_color: string
  position: number
  status: 'active' | 'inactive'
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  // 兼容字段
  is_active?: boolean
  display_order?: number
  start_time?: string
  end_time?: string
}

/**
 * 获取横幅列表
 */
export const getBanners = (params?: {
  page?: number
  limit?: number
  is_active?: boolean
}) => {
  return api.get<PaginatedResponse<Banner>>('/banners', { params })
}

/**
 * 获取单个横幅
 */
export const getBanner = (id: number) => {
  return api.get<ApiResponse<Banner>>(`/banners/${id}`)
}

/**
 * 创建横幅
 */
export const createBanner = (bannerData: Partial<Banner>) => {
  return api.post<ApiResponse<Banner>>('/banners', bannerData)
}

/**
 * 更新横幅
 */
export const updateBanner = (id: number, bannerData: Partial<Banner>) => {
  return api.put<ApiResponse<Banner>>(`/banners/${id}`, bannerData)
}

/**
 * 删除横幅
 */
export const deleteBanner = (id: number) => {
  return api.delete<ApiResponse>(`/banners/${id}`)
}

/**
 * 批量更新横幅状态
 */
export const batchUpdateBannerStatus = (ids: number[], is_active: boolean) => {
  return api.post<ApiResponse>('/banners/batch-status', { ids, is_active })
}

/**
 * 更新横幅排序
 */
export const updateBannerOrder = (orders: { id: number; display_order: number }[]) => {
  return api.post<ApiResponse>('/banners/update-order', { orders })
}

/**
 * 更新横幅位置（上移/下移）
 */
export const updateBannerPosition = (id: number, direction: 'up' | 'down') => {
  return api.patch<ApiResponse>(`/banners/${id}/position`, { direction })
}
