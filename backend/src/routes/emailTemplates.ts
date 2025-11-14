/**
 * 邮件模板路由
 */

import { Router } from 'express'
import {
  getEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  previewEmailTemplate,
} from '../controllers/emailTemplateController'
import { authenticate } from '../middleware/auth'

const router = Router()

// 所有路由都需要管理员权限
router.use(authenticate)

/**
 * GET /api/manage/email-templates
 * 获取所有邮件模板
 * 查询参数: template_type, enabled
 */
router.get('/', getEmailTemplates)

/**
 * GET /api/manage/email-templates/:key
 * 获取单个邮件模板
 */
router.get('/:key', getEmailTemplate)

/**
 * POST /api/manage/email-templates
 * 创建邮件模板
 */
router.post('/', createEmailTemplate)

/**
 * PUT /api/manage/email-templates/:key
 * 更新邮件模板
 */
router.put('/:key', updateEmailTemplate)

/**
 * DELETE /api/manage/email-templates/:key
 * 删除邮件模板（系统模板不能删除）
 */
router.delete('/:key', deleteEmailTemplate)

/**
 * POST /api/manage/email-templates/preview
 * 预览邮件模板
 */
router.post('/preview', previewEmailTemplate)

export default router
