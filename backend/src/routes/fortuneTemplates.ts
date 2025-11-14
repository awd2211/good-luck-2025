import express from 'express';
import {
  getFortuneTemplates,
  getFortuneTemplate,
  getTemplatesByService,
  createFortuneTemplate,
  updateFortuneTemplate,
  deleteFortuneTemplate,
  duplicateTemplate,
  getTemplateTypes
} from '../controllers/fortuneTemplates';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

// 获取模板类型列表（需要读取权限）
router.get(
  '/types',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW),
  getTemplateTypes
);

// 获取所有模板（需要读取权限）
router.get(
  '/',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW),
  getFortuneTemplates
);

// 根据服务获取模板（需要读取权限）
router.get(
  '/service/:serviceId',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW),
  getTemplatesByService
);

// 获取单个模板（需要读取权限）
router.get(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW),
  getFortuneTemplate
);

// 创建模板（需要创建权限）
router.post(
  '/',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE),
  createFortuneTemplate
);

// 更新模板（需要更新权限）
router.put(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.EDIT),
  updateFortuneTemplate
);

// 删除模板（需要删除权限）
router.delete(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.DELETE),
  deleteFortuneTemplate
);

// 复制模板（需要创建权限）
router.post(
  '/:id/duplicate',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE),
  duplicateTemplate
);

export default router;
