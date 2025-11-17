/**
 * 管理端 - 质检管理路由
 */

import express from 'express';
import * as qualityController from '../../controllers/webchat/qualityController';

const router = express.Router();

/**
 * @openapi
 * /api/manage/cs/quality/statistics:
 *   get:
 *     summary: 获取质检统计数据
 *     description: 获取质检评分分布、常见问题等统计信息
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: integer
 *         description: 客服ID (可选)
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
 *         description: 成功获取统计数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/statistics', qualityController.getStatistics);

/**
 * @openapi
 * /api/manage/cs/quality:
 *   get:
 *     summary: 获取质检记录列表
 *     description: 获取质检记录,支持多条件筛选和分页
 *     tags:
 *       - Admin - Customer Service
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, appealing, closed]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 成功获取质检记录列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', qualityController.getInspections);

/**
 * @openapi
 * /api/manage/cs/quality:
 *   post:
 *     summary: 创建质检记录
 *     description: 为客服会话创建新的质检记录
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - agentId
 *               - qualityScore
 *             properties:
 *               sessionId:
 *                 type: integer
 *                 description: 会话ID
 *               agentId:
 *                 type: integer
 *                 description: 客服ID
 *               qualityScore:
 *                 type: number
 *                 description: 总分 (0-100)
 *               serviceAttitude:
 *                 type: number
 *                 description: 服务态度分 (0-20)
 *               responseSpeed:
 *                 type: number
 *                 description: 响应速度分 (0-20)
 *               problemSolving:
 *                 type: number
 *                 description: 问题解决分 (0-30)
 *               compliance:
 *                 type: number
 *                 description: 合规性分 (0-15)
 *               communication:
 *                 type: number
 *                 description: 沟通能力分 (0-15)
 *               issues:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 发现的问题列表
 *               suggestions:
 *                 type: string
 *                 description: 改进建议
 *     responses:
 *       201:
 *         description: 质检记录创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/', qualityController.createInspection);

/**
 * @openapi
 * /api/manage/cs/quality/{id}:
 *   put:
 *     summary: 更新质检记录
 *     description: 更新指定的质检记录
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 质检记录ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qualityScore:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [pending, completed, appealing, closed]
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put('/:id', qualityController.updateInspection);

/**
 * @openapi
 * /api/manage/cs/quality/{id}:
 *   delete:
 *     summary: 删除质检记录
 *     description: 删除指定的质检记录
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 质检记录ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete('/:id', qualityController.deleteInspection);

export default router;
