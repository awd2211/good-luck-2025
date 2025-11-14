import { Router } from 'express'
import * as authController from '../../controllers/user/authController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

/**
 * @route   POST /api/auth/send-code
 * @desc    发送验证码
 * @access  Public
 */
router.post('/send-code', authController.sendCode)

/**
 * @route   POST /api/auth/login/code
 * @desc    验证码登录
 * @access  Public
 */
router.post('/login/code', authController.loginWithCode)

/**
 * @route   POST /api/auth/login/password
 * @desc    密码登录
 * @access  Public
 */
router.post('/login/password', authController.loginWithPassword)

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', authController.register)

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticateUser, authController.getProfile)

/**
 * @route   PUT /api/auth/profile
 * @desc    更新个人信息
 * @access  Private
 */
router.put('/profile', authenticateUser, authController.updateProfile)

/**
 * @route   POST /api/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.post('/change-password', authenticateUser, authController.changePassword)

/**
 * @route   POST /api/auth/reset-password
 * @desc    重置密码
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword)

export default router
