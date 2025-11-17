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
 * @openapi
 * /api/manage/cs/sessions:
 *   get:
 *     summary: 获取会话列表
 *     description: 获取客服会话列表,支持按用户、客服、状态筛选和分页
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用户ID筛选
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: integer
 *         description: 客服ID筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, active, closed]
 *         description: 会话状态筛选
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
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取会话列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @openapi
 * /api/manage/cs/sessions/{id}:
 *   get:
 *     summary: 获取会话详情
 *     description: 根据会话ID获取客服会话的详细信息
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 会话ID
 *     responses:
 *       200:
 *         description: 成功获取会话详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 * @openapi
 * /api/manage/cs/sessions/{id}/assign:
 *   post:
 *     summary: 手动分配客服
 *     description: 手动将会话分配给指定客服
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - agentId
 *             properties:
 *               agentId:
 *                 type: integer
 *                 description: 客服ID
 *     responses:
 *       200:
 *         description: 客服分配成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @openapi
 * /api/manage/cs/sessions/{id}/auto-assign:
 *   post:
 *     summary: 自动分配客服
 *     description: 根据负载均衡和专长标签自动分配客服
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 会话ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialtyTag:
 *                 type: string
 *                 description: 专长标签(可选)
 *     responses:
 *       200:
 *         description: 客服自动分配成功或无可用客服
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 * @openapi
 * /api/manage/cs/sessions/{id}/transfer:
 *   post:
 *     summary: 转接会话
 *     description: 将会话从一个客服转接到另一个客服
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - fromAgentId
 *               - toAgentId
 *             properties:
 *               fromAgentId:
 *                 type: integer
 *                 description: 原客服ID
 *               toAgentId:
 *                 type: integer
 *                 description: 目标客服ID
 *               reason:
 *                 type: string
 *                 description: 转接原因(可选)
 *     responses:
 *       200:
 *         description: 会话转接成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @openapi
 * /api/manage/cs/sessions/{id}/close:
 *   post:
 *     summary: 关闭会话
 *     description: 关闭客服会话并记录关闭原因
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 会话ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [user_left, agent_closed, timeout, resolved, transferred]
 *                 default: agent_closed
 *                 description: 关闭原因
 *     responses:
 *       200:
 *         description: 会话关闭成功
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
 * @openapi
 * /api/manage/cs/sessions/{id}/messages:
 *   get:
 *     summary: 获取会话消息列表
 *     description: 获取指定会话的所有消息,支持分页和历史消息加载
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: 每页消息数量
 *       - in: query
 *         name: beforeMessageId
 *         schema:
 *           type: integer
 *         description: 加载此消息ID之前的消息(用于历史消息加载)
 *     responses:
 *       200:
 *         description: 成功获取消息列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @openapi
 * /api/manage/cs/sessions/queue/length:
 *   get:
 *     summary: 获取队列长度
 *     description: 获取当前等待分配客服的会话队列长度
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取队列长度
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @openapi
 * /api/manage/cs/sessions/stats/overview:
 *   get:
 *     summary: 获取会话统计信息
 *     description: 获取客服会话的整体统计数据,支持按客服和时间范围筛选
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: integer
 *         description: 客服ID筛选
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取统计信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @openapi
 * /api/manage/cs/sessions/{id}/rate:
 *   post:
 *     summary: 评价会话
 *     description: 用户对客服会话进行满意度评价
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: 评分(1-5星)
 *               feedback:
 *                 type: string
 *                 description: 评价反馈(可选)
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
 * @openapi
 * /api/manage/cs/sessions/messages/search:
 *   get:
 *     summary: 搜索消息
 *     description: 根据关键词搜索客服会话消息,支持多种筛选条件
 *     tags:
 *       - Admin - Chat Sessions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: integer
 *         description: 会话ID筛选
 *       - in: query
 *         name: senderType
 *         schema:
 *           type: string
 *           enum: [user, agent, system]
 *         description: 发送者类型筛选
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束日期
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: 返回结果数量限制
 *     responses:
 *       200:
 *         description: 成功搜索消息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
