/**
 * 邮件模板控制器
 */

import { Request, Response } from 'express'
import { query } from '../config/database'

/**
 * 获取所有邮件模板
 */
export const getEmailTemplates = async (req: Request, res: Response) => {
  try {
    const { template_type, enabled } = req.query

    let sql = 'SELECT * FROM email_templates WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (template_type) {
      sql += ` AND template_type = $${paramIndex++}`
      params.push(template_type)
    }

    if (enabled !== undefined) {
      sql += ` AND enabled = $${paramIndex++}`
      params.push(enabled === 'true')
    }

    sql += ' ORDER BY is_system DESC, created_at DESC'

    const result = await query(sql, params)

    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error: any) {
    console.error('获取邮件模板失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取邮件模板失败',
    })
  }
}

/**
 * 获取单个邮件模板
 */
export const getEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { key } = req.params

    const result = await query(
      'SELECT * FROM email_templates WHERE template_key = $1',
      [key]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '邮件模板不存在',
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error: any) {
    console.error('获取邮件模板失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取邮件模板失败',
    })
  }
}

/**
 * 创建邮件模板
 */
export const createEmailTemplate = async (req: Request, res: Response) => {
  try {
    const {
      template_key,
      template_name,
      template_type,
      subject,
      html_content,
      variables,
      description,
      enabled,
    } = req.body

    const adminId = (req as any).admin?.id || 'unknown'

    // 检查模板键是否已存在
    const existing = await query(
      'SELECT id FROM email_templates WHERE template_key = $1',
      [template_key]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '模板键已存在',
      })
    }

    const result = await query(
      `INSERT INTO email_templates
       (template_key, template_name, template_type, subject, html_content, variables, description, enabled, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        template_key,
        template_name,
        template_type,
        subject,
        html_content,
        variables || [],
        description,
        enabled !== false,
        adminId,
        adminId,
      ]
    )

    res.json({
      success: true,
      message: '邮件模板创建成功',
      data: result.rows[0],
    })
  } catch (error: any) {
    console.error('创建邮件模板失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '创建邮件模板失败',
    })
  }
}

/**
 * 更新邮件模板
 */
export const updateEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const {
      template_name,
      template_type,
      subject,
      html_content,
      variables,
      description,
      enabled,
    } = req.body

    const adminId = (req as any).admin?.id || 'unknown'

    // 检查是否为系统模板
    const existing = await query(
      'SELECT is_system FROM email_templates WHERE template_key = $1',
      [key]
    )

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '邮件模板不存在',
      })
    }

    // 系统模板只能修改内容，不能修改键和类型
    const isSystem = existing.rows[0].is_system

    const result = await query(
      `UPDATE email_templates SET
       template_name = $1,
       ${!isSystem ? 'template_type = $2,' : ''}
       subject = $${isSystem ? '2' : '3'},
       html_content = $${isSystem ? '3' : '4'},
       variables = $${isSystem ? '4' : '5'},
       description = $${isSystem ? '5' : '6'},
       enabled = $${isSystem ? '6' : '7'},
       updated_by = $${isSystem ? '7' : '8'}
       WHERE template_key = $${isSystem ? '8' : '9'}
       RETURNING *`,
      isSystem
        ? [template_name, subject, html_content, variables || [], description, enabled !== false, adminId, key]
        : [template_name, template_type, subject, html_content, variables || [], description, enabled !== false, adminId, key]
    )

    res.json({
      success: true,
      message: '邮件模板更新成功',
      data: result.rows[0],
    })
  } catch (error: any) {
    console.error('更新邮件模板失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '更新邮件模板失败',
    })
  }
}

/**
 * 删除邮件模板
 */
export const deleteEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { key } = req.params

    // 检查是否为系统模板
    const existing = await query(
      'SELECT is_system FROM email_templates WHERE template_key = $1',
      [key]
    )

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '邮件模板不存在',
      })
    }

    if (existing.rows[0].is_system) {
      return res.status(403).json({
        success: false,
        message: '系统模板不能删除',
      })
    }

    await query('DELETE FROM email_templates WHERE template_key = $1', [key])

    res.json({
      success: true,
      message: '邮件模板删除成功',
    })
  } catch (error: any) {
    console.error('删除邮件模板失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '删除邮件模板失败',
    })
  }
}

/**
 * 预览邮件模板
 */
export const previewEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { html_content, variables } = req.body

    if (!html_content) {
      return res.status(400).json({
        success: false,
        message: '请提供html_content',
      })
    }

    // 替换示例变量
    let previewHtml = html_content

    const exampleData: Record<string, string> = {
      username: '张三',
      email: 'user@example.com',
      resetUrl: 'http://localhost:50303/reset-password?token=example_token_12345',
      testTime: new Date().toLocaleString('zh-CN'),
      token: '123456',
    }

    if (variables && Array.isArray(variables)) {
      variables.forEach((varName: string) => {
        const value = exampleData[varName] || `[${varName}]`
        const regex = new RegExp(`{{${varName}}}`, 'g')
        previewHtml = previewHtml.replace(regex, value)
      })
    }

    res.json({
      success: true,
      data: {
        html: previewHtml,
      },
    })
  } catch (error: any) {
    console.error('预览邮件模板失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '预览邮件模板失败',
    })
  }
}
