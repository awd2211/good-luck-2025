import express from 'express'
import {
  getDashboard,
  getRevenue,
  getUserGrowth,
  getDistribution
} from '../controllers/statsController'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'

const router = express.Router()

/**
 * @openapi
 * /api/manage/stats/dashboard:
 *   get:
 *     summary: 获取仪表板数据
 *     description: 获取管理后台仪表板的核心统计数据
 *     tags:
 *       - Admin - Stats
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回仪表板数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/dashboard', authenticate, requirePermission(Resource.STATS, Action.VIEW), getDashboard)

/**
 * @openapi
 * /api/manage/stats/revenue:
 *   get:
 *     summary: 获取营收统计
 *     description: 获取营收趋势和详细数据
 *     tags:
 *       - Admin - Stats
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功返回营收数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/revenue', authenticate, requirePermission(Resource.STATS, Action.VIEW), getRevenue)

/**
 * @openapi
 * /api/manage/stats/user-growth:
 *   get:
 *     summary: 获取用户增长数据
 *     description: 获取用户增长趋势统计
 *     tags:
 *       - Admin - Stats
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['day', 'week', 'month']
 *         description: 统计周期
 *     responses:
 *       200:
 *         description: 成功返回用户增长数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/user-growth', authenticate, requirePermission(Resource.STATS, Action.VIEW), getUserGrowth)

/**
 * @openapi
 * /api/manage/stats/distribution:
 *   get:
 *     summary: 获取数据分布统计
 *     description: 获取订单、用户等数据的分布情况
 *     tags:
 *       - Admin - Stats
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回分布数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/distribution', authenticate, requirePermission(Resource.STATS, Action.VIEW), getDistribution)

export default router
