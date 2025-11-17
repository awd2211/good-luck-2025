/**
 * 通知管理服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Notification {
  id: number
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success'
  priority: number
  status: 'active' | 'inactive'
  target: string
  start_date?: string
  end_date?: string
  is_scheduled?: boolean
  scheduled_time?: string
  sent_at?: string
  read_count?: number
  total_sent?: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface NotificationTemplate {
  id: number
  name: string
  title: string
  content: string
  type: string
  variables?: string[]
  created_at: string
  updated_at: string
}

/**
 * 获取通知列表
 */
export const getNotifications = (params?: {
  page?: number
  limit?: number
  type?: string
  is_active?: boolean
}) => {
  return api.get<PaginatedResponse<Notification>>('/notifications', { params })
}

/**
 * 获取单个通知
 */
export const getNotification = (id: number) => {
  return api.get<ApiResponse<Notification>>(`/notifications/${id}`)
}

/**
 * 创建通知
 */
export const createNotification = (notificationData: Partial<Notification>) => {
  return api.post<ApiResponse<Notification>>('/notifications', notificationData)
}

/**
 * 更新通知
 */
export const updateNotification = (id: number, notificationData: Partial<Notification>) => {
  return api.put<ApiResponse<Notification>>(`/notifications/${id}`, notificationData)
}

/**
 * 删除通知
 */
export const deleteNotification = (id: number) => {
  return api.delete<ApiResponse>(`/notifications/${id}`)
}

/**
 * 批量更新通知状态
 */
export const batchUpdateNotificationStatus = (ids: number[], status: string) => {
  return api.post<ApiResponse>('/notifications/batch/status', { ids, status })
}

/**
 * 发送通知
 */
export const sendNotification = (id: number) => {
  return api.post<ApiResponse>(`/notifications/${id}/send`)
}

// ========== 通知模板管理 ==========

/**
 * 获取通知模板列表
 */
export const getNotificationTemplates = (params?: {
  page?: number
  limit?: number
}) => {
  return api.get<PaginatedResponse<NotificationTemplate>>('/notification-templates', { params })
}

/**
 * 获取单个通知模板
 */
export const getNotificationTemplate = (id: number) => {
  return api.get<ApiResponse<NotificationTemplate>>(`/notification-templates/${id}`)
}

/**
 * 创建通知模板
 */
export const createNotificationTemplate = (templateData: Partial<NotificationTemplate>) => {
  return api.post<ApiResponse<NotificationTemplate>>('/notification-templates', templateData)
}

/**
 * 更新通知模板
 */
export const updateNotificationTemplate = (id: number, templateData: Partial<NotificationTemplate>) => {
  return api.put<ApiResponse<NotificationTemplate>>(`/notification-templates/${id}`, templateData)
}

/**
 * 删除通知模板
 */
export const deleteNotificationTemplate = (id: number) => {
  return api.delete<ApiResponse>(`/notification-templates/${id}`)
}
