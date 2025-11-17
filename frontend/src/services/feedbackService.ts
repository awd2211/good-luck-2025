/**
 * 用户反馈服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Feedback {
  id: string
  type: 'bug' | 'suggestion' | 'complaint' | 'praise' | 'other'
  title: string
  content: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  reply?: string
  contact_info?: string
  created_at: string
  updated_at: string
}

export interface CreateFeedbackData {
  type: 'bug' | 'suggestion' | 'complaint' | 'praise' | 'other'
  title: string
  content: string
  contact_info?: string
}

// 提交反馈
export const submitFeedback = (data: CreateFeedbackData) => {
  return api.post<ApiResponse<{ id: string }>>('/feedbacks', data)
}

// 获取我的反馈列表
export const getMyFeedbacks = (params?: {
  page?: number
  limit?: number
  status?: string
}) => {
  return api.get<PaginatedResponse<Feedback>>('/feedbacks/my', { params })
}

// 获取反馈详情
export const getFeedbackDetail = (id: string) => {
  return api.get<ApiResponse<Feedback>>(`/feedbacks/${id}`)
}
