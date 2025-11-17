/**
 * 客服系统服务 (包含所有16个客服相关模块)
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

// ========== 客服人员管理 ==========
export const getCSAgents = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/cs/agents', { params })

export const createCSAgent = (data: any) =>
  api.post<ApiResponse>('/cs/agents', data)

export const updateCSAgent = (id: string, data: any) =>
  api.put<ApiResponse>(`/cs/agents/${id}`, data)

export const deleteCSAgent = (id: string) =>
  api.delete<ApiResponse>(`/cs/agents/${id}`)

// ========== 客服会话管理 ==========
export const getCSSessions = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/cs/sessions', { params })

export const getCSSession = (id: number) =>
  api.get<ApiResponse<any>>(`/cs/sessions/${id}`)

// ========== 客服统计 ==========
export const getCSStats = (params?: { startDate?: string; endDate?: string }) =>
  api.get<ApiResponse<any>>('/cs/stats', { params })

// ========== 满意度管理 ==========
export const getCSSatisfactionStats = (params?: any) =>
  api.get<ApiResponse<any>>('/cs/satisfaction', { params })

// ========== 绩效管理 ==========
export const getCSPerformance = (params?: any) =>
  api.get<ApiResponse<any>>('/cs/performance', { params })

// ========== AI机器人配置 ==========
export const getCSAIConfig = () =>
  api.get<ApiResponse<any>>('/cs/ai')

export const updateCSAIConfig = (data: any) =>
  api.put<ApiResponse>('/cs/ai', data)

// ========== 快捷回复 ==========
export const getQuickReplies = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/cs/quick-replies', { params })

export const createQuickReply = (data: any) =>
  api.post<ApiResponse>('/cs/quick-replies', data)

export const updateQuickReply = (id: number, data: any) =>
  api.put<ApiResponse>(`/cs/quick-replies/${id}`, data)

export const deleteQuickReply = (id: number) =>
  api.delete<ApiResponse>(`/cs/quick-replies/${id}`)

// ========== 质检管理 ==========
export const getQualityInspections = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/cs/quality', { params })

// ========== 敏感词管理 ==========
export const getSensitiveWords = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/cs/sensitive-words', { params })

export const createSensitiveWord = (data: any) =>
  api.post<ApiResponse>('/cs/sensitive-words', data)

export const deleteSensitiveWord = (id: number) =>
  api.delete<ApiResponse>(`/cs/sensitive-words/${id}`)

// ========== 客户标签 ==========
export const getCustomerTags = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/customer-tags', { params })

export const createCustomerTag = (data: any) =>
  api.post<ApiResponse>('/customer-tags', data)

export const updateCustomerTag = (id: number, data: any) =>
  api.put<ApiResponse>(`/customer-tags/${id}`, data)

export const deleteCustomerTag = (id: number) =>
  api.delete<ApiResponse>(`/customer-tags/${id}`)

// ========== 客户备注 ==========
export const getCustomerNotes = (params?: { page?: number; limit?: number; userId?: string }) =>
  api.get<PaginatedResponse<any>>('/customer-notes', { params })

export const createCustomerNote = (data: any) =>
  api.post<ApiResponse>('/customer-notes', data)

// ========== 会话转接 ==========
export const getSessionTransfers = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/session-transfers', { params })

// ========== 知识库 ==========
export const getKnowledgeBase = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/knowledge-base', { params })

export const createKnowledgeArticle = (data: any) =>
  api.post<ApiResponse>('/knowledge-base', data)

export const updateKnowledgeArticle = (id: number, data: any) =>
  api.put<ApiResponse>(`/knowledge-base/${id}`, data)

export const deleteKnowledgeArticle = (id: number) =>
  api.delete<ApiResponse>(`/knowledge-base/${id}`)

// ========== 客服排班 ==========
export const getCSSchedule = (params?: any) =>
  api.get<ApiResponse<any>>('/cs-schedule', { params })

export const updateCSSchedule = (data: any) =>
  api.post<ApiResponse>('/cs-schedule', data)

// ========== 培训系统 ==========
export const getTrainingCourses = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/training', { params })

export const createTrainingCourse = (data: any) =>
  api.post<ApiResponse>('/training', data)

// ========== 客户画像 ==========
export const getCustomerProfile = (userId: string) =>
  api.get<ApiResponse<any>>(`/customer-profiles/${userId}`)

export const getCustomerProfiles = (params?: any) =>
  api.get<PaginatedResponse<any>>('/customer-profiles', { params })
