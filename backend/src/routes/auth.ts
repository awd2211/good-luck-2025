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
 * @openapi
 * /api/manage/auth/login:
 *   post:
 *     summary: 管理员登录
 *     description: 管理员使用用户名和密码登录，获取JWT token
 *     tags:
 *       - Admin - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *                 description: 管理员用户名
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *                 description: 管理员密码
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   description: JWT访问令牌，有效期24小时
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       401:
 *         description: 认证失败（用户名或密码错误）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', loginHandler)

/**
 * @openapi
 * /api/manage/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     description: 使用refresh token刷新访问令牌
 *     tags:
 *       - Admin - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 description: 刷新令牌
 *     responses:
 *       200:
 *         description: 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   description: 新的JWT访问令牌
 *       401:
 *         description: 刷新令牌无效或已过期
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', refreshTokenHandler)

/**
 * @openapi
 * /api/manage/auth/me:
 *   get:
 *     summary: 获取当前管理员信息
 *     description: 获取已登录管理员的详细信息
 *     tags:
 *       - Admin - Auth
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       401:
 *         description: 未认证或token无效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authenticate, getCurrentUser)

/**
 * @openapi
 * /api/manage/auth/logout:
 *   post:
 *     summary: 管理员登出
 *     description: 退出登录，清除服务端会话（如果有）
 *     tags:
 *       - Admin - Auth
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 登出成功
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', authenticate, logout)

/**
 * @openapi
 * /api/manage/auth/change-password:
 *   post:
 *     summary: 修改管理员密码
 *     description: 修改当前已登录管理员的密码
 *     tags:
 *       - Admin - Auth
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *                 description: 当前密码
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newPassword123
 *                 description: 新密码（至少6位）
 *     responses:
 *       200:
 *         description: 密码修改成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 密码修改成功
 *       400:
 *         description: 参数错误或旧密码不正确
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/change-password', authenticate, changePasswordHandler)

export default router
