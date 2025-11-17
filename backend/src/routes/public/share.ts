/**
 * 公开分享追踪路由（无需认证）
 */

import { Router } from 'express';
import {
  trackShareClick,
  getShareInfo
} from '../../controllers/shareTrackingController';

const router = Router();

/**
 * @openapi
 * /api/public/share/{shareCode}:
 *   get:
 *     summary: 追踪分享点击
 *     description: 公开接口,追踪分享链接的点击并重定向到目标页面
 *     tags:
 *       - Public - Share
 *     parameters:
 *       - in: path
 *         name: shareCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 分享码
 *         example: "abc123xyz"
 *     responses:
 *       302:
 *         description: 重定向到目标页面
 *       404:
 *         description: 分享码不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:shareCode', trackShareClick);

/**
 * @openapi
 * /api/public/share/{shareCode}/info:
 *   get:
 *     summary: 获取分享信息
 *     description: 公开接口,获取分享链接的详细信息(不追踪点击)
 *     tags:
 *       - Public - Share
 *     parameters:
 *       - in: path
 *         name: shareCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 分享码
 *         example: "abc123xyz"
 *     responses:
 *       200:
 *         description: 成功返回分享信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     shareCode:
 *                       type: string
 *                       example: "abc123xyz"
 *                     targetUrl:
 *                       type: string
 *                       example: "/fortunes/fortune-001"
 *                     clicks:
 *                       type: integer
 *                       example: 100
 *       404:
 *         description: 分享码不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:shareCode/info', getShareInfo);

export default router;
