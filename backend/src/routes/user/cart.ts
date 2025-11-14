import { Router } from 'express'
import * as cartController from '../../controllers/user/cartController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

// 所有购物车接口都需要用户认证
router.use(authenticateUser)

/**
 * @route   GET /api/cart
 * @desc    获取购物车
 * @access  Private (User)
 */
router.get('/', cartController.getCart)

/**
 * @route   POST /api/cart
 * @desc    添加到购物车
 * @access  Private (User)
 */
router.post('/', cartController.addToCart)

/**
 * @route   PUT /api/cart/:id
 * @desc    更新购物车商品数量
 * @access  Private (User)
 */
router.put('/:id', cartController.updateCartItem)

/**
 * @route   DELETE /api/cart/:id
 * @desc    删除购物车商品
 * @access  Private (User)
 */
router.delete('/:id', cartController.removeFromCart)

/**
 * @route   POST /api/cart/batch-delete
 * @desc    批量删除购物车商品
 * @access  Private (User)
 */
router.post('/batch-delete', cartController.batchRemove)

/**
 * @route   DELETE /api/cart
 * @desc    清空购物车
 * @access  Private (User)
 */
router.delete('/', cartController.clearCart)

export default router
