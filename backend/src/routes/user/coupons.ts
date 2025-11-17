import { Router } from 'express'
import * as couponController from '../../controllers/user/couponController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

/**
 * @openapi
 * /api/coupons/available:
 *   get:
 *     summary: 获取可领取的优惠券列表
 *     description: 公开接口,获取当前可领取的所有优惠券
 *     tags:
 *       - User - Coupons
 *     responses:
 *       200:
 *         description: 成功返回优惠券列表
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
 */
router.get('/available', couponController.getAvailableCoupons)

/**
 * @openapi
 * /api/coupons/receive:
 *   post:
 *     summary: 领取优惠券
 *     description: 用户领取指定的优惠券
 *     tags:
 *       - User - Coupons
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponId
 *             properties:
 *               couponId:
 *                 type: number
 *                 example: 1
 *                 description: 优惠券ID
 *     responses:
 *       201:
 *         description: 领取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 优惠券已领完或已领取过
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/receive', authenticateUser, couponController.receiveCoupon)

/**
 * @openapi
 * /api/coupons/my:
 *   get:
 *     summary: 获取用户的优惠券列表
 *     description: 获取当前用户的所有优惠券,支持按状态筛选
 *     tags:
 *       - User - Coupons
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['unused', 'used', 'expired']
 *         description: 优惠券状态筛选
 *     responses:
 *       200:
 *         description: 成功返回优惠券列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/my', authenticateUser, couponController.getUserCoupons)

/**
 * @openapi
 * /api/coupons/usable:
 *   get:
 *     summary: 获取可用的优惠券
 *     description: 获取下单时可使用的优惠券列表
 *     tags:
 *       - User - Coupons
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: 订单金额
 *         example: 99.00
 *       - in: query
 *         name: fortuneType
 *         schema:
 *           type: string
 *         description: 算命服务类型
 *         example: "bazi"
 *     responses:
 *       200:
 *         description: 成功返回可用优惠券
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 coupons:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/usable', authenticateUser, couponController.getUsableCoupons)

/**
 * @openapi
 * /api/coupons/stats:
 *   get:
 *     summary: 获取优惠券统计
 *     description: 获取用户优惠券的统计信息(未使用、已使用、已过期数量)
 *     tags:
 *       - User - Coupons
 *     security:
 *       - UserBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     unused:
 *                       type: integer
 *                       example: 5
 *                     used:
 *                       type: integer
 *                       example: 10
 *                     expired:
 *                       type: integer
 *                       example: 2
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', authenticateUser, couponController.getCouponStats)

/**
 * @openapi
 * /api/coupons/validate:
 *   post:
 *     summary: 验证优惠券是否可用
 *     description: 验证指定优惠券码是否可用于当前订单
 *     tags:
 *       - User - Coupons
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponCode
 *               - amount
 *             properties:
 *               couponCode:
 *                 type: string
 *                 example: "SAVE20"
 *                 description: 优惠券码
 *               amount:
 *                 type: number
 *                 example: 99.00
 *                 description: 订单金额
 *               fortuneType:
 *                 type: string
 *                 example: "bazi"
 *                 description: 算命服务类型
 *     responses:
 *       200:
 *         description: 返回优惠券验证结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 discount:
 *                   type: number
 *                   example: 20.00
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/validate', authenticateUser, couponController.validateCoupon)

export default router
