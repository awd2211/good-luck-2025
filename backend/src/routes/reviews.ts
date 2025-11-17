import { Router } from 'express';
import { getReviews, getReview, addReview, modifyReviewStatus, handleReplyReview, removeReview } from '../controllers/reviewController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

/**
 * @openapi
 * /api/manage/reviews:
 *   get:
 *     summary: 获取评价列表
 *     description: 分页获取用户评价列表，支持按状态、评分筛选
 *     tags:
 *       - Admin - Reviews
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: 审核状态
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: 按评分筛选
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: 按用户ID筛选
 *       - in: query
 *         name: fortune_id
 *         schema:
 *           type: string
 *         description: 按服务ID筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', authenticate, requirePermission(Resource.REVIEWS, Action.VIEW), getReviews);

/**
 * @openapi
 * /api/manage/reviews/{id}:
 *   get:
 *     summary: 获取评价详情
 *     description: 根据ID获取单条评价的详细信息
 *     tags:
 *       - Admin - Reviews
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
 *                     fortune_id:
 *                       type: string
 *                     rating:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 5
 *                     content:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, approved, rejected]
 *                     reply:
 *                       type: string
 *                       description: 管理员回复
 */
router.get('/:id', authenticate, requirePermission(Resource.REVIEWS, Action.VIEW), getReview);

/**
 * @openapi
 * /api/manage/reviews:
 *   post:
 *     summary: 创建评价（管理员代发）
 *     description: 管理员代替用户创建评价
 *     tags:
 *       - Admin - Reviews
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
 *               - fortune_id
 *               - rating
 *               - content
 *             properties:
 *               user_id:
 *                 type: string
 *               fortune_id:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *                 default: approved
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/', authenticate, requirePermission(Resource.REVIEWS, Action.CREATE), addReview);

/**
 * @openapi
 * /api/manage/reviews/{id}/status:
 *   patch:
 *     summary: 修改评价审核状态
 *     description: 审核通过或拒绝用户评价
 *     tags:
 *       - Admin - Reviews
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               reason:
 *                 type: string
 *                 description: 拒绝原因（当status为rejected时必填）
 *     responses:
 *       200:
 *         description: 修改成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch('/:id/status', authenticate, requirePermission(Resource.REVIEWS, Action.EDIT), modifyReviewStatus);

/**
 * @openapi
 * /api/manage/reviews/{id}/reply:
 *   post:
 *     summary: 回复用户评价
 *     description: 管理员回复用户的评价
 *     tags:
 *       - Admin - Reviews
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
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 example: 感谢您的反馈，我们会继续努力！
 *     responses:
 *       200:
 *         description: 回复成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/:id/reply', authenticate, requirePermission(Resource.REVIEWS, Action.EDIT), handleReplyReview);

/**
 * @openapi
 * /api/manage/reviews/{id}:
 *   delete:
 *     summary: 删除评价
 *     description: 删除不当评价
 *     tags:
 *       - Admin - Reviews
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
router.delete('/:id', authenticate, requirePermission(Resource.REVIEWS, Action.DELETE), removeReview);

export default router;
