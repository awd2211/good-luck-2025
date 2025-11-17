import { Router } from 'express';
import {
  getNotifications,
  getNotification,
  addNotification,
  modifyNotification,
  removeNotification,
  batchUpdateStatus,
} from '../controllers/notificationController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

/**
 * @openapi
 * /api/manage/notifications:
 *   get:
 *     summary: 获取通知列表
 *     description: 分页获取系统通知列表，支持按类型、状态筛选
 *     tags:
 *       - Admin - Notifications
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [system, promotion, update, maintenance]
 *         description: 通知类型
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.VIEW), getNotifications);

/**
 * @openapi
 * /api/manage/notifications/{id}:
 *   get:
 *     summary: 获取通知详情
 *     description: 根据ID获取单条通知的详细信息
 *     tags:
 *       - Admin - Notifications
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                       example: 系统维护通知
 *                     content:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [system, promotion, update, maintenance]
 *                     status:
 *                       type: string
 *                     priority:
 *                       type: string
 *                       enum: [low, medium, high]
 */
router.get('/:id', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.VIEW), getNotification);

/**
 * @openapi
 * /api/manage/notifications:
 *   post:
 *     summary: 创建新通知
 *     description: 创建一条新的系统通知
 *     tags:
 *       - Admin - Notifications
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 example: 系统维护通知
 *               content:
 *                 type: string
 *                 example: 系统将于今晚22:00-24:00进行维护
 *               type:
 *                 type: string
 *                 enum: [system, promotion, update, maintenance]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.CREATE), addNotification);

/**
 * @openapi
 * /api/manage/notifications/{id}:
 *   put:
 *     summary: 更新通知信息
 *     description: 更新指定通知的信息
 *     tags:
 *       - Admin - Notifications
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [system, promotion, update, maintenance]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put('/:id', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.EDIT), modifyNotification);

/**
 * @openapi
 * /api/manage/notifications/batch/status:
 *   post:
 *     summary: 批量修改通知状态
 *     description: 批量启用或停用多条通知
 *     tags:
 *       - Admin - Notifications
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - status
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["notif-001", "notif-002"]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: 批量修改成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 已修改2条通知状态
 */
router.post('/batch/status', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.EDIT), batchUpdateStatus);

/**
 * @openapi
 * /api/manage/notifications/{id}:
 *   delete:
 *     summary: 删除通知
 *     description: 删除指定通知
 *     tags:
 *       - Admin - Notifications
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete('/:id', authenticate, requirePermission(Resource.NOTIFICATIONS, Action.DELETE), removeNotification);

export default router;
