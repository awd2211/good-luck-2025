/**
 * 邮件模板控制器（完整版）
 */

import { Request, Response } from 'express'
import * as emailTemplateService from '../services/emailTemplateService'

/**
 * 获取所有邮件模板（分页）
 * @openapi
 * /api/manage/email-templates:
 *   get:
 *     tags: [Admin - Email Templates]
 *     summary: 获取所有邮件模板（分页）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [admin, user, system, marketing]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const category = req.query.category as string
    const search = req.query.search as string

    const result = await emailTemplateService.getAllTemplates(page, limit, category, search)

    res.json({
      success: true,
      data: result,
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
 * 根据ID获取模板
 */
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '无效的模板ID',
      })
    }

    const template = await emailTemplateService.getTemplateById(id)

    res.json({
      success: true,
      data: template,
    })
  } catch (error: any) {
    console.error('获取邮件模板失败:', error)
    res.status(error.message === '模板不存在' ? 404 : 500).json({
      success: false,
      message: error.message || '获取邮件模板失败',
    })
  }
}

/**
 * 创建邮件模板
 */
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const templateData = req.body
    const createdBy = (req as any).admin?.username || 'unknown'

    // 验证必填字段
    const requiredFields = ['template_key', 'name', 'category', 'subject', 'html_content']
    for (const field of requiredFields) {
      if (!templateData[field]) {
        return res.status(400).json({
          success: false,
          message: `缺少必填字段: ${field}`,
        })
      }
    }

    const template = await emailTemplateService.createTemplate(templateData, createdBy)

    res.json({
      success: true,
      message: '邮件模板创建成功',
      data: template,
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
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const templateData = req.body

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '无效的模板ID',
      })
    }

    const template = await emailTemplateService.updateTemplate(id, templateData)

    res.json({
      success: true,
      message: '邮件模板更新成功',
      data: template,
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
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '无效的模板ID',
      })
    }

    await emailTemplateService.deleteTemplate(id)

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
 * 预览模板
 */
export const previewTemplate = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const { variables } = req.body

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '无效的模板ID',
      })
    }

    if (!variables || typeof variables !== 'object') {
      return res.status(400).json({
        success: false,
        message: '请提供变量数据（JSON对象）',
      })
    }

    const result = await emailTemplateService.previewTemplate(id, variables)

    res.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('预览邮件模板失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '预览邮件模板失败',
    })
  }
}

/**
 * 发送测试邮件
 */
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const { toEmail, variables } = req.body

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '无效的模板ID',
      })
    }

    if (!toEmail) {
      return res.status(400).json({
        success: false,
        message: '请提供收件邮箱',
      })
    }

    if (!variables || typeof variables !== 'object') {
      return res.status(400).json({
        success: false,
        message: '请提供变量数据（JSON对象）',
      })
    }

    const result = await emailTemplateService.sendTestTemplateEmail(id, toEmail, variables)

    res.json({
      success: true,
      message: '测试邮件发送成功',
      data: result,
    })
  } catch (error: any) {
    console.error('发送测试邮件失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '发送测试邮件失败',
    })
  }
}

/**
 * 获取模板统计
 */
export const getTemplateStats = async (req: Request, res: Response) => {
  try {
    const stats = await emailTemplateService.getTemplateStats()

    res.json({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    console.error('获取模板统计失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取模板统计失败',
    })
  }
}

/**
 * 获取邮件发送记录
 */
export const getEmailLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const status = req.query.status as string
    const templateKey = req.query.template_key as string

    const result = await emailTemplateService.getEmailLogs(page, limit, status, templateKey)

    res.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('获取邮件发送记录失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取邮件发送记录失败',
    })
  }
}

/**
 * 批量发送邮件
 */
export const sendBatchEmails = async (req: Request, res: Response) => {
  try {
    const { template_key, recipients } = req.body

    if (!template_key) {
      return res.status(400).json({
        success: false,
        message: '请提供模板标识',
      })
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供收件人列表',
      })
    }

    const result = await emailTemplateService.sendBatchEmails(template_key, recipients)

    res.json({
      success: true,
      message: `批量发送完成：成功 ${result.success} 条，失败 ${result.failed} 条`,
      data: result,
    })
  } catch (error: any) {
    console.error('批量发送邮件失败:', error)
    res.status(500).json({
      success: false,
      message: error.message || '批量发送邮件失败',
    })
  }
}
