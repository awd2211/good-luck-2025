/**
 * 评价管理服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Review {
  id: number
  order_id: string
  user_id: string
  username: string
  fortune_type: string
  rating: number
  content?: string
  images?: string
  tags?: string
  is_anonymous: boolean
  status: 'published' | 'hidden' | 'deleted'
  helpful_count: number
  reply_content?: string
  reply_at?: string
  created_at: string
  updated_at: string
}

export const getReviews = (params?: { page?: number; limit?: number; status?: string }) =>
  api.get<PaginatedResponse<Review>>('/reviews', { params })

export const getReview = (id: number) =>
  api.get<ApiResponse<Review>>(`/reviews/${id}`)

export const updateReview = (id: number, data: Partial<Review>) =>
  api.put<ApiResponse<Review>>(`/reviews/${id}`, data)

export const deleteReview = (id: number) =>
  api.delete<ApiResponse>(`/reviews/${id}`)

export const approveReview = (id: number) =>
  api.post<ApiResponse>(`/reviews/${id}/approve`)

export const rejectReview = (id: number, reason?: string) =>
  api.post<ApiResponse>(`/reviews/${id}/reject`, { reason })

export const replyReview = (id: number, data: { reply_content: string }) =>
  api.post<ApiResponse>(`/reviews/${id}/reply`, data)

export const updateReviewStatus = (id: number, status: string) =>
  api.patch<ApiResponse>(`/reviews/${id}/status`, { status })
