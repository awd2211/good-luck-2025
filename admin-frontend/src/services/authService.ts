import axios from 'axios'

const API_BASE_URL = '/api/manage'

// 创建 axios 实例
const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// 请求拦截器：添加 token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理错误
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
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
}

/**
 * 用户登录
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await authApi.post<LoginResponse>('/auth/login', credentials)
  return response.data
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<UserInfo> => {
  const response = await authApi.get<{ success: boolean; data: UserInfo }>('/auth/me')
  return response.data.data
}

/**
 * 刷新 token
 */
export const refreshToken = async (token: string): Promise<string> => {
  const response = await authApi.post<{ success: boolean; data: { token: string } }>(
    '/auth/refresh',
    { token }
  )
  return response.data.data.token
}

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
  await authApi.post('/auth/logout')
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
}

/**
 * 保存登录信息到本地
 */
export const saveAuthData = (token: string, user: UserInfo): void => {
  localStorage.setItem('admin_token', token)
  localStorage.setItem('admin_user', JSON.stringify(user))
}

/**
 * 获取本地保存的用户信息
 */
export const getLocalUser = (): UserInfo | null => {
  const userStr = localStorage.getItem('admin_user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('admin_token')
}
