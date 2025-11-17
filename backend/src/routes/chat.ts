/**
 * 公开聊天API路由 (用户端)
 */
import express from 'express'
import { optionalAuth } from '../middleware/auth'
import {
  createChatSession,
  getChatSession,
  getChatMessages,
  sendChatMessage,
  closeChatSession
} from '../controllers/chatController'

const router = express.Router()

/**
 * @openapi
 * /api/chat/sessions:
 *   post:
 *     summary: 创建聊天会话
 *     description: 创建新的客服聊天会话,可选用户认证
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *       - {}
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *                 description: 用户昵称(未登录用户必填)
 *                 example: "访客123"
 *               initialMessage:
 *                 type: string
 *                 description: 初始消息
 *     responses:
 *       201:
 *         description: 会话创建成功
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
 *                     sessionId:
 *                       type: string
 *                     sessionKey:
 *                       type: string
 *                       description: 会话密钥,用于访问会话
 *                     userId:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       enum: [waiting, active, closed]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/sessions', optionalAuth, createChatSession)

/**
 * @openapi
 * /api/chat/sessions/{sessionKey}:
 *   get:
 *     summary: 获取会话详情
 *     description: 根据会话密钥获取聊天会话的详细信息
 *     tags:
 *       - User - Chat
 *     parameters:
 *       - in: path
 *         name: sessionKey
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话密钥
 *     responses:
 *       200:
 *         description: 成功获取会话详情
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
 *                     id:
 *                       type: string
 *                     sessionKey:
 *                       type: string
 *                     userId:
 *                       type: string
 *                       nullable: true
 *                     agentId:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       enum: [waiting, active, closed]
 *                     startedAt:
 *                       type: string
 *                       format: date-time
 *                     endedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/sessions/:sessionKey', getChatSession)

/**
 * @openapi
 * /api/chat/messages/{sessionId}:
 *   get:
 *     summary: 获取会话消息列表
 *     description: 获取指定聊天会话的所有消息记录
 *     tags:
 *       - User - Chat
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取消息列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       sessionId:
 *                         type: string
 *                       senderId:
 *                         type: string
 *                       senderType:
 *                         type: string
 *                         enum: [user, agent, system]
 *                       content:
 *                         type: string
 *                       messageType:
 *                         type: string
 *                         enum: [text, image, file]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/messages/:sessionId', getChatMessages)

/**
 * @openapi
 * /api/chat/messages:
 *   post:
 *     summary: 发送消息
 *     description: 发送聊天消息(通过Socket.IO发送,此API仅备用)
 *     tags:
 *       - User - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - content
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: 会话ID
 *               content:
 *                 type: string
 *                 description: 消息内容
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *                 description: 消息类型
 *     responses:
 *       201:
 *         description: 消息发送成功
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
 *                     messageId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/messages', sendChatMessage)

/**
 * @openapi
 * /api/chat/sessions/{sessionId}/close:
 *   post:
 *     summary: 关闭会话
 *     description: 关闭指定的聊天会话
 *     tags:
 *       - User - Chat
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 关闭原因
 *     responses:
 *       200:
 *         description: 会话关闭成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/sessions/:sessionId/close', closeChatSession)

export default router
