/**
 * 用户端聊天 API 路由
 * 用户端使用,需要用户认证
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as chatSessionService from '../../services/webchat/chatSessionService';
import * as chatMessageService from '../../services/webchat/chatMessageService';
import * as quickReplyService from '../../services/webchat/quickReplyService';

const router = Router();

/**
 * 发起咨询(创建会话)
 * POST /api/chat/sessions
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
 * 根据session_key获取会话信息
 * GET /api/chat/sessions/:key
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
 * 获取用户的历史会话
 * GET /api/chat/history
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
 * 获取会话消息历史
 * GET /api/chat/messages/:sessionId
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
 * 发送消息
 * POST /api/chat/messages
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
 * 标记消息为已读
 * POST /api/chat/messages/:id/read
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
 * 标记会话所有消息为已读
 * POST /api/chat/sessions/:sessionId/read
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
 * 获取未读消息数量
 * GET /api/chat/sessions/:sessionId/unread
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
 * 获取用户的总未读消息数
 * GET /api/chat/unread/total
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
 * 关闭会话
 * POST /api/chat/sessions/:sessionId/close
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
 * 评价客服
 * POST /api/chat/rating
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
 * 获取快捷回复模板列表(全局+个人)
 * GET /api/chat/quick-replies
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
 * 根据快捷键获取模板
 * GET /api/chat/quick-replies/shortcut/:key
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
 * 获取会话统计信息
 * GET /api/chat/sessions/:sessionId/stats
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
