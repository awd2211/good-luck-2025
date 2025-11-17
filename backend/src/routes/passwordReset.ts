/**
 * 密码重置路由(公开)
 */

import { Router } from 'express'
import {
  requestReset,
  verifyToken,
  resetPassword,
} from '../controllers/passwordResetController'

const router = Router()

/**
 * @openapi
 * /api/manage/auth/password-reset/request:
 *   post:
 *     summary: 请求密码重置
 *     description: 发送密码重置邮件到管理员邮箱
 *     tags:
 *       - Admin - Password Reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@fortune.com
 *                 description: 管理员邮箱
 *     responses:
 *       200:
 *         description: 重置邮件已发送
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
 *                   example: 密码重置邮件已发送
 *       404:
 *         description: 邮箱不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/request', requestReset)

/**
 * @openapi
 * /api/manage/auth/password-reset/verify:
 *   get:
 *     summary: 验证重置令牌
 *     description: 验证密码重置令牌是否有效
 *     tags:
 *       - Admin - Password Reset
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: 重置令牌
 *     responses:
 *       200:
 *         description: 令牌有效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 valid:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: 令牌无效或已过期
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/verify', verifyToken)

/**
 * @openapi
 * /api/manage/auth/password-reset/reset:
 *   post:
 *     summary: 重置密码
 *     description: 使用重置令牌设置新密码
 *     tags:
 *       - Admin - Password Reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123...
 *                 description: 重置令牌
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newPassword123
 *                 description: 新密码(至少6位)
 *     responses:
 *       200:
 *         description: 密码重置成功
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
 *                   example: 密码重置成功
 *       400:
 *         description: 令牌无效或密码格式错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reset', resetPassword)

export default router
