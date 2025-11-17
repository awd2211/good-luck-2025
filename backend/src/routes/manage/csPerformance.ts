/**
 * 管理端 - 客服绩效路由
 */

import express from 'express';
import * as performanceController from '../../controllers/webchat/performanceController';

const router = express.Router();

/**
 * @openapi
 * /api/manage/cs/performance/ranking:
 *   get:
 *     summary: 获取绩效排行榜
 *     description: 获取客服绩效排行榜数据
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 成功获取排行榜
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/ranking', performanceController.getPerformanceRanking);

/**
 * @openapi
 * /api/manage/cs/performance/report:
 *   get:
 *     summary: 获取详细绩效报表
 *     description: 获取客服的详细绩效报表数据
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
 *         description: 成功获取报表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/report', performanceController.getDetailedReport);

/**
 * @openapi
 * /api/manage/cs/performance/team:
 *   get:
 *     summary: 获取团队统计数据
 *     description: 获取整个客服团队的统计数据
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
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/team', performanceController.getTeamStatistics);

/**
 * @openapi
 * /api/manage/cs/performance/{agentId}:
 *   get:
 *     summary: 获取客服绩效数据
 *     description: 获取指定客服的绩效数据
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 客服ID
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
 *         description: 成功获取绩效数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:agentId', performanceController.getAgentPerformance);

/**
 * @openapi
 * /api/manage/cs/performance/update-daily:
 *   post:
 *     summary: 更新每日绩效数据
 *     description: 系统调用接口,更新客服每日绩效数据
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/update-daily', performanceController.updateDailyPerformance);

/**
 * @openapi
 * /api/manage/cs/performance/increment:
 *   post:
 *     summary: 增量更新绩效统计
 *     description: 系统调用接口,增量更新绩效统计数据
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId:
 *                 type: string
 *               metric:
 *                 type: string
 *               value:
 *                 type: number
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/increment', performanceController.incrementStats);

/**
 * @openapi
 * /api/manage/cs/performance/aggregate:
 *   post:
 *     summary: 聚合平均值数据
 *     description: 系统调用接口,聚合计算平均值数据
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 聚合成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/aggregate', performanceController.aggregateAverages);

export default router;
