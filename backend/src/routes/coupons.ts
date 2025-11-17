import { Router } from 'express';
import { getCoupons, getCoupon, addCoupon, modifyCoupon, modifyCouponStatus, removeCoupon } from '../controllers/couponController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

/**
 * @openapi
 * /api/manage/coupons:
 *   get:
 *     summary: 获取优惠券列表
 *     description: 分页获取优惠券模板列表，支持按类型、状态筛选
 *     tags:
 *       - Admin - Coupons
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
 *           enum: [discount, cash, free_shipping]
 *         description: 优惠券类型
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, expired]
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', authenticate, requirePermission(Resource.COUPONS, Action.VIEW), getCoupons);

/**
 * @openapi
 * /api/manage/coupons/{id}:
 *   get:
 *     summary: 获取优惠券详情
 *     description: 根据ID获取单个优惠券模板的详细信息
 *     tags:
 *       - Admin - Coupons
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
 *                     name:
 *                       type: string
 *                       example: 新用户8折券
 *                     type:
 *                       type: string
 *                       enum: [discount, cash, free_shipping]
 *                     value:
 *                       type: number
 *                       example: 0.8
 *                     min_amount:
 *                       type: number
 *                       example: 100
 *                     max_uses:
 *                       type: integer
 *                       example: 1000
 *                     status:
 *                       type: string
 *       404:
 *         description: 优惠券不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', authenticate, requirePermission(Resource.COUPONS, Action.VIEW), getCoupon);

/**
 * @openapi
 * /api/manage/coupons:
 *   post:
 *     summary: 创建优惠券模板
 *     description: 创建一个新的优惠券模板
 *     tags:
 *       - Admin - Coupons
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - value
 *             properties:
 *               name:
 *                 type: string
 *                 example: 新用户8折券
 *               code:
 *                 type: string
 *                 example: NEW80
 *                 description: 优惠券代码（可选，不填则自动生成）
 *               type:
 *                 type: string
 *                 enum: [discount, cash, free_shipping]
 *               value:
 *                 type: number
 *                 example: 0.8
 *                 description: 折扣值（discount类型为0-1，cash类型为金额）
 *               min_amount:
 *                 type: number
 *                 example: 100
 *                 description: 最低消费金额
 *               max_uses:
 *                 type: integer
 *                 example: 1000
 *                 description: 最大使用次数
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
router.post('/', authenticate, requirePermission(Resource.COUPONS, Action.CREATE), addCoupon);

/**
 * @openapi
 * /api/manage/coupons/{id}:
 *   put:
 *     summary: 更新优惠券信息
 *     description: 更新指定优惠券模板的信息
 *     tags:
 *       - Admin - Coupons
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
 *               name:
 *                 type: string
 *               value:
 *                 type: number
 *               min_amount:
 *                 type: number
 *               max_uses:
 *                 type: integer
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
router.put('/:id', authenticate, requirePermission(Resource.COUPONS, Action.EDIT), modifyCoupon);

/**
 * @openapi
 * /api/manage/coupons/{id}/status:
 *   patch:
 *     summary: 修改优惠券状态
 *     description: 快速启用或停用优惠券
 *     tags:
 *       - Admin - Coupons
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
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: 修改成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch('/:id/status', authenticate, requirePermission(Resource.COUPONS, Action.EDIT), modifyCouponStatus);

/**
 * @openapi
 * /api/manage/coupons/{id}:
 *   delete:
 *     summary: 删除优惠券
 *     description: 删除指定优惠券模板
 *     tags:
 *       - Admin - Coupons
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
 *       404:
 *         description: 优惠券不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', authenticate, requirePermission(Resource.COUPONS, Action.DELETE), removeCoupon);

export default router;
