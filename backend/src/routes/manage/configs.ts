/**
 * 配置管理路由
 */

import express from 'express';
import {
  getAllConfigs,
  getPublicConfigs,
  getConfig,
  updateConfig,
  batchUpdateConfigs,
  reloadConfigs,
  getConfigHistory,
  getCSConfig,
  updateCSConfig,
} from '../../controllers/configController';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: 配置管理
 *   description: 系统配置管理接口
 */

// 获取所有配置（支持按分类筛选）
router.get('/', getAllConfigs);

// 获取公开配置（无需认证）
router.get('/public', getPublicConfigs);

// 获取配置变更历史
router.get('/history', getConfigHistory);

// 重新加载配置
router.post('/reload', reloadConfigs);

// 批量更新配置
router.put('/batch', batchUpdateConfigs);

// 客服配置
router.get('/cs', getCSConfig);
router.put('/cs', updateCSConfig);

// 单个配置操作（放在最后以避免路由冲突）
router.get('/:key', getConfig);
router.put('/:key', updateConfig);

export default router;
