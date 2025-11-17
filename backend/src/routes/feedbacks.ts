import { Router } from 'express';
import { getFeedbacks, getFeedback, addFeedback, modifyFeedback, removeFeedback } from '../controllers/feedbackController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

/**
 * @openapi
 * /api/manage/feedbacks:
 *   get:
 *     summary: 获取反馈列表
 *     description: 分页获取用户反馈列表，支持按类型、状态筛选
 *     tags:
 *       - Admin - Feedbacks
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
 *           enum: [bug, suggestion, complaint, praise, other]
 *         description: 反馈类型
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, resolved, closed]
 *         description: 处理状态
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: 按用户ID筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', authenticate, requirePermission(Resource.FEEDBACKS, Action.VIEW), getFeedbacks);

/**
 * @openapi
 * /api/manage/feedbacks/{id}:
 *   get:
 *     summary: 获取反馈详情
 *     description: 根据ID获取单条用户反馈的详细信息
 *     tags:
 *       - Admin - Feedbacks
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
 *                     user_id:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [bug, suggestion, complaint, praise, other]
 *                     title:
 *                       type: string
 *                       example: 支付页面加载慢
 *                     content:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, resolved, closed]
 *                     reply:
 *                       type: string
 *                       description: 管理员回复
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 反馈不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', authenticate, requirePermission(Resource.FEEDBACKS, Action.VIEW), getFeedback);

/**
 * @openapi
 * /api/manage/feedbacks:
 *   post:
 *     summary: 创建反馈（管理员代建）
 *     description: 管理员代替用户创建反馈
 *     tags:
 *       - Admin - Feedbacks
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - type
 *               - title
 *               - content
 *             properties:
 *               user_id:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [bug, suggestion, complaint, praise, other]
 *               title:
 *                 type: string
 *                 example: 支付页面加载慢
 *               content:
 *                 type: string
 *                 example: 在使用支付功能时，页面加载需要等待很久
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/', authenticate, requirePermission(Resource.FEEDBACKS, Action.CREATE), addFeedback);

/**
 * @openapi
 * /api/manage/feedbacks/{id}:
 *   put:
 *     summary: 更新反馈信息
 *     description: 更新反馈的处理状态和回复
 *     tags:
 *       - Admin - Feedbacks
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
 *               status:
 *                 type: string
 *                 enum: [pending, processing, resolved, closed]
 *               reply:
 *                 type: string
 *                 example: 感谢您的反馈，我们已优化了支付页面的加载速度
 *                 description: 管理员回复
 *               note:
 *                 type: string
 *                 description: 内部备注
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put('/:id', authenticate, requirePermission(Resource.FEEDBACKS, Action.EDIT), modifyFeedback);

/**
 * @openapi
 * /api/manage/feedbacks/{id}:
 *   delete:
 *     summary: 删除反馈
 *     description: 删除指定的用户反馈
 *     tags:
 *       - Admin - Feedbacks
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
router.delete('/:id', authenticate, requirePermission(Resource.FEEDBACKS, Action.DELETE), removeFeedback);

export default router;
