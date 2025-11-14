import { Request, Response, NextFunction } from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  addAuditLog,
  getAuditLogStats,
  archiveAuditLogs,
  getArchivedLogs,
  detectAnomalies,
  getActionTrend
} from '../services/auditService';

/**
 * 获取审计日志
 */
export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page,
      pageSize,
      userId,
      username,
      action,
      resource,
      resourceId,
      status,
      level,
      startDate,
      endDate,
      search
    } = req.query;

    const result = await getAuditLogs({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      userId: userId as string,
      username: username as string,
      action: action as string,
      resource: resource as string,
      resourceId: resourceId as string,
      status: status as string,
      level: level as string,
      startDate: startDate as string,
      endDate: endDate as string,
      search: search as string
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('获取审计日志失败:', error);
    next(error);
  }
};

/**
 * 获取单条日志详情
 */
export const getLogDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const log = await getAuditLogById(parseInt(id));

    if (!log) {
      return res.status(404).json({
        success: false,
        message: '日志不存在'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('获取日志详情失败:', error);
    next(error);
  }
};

/**
 * 添加审计日志
 */
export const addLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logData = req.body;

    if (!logData.action || !logData.resource) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    // 从请求中获取用户信息和IP
    const userId = req.user?.id || 'unknown';
    const username = req.user?.username || 'unknown';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'];

    const newLog = await addAuditLog({
      userId,
      username,
      ipAddress,
      userAgent,
      status: 'success',
      level: 'info',
      ...logData
    });

    res.status(201).json({
      success: true,
      message: '审计日志添加成功',
      data: newLog
    });
  } catch (error) {
    console.error('添加审计日志失败:', error);
    next(error);
  }
};

/**
 * 获取日志统计
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getAuditLogStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取日志统计失败:', error);
    next(error);
  }
};

/**
 * 归档审计日志
 */
export const archiveLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { daysToKeep } = req.body;

    const archivedCount = await archiveAuditLogs(daysToKeep || 90);

    res.json({
      success: true,
      message: `已归档${archivedCount}条历史日志`,
      data: { archivedCount }
    });
  } catch (error) {
    console.error('归档审计日志失败:', error);
    next(error);
  }
};

/**
 * 获取归档日志
 */
export const getArchived = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, startDate, endDate } = req.query;

    const result = await getArchivedLogs({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('获取归档日志失败:', error);
    next(error);
  }
};

/**
 * 检测异常
 */
export const getAnomalies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anomalies = await detectAnomalies();

    res.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    console.error('检测异常失败:', error);
    next(error);
  }
};

/**
 * 获取操作趋势
 */
export const getTrend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days } = req.query;
    const trend = await getActionTrend(days ? parseInt(days as string) : 7);

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    console.error('获取操作趋势失败:', error);
    next(error);
  }
};

// 保留旧的cleanLogs函数以兼容(实际使用archiveLogs)
export const cleanLogs = archiveLogs;
