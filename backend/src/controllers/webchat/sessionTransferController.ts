/**
 * 会话转接管理控制器
 */

import type { Request, Response, NextFunction } from 'express';
import * as sessionTransferService from '../../services/webchat/sessionTransferService';

/**
 * 获取转接列表
 */
export const getTransfers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, fromAgentId, toAgentId, status, transferType, page, limit } = req.query;

    const params = {
      sessionId: sessionId ? parseInt(sessionId as string) : undefined,
      fromAgentId: fromAgentId ? parseInt(fromAgentId as string) : undefined,
      toAgentId: toAgentId ? parseInt(toAgentId as string) : undefined,
      status: status as string,
      transferType: transferType as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    };

    const result = await sessionTransferService.getTransfers(params);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: params.page || 1,
        limit: params.limit || 20
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取转接详情
 */
export const getTransferById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const transfer = await sessionTransferService.getTransferById(parseInt(id));

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建转接请求
 */
export const createTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, fromAgentId, toAgentId, transferReason, transferNotes, transferType } = req.body;

    if (!sessionId || !toAgentId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and target agent ID are required'
      });
    }

    const transfer = await sessionTransferService.createTransfer({
      sessionId,
      fromAgentId,
      toAgentId,
      transferReason,
      transferNotes,
      transferType
    });

    res.status(201).json({
      success: true,
      data: transfer,
      message: 'Transfer request created successfully'
    });
  } catch (error: any) {
    if (error.message === 'Session not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Target agent not found' || error.message === 'Target agent is offline') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === 'Session already has a pending transfer') {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 接受转接
 */
export const acceptTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const agentId = (req as any).user?.agentId; // 假设从认证中间件获取

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: 'Agent authentication required'
      });
    }

    const transfer = await sessionTransferService.acceptTransfer(parseInt(id), agentId);

    res.json({
      success: true,
      data: transfer,
      message: 'Transfer accepted successfully'
    });
  } catch (error: any) {
    if (error.message === 'Transfer not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Transfer is not pending' || error.message === 'Only the target agent can accept this transfer') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 拒绝转接
 */
export const rejectTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const agentId = (req as any).user?.agentId;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: 'Agent authentication required'
      });
    }

    const transfer = await sessionTransferService.rejectTransfer(parseInt(id), agentId);

    res.json({
      success: true,
      data: transfer,
      message: 'Transfer rejected successfully'
    });
  } catch (error: any) {
    if (error.message === 'Transfer not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Transfer is not pending' || error.message === 'Only the target agent can reject this transfer') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 取消转接
 */
export const cancelTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const agentId = (req as any).user?.agentId;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: 'Agent authentication required'
      });
    }

    await sessionTransferService.cancelTransfer(parseInt(id), agentId);

    res.json({
      success: true,
      message: 'Transfer cancelled successfully'
    });
  } catch (error: any) {
    if (error.message === 'Transfer not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Only pending transfers can be cancelled' || error.message === 'Only the initiator can cancel this transfer') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * 获取待处理的转接（针对当前客服）
 */
export const getPendingTransfers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = (req as any).user?.agentId;
    const isAdmin = (req as any).user?.role; // 检查是否是管理员

    // 如果既不是客服代理也不是管理员，返回401
    if (!agentId && !isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Agent authentication required'
      });
    }

    let transfers;
    if (agentId) {
      // 客服代理：只返回分配给该代理的转接
      transfers = await sessionTransferService.getPendingTransfersForAgent(agentId);
    } else {
      // 管理员：返回所有待处理转接
      transfers = await sessionTransferService.getTransfers({
        status: 'pending',
        page: 1,
        limit: 100
      });
      transfers = transfers.data; // 提取data数组
    }

    res.json({
      success: true,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取转接统计
 */
export const getTransferStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statistics = await sessionTransferService.getTransferStatistics();

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};
