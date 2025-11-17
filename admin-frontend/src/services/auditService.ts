/**
 * 审计日志服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface AuditLog {
  id: string
  admin_id: string
  admin_username: string
  action: string
  resource: string
  resource_id?: string
  details: string
  ip_address: string
  user_agent: string
  status: 'success' | 'failed'
  created_at: string
}

/**
 * 获取审计日志列表
 */
export const getAuditLogs = (params?: {
  page?: number
  limit?: number
  adminId?: string
  action?: string
  resource?: string
  status?: string
  startDate?: string
  endDate?: string
}) => {
  return api.get<PaginatedResponse<AuditLog>>('/audit', { params })
}

/**
 * 添加审计日志
 */
export const addAuditLog = (logData: {
  action: string
  resource: string
  resourceId?: string
  details: string
  status: 'success' | 'failed'
}) => {
  return api.post<ApiResponse<AuditLog>>('/audit', logData)
}

/**
 * 清理审计日志
 */
export const cleanAuditLogs = (keepCount?: number) => {
  return api.post<ApiResponse>('/audit/clean', { keepCount })
}
