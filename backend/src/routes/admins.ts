import express from 'express';
import {
  getAdmins,
  getAdmin,
  addAdmin,
  modifyAdmin,
  removeAdmin,
  getStats,
} from '../controllers/adminController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

/**
 * 管理员管理 - 所有接口都需要认证和ADMINS资源权限
 * 只有超级管理员可以管理其他管理员
 */

// 统计接口需要在参数化路由之前
router.get('/stats', authenticate, requirePermission(Resource.ADMINS, Action.VIEW), getStats);

// 查询操作 - 需要读取权限
router.get('/', authenticate, requirePermission(Resource.ADMINS, Action.VIEW), getAdmins);
router.get('/:id', authenticate, requirePermission(Resource.ADMINS, Action.VIEW), getAdmin);

// 创建操作 - 需要创建权限
router.post('/', authenticate, requirePermission(Resource.ADMINS, Action.CREATE), addAdmin);

// 更新操作 - 需要更新权限
router.put('/:id', authenticate, requirePermission(Resource.ADMINS, Action.EDIT), modifyAdmin);

// 删除操作 - 需要删除权限
router.delete('/:id', authenticate, requirePermission(Resource.ADMINS, Action.DELETE), removeAdmin);

export default router;
