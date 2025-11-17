/**
 * 管理端 - 客户画像路由
 */

import express from 'express';
import * as profileController from '../../controllers/webchat/customerProfileController';

const router = express.Router();

/**
 * @openapi
 * /api/manage/customer-profiles:
 *   get:
 *     summary: 获取客户画像列表
 *     tags: [Admin - Customer Profile]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vipLevel
 *         schema:
 *           type: integer
 *       - in: query
 *         name: riskScoreMin
 *         schema:
 *           type: integer
 *       - in: query
 *         name: riskScoreMax
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/', profileController.getCustomerProfiles);

/**
 * @openapi
 * /api/manage/customer-profiles/{userId}:
 *   get:
 *     summary: 获取客户画像详情
 *     tags: [Admin - Customer Profile]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/:userId', profileController.getCustomerProfile);

/**
 * @openapi
 * /api/manage/customer-profiles/{userId}:
 *   put:
 *     summary: 更新客户画像
 *     tags: [Admin - Customer Profile]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vipLevel:
 *                 type: integer
 *               riskScore:
 *                 type: integer
 *               lifetimeValue:
 *                 type: number
 *               preferredAgentId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/:userId', profileController.updateCustomerProfile);

/**
 * @openapi
 * /api/manage/customer-profiles/behaviors/log:
 *   post:
 *     summary: 记录客户行为
 *     tags: [Admin - Customer Profile]
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, actionType]
 *             properties:
 *               userId:
 *                 type: string
 *               actionType:
 *                 type: string
 *               actionDetail:
 *                 type: object
 *               ipAddress:
 *                 type: string
 *               userAgent:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/behaviors/log', profileController.logCustomerBehavior);

/**
 * @openapi
 * /api/manage/customer-profiles/statistics:
 *   get:
 *     summary: 获取客户统计
 *     tags: [Admin - Customer Profile]
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/statistics/overview', profileController.getStatistics);

/**
 * @openapi
 * /api/manage/customer-profiles/search:
 *   get:
 *     summary: 搜索客户
 *     tags: [Admin - Customer Profile]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/search/query', profileController.searchCustomers);

export default router;
