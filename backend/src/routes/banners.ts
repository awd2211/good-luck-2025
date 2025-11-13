import { Router } from 'express';
import {
  getBanners,
  getBanner,
  addBanner,
  modifyBanner,
  removeBanner,
  changeBannerPosition,
} from '../controllers/bannerController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

/**
 * 横幅管理 - 所有接口都需要认证
 */

// 查询操作 - 需要读取权限
router.get('/', authenticate, requirePermission(Resource.BANNERS, Action.READ), getBanners);
router.get('/:id', authenticate, requirePermission(Resource.BANNERS, Action.READ), getBanner);

// 创建操作 - 需要创建权限
router.post('/', authenticate, requirePermission(Resource.BANNERS, Action.CREATE), addBanner);

// 更新操作 - 需要更新权限
router.put('/:id', authenticate, requirePermission(Resource.BANNERS, Action.UPDATE), modifyBanner);
router.patch('/:id/position', authenticate, requirePermission(Resource.BANNERS, Action.UPDATE), changeBannerPosition);

// 删除操作 - 需要删除权限
router.delete('/:id', authenticate, requirePermission(Resource.BANNERS, Action.DELETE), removeBanner);

export default router;
