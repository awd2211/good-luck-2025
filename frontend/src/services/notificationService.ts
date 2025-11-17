import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Notification {
  id: number
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error' | 'system' | 'promotion' | 'announcement'
  priority: number
  is_read: boolean
  is_clicked: boolean
  read_at?: string
  click_count: number
  created_at: string
  link_url?: string
}

// 获取用户通知列表
export const getUserNotifications = (params?: {
  page?: number
  limit?: number
  is_read?: boolean
  type?: string
}) => {
  return api.get<PaginatedResponse<Notification>>('/notifications/user', { params })
}

// 获取未读通知数量
export const getUnreadCount = () => {
  return api.get<ApiResponse<{ count: number }>>('/notifications/unread-count')
}

// 标记通知为已读
export const markAsRead = (notificationId: number) => {
  return api.post<ApiResponse>(`/notifications/${notificationId}/read`)
}

// 标记所有通知为已读
export const markAllAsRead = () => {
  return api.post<ApiResponse>('/notifications/read-all')
}

// 记录通知点击
export const recordClick = (notificationId: number) => {
  return api.post<ApiResponse>(`/notifications/${notificationId}/click`)
}

// 删除通知
export const deleteNotification = (notificationId: number) => {
  return api.delete<ApiResponse>(`/notifications/${notificationId}/delete`)
}
