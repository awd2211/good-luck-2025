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
 * @route   POST /api/chat/sessions
 * @desc    创建聊天会话
 * @access  Public (可选认证)
 */
router.post('/sessions', optionalAuth, createChatSession)

/**
 * @route   GET /api/chat/sessions/:sessionKey
 * @desc    获取会话详情
 * @access  Public
 */
router.get('/sessions/:sessionKey', getChatSession)

/**
 * @route   GET /api/chat/messages/:sessionId
 * @desc    获取会话消息列表
 * @access  Public
 */
router.get('/messages/:sessionId', getChatMessages)

/**
 * @route   POST /api/chat/messages
 * @desc    发送消息 (通过Socket.IO发送，此API仅备用)
 * @access  Public
 */
router.post('/messages', sendChatMessage)

/**
 * @route   POST /api/chat/sessions/:sessionId/close
 * @desc    关闭会话
 * @access  Public
 */
router.post('/sessions/:sessionId/close', closeChatSession)

export default router
