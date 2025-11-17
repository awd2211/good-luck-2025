/**
 * 用户端聊天 API 路由
 * 用户端使用,需要用户认证
 *
 * 标签: User - Chat
 * 前缀: /api/chat
 *
 * 已完成的路由 (14个端点):
 *   - POST /sessions - 发起咨询会话
 *   - GET /sessions/:key - 获取会话信息
 *   - GET /history - 获取历史会话
 *   - GET /messages/:sessionId - 获取会话消息
 *   - POST /messages - 发送消息
 *   - POST /messages/:id/read - 标记消息已读
 *   - POST /sessions/:sessionId/read - 标记会话全部已读
 *   - GET /sessions/:sessionId/unread - 获取未读数量
 *   - GET /unread/total - 获取总未读数
 *   - POST /sessions/:sessionId/close - 关闭会话
 *   - POST /rating - 评价客服
 *   - GET /quick-replies - 获取快捷回复
 *   - GET /quick-replies/shortcut/:key - 通过快捷键获取模板
 *   - GET /sessions/:sessionId/stats - 获取会话统计
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as chatSessionService from '../../services/webchat/chatSessionService';
import * as chatMessageService from '../../services/webchat/chatMessageService';
import * as quickReplyService from '../../services/webchat/quickReplyService';

const router = Router();

/**
 * @openapi
 * /api/chat/sessions:
 *   post:
 *     summary: 发起咨询会话
 *     description: 用户发起客服咨询,创建新的聊天会话并自动分配客服
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *                 example: "user123"
 *               channel:
 *                 type: string
 *                 description: 咨询渠道
 *                 enum: [web, mobile, app]
 *                 default: web
 *               priority:
 *                 type: integer
 *                 description: 优先级(0-10)
 *                 default: 0
 *               metadata:
 *                 type: object
 *                 description: 附加元数据
 *     responses:
 *       200:
 *         description: 会话创建成功
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
 *                   example: "客服分配成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     session_key:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     agent_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, channel = 'web', priority = 0, metadata = {} } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少 userId 参数'
      });
    }

    // 创建会话
    const session = await chatSessionService.createSession({
      userId,
      channel,
      priority,
      metadata
    });

    // 尝试自动分配客服
    const assignedSession = await chatSessionService.autoAssignAgent(session.id);

    res.json({
      success: true,
      message: assignedSession?.agent_id ? '客服分配成功' : '您的咨询已进入队列,请稍候',
      data: assignedSession || session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/sessions/{key}:
 *   get:
 *     summary: 获取会话信息
 *     description: 根据会话密钥获取会话详细信息
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 会话密钥
 *     responses:
 *       200:
 *         description: 成功获取会话信息
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
 *                     id:
 *                       type: integer
 *                     session_key:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     agent_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/sessions/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;

    const session = await chatSessionService.getSessionByKey(key);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/history:
 *   get:
 *     summary: 获取历史会话
 *     description: 获取用户的历史咨询会话列表
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 成功获取历史会话
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, limit = '10' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少 userId 参数'
      });
    }

    const sessions = await chatSessionService.getUserSessions(
      userId as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/messages/{sessionId}:
 *   get:
 *     summary: 获取会话消息
 *     description: 获取指定会话的消息历史记录
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 会话ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 返回消息数量
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
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       session_id:
 *                         type: integer
 *                       sender_type:
 *                         type: string
 *                       content:
 *                         type: string
 *                       message_type:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/messages/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { limit = '50' } = req.query;

    const messages = await chatMessageService.getRecentMessages(
      parseInt(sessionId),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/messages:
 *   post:
 *     summary: 发送消息
 *     description: 在会话中发送新消息
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - senderType
 *               - senderId
 *               - content
 *             properties:
 *               sessionId:
 *                 type: integer
 *                 description: 会话ID
 *               senderType:
 *                 type: string
 *                 enum: [user, agent]
 *                 description: 发送者类型
 *               senderId:
 *                 type: string
 *                 description: 发送者ID
 *               content:
 *                 type: string
 *                 description: 消息内容
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: 消息发送成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      sessionId,
      senderType,
      senderId,
      content,
      messageType = 'text',
      attachments = []
    } = req.body;

    if (!sessionId || !senderType || !senderId || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: sessionId, senderType, senderId, content'
      });
    }

    const message = await chatMessageService.createMessage({
      sessionId: parseInt(sessionId),
      senderType,
      senderId,
      content,
      messageType,
      attachments
    });

    res.json({
      success: true,
      message: '消息发送成功',
      data: message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/messages/{id}/read:
 *   post:
 *     summary: 标记消息已读
 *     description: 将指定消息标记为已读状态
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 消息ID
 *     responses:
 *       200:
 *         description: 标记成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/messages/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const message = await chatMessageService.markAsRead(parseInt(id));

    res.json({
      success: true,
      message: message ? '消息已标记为已读' : '消息已是已读状态',
      data: message
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/sessions/{sessionId}/read:
 *   post:
 *     summary: 标记会话全部已读
 *     description: 将会话中所有消息标记为已读
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 会话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - readerType
 *             properties:
 *               readerType:
 *                 type: string
 *                 enum: [user, agent]
 *                 description: 读者类型
 *     responses:
 *       200:
 *         description: 标记成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/sessions/:sessionId/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { readerType } = req.body;

    if (!readerType || !['user', 'agent'].includes(readerType)) {
      return res.status(400).json({
        success: false,
        message: 'readerType 必须是 user 或 agent'
      });
    }

    const count = await chatMessageService.markSessionAsRead(
      parseInt(sessionId),
      readerType
    );

    res.json({
      success: true,
      message: `已标记 ${count} 条消息为已读`,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/sessions/{sessionId}/unread:
 *   get:
 *     summary: 获取未读数量
 *     description: 获取会话中的未读消息数量
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 会话ID
 *       - in: query
 *         name: readerType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, agent]
 *         description: 读者类型
 *     responses:
 *       200:
 *         description: 成功获取未读数量
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
 *                     unreadCount:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/sessions/:sessionId/unread', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { readerType } = req.query;

    if (!readerType || !['user', 'agent'].includes(readerType as string)) {
      return res.status(400).json({
        success: false,
        message: 'readerType 必须是 user 或 agent'
      });
    }

    const count = await chatMessageService.getUnreadCount(
      parseInt(sessionId),
      readerType as 'user' | 'agent'
    );

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/unread/total:
 *   get:
 *     summary: 获取总未读数
 *     description: 获取用户所有会话的未读消息总数
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取总未读数
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
 *                     totalUnread:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/unread/total', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少 userId 参数'
      });
    }

    const count = await chatMessageService.getUserUnreadCount(userId as string);

    res.json({
      success: true,
      data: { totalUnread: count }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/sessions/{sessionId}/close:
 *   post:
 *     summary: 关闭会话
 *     description: 关闭指定的咨询会话
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 会话ID
 *     responses:
 *       200:
 *         description: 会话关闭成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/sessions/:sessionId/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const session = await chatSessionService.closeSession(
      parseInt(sessionId),
      'user_left'
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    res.json({
      success: true,
      message: '会话已关闭',
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/rating:
 *   post:
 *     summary: 评价客服
 *     description: 对客服服务进行评分和反馈
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - rating
 *             properties:
 *               sessionId:
 *                 type: integer
 *                 description: 会话ID
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: 评分(1-5星)
 *               feedback:
 *                 type: string
 *                 description: 文字反馈
 *     responses:
 *       200:
 *         description: 评价提交成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/rating', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, rating, feedback } = req.body;

    if (!sessionId || !rating) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: sessionId, rating'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间'
      });
    }

    const session = await chatSessionService.rateSession(
      parseInt(sessionId),
      rating,
      feedback
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    res.json({
      success: true,
      message: '感谢您的评价!',
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/quick-replies:
 *   get:
 *     summary: 获取快捷回复
 *     description: 获取快捷回复模板列表(包含全局和个人模板)
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: integer
 *         description: 客服ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 分类
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
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
 *         description: 成功获取快捷回复列表
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
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/quick-replies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, category, keyword, page = '1', limit = '50' } = req.query;

    const filters: any = {
      isActive: true,
      includeGlobal: true,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (agentId) filters.agentId = parseInt(agentId as string);
    if (category) filters.category = category as string;
    if (keyword) filters.keyword = keyword as string;

    const result = await quickReplyService.getTemplates(filters);

    res.json({
      success: true,
      data: result.templates,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/quick-replies/shortcut/{key}:
 *   get:
 *     summary: 通过快捷键获取模板
 *     description: 根据快捷键代码获取对应的快捷回复模板
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 快捷键代码
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: integer
 *         description: 客服ID
 *     responses:
 *       200:
 *         description: 成功获取模板
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/quick-replies/shortcut/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { agentId } = req.query;

    const template = await quickReplyService.getTemplateByShortcut(
      key,
      agentId ? parseInt(agentId as string) : undefined
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '未找到对应的快捷回复'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/chat/sessions/{sessionId}/stats:
 *   get:
 *     summary: 获取会话统计
 *     description: 获取指定会话的统计信息(消息数、响应时间等)
 *     tags:
 *       - User - Chat
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 会话ID
 *     responses:
 *       200:
 *         description: 成功获取统计信息
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
 *                     totalMessages:
 *                       type: integer
 *                     avgResponseTime:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/sessions/:sessionId/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const stats = await chatMessageService.getMessageStatistics({
      sessionId: parseInt(sessionId)
    });

    const responseTime = await chatMessageService.calculateResponseTime(
      parseInt(sessionId)
    );

    res.json({
      success: true,
      data: {
        ...stats,
        avgResponseTime: responseTime
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
