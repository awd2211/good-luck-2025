/**
 * 用户通知管理路由 (用户端)
 *
 * 文件: user/notifications.ts
 * 标签: User - Notifications
 * 前缀: /api/notifications
 *
 * 已完成的路由 (6个):
 *   - GET /user - 获取用户通知列表
 *   - GET /unread-count - 获取未读通知数量
 *   - POST /:id/read - 标记通知为已读
 *   - POST /read-all - 标记所有通知为已读
 *   - POST /:id/click - 记录通知点击
 *   - DELETE /:id/delete - 删除通知
 */

import express from 'express';
import * as notificationController from '../../controllers/user/notificationController';

const router = express.Router();

/**
 * @openapi
 * /api/notifications/user:
 *   get:
 *     summary: 获取用户通知列表
 *     description: 获取当前登录用户的所有通知记录,支持分页和已读状态筛选
 *     tags:
 *       - User - Notifications
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: 筛选已读/未读通知
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [system, promotion, announcement]
 *         description: 通知类型筛选
 *     responses:
 *       200:
 *         description: 成功获取通知列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       type:
 *                         type: string
 *                       priority:
 *                         type: string
 *                       isRead:
 *                         type: boolean
 *                       readAt:
 *                         type: string
 *                         format: date-time
 *                       clickCount:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/user', notificationController.getUserNotifications);

/**
 * @openapi
 * /api/notifications/unread-count:
 *   get:
 *     summary: 获取未读通知数量
 *     description: 获取当前登录用户的未读通知总数
 *     tags:
 *       - User - Notifications
 *     security:
 *       - UserBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取未读数量
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
 *                     unreadCount:
 *                       type: integer
 *                       description: 未读通知数量
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   post:
 *     summary: 标记通知为已读
 *     description: 将指定的通知标记为已读状态
 *     tags:
 *       - User - Notifications
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知ID
 *     responses:
 *       200:
 *         description: 标记成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/read', notificationController.markAsRead);

/**
 * @openapi
 * /api/notifications/read-all:
 *   post:
 *     summary: 标记所有通知为已读
 *     description: 将当前用户的所有未读通知标记为已读
 *     tags:
 *       - User - Notifications
 *     security:
 *       - UserBearerAuth: []
 *     responses:
 *       200:
 *         description: 标记成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "所有通知已标记为已读"
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 *                       description: 更新的通知数量
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/read-all', notificationController.markAllAsRead);

/**
 * @openapi
 * /api/notifications/{id}/click:
 *   post:
 *     summary: 记录通知点击
 *     description: 记录用户点击通知的行为,用于统计分析
 *     tags:
 *       - User - Notifications
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知ID
 *     responses:
 *       200:
 *         description: 点击记录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "点击已记录"
 *                 data:
 *                   type: object
 *                   properties:
 *                     clickCount:
 *                       type: integer
 *                       description: 总点击次数
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/click', notificationController.recordClick);

/**
 * @openapi
 * /api/notifications/{id}/delete:
 *   delete:
 *     summary: 删除通知
 *     description: 删除指定的通知记录(软删除)
 *     tags:
 *       - User - Notifications
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 通知ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id/delete', notificationController.deleteNotification);

export default router;
