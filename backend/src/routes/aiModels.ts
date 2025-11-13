import express from 'express';
import {
  getAIModels,
  getAIModel,
  createAIModel,
  updateAIModel,
  deleteAIModel,
  testAIModel,
  getAIModelStats,
  setDefaultAIModel,
  batchUpdateAIModels,
  batchDeleteAIModels
} from '../controllers/aiModels';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

// 获取所有AI模型（需要读取权限）
router.get(
  '/',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.READ),
  getAIModels
);

// 获取单个AI模型（需要读取权限）
router.get(
  '/:id',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.READ),
  getAIModel
);

// 创建AI模型（需要创建权限）
router.post(
  '/',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.CREATE),
  createAIModel
);

// 更新AI模型（需要更新权限）
router.put(
  '/:id',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.UPDATE),
  updateAIModel
);

// 删除AI模型（需要删除权限）
router.delete(
  '/:id',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.DELETE),
  deleteAIModel
);

// 测试AI模型连接（需要更新权限）
router.post(
  '/:id/test',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.UPDATE),
  testAIModel
);

// 获取AI模型使用统计（需要读取权限）
router.get(
  '/:id/stats',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.READ),
  getAIModelStats
);

// 设置默认AI模型（需要更新权限）
router.post(
  '/:id/set-default',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.UPDATE),
  setDefaultAIModel
);

// 批量更新AI模型（需要更新权限）
router.post(
  '/batch-update',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.UPDATE),
  batchUpdateAIModels
);

// 批量删除AI模型（需要删除权限）
router.post(
  '/batch-delete',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.DELETE),
  batchDeleteAIModels
);

export default router;
