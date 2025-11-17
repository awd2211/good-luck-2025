/**
 * 管理员管理服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Admin {
  id: string
  username: string
  email: string
  role: 'super_admin' | 'admin' | 'manager' | 'operator' | 'viewer'
  status: 'active' | 'inactive'
  last_login?: string
  created_at: string
  updated_at: string
}

export const getAdmins = (params?: { page?: number; limit?: number; role?: string }) =>
  api.get<PaginatedResponse<Admin>>('/admins', { params })

export const getAdmin = (id: string) =>
  api.get<ApiResponse<Admin>>(`/admins/${id}`)

export const createAdmin = (data: Partial<Admin> & { password: string }) =>
  api.post<ApiResponse<Admin>>('/admins', data)

export const updateAdmin = (id: string, data: Partial<Admin>) =>
  api.put<ApiResponse<Admin>>(`/admins/${id}`, data)

export const deleteAdmin = (id: string) =>
  api.delete<ApiResponse>(`/admins/${id}`)

export const resetAdminPassword = (id: string, newPassword: string) =>
  api.post<ApiResponse>(`/admins/${id}/reset-password`, { password: newPassword })
