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
 * @openapi
 * /api/manage/auth/2fa/status:
 *   get:
 *     summary: 获取双因素认证状态
 *     description: 获取当前管理员的双因素认证启用状态
 *     tags:
 *       - Admin - Two Factor Auth
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
 *                 enabled:
 *                   type: boolean
 *                   example: false
 *                   description: 是否启用双因素认证
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/status', authenticate, get2FAStatus)

/**
 * @openapi
 * /api/manage/auth/2fa/setup:
 *   post:
 *     summary: 生成双因素认证设置
 *     description: 生成二维码和密钥,用于在认证器应用中配置双因素认证
 *     tags:
 *       - Admin - Two Factor Auth
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 生成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 qrCode:
 *                   type: string
 *                   description: 二维码数据URL
 *                   example: data:image/png;base64,iVBORw0KGgoAAAANS...
 *                 secret:
 *                   type: string
 *                   description: 手动输入的密钥
 *                   example: JBSWY3DPEHPK3PXP
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/setup', authenticate, setup2FA)

/**
 * @openapi
 * /api/manage/auth/2fa/enable:
 *   post:
 *     summary: 启用双因素认证
 *     description: 验证认证器生成的代码并启用双因素认证
 *     tags:
 *       - Admin - Two Factor Auth
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *                 description: 认证器应用生成的6位数字代码
 *     responses:
 *       200:
 *         description: 启用成功
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
 *                   example: 双因素认证已启用
 *                 backupCodes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 备用代码,请妥善保存
 *                   example: ["ABC123", "DEF456", "GHI789"]
 *       400:
 *         description: 验证码错误
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
router.post('/enable', authenticate, enable2FA)

/**
 * @openapi
 * /api/manage/auth/2fa/disable:
 *   post:
 *     summary: 禁用双因素认证
 *     description: 验证密码或备用代码后禁用双因素认证
 *     tags:
 *       - Admin - Two Factor Auth
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *                 description: 管理员密码
 *     responses:
 *       200:
 *         description: 禁用成功
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
 *                   example: 双因素认证已禁用
 *       400:
 *         description: 密码错误
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
router.post('/disable', authenticate, disable2FA)

/**
 * @openapi
 * /api/manage/auth/2fa/regenerate-backup-codes:
 *   post:
 *     summary: 重新生成备用代码
 *     description: 重新生成一组新的备用代码,旧代码将失效
 *     tags:
 *       - Admin - Two Factor Auth
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *                 description: 管理员密码
 *     responses:
 *       200:
 *         description: 重新生成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 backupCodes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 新的备用代码
 *                   example: ["NEW123", "NEW456", "NEW789"]
 *       400:
 *         description: 密码错误或双因素认证未启用
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
router.post('/regenerate-backup-codes', authenticate, regenerateBackupCodes)

export default router
