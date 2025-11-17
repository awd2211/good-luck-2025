/**
 * 敏感词控制器
 * 处理敏感词管理相关的HTTP请求
 */

import { Request, Response, NextFunction } from 'express';
import * as sensitiveWordService from '../../services/webchat/sensitiveWordService';

/**
 * 添加敏感词 (管理端)
 * POST /api/manage/cs/sensitive-words
 */
export const addSensitiveWord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { word, category, severity, action, replacement } = req.body;
    const createdBy = parseInt((req as any).admin.id.replace('admin-', ''));

    if (!word || !category || !severity || !action) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const sensitiveWord = await sensitiveWordService.addSensitiveWord({
      word,
      category,
      severity,
      action,
      replacement,
      createdBy
    });

    res.status(201).json({
      success: true,
      message: '敏感词已添加',
      data: sensitiveWord
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取敏感词列表 (管理端)
 * GET /api/manage/cs/sensitive-words
 */
export const getSensitiveWords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, severity, isActive, page, limit } = req.query;

    const result = await sensitiveWordService.getSensitiveWords({
      category: category as string,
      severity: severity as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: result.words,
      pagination: {
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50
      }
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 检测文本敏感词 (内部API)
 * POST /api/manage/cs/sensitive-words/detect
 */
export const detectText = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '缺少文本内容'
      });
    }

    const result = await sensitiveWordService.detectSensitiveWords(text);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取敏感词统计 (管理端)
 * GET /api/manage/cs/sensitive-words/statistics
 */
export const getStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await sensitiveWordService.getSensitiveWordStatistics({
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
 * 获取敏感词命中记录 (管理端)
 * GET /api/manage/cs/sensitive-words/hits
 */
export const getHits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      wordId,
      sessionId,
      agentId,
      startDate,
      endDate,
      page,
      limit
    } = req.query;

    const result = await sensitiveWordService.getSensitiveWordHits({
      wordId: wordId ? parseInt(wordId as string) : undefined,
      sessionId: sessionId ? parseInt(sessionId as string) : undefined,
      agentId: agentId ? parseInt(agentId as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: result.hits,
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
 * 更新敏感词 (管理端)
 * PUT /api/manage/cs/sensitive-words/:id
 */
export const updateSensitiveWord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const sensitiveWord = await sensitiveWordService.updateSensitiveWord(
      parseInt(id),
      updates
    );

    res.json({
      success: true,
      message: '敏感词已更新',
      data: sensitiveWord
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 删除敏感词 (管理端)
 * DELETE /api/manage/cs/sensitive-words/:id
 */
export const deleteSensitiveWord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const success = await sensitiveWordService.deleteSensitiveWord(parseInt(id));

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '敏感词不存在'
      });
    }

    res.json({
      success: true,
      message: '敏感词已删除'
    });
  } catch (error: any) {
    next(error);
  }
};
