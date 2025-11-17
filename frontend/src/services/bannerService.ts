import api from './api'
import type { ApiResponse } from '../types'

export interface Banner {
  id: number
  title: string
  subtitle: string
  bg_color: string
  text_color: string
  link_url?: string
  image_url?: string
  sort_order: number
  status: string
  created_at: string
  updated_at: string
}

export interface PublicNotification {
  id: number
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  priority: number
  created_at: string
}

// 获取激活的横幅列表（公开接口）
export const getActiveBanners = () => {
  return api.get<ApiResponse<Banner[]>>('/public/banners')
}

// 获取公开通知列表（公开接口）
export const getPublicNotifications = () => {
  return api.get<ApiResponse<PublicNotification[]>>('/public/notifications')
}
