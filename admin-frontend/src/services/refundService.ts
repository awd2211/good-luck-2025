/**
 * 退款管理服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Refund {
  id: number
  refund_no: string
  order_id: string
  user_id: string
  username?: string
  amount: number
  reason: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  refund_method?: string
  reviewer_id?: string
  reviewer_name?: string
  review_comment?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export const getRefunds = (params?: { page?: number; limit?: number; status?: string }) =>
  api.get<PaginatedResponse<Refund>>('/refunds', { params })

export const getRefund = (id: number) =>
  api.get<ApiResponse<Refund>>(`/refunds/${id}`)

export const approveRefund = (id: number, note?: string) =>
  api.post<ApiResponse>(`/refunds/${id}/approve`, { note })

export const rejectRefund = (id: number, note: string) =>
  api.post<ApiResponse>(`/refunds/${id}/reject`, { note })

export const processRefund = (id: number) =>
  api.post<ApiResponse>(`/refunds/${id}/process`)

export const reviewRefund = (id: number, data: {
  action: 'approve' | 'reject'
  review_comment: string
  refund_method?: string
}) =>
  api.post<ApiResponse>(`/refunds/${id}/review`, data)
