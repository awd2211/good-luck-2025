/**
 * 用户通知路由
 */

import express from 'express';
import * as notificationController from '../../controllers/user/notificationController';

const router = express.Router();

// 获取用户通知列表
router.get('/user', notificationController.getUserNotifications);

// 获取未读通知数量
router.get('/unread-count', notificationController.getUnreadCount);

// 标记通知为已读
router.post('/:id/read', notificationController.markAsRead);

// 标记所有通知为已读
router.post('/read-all', notificationController.markAllAsRead);

// 记录通知点击
router.post('/:id/click', notificationController.recordClick);

// 删除通知
router.delete('/:id/delete', notificationController.deleteNotification);

export default router;
