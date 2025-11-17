/**
 * 满意度评价路由
 */

import express from 'express';
import * as satisfactionController from '../../controllers/webchat/satisfactionController';

const router = express.Router();

/**
 * @openapi
 * /api/webchat/sessions/{sessionId}/rating:
 *   post:
 *     summary: 提交满意度评价
 *     description: 用户对客服会话进行满意度评价
 *     tags:
 *       - WebChat - Satisfaction
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *                 description: 评分(1-5星)
 *               comment:
 *                 type: string
 *                 example: 客服态度很好,解答及时
 *                 description: 评价内容
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["专业", "耐心", "高效"]
 *                 description: 评价标签
 *     responses:
 *       201:
 *         description: 评价提交成功
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
 *                   example: 感谢您的反馈!
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 会话不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/sessions/:sessionId/rating', satisfactionController.createRating);

export default router;
