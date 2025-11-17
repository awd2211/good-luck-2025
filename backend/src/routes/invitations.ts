/**
 * 管理员邀请路由
 */

import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  sendInvitation,
  listPendingInvitations,
  listAllInvitations,
  cancelInvitationHandler,
  resendInvitationHandler,
} from '../controllers/invitationController'

const router = Router()

/**
 * POST /api/manage/invitations/send
 * 发送管理员邀请（需要管理员权限）
 */
router.post('/send', authenticate, sendInvitation)

/**
 * GET /api/manage/invitations/pending
 * 获取待处理的邀请列表
 */
router.get('/pending', authenticate, listPendingInvitations)

/**
 * GET /api/manage/invitations
 * 获取所有邀请（分页）
 */
router.get('/', authenticate, listAllInvitations)

/**
 * POST /api/manage/invitations/:id/cancel
 * 取消邀请
 */
router.post('/:id/cancel', authenticate, cancelInvitationHandler)

/**
 * POST /api/manage/invitations/:id/resend
 * 重新发送邀请邮件
 */
router.post('/:id/resend', authenticate, resendInvitationHandler)

export default router
