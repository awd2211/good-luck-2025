/**
 * 用户通知控制器
 */

import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../../services/user/notificationService';

/**
 * 获取用户通知列表
 */
export const getUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const { unread_only, type, page, limit } = req.query;

    const result = await notificationService.getUserNotifications({
      userId,
      unreadOnly: unread_only === 'true',
      type: type as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取未读通知数量
 */
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 标记通知为已读
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const { id } = req.params;

    await notificationService.markAsRead({
      userId,
      notificationId: parseInt(id),
    });

    res.json({
      success: true,
      message: '已标记为已读',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 标记所有通知为已读
 */
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: '全部标记为已读',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 记录通知点击
 */
export const recordClick = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const { id } = req.params;

    await notificationService.recordClick({
      userId,
      notificationId: parseInt(id),
    });

    res.json({
      success: true,
      message: '已记录点击',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除通知
 */
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const { id } = req.params;

    await notificationService.deleteUserNotification({
      userId,
      notificationId: parseInt(id),
    });

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    next(error);
  }
};
