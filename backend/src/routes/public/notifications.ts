import { Router } from 'express';
import { getActiveNotificationsPublic } from '../../controllers/notificationController';

const router = Router();

/**
 * 公开API - 获取激活的通知（无需认证）
 */
router.get('/', getActiveNotificationsPublic);

export default router;
