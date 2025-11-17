import { Router } from 'express';
import { getActiveNotificationsPublic } from '../../controllers/notificationController';

const router = Router();

/**
 * @openapi
 * /api/public/notifications:
 *   get:
 *     summary: 获取激活的通知
 *     description: 公开接口,获取当前激活的系统通知,无需认证
 *     tags:
 *       - Public - Notifications
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
 *     responses:
 *       200:
 *         description: 成功返回通知列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "notify-001"
 *                       title:
 *                         type: string
 *                         example: "系统维护通知"
 *                       content:
 *                         type: string
 *                         example: "本系统将于今晚进行维护"
 *                       type:
 *                         type: string
 *                         enum: ['info', 'warning', 'error', 'success']
 *                         example: "info"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 */
router.get('/', getActiveNotificationsPublic);

export default router;
