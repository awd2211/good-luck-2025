import { Router } from 'express'
import * as fortuneListController from '../../controllers/user/fortuneListController'
import { optionalUserAuth } from '../../middleware/userAuth'

const router = Router()

/**
 * @route   GET /api/fortunes
 * @desc    获取算命服务列表
 * @access  Public
 */
router.get('/', fortuneListController.getFortuneList)

/**
 * @route   GET /api/fortunes/popular
 * @desc    获取热门服务
 * @access  Public
 */
router.get('/popular', fortuneListController.getPopularFortunes)

/**
 * @route   GET /api/fortunes/recommended
 * @desc    获取推荐服务
 * @access  Public
 */
router.get('/recommended', fortuneListController.getRecommendedFortunes)

/**
 * @route   GET /api/fortunes/categories
 * @desc    获取分类列表
 * @access  Public
 */
router.get('/categories', fortuneListController.getCategories)

/**
 * @route   GET /api/fortunes/:id
 * @desc    获取算命服务详情 (可选登录，登录后返回收藏状态)
 * @access  Public (登录后包含收藏状态)
 */
router.get('/:id', optionalUserAuth, fortuneListController.getFortuneDetail)

export default router
