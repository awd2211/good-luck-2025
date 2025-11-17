/**
 * 管理端 - 客服排班管理路由
 */

import express from 'express';
import * as scheduleController from '../../controllers/webchat/csScheduleController';

const router = express.Router();

// ==================== 排班管理 ====================

/**
 * @openapi
 * /api/manage/cs-schedule/schedules:
 *   get:
 *     summary: 获取排班列表
 *     tags: [Admin - CS Schedule]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: integer
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
 *         name: shiftType
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
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
router.get('/schedules', scheduleController.getSchedules);

/**
 * @openapi
 * /api/manage/cs-schedule/schedules/{id}:
 *   get:
 *     summary: 获取排班详情
 *     tags: [Admin - CS Schedule]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/schedules/:id', scheduleController.getScheduleById);

/**
 * @openapi
 * /api/manage/cs-schedule/schedules:
 *   post:
 *     summary: 创建排班
 *     tags: [Admin - CS Schedule]
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agentId, scheduleDate, shiftType, startTime, endTime]
 *             properties:
 *               agentId:
 *                 type: integer
 *               scheduleDate:
 *                 type: string
 *                 format: date
 *               shiftType:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/schedules', scheduleController.createSchedule);

/**
 * @openapi
 * /api/manage/cs-schedule/schedules/{id}:
 *   put:
 *     summary: 更新排班
 *     tags: [Admin - CS Schedule]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/schedules/:id', scheduleController.updateSchedule);

/**
 * @openapi
 * /api/manage/cs-schedule/schedules/{id}:
 *   delete:
 *     summary: 删除排班
 *     tags: [Admin - CS Schedule]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.delete('/schedules/:id', scheduleController.deleteSchedule);

/**
 * @openapi
 * /api/manage/cs-schedule/schedules/batch:
 *   post:
 *     summary: 批量创建排班
 *     tags: [Admin - CS Schedule]
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [schedules]
 *             properties:
 *               schedules:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/schedules/batch', scheduleController.batchCreateSchedules);

/**
 * @openapi
 * /api/manage/cs-schedule/statistics:
 *   get:
 *     summary: 获取排班统计
 *     tags: [Admin - CS Schedule]
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
 *         description: 成功
 */
router.get('/statistics', scheduleController.getScheduleStatistics);

// ==================== 调班请求 ====================

/**
 * @openapi
 * /api/manage/cs-schedule/swap-requests:
 *   get:
 *     summary: 获取调班请求列表
 *     tags: [Admin - CS Schedule]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
router.get('/swap-requests', scheduleController.getSwapRequests);

/**
 * @openapi
 * /api/manage/cs-schedule/swap-requests:
 *   post:
 *     summary: 创建调班请求
 *     tags: [Admin - CS Schedule]
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requesterId, targetId, requesterScheduleId, targetScheduleId]
 *             properties:
 *               requesterId:
 *                 type: integer
 *               targetId:
 *                 type: integer
 *               requesterScheduleId:
 *                 type: integer
 *               targetScheduleId:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/swap-requests', scheduleController.createSwapRequest);

/**
 * @openapi
 * /api/manage/cs-schedule/swap-requests/{id}/review:
 *   post:
 *     summary: 审批调班请求
 *     tags: [Admin - CS Schedule]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status, reviewedBy]
 *             properties:
 *               status:
 *                 type: string
 *               reviewedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.post('/swap-requests/:id/review', scheduleController.reviewSwapRequest);

export default router;
