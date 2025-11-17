/**
 * 客服管理 API 路由
 * 管理端使用,需要管理员认证
 *
 * 标签: Admin - Customer Service
 * 前缀: /api/manage/customer-service
 *
 * 已完成的路由 (14个端点):
 *   - POST /agents - 创建客服
 *   - GET /agents - 获取客服列表
 *   - GET /agents/:id - 获取客服详情
 *   - PUT /agents/:id - 更新客服信息
 *   - DELETE /agents/:id - 删除客服
 *   - PUT /agents/:id/status - 更新客服状态
 *   - GET /team/:managerId - 获取团队成员
 *   - GET /agents/available/list - 获取可用客服列表
 *   - GET /stats/online - 获取在线客服统计
 *   - GET /agents/:id/sessions - 获取客服活跃会话
 *   - GET /agents/:id/statistics - 获取客服统计数据
 *   - GET /agents/:id/summary - 获取客服统计汇总
 *   - GET /team/:managerId/leaderboard - 获取团队排行榜
 *   - GET /workload - 获取工作负载对比
 *   - POST /stats/generate - 生成每日统计
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as csAgentService from '../../services/webchat/csAgentService';
import * as chatSessionService from '../../services/webchat/chatSessionService';
import * as statisticsService from '../../services/webchat/statisticsService';

const router = Router();

/**
 * @openapi
 * /api/manage/customer-service/agents:
 *   post:
 *     summary: 创建客服
 *     description: 创建新的客服账号,可以是客服经理或普通客服
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - displayName
 *               - role
 *             properties:
 *               adminId:
 *                 type: integer
 *                 description: 管理员ID
 *               displayName:
 *                 type: string
 *                 description: 客服显示名称
 *               avatarUrl:
 *                 type: string
 *                 description: 客服头像URL
 *               role:
 *                 type: string
 *                 enum: [manager, agent]
 *                 description: 客服角色
 *               managerId:
 *                 type: integer
 *                 description: 所属客服经理ID
 *               maxConcurrentChats:
 *                 type: integer
 *                 description: 最大并发会话数
 *                 default: 5
 *               specialtyTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 专长标签
 *     responses:
 *       200:
 *         description: 客服创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/agents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      adminId,
      displayName,
      avatarUrl,
      role,
      managerId,
      maxConcurrentChats,
      specialtyTags
    } = req.body;

    // 验证必填字段
    if (!adminId || !displayName || !role) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: adminId, displayName, role'
      });
    }

    // 验证角色
    if (role !== 'manager' && role !== 'agent') {
      return res.status(400).json({
        success: false,
        message: '角色必须是 manager 或 agent'
      });
    }

    // 创建客服
    const agent = await csAgentService.createAgent({
      adminId,
      displayName,
      avatarUrl,
      role,
      managerId,
      maxConcurrentChats,
      specialtyTags
    });

    res.json({
      success: true,
      message: '客服创建成功',
      data: agent
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/agents:
 *   get:
 *     summary: 获取客服列表
 *     description: 获取客服列表,支持多条件筛选和分页
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [manager, agent]
 *         description: 角色筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [online, busy, offline]
 *         description: 状态筛选
 *       - in: query
 *         name: managerId
 *         schema:
 *           type: integer
 *         description: 客服经理ID筛选
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 是否激活筛选
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
 *         description: 成功获取客服列表
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
router.get('/agents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      role,
      status,
      managerId,
      isActive,
      page = '1',
      limit = '20'
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (role) filters.role = role;
    if (status) filters.status = status;
    if (managerId) filters.managerId = parseInt(managerId as string);
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const result = await csAgentService.getAgents(filters);

    res.json({
      success: true,
      data: result.agents,
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
 * /api/manage/customer-service/agents/{id}:
 *   get:
 *     summary: 获取客服详情
 *     description: 根据ID获取客服的详细信息
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客服ID
 *     responses:
 *       200:
 *         description: 成功获取客服详情
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
router.get('/agents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const agent = await csAgentService.getAgentById(parseInt(id));

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: '客服不存在'
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/agents/{id}:
 *   put:
 *     summary: 更新客服信息
 *     description: 更新客服的基本信息和配置
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客服ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: 客服显示名称
 *               avatarUrl:
 *                 type: string
 *                 description: 客服头像URL
 *               role:
 *                 type: string
 *                 enum: [manager, agent]
 *                 description: 客服角色
 *               managerId:
 *                 type: integer
 *                 description: 所属客服经理ID
 *               maxConcurrentChats:
 *                 type: integer
 *                 description: 最大并发会话数
 *               specialtyTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 专长标签
 *               isActive:
 *                 type: boolean
 *                 description: 是否激活
 *     responses:
 *       200:
 *         description: 客服信息更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/agents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 不允许更新的字段
    delete updateData.id;
    delete updateData.admin_id;
    delete updateData.created_at;
    delete updateData.updated_at;

    const agent = await csAgentService.updateAgent(parseInt(id), updateData);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: '客服不存在'
      });
    }

    res.json({
      success: true,
      message: '客服信息更新成功',
      data: agent
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/agents/{id}:
 *   delete:
 *     summary: 删除客服
 *     description: 删除指定的客服账号
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客服ID
 *     responses:
 *       200:
 *         description: 客服删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/agents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const deleted = await csAgentService.deleteAgent(parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '客服不存在'
      });
    }

    res.json({
      success: true,
      message: '客服删除成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/agents/{id}/status:
 *   put:
 *     summary: 更新客服状态
 *     description: 更新客服的在线状态(在线/忙碌/离线)
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客服ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [online, busy, offline]
 *                 description: 客服状态
 *     responses:
 *       200:
 *         description: 状态更新成功
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
router.put('/agents/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['online', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态必须是 online, busy 或 offline'
      });
    }

    const agent = await csAgentService.updateAgentStatus(parseInt(id), status);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: '客服不存在'
      });
    }

    res.json({
      success: true,
      message: '状态更新成功',
      data: agent
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/team/{managerId}:
 *   get:
 *     summary: 获取团队成员
 *     description: 获取指定客服经理的团队成员列表
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客服经理ID
 *     responses:
 *       200:
 *         description: 成功获取团队成员
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/team/:managerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { managerId } = req.params;

    const members = await csAgentService.getTeamMembers(parseInt(managerId));

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/agents/available/list:
 *   get:
 *     summary: 获取可用客服列表
 *     description: 获取当前可接待用户的客服列表,可按专长标签筛选
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialtyTag
 *         schema:
 *           type: string
 *         description: 专长标签筛选
 *     responses:
 *       200:
 *         description: 成功获取可用客服列表
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/agents/available/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { specialtyTag } = req.query;

    const agents = await csAgentService.getAvailableAgents(specialtyTag as string);

    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/stats/online:
 *   get:
 *     summary: 获取在线客服统计
 *     description: 获取当前在线客服的统计数据(在线数、忙碌数、离线数等)
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取在线统计
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
 *                     online:
 *                       type: integer
 *                     busy:
 *                       type: integer
 *                     offline:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats/online', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await csAgentService.getOnlineStatistics();

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
 * /api/manage/customer-service/agents/{id}/sessions:
 *   get:
 *     summary: 获取客服活跃会话
 *     description: 获取指定客服当前的所有活跃会话列表
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客服ID
 *     responses:
 *       200:
 *         description: 成功获取活跃会话
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/agents/:id/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const sessions = await chatSessionService.getActiveSessionsByAgent(parseInt(id));

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
 * /api/manage/customer-service/agents/{id}/statistics:
 *   get:
 *     summary: 获取客服统计数据
 *     description: 获取客服在指定时间段内的详细统计数据
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客服ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取统计数据
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
 */
router.get('/agents/:id/statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const statistics = await statisticsService.getAgentStatistics(
      parseInt(id),
      filters.startDate,
      filters.endDate
    );

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/agents/{id}/summary:
 *   get:
 *     summary: 获取客服统计汇总
 *     description: 获取客服在指定时间段内的统计汇总信息
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客服ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取统计汇总
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
 */
router.get('/agents/:id/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const summary = await statisticsService.getAgentSummary(
      parseInt(id),
      filters.startDate,
      filters.endDate
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/team/{managerId}/leaderboard:
 *   get:
 *     summary: 获取团队排行榜
 *     description: 获取客服团队的业绩排行榜,可按不同指标排序
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客服经理ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [sessions, messages, rating]
 *           default: sessions
 *         description: 排序依据
 *     responses:
 *       200:
 *         description: 成功获取团队排行榜
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/team/:managerId/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { managerId } = req.params;
    const { startDate, endDate, orderBy = 'sessions' } = req.query;

    const leaderboard = await statisticsService.getTeamLeaderboard(
      parseInt(managerId),
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      orderBy as any
    );

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/workload:
 *   get:
 *     summary: 获取工作负载对比
 *     description: 获取所有客服或指定团队的当前工作负载对比数据
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: managerId
 *         schema:
 *           type: integer
 *         description: 客服经理ID(可选,用于筛选特定团队)
 *     responses:
 *       200:
 *         description: 成功获取工作负载数据
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
 *                       agentId:
 *                         type: integer
 *                       displayName:
 *                         type: string
 *                       activeSessions:
 *                         type: integer
 *                       maxConcurrentChats:
 *                         type: integer
 *                       workloadPercent:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/workload', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { managerId } = req.query;

    const workload = await statisticsService.getWorkloadComparison(
      managerId ? parseInt(managerId as string) : undefined
    );

    res.json({
      success: true,
      data: workload
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/manage/customer-service/stats/generate:
 *   post:
 *     summary: 生成每日统计
 *     description: 手动触发生成指定日期的客服每日统计数据
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: 统计日期(可选,默认为当天)
 *     responses:
 *       200:
 *         description: 统计数据生成成功
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
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/stats/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.body;

    const statDate = date ? new Date(date) : new Date();

    const statistics = await statisticsService.generateAllDailyStatistics(statDate);

    res.json({
      success: true,
      message: `成功生成 ${statistics.length} 个客服的统计数据`,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

export default router;
