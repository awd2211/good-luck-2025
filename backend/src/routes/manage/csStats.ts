import { Router } from 'express';
import * as csStatsController from '../../controllers/manage/csStatsController';
import { requirePermission } from '../../middleware/auth';
import { Resource, Action } from '../../config/permissions';

const router = Router();

/**
 * @route   GET /api/manage/cs/stats/online
 * @desc    获取在线客服统计
 * @access  Private (需要客服统计查看权限)
 */
router.get('/online', requirePermission(Resource.CS_STATS, Action.VIEW), csStatsController.getOnlineStats);

/**
 * @route   GET /api/manage/cs/stats/team
 * @desc    获取团队统计
 * @access  Private (需要客服统计查看权限)
 */
router.get('/team', requirePermission(Resource.CS_STATS, Action.VIEW), csStatsController.getTeamStats);

export default router;
