/**
 * 快捷回复控制器
 */

import { Request, Response, NextFunction } from 'express';
import * as quickReplyService from '../../services/webchat/quickReplyService';

/**
 * 获取快捷回复列表
 * GET /api/manage/cs/quick-replies
 */
export const getQuickReplies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agentId, category, isActive, isPublic, page, limit } = req.query;

    const result = await quickReplyService.getTemplates({
      agentId: agentId ? parseInt(agentId as string) : undefined,
      category: category as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      includeGlobal: isPublic !== 'true',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50
    });

    res.json({
      success: true,
      data: result.templates,
      pagination: {
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
        totalPages: Math.ceil(result.total / (limit ? parseInt(limit as string) : 50))
      }
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取单个快捷回复
 * GET /api/manage/cs/quick-replies/:id
 */
export const getQuickReply = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const template = await quickReplyService.getTemplateById(parseInt(id));

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '快捷回复不存在'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 创建快捷回复
 * POST /api/manage/cs/quick-replies
 */
export const createQuickReply = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { agentId, category, title, content, shortcutKey } = req.body;

    if (!category || !title || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: category, title, content'
      });
    }

    const template = await quickReplyService.createTemplate({
      agentId: agentId ? parseInt(agentId) : undefined,
      category,
      title,
      content,
      shortcutKey
    });

    res.json({
      success: true,
      message: '创建成功',
      data: template
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 更新快捷回复
 * PUT /api/manage/cs/quick-replies/:id
 */
export const updateQuickReply = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const template = await quickReplyService.updateTemplate(parseInt(id), updates);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '快捷回复不存在'
      });
    }

    res.json({
      success: true,
      message: '更新成功',
      data: template
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 删除快捷回复
 * DELETE /api/manage/cs/quick-replies/:id
 */
export const deleteQuickReply = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deleted = await quickReplyService.deleteTemplate(parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '快捷回复不存在'
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取分类列表
 * GET /api/manage/cs/quick-replies/categories
 */
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await quickReplyService.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取热门快捷回复
 * GET /api/manage/cs/quick-replies/top
 */
export const getTopReplies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit } = req.query;

    const templates = await quickReplyService.getPopularTemplates(
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 增加使用次数
 * POST /api/manage/cs/quick-replies/:id/use
 */
export const incrementUseCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await quickReplyService.incrementUsageCount(parseInt(id));

    res.json({
      success: true,
      message: '使用次数已更新'
    });
  } catch (error: any) {
    next(error);
  }
};
