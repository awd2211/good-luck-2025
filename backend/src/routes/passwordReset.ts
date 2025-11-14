/**
 * 密码重置路由（公开）
 */

import { Router } from 'express'
import {
  requestReset,
  verifyToken,
  resetPassword,
} from '../controllers/passwordResetController'

const router = Router()

/**
 * @route   POST /api/auth/forgot-password
 * @desc    请求密码重置
 * @access  Public
 */
router.post('/request', requestReset)

/**
 * @route   GET /api/auth/reset-password/verify
 * @desc    验证重置令牌
 * @access  Public
 */
router.get('/verify', verifyToken)

/**
 * @route   POST /api/auth/reset-password
 * @desc    重置密码
 * @access  Public
 */
router.post('/reset', resetPassword)

export default router
