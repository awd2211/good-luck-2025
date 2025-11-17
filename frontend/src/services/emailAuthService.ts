/**
 * 邮箱认证服务
 */
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50301/api'

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 发送验证码接口返回类型
interface SendCodeResponse {
  success: boolean
  message: string
}

// 注册/登录接口返回类型
interface AuthResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: {
      id: string
      email: string
      nickname: string
      avatar: string | null
      balance: number
    }
  }
}

/**
 * 发送邮箱验证码
 * @param email 邮箱地址
 * @param purpose 用途: register | login | reset_password
 */
export const sendVerificationCode = async (
  email: string,
  purpose: 'register' | 'login' | 'reset_password'
): Promise<SendCodeResponse> => {
  const response = await api.post<SendCodeResponse>('/user/email-auth/send-code', {
    email,
    purpose,
  })
  return response.data
}

/**
 * 邮箱注册
 */
export const registerWithEmail = async (
  email: string,
  nickname: string,
  password: string,
  verificationCode: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/user/email-auth/register', {
    email,
    nickname,
    password,
    verificationCode,
  })
  return response.data
}

/**
 * 邮箱+密码登录
 */
export const loginWithPassword = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/user/email-auth/login', {
    email,
    password,
  })
  return response.data
}

/**
 * 邮箱+验证码登录
 */
export const loginWithCode = async (
  email: string,
  verificationCode: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/user/email-auth/login-with-code', {
    email,
    verificationCode,
  })
  return response.data
}

/**
 * 重置密码
 */
export const resetPassword = async (
  email: string,
  verificationCode: string,
  newPassword: string
): Promise<SendCodeResponse> => {
  const response = await api.post<SendCodeResponse>('/user/email-auth/reset-password', {
    email,
    verificationCode,
    newPassword,
  })
  return response.data
}
