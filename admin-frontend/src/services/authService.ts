// 导入统一的 axios 实例
import api from './api'
import storage from '../utils/storage'

export interface LoginRequest {
  username: string
  password: string
  twoFactorToken?: string
}

export interface LoginResponse {
  success: boolean
  message?: string
  requiresTwoFactor?: boolean
  data?: {
    token: string
    user: {
      id: string
      username: string
      role: string
      email: string
    }
  }
}

export interface UserInfo {
  id: string
  username: string
  role: string
  email: string
  phone?: string
  language?: string
  timezone?: string
  created_at?: string
  last_login?: string
}

/**
 * 用户登录
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials)
  return response.data
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<UserInfo> => {
  const response = await api.get<{ success: boolean; data: UserInfo }>('/auth/me')
  return response.data.data
}

/**
 * 刷新 token
 */
export const refreshToken = async (token: string): Promise<string> => {
  const response = await api.post<{ success: boolean; data: { token: string } }>(
    '/auth/refresh',
    { token }
  )
  return response.data.data.token
}

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout')
  storage.remove('admin_token')
  storage.remove('admin_user')
}

/**
 * 保存登录信息到本地
 */
export const saveAuthData = (token: string, user: UserInfo): void => {
  storage.set('admin_token', token)
  storage.setJSON('admin_user', user)
}

/**
 * 获取本地保存的用户信息
 */
export const getLocalUser = (): UserInfo | null => {
  return storage.getJSON<UserInfo>('admin_user')
}

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return !!storage.get('admin_token')
}
