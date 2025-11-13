import api from './api'
import type { LoginData, RegisterData, ApiResponse, User } from '../types'

// 发送验证码
export const sendVerificationCode = (phone: string) => {
  return api.post<ApiResponse>('/auth/send-code', { phone })
}

// 手机号+验证码登录
export const loginWithCode = (phone: string, code: string) => {
  return api.post<ApiResponse<{ token: string; user: User }>>('/auth/login/code', {
    phone,
    code,
  })
}

// 手机号+密码登录
export const loginWithPassword = (phone: string, password: string) => {
  return api.post<ApiResponse<{ token: string; user: User }>>('/auth/login/password', {
    phone,
    password,
  })
}

// 统一登录接口（根据 LoginData 自动选择登录方式）
export const login = (data: LoginData) => {
  if (data.code) {
    return loginWithCode(data.phone, data.code)
  } else if (data.password) {
    return loginWithPassword(data.phone, data.password)
  }
  throw new Error('请提供验证码或密码')
}

// 注册
export const register = (data: RegisterData) => {
  return api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data)
}

// 获取当前用户信息
export const getCurrentUser = () => {
  return api.get<ApiResponse<User>>('/auth/me')
}

// 更新用户信息
export const updateProfile = (data: Partial<User>) => {
  return api.put<ApiResponse<User>>('/auth/profile', data)
}

// 修改密码
export const changePassword = (oldPassword: string, newPassword: string) => {
  return api.post<ApiResponse>('/auth/change-password', {
    old_password: oldPassword,
    new_password: newPassword,
  })
}

// 重置密码（忘记密码）
export const resetPassword = (phone: string, code: string, newPassword: string) => {
  return api.post<ApiResponse>('/auth/reset-password', {
    phone,
    code,
    new_password: newPassword,
  })
}
