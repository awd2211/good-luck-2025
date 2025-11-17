/**
 * 用户邮箱认证路由
 */
import { Router } from 'express'
import {
  sendVerificationCode,
  registerWithEmail,
  loginWithPassword,
  loginWithCode,
  resetPassword,
} from '../../controllers/user/emailAuthController'

const router = Router()

/**
 * @openapi
 * /api/user/email-auth/send-code:
 *   post:
 *     summary: 发送邮箱验证码
 *     tags:
 *       - User - Email Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - purpose
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *               purpose:
 *                 type: string
 *                 enum: [register, login, reset_password]
 *                 description: 用途
 *     responses:
 *       200:
 *         description: 验证码发送成功
 */
router.post('/send-code', sendVerificationCode)

/**
 * @openapi
 * /api/user/email-auth/register:
 *   post:
 *     summary: 邮箱注册
 *     tags:
 *       - User - Email Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - nickname
 *               - password
 *               - verificationCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               nickname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *               password:
 *                 type: string
 *                 minLength: 6
 *               verificationCode:
 *                 type: string
 *                 description: 6位验证码
 *     responses:
 *       201:
 *         description: 注册成功
 */
router.post('/register', registerWithEmail)

/**
 * @openapi
 * /api/user/email-auth/login:
 *   post:
 *     summary: 邮箱+密码登录
 *     tags:
 *       - User - Email Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 */
router.post('/login', loginWithPassword)

/**
 * @openapi
 * /api/user/email-auth/login-with-code:
 *   post:
 *     summary: 邮箱+验证码登录
 *     tags:
 *       - User - Email Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               verificationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 */
router.post('/login-with-code', loginWithCode)

/**
 * @openapi
 * /api/user/email-auth/reset-password:
 *   post:
 *     summary: 重置密码
 *     tags:
 *       - User - Email Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationCode
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               verificationCode:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: 密码重置成功
 */
router.post('/reset-password', resetPassword)

export default router
