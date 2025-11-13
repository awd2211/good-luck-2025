import axios from 'axios'

const API_BASE_URL = '/api'

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// 请求拦截器：添加 token
api.interceptors.request.use(
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ========== 用户管理 ==========

export const getUsers = async (params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}) => {
  const response = await api.get('/users', { params })
  return response.data
}

export const getUser = async (id: string) => {
  const response = await api.get(`/users/${id}`)
  return response.data
}

export const createUser = async (userData: any) => {
  const response = await api.post('/users', userData)
  return response.data
}

export const updateUser = async (id: string, userData: any) => {
  const response = await api.put(`/users/${id}`, userData)
  return response.data
}

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`)
  return response.data
}

export const batchUpdateUserStatus = async (ids: string[], status: string) => {
  const response = await api.post('/users/batch-status', { ids, status })
  return response.data
}

export const getUserStats = async () => {
  const response = await api.get('/users/stats')
  return response.data
}

// ========== 订单管理 ==========

export const getOrders = async (params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  startDate?: string
  endDate?: string
}) => {
  const response = await api.get('/orders', { params })
  return response.data
}

export const getOrder = async (id: string) => {
  const response = await api.get(`/orders/${id}`)
  return response.data
}

export const createOrder = async (orderData: any) => {
  const response = await api.post('/orders', orderData)
  return response.data
}

export const updateOrder = async (id: string, orderData: any) => {
  const response = await api.put(`/orders/${id}`, orderData)
  return response.data
}

export const updateOrderStatus = async (id: string, status: string) => {
  const response = await api.patch(`/orders/${id}/status`, { status })
  return response.data
}

export const deleteOrder = async (id: string) => {
  const response = await api.delete(`/orders/${id}`)
  return response.data
}

export const getOrderStats = async (params?: {
  startDate?: string
  endDate?: string
}) => {
  const response = await api.get('/orders/stats', { params })
  return response.data
}

export const getTodayOrderStats = async () => {
  const response = await api.get('/orders/today-stats')
  return response.data
}

// ========== 统计数据 ==========

export const getDashboardStats = async () => {
  const response = await api.get('/stats/dashboard')
  return response.data
}

export const getRevenueTrend = async (days: number = 7) => {
  const response = await api.get('/stats/revenue', { params: { days } })
  return response.data
}

export const getUserGrowthTrend = async (days: number = 7) => {
  const response = await api.get('/stats/user-growth', { params: { days } })
  return response.data
}

export const getFortuneTypeDistribution = async () => {
  const response = await api.get('/stats/distribution')
  return response.data
}

// ========== 审计日志 ==========

export const getAuditLogs = async (params?: {
  page?: number
  pageSize?: number
  userId?: string
  action?: string
  resource?: string
  status?: string
  startDate?: string
  endDate?: string
}) => {
  const response = await api.get('/audit', { params })
  return response.data
}

export const addAuditLog = async (logData: {
  action: string
  resource: string
  details: string
  status: 'success' | 'failed'
}) => {
  const response = await api.post('/audit', logData)
  return response.data
}

export const cleanAuditLogs = async (keepCount?: number) => {
  const response = await api.post('/audit/clean', { keepCount })
  return response.data
}

export default api
