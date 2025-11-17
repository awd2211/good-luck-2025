import api from './api'
import type { ApiResponse } from '../types'

export interface Policy {
  title: string
  content: string
  version: string
  effectiveDate: string
}

// 获取用户协议
export const getUserAgreement = () => {
  return api.get<ApiResponse<Policy>>('/policies/user-agreement')
}

// 获取隐私政策
export const getPrivacyPolicy = () => {
  return api.get<ApiResponse<Policy>>('/policies/privacy-policy')
}
