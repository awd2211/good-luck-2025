import { Router } from 'express'
import {
  loginHandler,
  refreshTokenHandler,
  getCurrentUser,
  logout,
  changePasswordHandler,
} from '../controllers/authController'
import { authenticate } from '../middleware/auth'

const router = Router()

/**
 * @route   POST /api/auth/login
 * @desc    管理员登录
 * @access  Public
 */
router.post('/login', loginHandler)

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新 token
 * @access  Public
 */
router.post('/refresh', refreshTokenHandler)

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser)

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authenticate, logout)

/**
 * @route   POST /api/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.post('/change-password', authenticate, changePasswordHandler)

export default router
