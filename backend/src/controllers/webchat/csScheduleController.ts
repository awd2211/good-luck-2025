/**
 * 客服排班管理控制器
 */

import type { Request, Response, NextFunction } from 'express';
import * as scheduleService from '../../services/webchat/csScheduleService';

// 获取排班列表
export const getSchedules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, startDate, endDate, shiftType, isActive, page = 1, limit = 50 } = req.query;
    const user = req.user;

    let finalAgentId = agentId ? Number(agentId) : undefined;

    // 如果是普通客服(cs_agent)，只能查看自己的排班
    if (user && user.role === 'cs_agent') {
      // 通过 admin_id 查找对应的 customer_service_agents.id
      const agentResult = await scheduleService.getAgentIdByAdminId(user.id);
      if (!agentResult) {
        return res.status(404).json({
          success: false,
          message: '未找到对应的客服信息'
        });
      }
      finalAgentId = agentResult.id;
    }

    const params = {
      agentId: finalAgentId,
      startDate: startDate as string,
      endDate: endDate as string,
      shiftType: shiftType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: Number(page),
      limit: Number(limit)
    };

    const result = await scheduleService.getSchedules(params);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 获取单个排班
export const getScheduleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schedule = await scheduleService.getScheduleById(Number(id));
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

// 创建排班
export const createSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const schedule = await scheduleService.createSchedule(data);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

// 更新排班
export const updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const schedule = await scheduleService.updateSchedule(Number(id), data);
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

// 删除排班
export const deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await scheduleService.deleteSchedule(Number(id));
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 批量创建排班
export const batchCreateSchedules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schedules } = req.body;
    const result = await scheduleService.batchCreateSchedules(schedules);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// 获取排班统计
export const getScheduleStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const user = req.user;

    let agentId: number | undefined = undefined;

    // 如果是普通客服(cs_agent)，只能查看自己的统计
    if (user && user.role === 'cs_agent') {
      const agentResult = await scheduleService.getAgentIdByAdminId(user.id);
      if (!agentResult) {
        return res.status(404).json({
          success: false,
          message: '未找到对应的客服信息'
        });
      }
      agentId = agentResult.id;
    }

    const stats = await scheduleService.getScheduleStatistics({
      startDate: startDate as string,
      endDate: endDate as string,
      agentId
    });
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// 获取调班请求列表
export const getSwapRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await scheduleService.getSwapRequests({
      status: status as string,
      page: Number(page),
      limit: Number(limit)
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 创建调班请求
export const createSwapRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const request = await scheduleService.createSwapRequest(data);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// 审批调班请求
export const reviewSwapRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy } = req.body;
    const request = await scheduleService.reviewSwapRequest(Number(id), status, reviewedBy);
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};
