/**
 * 管理端 - 培训系统路由
 */

import express from 'express';
import * as trainingController from '../../controllers/webchat/trainingController';

const router = express.Router();

// ==================== 课程管理 ====================

/**
 * @openapi
 * /api/manage/training/courses:
 *   get:
 *     summary: 获取课程列表
 *     tags: [Admin - Training]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isMandatory
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isPublished
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
router.get('/courses', trainingController.getCourses);

/**
 * @openapi
 * /api/manage/training/courses/{id}:
 *   get:
 *     summary: 获取课程详情
 *     tags: [Admin - Training]
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
router.get('/courses/:id', trainingController.getCourseById);

/**
 * @openapi
 * /api/manage/training/courses:
 *   post:
 *     summary: 创建课程
 *     tags: [Admin - Training]
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               durationMinutes:
 *                 type: integer
 *               passingScore:
 *                 type: integer
 *               isMandatory:
 *                 type: boolean
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/courses', trainingController.createCourse);

/**
 * @openapi
 * /api/manage/training/courses/{id}:
 *   put:
 *     summary: 更新课程
 *     tags: [Admin - Training]
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
router.put('/courses/:id', trainingController.updateCourse);

/**
 * @openapi
 * /api/manage/training/courses/{id}:
 *   delete:
 *     summary: 删除课程
 *     tags: [Admin - Training]
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
router.delete('/courses/:id', trainingController.deleteCourse);

// ==================== 培训记录 ====================

/**
 * @openapi
 * /api/manage/training/records:
 *   get:
 *     summary: 获取培训记录列表
 *     tags: [Admin - Training]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: integer
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
router.get('/records', trainingController.getTrainingRecords);

/**
 * @openapi
 * /api/manage/training/records:
 *   post:
 *     summary: 创建培训记录
 *     tags: [Admin - Training]
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agentId, courseId]
 *             properties:
 *               agentId:
 *                 type: integer
 *               courseId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/records', trainingController.createTrainingRecord);

/**
 * @openapi
 * /api/manage/training/records/{id}:
 *   put:
 *     summary: 更新培训记录
 *     tags: [Admin - Training]
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
router.put('/records/:id', trainingController.updateTrainingRecord);

/**
 * @openapi
 * /api/manage/training/statistics:
 *   get:
 *     summary: 获取培训统计
 *     tags: [Admin - Training]
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/statistics', trainingController.getStatistics);

export default router;
