/**
 * 双因素认证路由
 */

import { Router } from 'express'
import {
  setup2FA,
  enable2FA,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes,
} from '../controllers/twoFactorController'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * @route   GET /api/auth/2fa/status
 * @desc    获取2FA状态
 * @access  Private
 */
router.get('/status', authenticate, get2FAStatus)

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    生成2FA设置（获取二维码）
 * @access  Private
 */
router.post('/setup', authenticate, setup2FA)

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    启用2FA
 * @access  Private
 */
router.post('/enable', authenticate, enable2FA)

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    禁用2FA
 * @access  Private
 */
router.post('/disable', authenticate, disable2FA)

/**
 * @route   POST /api/auth/2fa/regenerate-backup-codes
 * @desc    重新生成备用代码
 * @access  Private
 */
router.post('/regenerate-backup-codes', authenticate, regenerateBackupCodes)

export default router
