/**
 * 管理端通用类型定义
 */

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
  error?: any
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: Pagination
}

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}
