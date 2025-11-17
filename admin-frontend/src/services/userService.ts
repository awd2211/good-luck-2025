/**
 * 用户管理服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface User {
  id: string
  username: string
  phone: string
  nickname?: string
  email?: string
  avatar?: string
  balance: number
  status: string
  created_at: string
  updated_at: string
  last_login?: string
  // 后端实际返回的字段
  register_date: string
  order_count: number
  total_spent: number
  last_login_date?: string
}

export interface UserStats {
  // 后端实际返回的字段
  total_users: number
  active_users: number
  inactive_users: number
  today_new_users: number
  week_new_users: number
  month_new_users: number
}

/**
 * 获取用户列表
 */
export const getUsers = (params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
}) => {
  return api.get<PaginatedResponse<User>>('/users', { params })
}

/**
 * 获取单个用户
 */
export const getUser = (id: string) => {
  return api.get<ApiResponse<User>>(`/users/${id}`)
}

/**
 * 创建用户
 */
export const createUser = (userData: Partial<User>) => {
  return api.post<ApiResponse<User>>('/users', userData)
}

/**
 * 更新用户信息
 */
export const updateUser = (id: string, userData: Partial<User>) => {
  return api.put<ApiResponse<User>>(`/users/${id}`, userData)
}

/**
 * 删除用户
 */
export const deleteUser = (id: string) => {
  return api.delete<ApiResponse>(`/users/${id}`)
}

/**
 * 批量更新用户状态
 */
export const batchUpdateUserStatus = (ids: string[], status: string) => {
  return api.post<ApiResponse>('/users/batch-status', { ids, status })
}

/**
 * 获取用户统计数据
 */
export const getUserStats = () => {
  return api.get<ApiResponse<UserStats>>('/users/stats')
}

/**
 * 导出用户数据（CSV格式）
 */
export const exportUsers = (params?: {
  search?: string
  status?: string
}) => {
  return api.get('/users/export', {
    params,
    responseType: 'blob'
  })
}

/**
 * 重置用户密码
 */
export const resetUserPassword = (id: string, newPassword: string) => {
  return api.post<ApiResponse>(`/users/${id}/reset-password`, { newPassword })
}
