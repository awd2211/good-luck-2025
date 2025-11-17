/**
 * 管理端分享统计分析路由
 */

import { Router } from 'express';
import {
  getOverview,
  getConversionFunnel,
  getGeoDistribution,
  getDeviceDistribution,
  getTimeTrends,
  getLeaderboard,
  getViralTree,
  getKFactor,
  getABTestResults,
  getShareLinks
} from '../../controllers/manage/shareAnalyticsController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// 所有路由都需要管理员认证
router.use(authenticate);

/**
 * @openapi
 * /api/manage/share-analytics/overview:
 *   get:
 *     summary: 获取分享统计总览
 *     description: 获取分享功能的整体统计数据概览
 *     tags:
 *       - Admin - Share Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取统计总览
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/overview', getOverview);

/**
 * @openapi
 * /api/manage/share-analytics/funnel:
 *   get:
 *     summary: 获取转化漏斗
 *     description: 获取分享功能的转化漏斗数据
 *     tags:
 *       - Admin - Share Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取转化漏斗数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/funnel', getConversionFunnel);

/**
 * @openapi
 * /api/manage/share-analytics/geo:
 *   get:
 *     summary: 获取地理位置分布
 *     description: 获取分享用户的地理位置分布统计
 *     tags:
 *       - Admin - Share Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取地理分布数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/geo', getGeoDistribution);

/**
 * @openapi
 * /api/manage/share-analytics/devices:
 *   get:
 *     summary: 获取设备分布
 *     description: 获取分享用户的设备和浏览器分布统计
 *     tags:
 *       - Admin - Share Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取设备分布数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/devices', getDeviceDistribution);

/**
 * @openapi
 * /api/manage/share-analytics/trends:
 *   get:
 *     summary: 获取时间趋势
 *     description: 获取分享数据的时间趋势分析
 *     tags:
 *       - Admin - Share Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取趋势数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/trends', getTimeTrends);

/**
 * @openapi
 * /api/manage/share-analytics/leaderboard:
 *   get:
 *     summary: 获取分享排行榜
 *     description: 获取用户分享次数和效果排行榜
 *     tags:
 *       - Admin - Share Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取排行榜数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @openapi
 * /api/manage/share-analytics/viral-tree/{userId}:
 *   get:
 *     summary: 获取病毒传播树
 *     description: 获取指定用户的病毒式传播关系树
 *     tags:
 *       - Admin - Share Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取传播树数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/viral-tree/:userId', getViralTree);

/**
 * @openapi
 * /api/manage/share-analytics/k-factor/{userId}:
 *   get:
 *     summary: 获取K因子
 *     description: 获取指定用户的病毒传播K因子(平均每个用户带来的新用户数)
 *     tags:
 *       - Admin - Share Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取K因子数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/k-factor/:userId', getKFactor);

/**
 * @openapi
 * /api/manage/share-analytics/ab-test/{testId}:
 *   get:
 *     summary: 获取A/B测试结果
 *     description: 获取指定A/B测试的结果统计
 *     tags:
 *       - Admin - Share Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: 测试ID
 *     responses:
 *       200:
 *         description: 成功获取A/B测试结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/ab-test/:testId', getABTestResults);

/**
 * @openapi
 * /api/manage/share-analytics/links:
 *   get:
 *     summary: 获取分享链接列表
 *     description: 获取所有分享链接的列表和统计
 *     tags:
 *       - Admin - Share Analytics
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取分享链接列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/links', getShareLinks);

export default router;
