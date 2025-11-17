/**
 * 培训系统控制器
 */

import type { Request, Response, NextFunction } from 'express';
import * as trainingService from '../../services/webchat/trainingService';

// 获取课程列表
export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, isMandatory, isPublished, page, limit } = req.query;

    const params = {
      category: category as string,
      isMandatory: isMandatory === 'true' ? true : isMandatory === 'false' ? false : undefined,
      isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    };

    const result = await trainingService.getCourses(params);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 获取课程详情
export const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await trainingService.getCourseById(Number(id));
    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// 创建课程
export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await trainingService.createCourse(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// 更新课程
export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await trainingService.updateCourse(Number(id), req.body);
    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// 删除课程
export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await trainingService.deleteCourse(Number(id));
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 获取培训记录
export const getTrainingRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, courseId, status, page, limit } = req.query;

    const params = {
      agentId: agentId ? Number(agentId) : undefined,
      courseId: courseId ? Number(courseId) : undefined,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    };

    const result = await trainingService.getTrainingRecords(params);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 创建培训记录
export const createTrainingRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await trainingService.createTrainingRecord(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// 更新培训记录
export const updateTrainingRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const record = await trainingService.updateTrainingRecord(Number(id), req.body);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// 获取统计信息
export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await trainingService.getTrainingStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
