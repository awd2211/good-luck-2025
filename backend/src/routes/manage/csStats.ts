import { Router } from 'express';
import * as csStatsController from '../../controllers/manage/csStatsController';
import { requirePermission } from '../../middleware/auth';
import { Resource, Action } from '../../config/permissions';

const router = Router();

/**
 * @openapi
 * /api/manage/cs/stats/online:
 *   get:
 *     summary: 获取在线客服统计
 *     description: 获取当前在线客服人员的实时统计数据
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取在线统计
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOnline:
 *                       type: integer
 *                       description: 在线客服总数
 *                     availableAgents:
 *                       type: integer
 *                       description: 可用客服数
 *                     busyAgents:
 *                       type: integer
 *                       description: 忙碌客服数
 *                     activeSessions:
 *                       type: integer
 *                       description: 活跃会话数
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/online', requirePermission(Resource.CS_STATS, Action.VIEW), csStatsController.getOnlineStats);

/**
 * @openapi
 * /api/manage/cs/stats/team:
 *   get:
 *     summary: 获取团队统计
 *     description: 获取客服团队的整体统计数据
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: 成功获取团队统计
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalAgents:
 *                       type: integer
 *                     totalSessions:
 *                       type: integer
 *                     avgResponseTime:
 *                       type: number
 *                     satisfactionRate:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/team', requirePermission(Resource.CS_STATS, Action.VIEW), csStatsController.getTeamStats);

export default router;
