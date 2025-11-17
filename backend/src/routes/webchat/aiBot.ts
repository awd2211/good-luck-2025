/**
 * AI智能客服路由
 */

import express from 'express';
import * as aiBotController from '../../controllers/webchat/aiBotController';

const router = express.Router();

/**
 * @openapi
 * /api/webchat/ai:
 *   post:
 *     summary: AI智能对话
 *     description: 与AI助手进行对话，获取智能回复
 *     tags:
 *       - WebChat - AI Bot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - sessionId
 *             properties:
 *               message:
 *                 type: string
 *                 example: 你好,我想咨询一下运势服务
 *                 description: 用户消息内容
 *               sessionId:
 *                 type: string
 *                 example: session-001
 *                 description: 会话ID
 *               context:
 *                 type: object
 *                 description: 上下文信息
 *     responses:
 *       200:
 *         description: AI回复成功
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
 *                     reply:
 *                       type: string
 *                       example: 您好!我可以帮您了解各类运势服务...
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["查看八字精批", "查看生肖运势"]
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/ai', aiBotController.chatWithAI);

export default router;
