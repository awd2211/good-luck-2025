import api from './api'
import type { ApiResponse, PaginatedResponse, Coupon, UserCoupon } from '../types'

// 获取可领取的优惠券列表
export const getAvailableCoupons = (params?: {
  page?: number
  limit?: number
}) => {
  return api.get<PaginatedResponse<Coupon>>('/coupons/available', { params })
}

// 获取我的优惠券
export const getMyCoupons = (params?: {
  page?: number
  limit?: number
  is_used?: boolean
}) => {
  return api.get<PaginatedResponse<UserCoupon>>('/coupons/my', { params })
}

// 领取优惠券
export const claimCoupon = (couponId: string) => {
  return api.post<ApiResponse<UserCoupon>>(`/coupons/${couponId}/claim`)
}

// 通过优惠码领取优惠券
export const claimCouponByCode = (code: string) => {
  return api.post<ApiResponse<UserCoupon>>('/coupons/claim-by-code', { code })
}

// 获取适用于当前订单的优惠券
export const getApplicableCoupons = (amount: number) => {
  return api.get<ApiResponse<UserCoupon[]>>('/coupons/applicable', {
    params: { amount },
  })
}

// 计算优惠券折扣
export const calculateDiscount = (couponId: string, amount: number) => {
  return api.post<ApiResponse<{
    discount: number
    final_amount: number
  }>>('/coupons/calculate', {
    coupon_id: couponId,
    amount,
  })
}
