/**
 * 邮件测试路由
 */

import { Router } from 'express'
import { testEmail } from '../controllers/emailTestController'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * POST /api/manage/email/test
 * 发送测试邮件
 * 需要管理员权限
 */
router.post('/test', authenticate, testEmail)

export default router
