/**
 * 聊天会话管理 API 路由
 * 管理端使用,需要管理员认证
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as chatSessionService from '../../services/webchat/chatSessionService';
import * as chatMessageService from '../../services/webchat/chatMessageService';
import { notifyNewSession } from '../../socket/chatServer';

const router = Router();

/**
 * 获取会话列表
 * GET /api/manage/cs/sessions
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId,
      agentId,
      status,
      page = '1',
      limit = '20'
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (userId) filters.userId = userId as string;
    if (agentId) filters.agentId = parseInt(agentId as string);
    if (status) filters.status = status as string;

    const result = await chatSessionService.getSessions(filters);

    res.json({
      success: true,
      data: result.sessions,
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
 * 获取会话详情
 * GET /api/manage/cs/sessions/:id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const session = await chatSessionService.getSessionById(parseInt(id));

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
 * 手动分配客服
 * POST /api/manage/cs/sessions/:id/assign
 */
router.post('/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: '缺少 agentId 参数'
      });
    }

    const session = await chatSessionService.assignAgentToSession(
      parseInt(id),
      parseInt(agentId)
    );

    if (!session) {
      return res.status(400).json({
        success: false,
        message: '分配失败,会话可能不存在或客服无法接待'
      });
    }

    // 通知客服
    await notifyNewSession(parseInt(agentId), parseInt(id));

    res.json({
      success: true,
      message: '客服分配成功',
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 自动分配客服
 * POST /api/manage/cs/sessions/:id/auto-assign
 */
router.post('/:id/auto-assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { specialtyTag } = req.body;

    const session = await chatSessionService.autoAssignAgent(
      parseInt(id),
      specialtyTag
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    if (!session.agent_id) {
      return res.json({
        success: true,
        message: '暂无可用客服,会话保持在队列中',
        data: session
      });
    }

    // 通知客服
    await notifyNewSession(session.agent_id, parseInt(id));

    res.json({
      success: true,
      message: '客服自动分配成功',
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 转接会话
 * POST /api/manage/cs/sessions/:id/transfer
 */
router.post('/:id/transfer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { fromAgentId, toAgentId, reason } = req.body;

    if (!fromAgentId || !toAgentId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: fromAgentId, toAgentId'
      });
    }

    const session = await chatSessionService.transferSession(
      parseInt(id),
      parseInt(fromAgentId),
      parseInt(toAgentId),
      reason
    );

    if (!session) {
      return res.status(400).json({
        success: false,
        message: '转接失败,会话可能不存在或目标客服无法接待'
      });
    }

    res.json({
      success: true,
      message: '会话转接成功',
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 关闭会话
 * POST /api/manage/cs/sessions/:id/close
 */
router.post('/:id/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason = 'agent_closed' } = req.body;

    const validReasons = ['user_left', 'agent_closed', 'timeout', 'resolved', 'transferred'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `关闭原因必须是: ${validReasons.join(', ')}`
      });
    }

    const session = await chatSessionService.closeSession(parseInt(id), reason);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    res.json({
      success: true,
      message: '会话关闭成功',
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取会话消息列表
 * GET /api/manage/cs/sessions/:id/messages
 */
router.get('/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50', beforeMessageId } = req.query;

    const options: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (beforeMessageId) {
      options.beforeMessageId = parseInt(beforeMessageId as string);
    }

    const result = await chatMessageService.getMessagesBySession(
      parseInt(id),
      options
    );

    res.json({
      success: true,
      data: result.messages,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: result.total,
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取队列长度
 * GET /api/manage/cs/queue/length
 */
router.get('/queue/length', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const length = await chatSessionService.getQueueLength();

    res.json({
      success: true,
      data: { queueLength: length }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取会话统计信息
 * GET /api/manage/cs/sessions/stats/overview
 */
router.get('/stats/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, startDate, endDate } = req.query;

    const filters: any = {};
    if (agentId) filters.agentId = parseInt(agentId as string);
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const stats = await chatSessionService.getSessionStatistics(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 用户评价会话
 * POST /api/manage/cs/sessions/:id/rate
 */
router.post('/:id/rate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间'
      });
    }

    const session = await chatSessionService.rateSession(
      parseInt(id),
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
      message: '评价提交成功',
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 搜索消息
 * GET /api/manage/cs/messages/search
 */
router.get('/messages/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      keyword,
      sessionId,
      senderType,
      startDate,
      endDate,
      limit = '100'
    } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '缺少 keyword 参数'
      });
    }

    const filters: any = {
      keyword: keyword as string,
      limit: parseInt(limit as string)
    };

    if (sessionId) filters.sessionId = parseInt(sessionId as string);
    if (senderType) filters.senderType = senderType as any;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const messages = await chatMessageService.searchMessages(filters);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
});

export default router;
