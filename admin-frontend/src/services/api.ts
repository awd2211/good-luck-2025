/**
 * 管理端 API 基础配置
 * 统一的 axios 实例和拦截器
 */

import axios, { AxiosError } from 'axios'
import storage from '../utils/storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/manage'

// 开发环境下输出配置信息
if (import.meta.env.DEV) {
  console.log('🔧 API配置信息:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    实际使用的BASE_URL: API_BASE_URL,
    环境: import.meta.env.MODE
  })
}

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加 token
api.interceptors.request.use(
  (config) => {
    const token = storage.get('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 开发环境下记录请求信息
    if (import.meta.env.DEV) {
      console.log('📤 发送请求:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        完整URL: `${config.baseURL}${config.url}`,
        data: config.data,
        params: config.params
      })
    }

    return config
  },
  (error) => {
    console.error('❌ 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => {
    // 开发环境下记录响应信息
    if (import.meta.env.DEV) {
      console.log('📥 收到响应:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      })
    }
    return response
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as any
      const url = error.config?.url || '未知URL'

      // 开发环境下详细记录错误
      if (import.meta.env.DEV) {
        console.error('📥 响应错误:', {
          url,
          status,
          message: data?.message,
          data
        })
      }

      switch (status) {
        case 400:
          console.error('❌ 请求参数错误:', data.message || data.errors)
          break
        case 401:
          // 只有在登录相关的401才强制退出
          // 其他401可能是权限不足或接口不存在，不应该退出
          const isLoginRelated = url.includes('/auth/') || data?.message?.includes('token') || data?.message?.includes('认证')

          if (isLoginRelated) {
            console.error('❌ 认证失败，请重新登录')
            storage.remove('admin_token')
            storage.remove('admin_user')
            // 延迟跳转，避免干扰当前操作
            setTimeout(() => {
              if (window.location.pathname !== '/login') {
                window.location.href = '/login'
              }
            }, 100)
          } else {
            console.warn('⚠️ 接口未授权或不存在:', url)
          }
          break
        case 403:
          console.error('❌ 权限不足:', url)
          break
        case 404:
          console.error('❌ 请求的资源不存在:', url)
          break
        case 429:
          console.error('❌ 请求过于频繁，请稍后再试')
          break
        case 500:
        case 502:
        case 503:
        case 504:
          console.error('❌ 服务器错误，请稍后重试:', url)
          break
        default:
          console.error('❌ 未知错误:', status, url, data)
      }
    } else if (error.request) {
      console.error('❌ 网络错误，请检查网络连接')
    } else {
      console.error('❌ 请求配置错误:', error.message)
    }

    return Promise.reject(error)
  }
)

export default api
