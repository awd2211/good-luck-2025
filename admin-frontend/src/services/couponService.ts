/**
 * 优惠券管理服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Coupon {
  id: number
  code: string
  name: string
  type: 'discount' | 'amount' | 'free'
  value: number
  min_amount?: number
  max_discount?: number
  total_count: number
  used_count: number
  valid_from: string
  valid_until: string
  target_users: string
  applicable_types?: string
  status: 'active' | 'inactive' | 'expired'
  created_by?: string
  created_at: string
  updated_at: string
}

export const getCoupons = (params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<Coupon>>('/coupons', { params })

export const getCoupon = (id: number) =>
  api.get<ApiResponse<Coupon>>(`/coupons/${id}`)

export const createCoupon = (data: Partial<Coupon>) =>
  api.post<ApiResponse<Coupon>>('/coupons', data)

export const updateCoupon = (id: number, data: Partial<Coupon>) =>
  api.put<ApiResponse<Coupon>>(`/coupons/${id}`, data)

export const deleteCoupon = (id: number) =>
  api.delete<ApiResponse>(`/coupons/${id}`)

export const generateCouponCodes = (id: number, quantity: number) =>
  api.post<ApiResponse>(`/coupons/${id}/generate`, { quantity })

export const updateCouponStatus = (id: number, status: string) =>
  api.patch<ApiResponse>(`/coupons/${id}/status`, { status })
