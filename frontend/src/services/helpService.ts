/**
 * 帮助中心服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface HelpCategory {
  id: number
  name: string
  description: string
  icon?: string
  article_count: number
}

export interface HelpArticle {
  id: number
  category_id?: number
  title: string
  content?: string
  summary?: string
  tags?: string[]
  view_count: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface FAQ {
  id: number
  category_id?: number
  question: string
  answer: string
  tags?: string[]
  view_count: number
  created_at: string
  updated_at: string
}

export interface SearchResult {
  id: number
  text: string
  description: string
  type: 'article' | 'faq'
  view_count: number
}

// 获取帮助分类列表
export const getCategories = () => {
  return api.get<ApiResponse<HelpCategory[]>>('/help/categories')
}

// 获取帮助文章列表
export const getArticles = (params?: {
  categoryId?: number
  keyword?: string
  page?: number
  limit?: number
}) => {
  return api.get<PaginatedResponse<HelpArticle>>('/help/articles', { params })
}

// 获取帮助文章详情
export const getArticleDetail = (id: number) => {
  return api.get<ApiResponse<HelpArticle>>(`/help/articles/${id}`)
}

// 获取FAQ列表
export const getFAQs = (params?: {
  categoryId?: number
  keyword?: string
  page?: number
  limit?: number
}) => {
  return api.get<PaginatedResponse<FAQ>>('/help/faqs', { params })
}

// 获取FAQ详情
export const getFAQDetail = (id: number) => {
  return api.get<ApiResponse<FAQ>>(`/help/faqs/${id}`)
}

// 搜索帮助内容
export const searchHelp = (keyword: string, limit?: number) => {
  return api.get<ApiResponse<SearchResult[]>>('/help/search', {
    params: { q: keyword, limit }
  })
}
