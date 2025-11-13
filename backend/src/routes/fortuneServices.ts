import express from 'express';
import {
  getFortuneServices,
  getFortuneService,
  createFortuneService,
  updateFortuneService,
  deleteFortuneService,
  batchUpdateStatus,
  incrementViewCount,
  getServiceStats,
  getAllServicesStats,
  batchUpdateServices,
  batchDeleteServices,
  exportServices,
  importServices
} from '../controllers/fortuneServices';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

// 获取所有服务的统计概览（需要读取权限）- 必须放在 /:id 之前
router.get(
  '/stats',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.READ),
  getAllServicesStats
);

// 导出服务数据（需要读取权限）
router.get(
  '/export',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.READ),
  exportServices
);

// 批量更新服务（需要更新权限）
router.post(
  '/batch-update',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.UPDATE),
  batchUpdateServices
);

// 批量删除服务（需要删除权限）
router.post(
  '/batch-delete',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.DELETE),
  batchDeleteServices
);

// 导入服务数据（需要创建权限）
router.post(
  '/import',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.CREATE),
  importServices
);

// 批量更新状态（需要更新权限）
router.patch(
  '/batch/status',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.UPDATE),
  batchUpdateStatus
);

// 获取所有服务（需要读取权限）
router.get(
  '/',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.READ),
  getFortuneServices
);

// 获取单个服务（需要读取权限）
router.get(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.READ),
  getFortuneService
);

// 创建服务（需要创建权限）
router.post(
  '/',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.CREATE),
  createFortuneService
);

// 更新服务（需要更新权限）
router.put(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.UPDATE),
  updateFortuneService
);

// 删除服务（需要删除权限）
router.delete(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.DELETE),
  deleteFortuneService
);

// 更新浏览量（需要更新权限）
router.patch(
  '/:id/view',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.UPDATE),
  incrementViewCount
);

// 获取服务统计（需要读取权限）
router.get(
  '/:id/stats',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.READ),
  getServiceStats
);

export default router;
