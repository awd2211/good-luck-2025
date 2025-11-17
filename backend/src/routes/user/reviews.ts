import { Router } from 'express'
import * as reviewController from '../../controllers/user/reviewController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

/**
 * @openapi
 * /api/reviews/fortune/{fortuneType}:
 *   get:
 *     summary: 获取算命服务的评价列表
 *     description: 公开接口,获取指定算命服务类型的评价列表,支持按评分筛选
 *     tags:
 *       - User - Reviews
 *     parameters:
 *       - in: path
 *         name: fortuneType
 *         required: true
 *         schema:
 *           type: string
 *         description: 算命服务类型
 *         example: "bazi"
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
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: 按评分筛选
 *     responses:
 *       200:
 *         description: 成功返回评价列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/fortune/:fortuneType', reviewController.getFortuneReviews)

/**
 * @openapi
 * /api/reviews/{id}:
 *   get:
 *     summary: 获取评价详情
 *     description: 公开接口,获取指定评价的详细信息
 *     tags:
 *       - User - Reviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 评价ID
 *         example: "review-001"
 *     responses:
 *       200:
 *         description: 成功返回评价详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 review:
 *                   type: object
 *       404:
 *         description: 评价不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', reviewController.getReviewDetail)

/**
 * @openapi
 * /api/reviews:
 *   post:
 *     summary: 创建评价
 *     description: 用户为已完成的订单创建评价
 *     tags:
 *       - User - Reviews
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - rating
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "order-001"
 *                 description: 订单ID
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *                 description: 评分 (1-5星)
 *               content:
 *                 type: string
 *                 example: "非常准确,服务很好!"
 *                 description: 评价内容
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/img1.jpg"]
 *                 description: 评价图片URL数组
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["准确", "专业"]
 *                 description: 评价标签
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *                 description: 是否匿名评价
 *     responses:
 *       201:
 *         description: 评价创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 订单不存在或已评价
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
router.post('/', authenticateUser, reviewController.createReview)

/**
 * @openapi
 * /api/reviews/my/list:
 *   get:
 *     summary: 获取用户的评价列表
 *     description: 获取当前用户发布的所有评价
 *     tags:
 *       - User - Reviews
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
 *     responses:
 *       200:
 *         description: 成功返回评价列表
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
router.get('/my/list', authenticateUser, reviewController.getUserReviews)

/**
 * @openapi
 * /api/reviews/{id}:
 *   delete:
 *     summary: 删除评价
 *     description: 删除自己发布的评价
 *     tags:
 *       - User - Reviews
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 评价ID
 *         example: "review-001"
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 评价不存在
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
router.delete('/:id', authenticateUser, reviewController.deleteReview)

/**
 * @openapi
 * /api/reviews/{id}/helpful:
 *   post:
 *     summary: 点赞评价
 *     description: 公开接口,标记评价为有帮助
 *     tags:
 *       - User - Reviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 评价ID
 *         example: "review-001"
 *     responses:
 *       200:
 *         description: 点赞成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 评价不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/helpful', reviewController.markHelpful)

/**
 * @openapi
 * /api/reviews/check/{orderId}:
 *   get:
 *     summary: 检查订单是否可以评价
 *     description: 检查指定订单是否已完成且未评价
 *     tags:
 *       - User - Reviews
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单ID
 *         example: "order-001"
 *     responses:
 *       200:
 *         description: 返回是否可评价
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 canReview:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/check/:orderId', authenticateUser, reviewController.canReviewOrder)

export default router
