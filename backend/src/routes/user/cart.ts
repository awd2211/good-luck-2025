import { Router } from 'express'
import * as cartController from '../../controllers/user/cartController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

// 所有购物车接口都需要用户认证
router.use(authenticateUser)

/**
 * @openapi
 * /api/cart:
 *   get:
 *     summary: 获取购物车
 *     description: 获取当前用户的购物车列表及商品详情
 *     tags:
 *       - User - Cart
 *     security:
 *       - UserBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回购物车列表
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
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "cart-001"
 *                       fortune_id:
 *                         type: string
 *                         example: "fortune-001"
 *                       fortune_name:
 *                         type: string
 *                         example: "八字精批"
 *                       price:
 *                         type: number
 *                         example: 99.00
 *                       quantity:
 *                         type: integer
 *                         example: 1
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', cartController.getCart)

/**
 * @openapi
 * /api/cart:
 *   post:
 *     summary: 添加到购物车
 *     description: 将算命服务添加到用户购物车
 *     tags:
 *       - User - Cart
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fortune_id
 *             properties:
 *               fortune_id:
 *                 type: string
 *                 example: "fortune-001"
 *                 description: 算命服务ID
 *               quantity:
 *                 type: integer
 *                 example: 1
 *                 default: 1
 *                 description: 数量
 *     responses:
 *       201:
 *         description: 添加成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 商品不存在或已在购物车
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
router.post('/', cartController.addToCart)

/**
 * @openapi
 * /api/cart/{id}:
 *   put:
 *     summary: 更新购物车商品数量
 *     description: 更新购物车中指定商品的数量
 *     tags:
 *       - User - Cart
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 购物车项ID
 *         example: "cart-001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *                 description: 新的数量
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 购物车项不存在
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
router.put('/:id', cartController.updateCartItem)

/**
 * @openapi
 * /api/cart/{id}:
 *   delete:
 *     summary: 删除购物车商品
 *     description: 从购物车中删除指定商品
 *     tags:
 *       - User - Cart
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 购物车项ID
 *         example: "cart-001"
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 购物车项不存在
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
router.delete('/:id', cartController.removeFromCart)

/**
 * @openapi
 * /api/cart/batch-delete:
 *   post:
 *     summary: 批量删除购物车商品
 *     description: 批量删除购物车中的多个商品
 *     tags:
 *       - User - Cart
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["cart-001", "cart-002"]
 *                 description: 购物车项ID数组
 *     responses:
 *       200:
 *         description: 批量删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 请求参数错误
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
router.post('/batch-delete', cartController.batchRemove)

/**
 * @openapi
 * /api/cart:
 *   delete:
 *     summary: 清空购物车
 *     description: 清空当前用户的所有购物车商品
 *     tags:
 *       - User - Cart
 *     security:
 *       - UserBearerAuth: []
 *     responses:
 *       200:
 *         description: 清空成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/', cartController.clearCart)

export default router
