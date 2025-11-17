/**
 * 公开邀请路由（无需认证）
 * 用于被邀请人验证邀请令牌和接受邀请
 */

import { Router } from 'express'
import {
  validateToken,
  acceptInvitationHandler,
} from '../../controllers/invitationController'

const router = Router()

/**
 * GET /api/public/invitations/validate
 * 验证邀请令牌（无需认证）
 */
router.get('/validate', validateToken)

/**
 * POST /api/public/invitations/accept
 * 接受邀请并设置密码（无需认证）
 */
router.post('/accept', acceptInvitationHandler)

export default router
