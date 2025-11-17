/**
 * 文章管理服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Article {
  id: number
  title: string
  summary: string
  content: string
  cover_image: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  author: string
  sort_order: number
  view_count: number
  like_count: number
  seo_title: string
  seo_keywords: string
  seo_description: string
  is_featured: boolean
  is_hot: boolean
  publish_time?: string
  created_at: string
  updated_at: string
}

/**
 * 获取文章列表
 */
export const getArticles = (params?: {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: string
}) => {
  return api.get<PaginatedResponse<Article>>('/articles', { params })
}

/**
 * 获取单个文章
 */
export const getArticle = (id: number) => {
  return api.get<ApiResponse<Article>>(`/articles/${id}`)
}

/**
 * 创建文章
 */
export const createArticle = (articleData: Partial<Article>) => {
  return api.post<ApiResponse<Article>>('/articles', articleData)
}

/**
 * 更新文章
 */
export const updateArticle = (id: number, articleData: Partial<Article>) => {
  return api.put<ApiResponse<Article>>(`/articles/${id}`, articleData)
}

/**
 * 删除文章
 */
export const deleteArticle = (id: number) => {
  return api.delete<ApiResponse>(`/articles/${id}`)
}

/**
 * 发布文章
 */
export const publishArticle = (id: number) => {
  return api.post<ApiResponse>(`/articles/${id}/publish`)
}

/**
 * 归档文章
 */
export const archiveArticle = (id: number) => {
  return api.post<ApiResponse>(`/articles/${id}/archive`)
}

/**
 * 批量删除文章
 */
export const batchDeleteArticles = (ids: number[]) => {
  return api.post<ApiResponse>('/articles/batch-delete', { ids })
}

/**
 * 获取文章分类列表
 */
export const getArticleCategories = () => {
  return api.get<ApiResponse<string[]>>('/articles/categories')
}

/**
 * 获取文章标签列表
 */
export const getArticleTags = () => {
  return api.get<ApiResponse<string[]>>('/articles/tags')
}

/**
 * 批量更新文章状态
 */
export const batchUpdateArticleStatus = (ids: number[], status: string) => {
  return api.patch<ApiResponse>('/articles/batch/status', { ids, status })
}
