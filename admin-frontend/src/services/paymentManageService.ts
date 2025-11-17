/**
 * 支付管理服务 (配置/方式/交易)
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

// ==================== 类型定义 ====================

export interface PaymentConfig {
  id: string
  provider: string
  config_key: string
  config_value: string
  is_production: boolean
  is_enabled: boolean
  description?: string
  is_masked?: boolean
  created_at: string
  updated_at: string
}

export interface PaymentMethod {
  id: string
  method_code: string
  method_name: string
  provider?: string
  icon?: string
  description?: string
  is_enabled: boolean
  sort_order: number
  min_amount: number
  max_amount?: number
  fee_type: 'none' | 'fixed' | 'percentage'
  fee_value: number
  created_at: string
  updated_at: string
}

export interface PaymentMethodStats {
  total_transactions: number
  completed_count: number
  pending_count: number
  failed_count: number
  total_amount: number
  avg_amount: number
}

export interface PaymentTransaction {
  id: string
  transaction_id: string
  user_id: string
  order_id: string
  amount: number
  currency: string
  payment_method: string
  provider: string
  provider_transaction_id?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_url?: string
  client_secret?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
  created_at: string
  completed_at?: string
}

export interface TransactionStats {
  total_count: number
  total_amount: number
  completed_count: number
  pending_count: number
  failed_count: number
  refunded_count: number
}

// ==================== 支付配置 API ====================

/**
 * 获取支付配置列表
 */
export const getPaymentConfigs = (params?: {
  provider?: string
  is_production?: boolean
}) => {
  return api.get<ApiResponse<PaymentConfig[]>>('/payment-configs', { params })
}

/**
 * 创建支付配置
 */
export const createPaymentConfig = (data: Partial<PaymentConfig>) => {
  return api.post<ApiResponse<PaymentConfig>>('/payment-configs', data)
}

/**
 * 更新支付配置
 */
export const updatePaymentConfig = (id: string, data: Partial<PaymentConfig>) => {
  return api.put<ApiResponse<PaymentConfig>>(`/payment-configs/${id}`, data)
}

/**
 * 删除支付配置
 */
export const deletePaymentConfig = (id: string) => {
  return api.delete<ApiResponse>(`/payment-configs/${id}`)
}

/**
 * 测试支付配置
 */
export const testPaymentConfig = (data: {
  provider: string
  is_production: boolean
}) => {
  return api.post<ApiResponse<{ message: string }>>('/payment-configs/test', data)
}

// ==================== 支付方式 API ====================

/**
 * 获取支付方式列表
 */
export const getPaymentMethods = () => {
  return api.get<ApiResponse<PaymentMethod[]>>('/payment-methods')
}

/**
 * 创建支付方式
 */
export const createPaymentMethod = (data: Partial<PaymentMethod>) => {
  return api.post<ApiResponse<PaymentMethod>>('/payment-methods', data)
}

/**
 * 更新支付方式
 */
export const updatePaymentMethod = (id: string, data: Partial<PaymentMethod>) => {
  return api.put<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`, data)
}

/**
 * 删除支付方式
 */
export const deletePaymentMethod = (id: string) => {
  return api.delete<ApiResponse>(`/payment-methods/${id}`)
}

/**
 * 切换支付方式状态
 */
export const togglePaymentMethod = (id: string) => {
  return api.patch<ApiResponse<{ message: string }>>(`/payment-methods/${id}/toggle`)
}

/**
 * 获取支付方式统计
 */
export const getPaymentMethodStats = (id: string) => {
  return api.get<ApiResponse<{ stats: PaymentMethodStats }>>(`/payment-methods/${id}/stats`)
}

// ==================== 支付交易 API ====================

/**
 * 获取支付交易列表
 */
export const getPaymentTransactions = (params?: {
  page?: number
  limit?: number
  status?: string
  payment_method?: string
  provider?: string
  search?: string
  start_date?: string
  end_date?: string
}) => {
  return api.get<PaginatedResponse<PaymentTransaction>>('/payment-transactions', { params })
}

/**
 * 获取单个支付交易
 */
export const getPaymentTransaction = (id: string) => {
  return api.get<ApiResponse<PaymentTransaction>>(`/payment-transactions/${id}`)
}

/**
 * 获取支付交易统计
 */
export const getPaymentTransactionStats = () => {
  return api.get<ApiResponse<TransactionStats>>('/payment-transactions/stats')
}
