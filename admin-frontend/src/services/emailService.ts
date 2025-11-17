/**
 * 邮件服务
 */

import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface EmailTemplate {
  id: number
  name: string
  subject: string
  content: string
  variables?: string[]
  type: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailTest {
  to: string
  subject: string
  content: string
  template_id?: number
}

/**
 * 发送测试邮件
 */
export const sendTestEmail = (emailData: EmailTest) => {
  return api.post<ApiResponse>('/email/test', emailData)
}

// ========== 邮件模板管理 ==========

/**
 * 获取邮件模板列表
 */
export const getEmailTemplates = (params?: {
  page?: number
  limit?: number
  type?: string
}) => {
  return api.get<PaginatedResponse<EmailTemplate>>('/email-templates', { params })
}

/**
 * 获取单个邮件模板
 */
export const getEmailTemplate = (id: number) => {
  return api.get<ApiResponse<EmailTemplate>>(`/email-templates/${id}`)
}

/**
 * 创建邮件模板
 */
export const createEmailTemplate = (templateData: Partial<EmailTemplate>) => {
  return api.post<ApiResponse<EmailTemplate>>('/email-templates', templateData)
}

/**
 * 更新邮件模板
 */
export const updateEmailTemplate = (id: number, templateData: Partial<EmailTemplate>) => {
  return api.put<ApiResponse<EmailTemplate>>(`/email-templates/${id}`, templateData)
}

/**
 * 删除邮件模板
 */
export const deleteEmailTemplate = (id: number) => {
  return api.delete<ApiResponse>(`/email-templates/${id}`)
}

/**
 * 预览邮件模板
 */
export const previewEmailTemplate = (id: number, variables?: Record<string, any>) => {
  return api.post<ApiResponse<{ subject: string; content: string }>>(`/email-templates/${id}/preview`, { variables })
}
