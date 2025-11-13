import { Request, Response } from 'express';
import {
  getAllNotifications,
  getActiveNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  batchUpdateNotificationStatus,
} from '../services/notificationService';

/**
 * 获取所有通知
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, status, type } = req.query;

    const result = await getAllNotifications({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      status: status as string,
      type: type as string,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知列表失败',
    });
  }
};

/**
 * 获取激活的通知（公开API，无需认证）
 */
export const getActiveNotificationsPublic = async (req: Request, res: Response) => {
  try {
    const { target } = req.query;
    const notifications = await getActiveNotifications(target as string);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知失败',
    });
  }
};

/**
 * 获取单个通知
 */
export const getNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await getNotificationById(parseInt(id));

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在',
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知失败',
    });
  }
};

/**
 * 创建通知
 */
export const addNotification = async (req: Request, res: Response) => {
  try {
    const notificationData = req.body;

    if (!notificationData.title || !notificationData.content) {
      return res.status(400).json({
        success: false,
        message: '通知标题和内容不能为空',
      });
    }

    // 从请求中获取创建者信息
    if (req.user) {
      notificationData.created_by = req.user.id;
    }

    const newNotification = await createNotification(notificationData);

    res.status(201).json({
      success: true,
      message: '通知创建成功',
      data: newNotification,
    });
  } catch (error) {
    console.error('创建通知失败:', error);
    res.status(500).json({
      success: false,
      message: '创建通知失败',
    });
  }
};

/**
 * 更新通知
 */
export const modifyNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notificationData = req.body;

    const updatedNotification = await updateNotification(parseInt(id), notificationData);

    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在',
      });
    }

    res.json({
      success: true,
      message: '通知更新成功',
      data: updatedNotification,
    });
  } catch (error) {
    console.error('更新通知失败:', error);
    res.status(500).json({
      success: false,
      message: '更新通知失败',
    });
  }
};

/**
 * 删除通知
 */
export const removeNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteNotification(parseInt(id));

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '通知不存在',
      });
    }

    res.json({
      success: true,
      message: '通知删除成功',
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({
      success: false,
      message: '删除通知失败',
    });
  }
};

/**
 * 批量更新通知状态
 */
export const batchUpdateStatus = async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供通知ID列表',
      });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态值无效',
      });
    }

    const count = await batchUpdateNotificationStatus(ids, status);

    res.json({
      success: true,
      message: `成功更新${count}条通知的状态`,
      data: { count },
    });
  } catch (error) {
    console.error('批量更新失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新失败',
    });
  }
};
