/**
 * 公开分享追踪路由（无需认证）
 */

import { Router } from 'express';
import {
  trackShareClick,
  getShareInfo
} from '../../controllers/shareTrackingController';

const router = Router();

// 追踪分享点击（重定向）
router.get('/:shareCode', trackShareClick);

// 获取分享信息
router.get('/:shareCode/info', getShareInfo);

export default router;
