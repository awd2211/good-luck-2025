/**
 * 邮件发送历史记录路由
 */

import { Router } from 'express'
import {
  getHistoryList,
  getHistoryById,
  getHistoryStats,
  cleanupOldHistory
} from '../../controllers/manage/emailSendHistoryController'
import { authenticate } from '../../middleware/auth'

const router = Router()

// 应用管理员认证中间件
router.use(authenticate)

// 获取邮件发送历史列表
router.get('/', getHistoryList)

// 获取统计信息
router.get('/stats', getHistoryStats)

// 获取单个历史详情
router.get('/:id', getHistoryById)

// 清理旧历史记录
router.post('/cleanup', cleanupOldHistory)

export default router
