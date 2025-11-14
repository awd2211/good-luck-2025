/**
 * 客服管理 API 路由
 * 管理端使用,需要管理员认证
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as csAgentService from '../../services/webchat/csAgentService';
import * as chatSessionService from '../../services/webchat/chatSessionService';
import * as statisticsService from '../../services/webchat/statisticsService';

const router = Router();

/**
 * 创建客服
 * POST /api/manage/cs/agents
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
 * 获取客服列表
 * GET /api/manage/cs/agents
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
 * 获取客服详情
 * GET /api/manage/cs/agents/:id
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
 * 更新客服信息
 * PUT /api/manage/cs/agents/:id
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
 * 删除客服
 * DELETE /api/manage/cs/agents/:id
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
 * 更新客服状态
 * PUT /api/manage/cs/agents/:id/status
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
 * 获取团队成员(客服经理查询)
 * GET /api/manage/cs/team/:managerId
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
 * 获取可用客服列表
 * GET /api/manage/cs/agents/available
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
 * 获取在线客服统计
 * GET /api/manage/cs/stats/online
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
 * 获取客服的活跃会话
 * GET /api/manage/cs/agents/:id/sessions
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
 * 获取客服统计数据
 * GET /api/manage/cs/agents/:id/statistics
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
 * 获取客服统计汇总
 * GET /api/manage/cs/agents/:id/summary
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
 * 获取团队排行榜
 * GET /api/manage/cs/team/:managerId/leaderboard
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
 * 获取工作负载对比
 * GET /api/manage/cs/workload
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
 * 生成每日统计
 * POST /api/manage/cs/stats/generate
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
