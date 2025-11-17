/**
 * 系统配置服务 (系统配置/AI模型/归因/分享统计)
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

// ========== 系统配置 ==========
export const getSystemConfigs = () =>
  api.get<ApiResponse<any>>('/system-configs')

export const updateSystemConfig = (key: string, value: any) =>
  api.put<ApiResponse>(`/system-configs/${key}`, { value })

// ========== AI模型管理 ==========
export const getAIModels = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/ai-models', { params })

export const createAIModel = (data: any) =>
  api.post<ApiResponse>('/ai-models', data)

export const updateAIModel = (id: number, data: any) =>
  api.put<ApiResponse>(`/ai-models/${id}`, data)

export const deleteAIModel = (id: number) =>
  api.delete<ApiResponse>(`/ai-models/${id}`)

// ========== 归因统计 ==========
export const getAttributionAnalytics = (params?: any) =>
  api.get<ApiResponse<any>>('/attribution', { params })

// ========== 分享统计 ==========
export const getShareAnalytics = (params?: any) =>
  api.get<ApiResponse<any>>('/share-analytics', { params })
