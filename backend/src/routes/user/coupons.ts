import { Router } from 'express'
import * as couponController from '../../controllers/user/couponController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

/**
 * @route   GET /api/coupons/available
 * @desc    获取可领取的优惠券列表（公开接口，可选登录）
 * @access  Public
 */
router.get('/available', couponController.getAvailableCoupons)

/**
 * @route   POST /api/coupons/receive
 * @desc    领取优惠券
 * @access  Private (用户)
 * @body    { couponId: number }
 */
router.post('/receive', authenticateUser, couponController.receiveCoupon)

/**
 * @route   GET /api/coupons/my
 * @desc    获取用户的优惠券列表
 * @access  Private (用户)
 * @query   page, limit, status
 */
router.get('/my', authenticateUser, couponController.getUserCoupons)

/**
 * @route   GET /api/coupons/usable
 * @desc    获取可用的优惠券（用于下单时选择）
 * @access  Private (用户)
 * @query   amount (required), fortuneType (optional)
 */
router.get('/usable', authenticateUser, couponController.getUsableCoupons)

/**
 * @route   GET /api/coupons/stats
 * @desc    获取优惠券统计
 * @access  Private (用户)
 */
router.get('/stats', authenticateUser, couponController.getCouponStats)

/**
 * @route   POST /api/coupons/validate
 * @desc    验证优惠券是否可用
 * @access  Private (用户)
 * @body    { couponCode: string, amount: number, fortuneType?: string }
 */
router.post('/validate', authenticateUser, couponController.validateCoupon)

export default router
