/**
 * 邮件模板服务
 */

import { query } from '../config/database'
import Mailgun from 'mailgun.js'
import FormData from 'form-data'

/**
 * 获取所有模板（分页）
 */
export const getAllTemplates = async (
  page: number = 1,
  limit: number = 20,
  category?: string,
  search?: string
) => {
  const offset = (page - 1) * limit
  let whereConditions: string[] = []
  let params: any[] = []
  let paramIndex = 1

  if (category) {
    whereConditions.push(`category = $${paramIndex}`)
    params.push(category)
    paramIndex++
  }

  if (search) {
    whereConditions.push(`(name ILIKE $${paramIndex} OR template_key ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
    params.push(`%${search}%`)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  const result = await query(
    `SELECT id, template_key, name, category, subject, description, variables,
            enabled, is_system, created_at, updated_at, last_sent_at, sent_count
     FROM email_templates
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  )

  const countResult = await query(
    `SELECT COUNT(*) FROM email_templates ${whereClause}`,
    params
  )

  return {
    templates: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
  }
}

/**
 * 根据模板key获取模板
 */
export const getTemplateByKey = async (templateKey: string) => {
  const result = await query(
    `SELECT * FROM email_templates WHERE template_key = $1`,
    [templateKey]
  )

  if (result.rows.length === 0) {
    throw new Error('模板不存在')
  }

  return result.rows[0]
}

/**
 * 根据ID获取模板
 */
export const getTemplateById = async (id: number) => {
  const result = await query(
    `SELECT * FROM email_templates WHERE id = $1`,
    [id]
  )

  if (result.rows.length === 0) {
    throw new Error('模板不存在')
  }

  return result.rows[0]
}

/**
 * 创建模板
 */
export const createTemplate = async (
  templateData: {
    template_key: string
    name: string
    category: string
    subject: string
    html_content: string
    text_content?: string
    description?: string
    variables?: string[]
    enabled?: boolean
  },
  createdBy: string
) => {
  const {
    template_key,
    name,
    category,
    subject,
    html_content,
    text_content,
    description,
    variables = [],
    enabled = true,
  } = templateData

  // 检查template_key是否已存在
  const existingTemplate = await query(
    'SELECT id FROM email_templates WHERE template_key = $1',
    [template_key]
  )

  if (existingTemplate.rows.length > 0) {
    throw new Error('模板标识已存在')
  }

  const result = await query(
    `INSERT INTO email_templates
     (template_key, name, category, subject, html_content, text_content, description, variables, enabled, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      template_key,
      name,
      category,
      subject,
      html_content,
      text_content || null,
      description || null,
      JSON.stringify(variables),
      enabled,
      createdBy,
    ]
  )

  return result.rows[0]
}

/**
 * 更新模板
 */
export const updateTemplate = async (id: number, templateData: any) => {
  // 检查模板是否存在
  const template = await getTemplateById(id)

  // 系统模板只能更新部分字段
  if (template.is_system) {
    // 系统模板只能更新enabled状态
    if (templateData.enabled !== undefined) {
      const result = await query(
        `UPDATE email_templates
         SET enabled = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [templateData.enabled, id]
      )
      return result.rows[0]
    } else {
      throw new Error('系统模板只能启用/禁用，不能修改内容')
    }
  }

  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  const allowedFields = [
    'name',
    'subject',
    'html_content',
    'text_content',
    'description',
    'variables',
    'enabled',
  ]

  for (const field of allowedFields) {
    if (templateData[field] !== undefined) {
      fields.push(`${field} = $${paramIndex}`)
      if (field === 'variables') {
        values.push(JSON.stringify(templateData[field]))
      } else {
        values.push(templateData[field])
      }
      paramIndex++
    }
  }

  if (fields.length === 0) {
    throw new Error('没有要更新的字段')
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(id)

  const result = await query(
    `UPDATE email_templates
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )

  return result.rows[0]
}

/**
 * 删除模板
 */
export const deleteTemplate = async (id: number) => {
  const template = await getTemplateById(id)

  if (template.is_system) {
    throw new Error('系统模板不能删除')
  }

  await query('DELETE FROM email_templates WHERE id = $1', [id])

  return { success: true }
}

/**
 * 预览模板（替换变量）
 */
export const previewTemplate = async (
  templateId: number,
  variables: Record<string, any>
) => {
  const template = await getTemplateById(templateId)

  let subject = template.subject
  let html = template.html_content

  // 替换变量
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(regex, String(value))
    html = html.replace(regex, String(value))
  }

  return {
    subject,
    html,
    variables: template.variables,
  }
}

/**
 * 发送测试邮件
 */
export const sendTestTemplateEmail = async (
  templateId: number,
  toEmail: string,
  variables: Record<string, any>
) => {
  const template = await getTemplateById(templateId)

  if (!template.enabled) {
    throw new Error('模板未启用')
  }

  let subject = template.subject
  let html = template.html_content

  // 替换变量
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(regex, String(value))
    html = html.replace(regex, String(value))
  }

  // 获取邮件配置
  const configResult = await query(
    `SELECT config_value FROM system_configs WHERE config_key = 'smtp_settings'`
  )

  if (configResult.rows.length === 0) {
    throw new Error('邮件配置不存在')
  }

  const emailConfig = configResult.rows[0].config_value
  const fromName = emailConfig.from_name || 'LUCK.DAY'
  const fromEmail = emailConfig.from_email || 'noreply@luck.day'

  let result: any

  // 根据配置类型发送邮件
  if (emailConfig.email_type === 'third_party_api' && emailConfig.api_provider === 'mailgun') {
    // 使用 Mailgun API 发送
    const mailgun = new Mailgun(FormData)
    const mg = mailgun.client({
      username: 'api',
      key: emailConfig.mailgun_api_key,
      url: emailConfig.mailgun_region === 'eu'
        ? 'https://api.eu.mailgun.net'
        : 'https://api.mailgun.net'
    })

    const messageData = {
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      html: html,
    }

    const response = await mg.messages.create(emailConfig.mailgun_domain, messageData)
    result = { success: true, messageId: response.id }

  } else if (emailConfig.email_type === 'smtp') {
    // 使用 SMTP 发送
    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp_host,
      port: parseInt(emailConfig.smtp_port),
      secure: emailConfig.smtp_secure === true,
      auth: {
        user: emailConfig.smtp_user,
        pass: emailConfig.smtp_password,
      },
    })

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      html: html,
    }

    const info = await transporter.sendMail(mailOptions)
    result = { success: true, messageId: info.messageId }

  } else {
    throw new Error('不支持的邮件服务类型')
  }

  // 记录发送日志
  await query(
    `INSERT INTO email_logs (template_key, recipient, subject, status, sent_at)
     VALUES ($1, $2, $3, 'sent', CURRENT_TIMESTAMP)`,
    [template.template_key, toEmail, subject]
  )

  return result
}

/**
 * 获取模板分类统计
 */
export const getTemplateStats = async () => {
  const result = await query(`
    SELECT
      category,
      COUNT(*) as count,
      SUM(CASE WHEN enabled THEN 1 ELSE 0 END) as enabled_count,
      SUM(sent_count) as total_sent
    FROM email_templates
    GROUP BY category
    ORDER BY category
  `)

  return result.rows
}

/**
 * 获取邮件发送记录
 */
export const getEmailLogs = async (
  page: number = 1,
  limit: number = 50,
  status?: string,
  templateKey?: string
) => {
  const offset = (page - 1) * limit
  let whereConditions: string[] = []
  let params: any[] = []
  let paramIndex = 1

  if (status) {
    whereConditions.push(`status = $${paramIndex}`)
    params.push(status)
    paramIndex++
  }

  if (templateKey) {
    whereConditions.push(`template_key = $${paramIndex}`)
    params.push(templateKey)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  const result = await query(
    `SELECT * FROM email_logs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  )

  const countResult = await query(
    `SELECT COUNT(*) FROM email_logs ${whereClause}`,
    params
  )

  return {
    logs: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
  }
}

/**
 * 批量发送邮件
 */
export const sendBatchEmails = async (
  templateKey: string,
  recipients: Array<{ email: string; variables: Record<string, any> }>
) => {
  const template = await getTemplateByKey(templateKey)

  if (!template.enabled) {
    throw new Error('模板未启用')
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[],
  }

  // TODO: 这里应该使用队列系统处理批量发送
  // 暂时简化处理
  for (const recipient of recipients) {
    try {
      await sendTestTemplateEmail(template.id, recipient.email, recipient.variables)
      results.success++
    } catch (error: any) {
      results.failed++
      results.errors.push({
        email: recipient.email,
        error: error.message,
      })
    }
  }

  return results
}

/**
 * 发送验证码邮件（便捷函数）
 */
export const sendVerificationCodeEmail = async (
  email: string,
  code: string,
  purpose: string
) => {
  const purposeMap: Record<string, string> = {
    register: '注册账号',
    login: '登录',
    reset_password: '重置密码',
  }

  const purposeText = purposeMap[purpose] || purpose

  // 获取模板
  const template = await getTemplateByKey('user_email_verification')

  if (!template) {
    throw new Error('验证码邮件模板不存在')
  }

  // 发送邮件
  return await sendTestTemplateEmail(
    template.id,
    email,
    {
      purpose: purposeText,
      code: code,
    }
  )
}
