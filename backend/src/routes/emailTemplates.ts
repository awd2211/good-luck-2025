/**
 * 邮件模板路由
 */

import { Router } from 'express'
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  sendTestEmail,
  getTemplateStats,
  getEmailLogs,
  sendBatchEmails,
} from '../controllers/emailTemplateController'
import { authenticate } from '../middleware/auth'

const router = Router()

// 所有路由都需要管理员权限
router.use(authenticate)

// 模板统计
router.get('/stats', getTemplateStats)

// 模板CRUD
router.get('/', getAllTemplates)
router.get('/:id', getTemplateById)
router.post('/', createTemplate)
router.put('/:id', updateTemplate)
router.delete('/:id', deleteTemplate)

// 模板操作
router.post('/:id/preview', previewTemplate)
router.post('/:id/test', sendTestEmail)
router.post('/batch-send', sendBatchEmails)

// 邮件日志
router.get('/logs/list', getEmailLogs)

export default router
