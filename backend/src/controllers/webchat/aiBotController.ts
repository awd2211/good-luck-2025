/**
 * AI智能客服机器人控制器
 */

import { Request, Response, NextFunction } from 'express';
import * as aiBotService from '../../services/webchat/aiBotService';

/**
 * AI对话接口 (用户端/客服端)
 * POST /api/chat/ai
 */
export const chatWithAI = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, sessionId, includeHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 如果需要包含历史对话
    let conversationHistory: { role: string; content: string }[] = [];
    if (includeHistory && sessionId) {
      conversationHistory = await aiBotService.getSessionAIHistory(parseInt(sessionId));
    }

    const result = await aiBotService.chatWithAI(
      message,
      sessionId ? parseInt(sessionId) : undefined,
      conversationHistory
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'AI对话失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取AI配置列表 (管理端)
 * GET /api/manage/cs/ai-configs
 */
export const getAIConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const configs = await aiBotService.getAllAIConfigs();

    res.json({
      success: true,
      data: configs
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 创建AI配置 (管理端)
 * POST /api/manage/cs/ai-configs
 */
export const createAIConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      botName,
      provider,
      modelName,
      apiEndpoint,
      apiKey,
      systemPrompt,
      temperature,
      maxTokens,
      priority
    } = req.body;

    if (!botName || !provider || !modelName) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: botName, provider, modelName'
      });
    }

    const config = await aiBotService.createAIConfig({
      botName,
      provider,
      modelName,
      apiEndpoint,
      apiKey,
      systemPrompt,
      temperature,
      maxTokens,
      priority
    });

    res.json({
      success: true,
      message: 'AI配置创建成功',
      data: config
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 更新AI配置 (管理端)
 * PUT /api/manage/cs/ai-configs/:id
 */
export const updateAIConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const config = await aiBotService.updateAIConfig(parseInt(id), updates);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'AI配置不存在'
      });
    }

    res.json({
      success: true,
      message: 'AI配置已更新',
      data: config
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 删除AI配置 (管理端)
 * DELETE /api/manage/cs/ai-configs/:id
 */
export const deleteAIConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deleted = await aiBotService.deleteAIConfig(parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'AI配置不存在'
      });
    }

    res.json({
      success: true,
      message: 'AI配置已删除'
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 获取AI对话日志 (管理端)
 * GET /api/manage/cs/ai-logs
 */
export const getAILogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      sessionId,
      startDate,
      endDate,
      success,
      page,
      limit
    } = req.query;

    const result = await aiBotService.getAILogs({
      sessionId: sessionId ? parseInt(sessionId as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      success: success === 'true' ? true : success === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50
    });

    res.json({
      success: true,
      data: result.data,
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
 * 获取AI使用统计 (管理端)
 * GET /api/manage/cs/ai-stats
 */
export const getAIStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await aiBotService.getAIStatistics({
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
 * 测试AI配置 (管理端)
 * POST /api/manage/cs/ai-configs/:id/test
 */
export const testAIConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: '测试消息不能为空'
      });
    }

    // 临时设置该配置为最高优先级进行测试
    const config = await aiBotService.updateAIConfig(parseInt(id), {
      is_active: true
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'AI配置不存在'
      });
    }

    const result = await aiBotService.chatWithAI(message);

    res.json({
      success: true,
      message: 'AI测试成功',
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'AI测试失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
