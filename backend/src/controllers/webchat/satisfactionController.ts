/**
 * 满意度评价控制器
 */

import { Request, Response, NextFunction } from 'express';
import * as satisfactionService from '../../services/webchat/satisfactionService';

/**
 * 创建满意度评价 (用户端)
 * POST /api/chat/sessions/:sessionId/rating
 */
export const createRating = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const { rating, comment, tags } = req.body;
    const userId = (req as any).user?.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间'
      });
    }

    const ratingData = await satisfactionService.createRating({
      sessionId: parseInt(sessionId),
      userId,
      rating,
      comment,
      tags,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: '评价提交成功',
      data: ratingData
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 查询满意度评价列表 (管理端)
 * GET /api/manage/cs/satisfaction
 */
export const getRatings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      agentId,
      rating,
      startDate,
      endDate,
      page,
      limit
    } = req.query;

    const result = await satisfactionService.getRatings({
      agentId: agentId ? parseInt(agentId as string) : undefined,
      rating: rating ? parseInt(rating as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        totalPages: Math.ceil(result.total / (limit ? parseInt(limit as string) : 20))
      }
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取满意度统计数据 (管理端)
 * GET /api/manage/cs/satisfaction/stats
 */
export const getStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await satisfactionService.getStatistics({
      startDate: startDate as string,
      endDate: endDate as string
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取客服平均评分 (管理端)
 * GET /api/manage/cs/agents/:agentId/rating
 */
export const getAgentRating = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agentId } = req.params;
    const { startDate, endDate } = req.query;

    const rating = await satisfactionService.getAgentAverageRating(
      parseInt(agentId),
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: rating
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取评价标签统计 (管理端)
 * GET /api/manage/cs/satisfaction/tags
 */
export const getTagStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const tags = await satisfactionService.getTagStatistics({
      startDate: startDate as string,
      endDate: endDate as string
    });

    res.json({
      success: true,
      data: tags
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 删除评价 (管理端)
 * DELETE /api/manage/cs/satisfaction/:id
 */
export const deleteRating = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deleted = await satisfactionService.deleteRating(parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '评价不存在'
      });
    }

    res.json({
      success: true,
      message: '评价已删除'
    });
  } catch (error: any) {
    next(error);
  }
};
