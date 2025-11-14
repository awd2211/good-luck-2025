import { Router } from 'express';
import {
  getNotifications,
  getNotification,
  addNotification,
  modifyNotification,
  removeNotification,
  batchUpdateStatus,
} from '../controllers/notificationController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

/**
 * 通知管理 - 所有接口都需要认证
 */

// 查询操作 - 需要读取权限
router.get('/', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.VIEW), getNotifications);
router.get('/:id', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.VIEW), getNotification);

// 创建操作 - 需要创建权限
router.post('/', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.CREATE), addNotification);

// 更新操作 - 需要更新权限
router.put('/:id', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.EDIT), modifyNotification);
router.post('/batch/status', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.EDIT), batchUpdateStatus);

// 删除操作 - 需要删除权限
router.delete('/:id', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.DELETE), removeNotification);

export default router;
