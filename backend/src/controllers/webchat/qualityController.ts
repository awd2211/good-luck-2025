/**
 * 质检控制器
 * 处理质检相关的HTTP请求
 */

import { Request, Response, NextFunction } from 'express';
import * as qualityService from '../../services/webchat/qualityService';

/**
 * 创建质检记录 (管理端)
 * POST /api/manage/cs/quality
 */
export const createInspection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      sessionId,
      agentId,
      qualityScore,
      serviceAttitude,
      responseSpeed,
      problemSolving,
      compliance,
      communication,
      issues,
      suggestions
    } = req.body;

    const inspectorId = parseInt((req as any).admin.id.replace('admin-', ''));

    if (!sessionId || !agentId) {
      return res.status(400).json({
        success: false,
        message: '缺少会话ID或客服ID'
      });
    }

    const inspection = await qualityService.createInspection({
      sessionId: parseInt(sessionId),
      inspectorId,
      agentId: parseInt(agentId),
      qualityScore: parseFloat(qualityScore),
      serviceAttitude: parseFloat(serviceAttitude),
      responseSpeed: parseFloat(responseSpeed),
      problemSolving: parseFloat(problemSolving),
      compliance: parseFloat(compliance),
      communication: parseFloat(communication),
      issues,
      suggestions
    });

    res.status(201).json({
      success: true,
      message: '质检记录已创建',
      data: inspection
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取质检记录列表 (管理端)
 * GET /api/manage/cs/quality
 */
export const getInspections = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      agentId,
      inspectorId,
      startDate,
      endDate,
      status,
      minScore,
      maxScore,
      page,
      limit
    } = req.query;

    const result = await qualityService.getInspections({
      agentId: agentId ? parseInt(agentId as string) : undefined,
      inspectorId: inspectorId ? parseInt(inspectorId as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as string,
      minScore: minScore ? parseFloat(minScore as string) : undefined,
      maxScore: maxScore ? parseFloat(maxScore as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: result.inspections,
      pagination: {
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      }
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取质检统计数据 (管理端)
 * GET /api/manage/cs/quality/statistics
 */
export const getStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agentId, startDate, endDate } = req.query;

    const stats = await qualityService.getInspectionStatistics({
      agentId: agentId ? parseInt(agentId as string) : undefined,
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
 * 更新质检记录 (管理端)
 * PUT /api/manage/cs/quality/:id
 */
export const updateInspection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const inspection = await qualityService.updateInspection(
      parseInt(id),
      updates
    );

    res.json({
      success: true,
      message: '质检记录已更新',
      data: inspection
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 删除质检记录 (管理端)
 * DELETE /api/manage/cs/quality/:id
 */
export const deleteInspection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await qualityService.deleteInspection(parseInt(id));

    if (false) {  // deleteInspection返回void，移除此检查
      return res.status(404).json({
        success: false,
        message: '质检记录不存在'
      });
    }

    res.json({
      success: true,
      message: '质检记录已删除'
    });
  } catch (error: any) {
    next(error);
  }
};
