import { Router } from 'express'
import * as policyController from '../../controllers/user/policyController'

const router = Router()

/**
 * @openapi
 * /api/policies/user-agreement:
 *   get:
 *     summary: 获取用户协议
 *     description: 获取用户服务协议内容
 *     tags:
 *       - User - Policies
 *     responses:
 *       200:
 *         description: 成功获取用户协议
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "用户服务协议"
 *                     content:
 *                       type: string
 *                     version:
 *                       type: string
 *                     effectiveDate:
 *                       type: string
 *                       format: date
 */
router.get('/user-agreement', policyController.getUserAgreement)

/**
 * @openapi
 * /api/policies/privacy-policy:
 *   get:
 *     summary: 获取隐私政策
 *     description: 获取隐私保护政策内容
 *     tags:
 *       - User - Policies
 *     responses:
 *       200:
 *         description: 成功获取隐私政策
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "隐私保护政策"
 *                     content:
 *                       type: string
 *                     version:
 *                       type: string
 *                     effectiveDate:
 *                       type: string
 *                       format: date
 */
router.get('/privacy-policy', policyController.getPrivacyPolicy)

export default router
