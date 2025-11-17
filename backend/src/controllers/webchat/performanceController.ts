/**
 * 绩效统计控制器
 */

import { Request, Response, NextFunction } from 'express';
import * as performanceService from '../../services/webchat/performanceService';

/**
 * 获取客服绩效数据 (管理端)
 * GET /api/manage/cs/performance/:agentId
 */
export const getAgentPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agentId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '缺少开始日期或结束日期'
      });
    }

    const data = await performanceService.getAgentPerformance(
      parseInt(agentId),
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取绩效排行榜 (管理端)
 * GET /api/manage/cs/performance/ranking
 */
export const getPerformanceRanking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, orderBy } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '缺少开始日期或结束日期'
      });
    }

    const validOrderBy = ['sessions', 'satisfaction', 'quality', 'response_time'];
    const orderByField = validOrderBy.includes(orderBy as string)
      ? (orderBy as 'sessions' | 'satisfaction' | 'quality' | 'response_time')
      : 'sessions';

    const ranking = await performanceService.getPerformanceRanking(
      startDate as string,
      endDate as string,
      orderByField
    );

    res.json({
      success: true,
      data: ranking
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取详细绩效报表 (管理端)
 * GET /api/manage/cs/performance/report
 */
export const getDetailedReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agentId, startDate, endDate } = req.query;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: '缺少客服ID参数'
      });
    }

    const report = await performanceService.generateDetailedReport(
      parseInt(agentId as string),
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取团队统计数据 (管理端)
 * GET /api/manage/cs/performance/team
 */
export const getTeamStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '缺少开始日期或结束日期'
      });
    }

    const stats = await performanceService.getTeamStatistics(
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 更新每日绩效数据 (系统调用)
 * POST /api/manage/cs/performance/update-daily
 */
export const updateDailyPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agentId, date, updates } = req.body;

    if (!agentId || !date) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    await performanceService.upsertDailyPerformance(
      parseInt(agentId),
      date,
      updates
    );

    res.json({
      success: true,
      message: '绩效数据已更新'
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 增量更新绩效统计 (系统调用)
 * POST /api/manage/cs/performance/increment
 */
export const incrementStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agentId, date, increments } = req.body;

    if (!agentId || !date || !increments) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: agentId, date, increments'
      });
    }

    await performanceService.incrementPerformanceStats(
      parseInt(agentId),
      date,
      increments
    );

    res.json({
      success: true,
      message: '统计数据已更新'
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 聚合平均值数据 (系统调用)
 * POST /api/manage/cs/performance/aggregate
 */
export const aggregateAverages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agentId, date } = req.body;

    if (!agentId || !date) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    await performanceService.aggregateAverages(parseInt(agentId), date);

    res.json({
      success: true,
      message: '平均值已聚合'
    });
  } catch (error: any) {
    next(error);
  }
};
