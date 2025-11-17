/**
 * TODO: 为此文件添加完整的 @openapi 注解
 * 
 * 文件: emailTest.ts
 * 标签: Admin - Email Test
 * 前缀: /api/manage/email-test
 * 
 * 找到的路由:
 *   - POST /test
 *
 * 请参考已完成的文件(如 routes/auth.ts)添加完整文档
 */

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
