import { Router } from 'express';
import { getActiveBannersPublic } from '../../controllers/bannerController';

const router = Router();

/**
 * 公开API - 获取激活的横幅（无需认证）
 */
router.get('/', getActiveBannersPublic);

export default router;
