/**
 * 反馈管理服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Feedback {
  id: number
  user_id: string
  username: string
  type: 'feedback' | 'complaint' | 'suggestion' | 'bug'
  category?: string
  title: string
  content: string
  contact?: string
  images?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  handler_id?: string
  handler_name?: string
  handler_comment?: string
  satisfaction_score?: number
  created_at: string
  updated_at: string
  resolved_at?: string
}

export const getFeedbacks = (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
  api.get<PaginatedResponse<Feedback>>('/feedbacks', { params })

export const getFeedback = (id: number) =>
  api.get<ApiResponse<Feedback>>(`/feedbacks/${id}`)

export const updateFeedback = (id: number, data: Partial<Feedback>) =>
  api.put<ApiResponse<Feedback>>(`/feedbacks/${id}`, data)

export const replyFeedback = (id: number, reply: string) =>
  api.post<ApiResponse>(`/feedbacks/${id}/reply`, { reply })

export const closeFeedback = (id: number) =>
  api.post<ApiResponse>(`/feedbacks/${id}/close`)
