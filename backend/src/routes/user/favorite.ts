import { Router } from 'express'
import * as favoriteController from '../../controllers/user/favoriteController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

// 所有收藏接口都需要用户认证
router.use(authenticateUser)

/**
 * @route   GET /api/favorites
 * @desc    获取收藏列表
 * @access  Private (User)
 */
router.get('/', favoriteController.getFavorites)

/**
 * @route   POST /api/favorites
 * @desc    添加收藏
 * @access  Private (User)
 */
router.post('/', favoriteController.addFavorite)

/**
 * @route   DELETE /api/favorites/:fortuneId
 * @desc    取消收藏
 * @access  Private (User)
 */
router.delete('/:fortuneId', favoriteController.removeFavorite)

/**
 * @route   GET /api/favorites/check/:fortuneId
 * @desc    检查是否收藏
 * @access  Private (User)
 */
router.get('/check/:fortuneId', favoriteController.checkFavorite)

/**
 * @route   POST /api/favorites/batch-check
 * @desc    批量检查收藏状态
 * @access  Private (User)
 */
router.post('/batch-check', favoriteController.batchCheckFavorites)

export default router
