import express from 'express';
import {
  getSystemConfigs,
  getSystemConfig,
  createSystemConfig,
  updateSystemConfig,
  deleteSystemConfig,
  getConfigTypes,
  getBatchConfigs
} from '../controllers/systemConfigs';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

// 获取配置类型列表（需要读取权限）
router.get(
  '/types',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.READ),
  getConfigTypes
);

// 批量获取配置（需要读取权限）
router.post(
  '/batch',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.READ),
  getBatchConfigs
);

// 获取所有配置（需要读取权限）
router.get(
  '/',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.READ),
  getSystemConfigs
);

// 获取单个配置（需要读取权限）
router.get(
  '/:key',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.READ),
  getSystemConfig
);

// 创建配置（需要创建权限）
router.post(
  '/',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.CREATE),
  createSystemConfig
);

// 更新配置（需要更新权限）
router.put(
  '/:key',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.UPDATE),
  updateSystemConfig
);

// 删除配置（需要删除权限）
router.delete(
  '/:key',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.DELETE),
  deleteSystemConfig
);

export default router;
