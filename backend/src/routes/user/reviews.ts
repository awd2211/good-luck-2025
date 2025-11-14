import { Router } from 'express'
import * as reviewController from '../../controllers/user/reviewController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

/**
 * @route   GET /api/reviews/fortune/:fortuneType
 * @desc    获取算命服务的评价列表（公开接口）
 * @access  Public
 * @query   page, limit, rating
 */
router.get('/fortune/:fortuneType', reviewController.getFortuneReviews)

/**
 * @route   GET /api/reviews/:id
 * @desc    获取评价详情
 * @access  Public
 */
router.get('/:id', reviewController.getReviewDetail)

/**
 * @route   POST /api/reviews
 * @desc    创建评价
 * @access  Private (用户)
 * @body    { orderId, rating, content?, images?, tags?, isAnonymous? }
 */
router.post('/', authenticateUser, reviewController.createReview)

/**
 * @route   GET /api/reviews/my/list
 * @desc    获取用户的评价列表
 * @access  Private (用户)
 * @query   page, limit
 */
router.get('/my/list', authenticateUser, reviewController.getUserReviews)

/**
 * @route   DELETE /api/reviews/:id
 * @desc    删除评价
 * @access  Private (用户)
 */
router.delete('/:id', authenticateUser, reviewController.deleteReview)

/**
 * @route   POST /api/reviews/:id/helpful
 * @desc    点赞评价（标记为有帮助）
 * @access  Public
 */
router.post('/:id/helpful', reviewController.markHelpful)

/**
 * @route   GET /api/reviews/check/:orderId
 * @desc    检查订单是否可以评价
 * @access  Private (用户)
 */
router.get('/check/:orderId', authenticateUser, reviewController.canReviewOrder)

export default router
