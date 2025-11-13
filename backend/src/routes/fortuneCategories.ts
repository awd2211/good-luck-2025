import express from 'express';
import {
  getFortuneCategories,
  getFortuneCategory,
  createFortuneCategory,
  updateFortuneCategory,
  deleteFortuneCategory,
  updateCategoriesOrder
} from '../controllers/fortuneCategories';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

// 获取所有分类（需要读取权限）
router.get(
  '/',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.READ),
  getFortuneCategories
);

// 获取单个分类（需要读取权限）
router.get(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.READ),
  getFortuneCategory
);

// 创建分类（需要创建权限）
router.post(
  '/',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.CREATE),
  createFortuneCategory
);

// 更新分类（需要更新权限）
router.put(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.UPDATE),
  updateFortuneCategory
);

// 删除分类（需要删除权限）
router.delete(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.DELETE),
  deleteFortuneCategory
);

// 更新排序（需要更新权限）
router.patch(
  '/order/batch',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.UPDATE),
  updateCategoriesOrder
);

export default router;
