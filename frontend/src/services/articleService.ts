import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Article {
  id: number
  title: string
  summary: string
  content: string
  category: string
  cover_image?: string
  author: string
  view_count: number
  publish_time: string
  status: string
  created_at: string
  updated_at: string
}

// 获取文章列表
export const getArticles = (params?: {
  page?: number
  limit?: number
  category?: string
}) => {
  return api.get<PaginatedResponse<Article>>('/articles', { params })
}

// 获取文章详情
export const getArticleDetail = (articleId: string) => {
  return api.get<ApiResponse<Article>>(`/articles/${articleId}`)
}
