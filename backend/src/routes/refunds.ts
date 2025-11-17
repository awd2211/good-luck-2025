import { Router } from 'express';
import {
  getRefunds,
  getRefund,
  addRefund,
  handleReviewRefund,
  modifyRefundStatus,
  removeRefund,
} from '../controllers/refundController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

/**
 * @openapi
 * /api/manage/refunds:
 *   get:
 *     summary: 获取退款列表
 *     description: 分页获取退款申请列表，支持按状态、用户筛选
 *     tags:
 *       - Admin - Refunds
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
 *           enum: [pending, approved, rejected, processing, completed, failed]
 *         description: 退款状态
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: 按用户ID筛选
 *       - in: query
 *         name: order_id
 *         schema:
 *           type: string
 *         description: 按订单ID筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', authenticate, requirePermission(Resource.REFUNDS, Action.VIEW), getRefunds);

/**
 * @openapi
 * /api/manage/refunds/{id}:
 *   get:
 *     summary: 获取退款详情
 *     description: 根据ID获取单个退款申请的详细信息
 *     tags:
 *       - Admin - Refunds
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
 *                     order_id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                       example: 99.00
 *                     reason:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, approved, rejected, processing, completed, failed]
 *                     review_comment:
 *                       type: string
 *                       description: 审核备注
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 退款申请不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', authenticate, requirePermission(Resource.REFUNDS, Action.VIEW), getRefund);

/**
 * @openapi
 * /api/manage/refunds:
 *   post:
 *     summary: 创建退款申请（管理员代建）
 *     description: 管理员代替用户创建退款申请
 *     tags:
 *       - Admin - Refunds
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
 *               - order_id
 *               - amount
 *               - reason
 *             properties:
 *               user_id:
 *                 type: string
 *               order_id:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 99.00
 *                 description: 退款金额
 *               reason:
 *                 type: string
 *                 example: 服务不满意
 *                 description: 退款原因
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/', authenticate, requirePermission(Resource.REFUNDS, Action.CREATE), addRefund);

/**
 * @openapi
 * /api/manage/refunds/{id}/review:
 *   post:
 *     summary: 审核退款申请
 *     description: 审核通过或拒绝用户的退款申请
 *     tags:
 *       - Admin - Refunds
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
 *                 description: 审核结果
 *               comment:
 *                 type: string
 *                 example: 已核实，同意退款
 *                 description: 审核备注
 *     responses:
 *       200:
 *         description: 审核成功
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
 *                   example: 退款审核完成
 */
router.post('/:id/review', authenticate, requirePermission(Resource.REFUNDS, Action.EDIT), handleReviewRefund);

/**
 * @openapi
 * /api/manage/refunds/{id}/status:
 *   patch:
 *     summary: 修改退款状态
 *     description: 更新退款申请的处理状态
 *     tags:
 *       - Admin - Refunds
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
 *                 enum: [processing, completed, failed]
 *                 description: 新状态
 *               note:
 *                 type: string
 *                 description: 状态变更备注
 *     responses:
 *       200:
 *         description: 修改成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch('/:id/status', authenticate, requirePermission(Resource.REFUNDS, Action.EDIT), modifyRefundStatus);

/**
 * @openapi
 * /api/manage/refunds/{id}:
 *   delete:
 *     summary: 删除退款记录
 *     description: 删除退款申请记录（谨慎操作）
 *     tags:
 *       - Admin - Refunds
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
router.delete('/:id', authenticate, requirePermission(Resource.REFUNDS, Action.DELETE), removeRefund);

export default router;
