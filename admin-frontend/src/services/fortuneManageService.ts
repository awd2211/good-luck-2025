/**
 * 算命业务管理服务 (分类/服务/模板/每日运势)
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

// ========== 算命分类 ==========
export const getFortuneCategories = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/fortune-categories', { params })

export const createFortuneCategory = (data: any) =>
  api.post<ApiResponse>('/fortune-categories', data)

export const updateFortuneCategory = (id: number, data: any) =>
  api.put<ApiResponse>(`/fortune-categories/${id}`, data)

export const deleteFortuneCategory = (id: number) =>
  api.delete<ApiResponse>(`/fortune-categories/${id}`)

// ========== 算命服务 ==========
export const getFortuneServices = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/fortune-services', { params })

export const createFortuneService = (data: any) =>
  api.post<ApiResponse>('/fortune-services', data)

export const updateFortuneService = (id: string, data: any) =>
  api.put<ApiResponse>(`/fortune-services/${id}`, data)

export const deleteFortuneService = (id: string) =>
  api.delete<ApiResponse>(`/fortune-services/${id}`)

// ========== 算命模板 ==========
export const getFortuneTemplates = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<any>>('/fortune-templates', { params })

export const createFortuneTemplate = (data: any) =>
  api.post<ApiResponse>('/fortune-templates', data)

export const updateFortuneTemplate = (id: number, data: any) =>
  api.put<ApiResponse>(`/fortune-templates/${id}`, data)

export const deleteFortuneTemplate = (id: number) =>
  api.delete<ApiResponse>(`/fortune-templates/${id}`)

// ========== 每日运势 ==========
export const getDailyHoroscopes = (params?: { page?: number; limit?: number; date?: string }) =>
  api.get<PaginatedResponse<any>>('/daily-horoscopes', { params })

export const createDailyHoroscope = (data: any) =>
  api.post<ApiResponse>('/daily-horoscopes', data)

export const updateDailyHoroscope = (id: number, data: any) =>
  api.put<ApiResponse>(`/daily-horoscopes/${id}`, data)

export const deleteDailyHoroscope = (id: number) =>
  api.delete<ApiResponse>(`/daily-horoscopes/${id}`)
