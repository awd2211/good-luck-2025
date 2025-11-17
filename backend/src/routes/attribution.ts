import { Router } from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'
import * as attributionController from '../controllers/attribution'

const router = Router()

/**
 * @openapi
 * /api/manage/attribution/channels:
 *   get:
 *     summary: 获取渠道列表
 *     description: 获取所有营销渠道配置列表,支持分页和搜索
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
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
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功获取渠道列表
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
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/channels',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getChannels
)

/**
 * @openapi
 * /api/manage/attribution/channels:
 *   post:
 *     summary: 创建渠道
 *     description: 创建新的营销渠道配置
 *     tags:
 *       - Admin - Attribution
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
 *               - code
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: 渠道名称
 *                 example: "抖音广告"
 *               code:
 *                 type: string
 *                 description: 渠道代码(唯一)
 *                 example: "douyin_ads"
 *               type:
 *                 type: string
 *                 description: 渠道类型
 *                 enum: [paid, organic, social, email, direct]
 *                 example: "paid"
 *               description:
 *                 type: string
 *                 description: 渠道描述
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/channels',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.createChannel
)

/**
 * @openapi
 * /api/manage/attribution/channels/{id}:
 *   put:
 *     summary: 更新渠道
 *     description: 更新指定营销渠道的配置
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 渠道ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [paid, organic, social, email, direct]
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/channels/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.EDIT),
  attributionController.updateChannel
)

/**
 * @openapi
 * /api/manage/attribution/channels/{id}:
 *   delete:
 *     summary: 删除渠道
 *     description: 删除指定的营销渠道
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 渠道ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/channels/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.DELETE),
  attributionController.deleteChannel
)

/**
 * @openapi
 * /api/manage/attribution/utm-templates:
 *   get:
 *     summary: 获取UTM模板列表
 *     description: 获取所有UTM参数模板,用于生成营销链接
 *     tags:
 *       - Admin - Attribution
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
 *     responses:
 *       200:
 *         description: 成功获取UTM模板列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       utmSource:
 *                         type: string
 *                       utmMedium:
 *                         type: string
 *                       utmCampaign:
 *                         type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/utm-templates',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getUtmTemplates
)

/**
 * @openapi
 * /api/manage/attribution/utm-templates:
 *   post:
 *     summary: 创建UTM模板
 *     description: 创建新的UTM参数模板
 *     tags:
 *       - Admin - Attribution
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
 *               - utmSource
 *               - utmMedium
 *             properties:
 *               name:
 *                 type: string
 *                 description: 模板名称
 *                 example: "抖音春节活动"
 *               utmSource:
 *                 type: string
 *                 description: UTM来源
 *                 example: "douyin"
 *               utmMedium:
 *                 type: string
 *                 description: UTM媒介
 *                 example: "cpc"
 *               utmCampaign:
 *                 type: string
 *                 description: UTM活动名称
 *                 example: "spring_festival_2025"
 *               utmTerm:
 *                 type: string
 *                 description: UTM关键词
 *               utmContent:
 *                 type: string
 *                 description: UTM内容
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/utm-templates',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.createUtmTemplate
)

/**
 * @openapi
 * /api/manage/attribution/utm-templates/{id}:
 *   put:
 *     summary: 更新UTM模板
 *     description: 更新指定的UTM参数模板
 *     tags:
 *       - Admin - Attribution
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
 *               utmSource:
 *                 type: string
 *               utmMedium:
 *                 type: string
 *               utmCampaign:
 *                 type: string
 *               utmTerm:
 *                 type: string
 *               utmContent:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/utm-templates/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.EDIT),
  attributionController.updateUtmTemplate
)

/**
 * @openapi
 * /api/manage/attribution/utm-templates/{id}:
 *   delete:
 *     summary: 删除UTM模板
 *     description: 删除指定的UTM参数模板
 *     tags:
 *       - Admin - Attribution
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/utm-templates/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.DELETE),
  attributionController.deleteUtmTemplate
)

/**
 * @openapi
 * /api/manage/attribution/promotion-codes:
 *   get:
 *     summary: 获取推广码列表
 *     description: 获取所有推广码,支持分页和筛选
 *     tags:
 *       - Admin - Attribution
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
 *           enum: [active, inactive, expired]
 *     responses:
 *       200:
 *         description: 成功获取推广码列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       code:
 *                         type: string
 *                       channelId:
 *                         type: string
 *                       clicks:
 *                         type: integer
 *                       conversions:
 *                         type: integer
 *                       status:
 *                         type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/promotion-codes',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getPromotionCodes
)

/**
 * @openapi
 * /api/manage/attribution/promotion-codes:
 *   post:
 *     summary: 创建推广码
 *     description: 创建新的推广码用于营销追踪
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - channelId
 *             properties:
 *               code:
 *                 type: string
 *                 description: 推广码(唯一)
 *                 example: "SPRING2025"
 *               channelId:
 *                 type: string
 *                 description: 所属渠道ID
 *               description:
 *                 type: string
 *                 description: 推广码描述
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: 有效期开始
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 description: 有效期结束
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/promotion-codes',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.createPromotionCode
)

/**
 * @openapi
 * /api/manage/attribution/promotion-codes/{id}:
 *   put:
 *     summary: 更新推广码
 *     description: 更新指定推广码的信息
 *     tags:
 *       - Admin - Attribution
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
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [active, inactive, expired]
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/promotion-codes/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.EDIT),
  attributionController.updatePromotionCode
)

/**
 * @openapi
 * /api/manage/attribution/promotion-codes/{id}:
 *   delete:
 *     summary: 删除推广码
 *     description: 删除指定的推广码
 *     tags:
 *       - Admin - Attribution
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/promotion-codes/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.DELETE),
  attributionController.deletePromotionCode
)

/**
 * @openapi
 * /api/manage/attribution/conversion-events:
 *   get:
 *     summary: 获取转化事件列表
 *     description: 获取所有转化事件定义
 *     tags:
 *       - Admin - Attribution
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
 *     responses:
 *       200:
 *         description: 成功获取转化事件列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       eventType:
 *                         type: string
 *                       value:
 *                         type: number
 *                       status:
 *                         type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/conversion-events',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getConversionEvents
)

/**
 * @openapi
 * /api/manage/attribution/conversion-events:
 *   post:
 *     summary: 创建转化事件
 *     description: 创建新的转化事件定义
 *     tags:
 *       - Admin - Attribution
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
 *               - eventType
 *             properties:
 *               name:
 *                 type: string
 *                 description: 事件名称
 *                 example: "完成支付"
 *               eventType:
 *                 type: string
 *                 description: 事件类型
 *                 enum: [page_view, click, signup, purchase, custom]
 *                 example: "purchase"
 *               value:
 *                 type: number
 *                 description: 事件价值(元)
 *                 example: 99.00
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/conversion-events',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.createConversionEvent
)

/**
 * @openapi
 * /api/manage/attribution/conversion-events/{id}:
 *   put:
 *     summary: 更新转化事件
 *     description: 更新指定转化事件的定义
 *     tags:
 *       - Admin - Attribution
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
 *               eventType:
 *                 type: string
 *                 enum: [page_view, click, signup, purchase, custom]
 *               value:
 *                 type: number
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/conversion-events/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.EDIT),
  attributionController.updateConversionEvent
)

/**
 * @openapi
 * /api/manage/attribution/conversion-events/{id}:
 *   delete:
 *     summary: 删除转化事件
 *     description: 删除指定的转化事件
 *     tags:
 *       - Admin - Attribution
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/conversion-events/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.DELETE),
  attributionController.deleteConversionEvent
)

/**
 * @openapi
 * /api/manage/attribution/track-visit:
 *   post:
 *     summary: 追踪用户访问
 *     description: 记录用户访问事件,用于归因分析
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               utmSource:
 *                 type: string
 *                 description: UTM来源
 *               utmMedium:
 *                 type: string
 *                 description: UTM媒介
 *               utmCampaign:
 *                 type: string
 *                 description: UTM活动
 *               promotionCode:
 *                 type: string
 *                 description: 推广码
 *               referrer:
 *                 type: string
 *                 description: 来源URL
 *               landingPage:
 *                 type: string
 *                 description: 落地页
 *     responses:
 *       201:
 *         description: 记录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/track-visit',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.trackVisit
)

/**
 * @openapi
 * /api/manage/attribution/dashboard:
 *   get:
 *     summary: 获取实时看板数据
 *     description: 获取归因分析实时看板的关键指标和数据
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取看板数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVisits:
 *                       type: integer
 *                     totalConversions:
 *                       type: integer
 *                     conversionRate:
 *                       type: number
 *                     totalRevenue:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/dashboard',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getDashboard
)

/**
 * @openapi
 * /api/manage/attribution/funnel:
 *   get:
 *     summary: 获取转化漏斗数据
 *     description: 获取用户转化漏斗各环节的数据
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *         description: 筛选指定渠道
 *     responses:
 *       200:
 *         description: 成功获取漏斗数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stage:
 *                         type: string
 *                         description: 漏斗阶段
 *                       count:
 *                         type: integer
 *                       rate:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/funnel',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getFunnel
)

/**
 * @openapi
 * /api/manage/attribution/touchpoints:
 *   get:
 *     summary: 获取多触点归因数据
 *     description: 获取用户转化路径中的多个触点数据
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 查询指定用户
 *     responses:
 *       200:
 *         description: 成功获取触点数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       touchpointId:
 *                         type: string
 *                       channel:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       contribution:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/touchpoints',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getTouchpoints
)

/**
 * @openapi
 * /api/manage/attribution/model-comparison:
 *   get:
 *     summary: 归因模型对比
 *     description: 对比不同归因模型(首次点击、最后点击、线性、时间衰减等)的结果
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: 成功获取模型对比数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     firstClick:
 *                       type: object
 *                       description: 首次点击模型结果
 *                     lastClick:
 *                       type: object
 *                       description: 最后点击模型结果
 *                     linear:
 *                       type: object
 *                       description: 线性归因模型结果
 *                     timeDecay:
 *                       type: object
 *                       description: 时间衰减模型结果
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/model-comparison',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getModelComparison
)

/**
 * @openapi
 * /api/manage/attribution/roi:
 *   get:
 *     summary: 获取ROI计算
 *     description: 计算各渠道的投资回报率(ROI)
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *         description: 指定渠道ID
 *     responses:
 *       200:
 *         description: 成功获取ROI数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       channelName:
 *                         type: string
 *                       cost:
 *                         type: number
 *                         description: 投入成本(元)
 *                       revenue:
 *                         type: number
 *                         description: 收入(元)
 *                       roi:
 *                         type: number
 *                         description: ROI百分比
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/roi',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getRoi
)

/**
 * @openapi
 * /api/manage/attribution/channel-comparison:
 *   get:
 *     summary: 渠道对比分析
 *     description: 对比不同营销渠道的表现数据
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: channelIds
 *         schema:
 *           type: string
 *         description: 对比渠道ID列表(逗号分隔)
 *     responses:
 *       200:
 *         description: 成功获取渠道对比数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       channelName:
 *                         type: string
 *                       visits:
 *                         type: integer
 *                       conversions:
 *                         type: integer
 *                       conversionRate:
 *                         type: number
 *                       revenue:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/channel-comparison',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getChannelComparison
)

/**
 * @openapi
 * /api/manage/attribution/trends:
 *   get:
 *     summary: 获取时间趋势数据
 *     description: 获取归因数据的时间趋势分析
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: 时间粒度
 *     responses:
 *       200:
 *         description: 成功获取趋势数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       visits:
 *                         type: integer
 *                       conversions:
 *                         type: integer
 *                       revenue:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/trends',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getTrends
)

/**
 * @openapi
 * /api/manage/attribution/user-quality:
 *   get:
 *     summary: 用户质量分析
 *     description: 分析不同渠道带来的用户质量(LTV、留存率等)
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取用户质量数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       channelName:
 *                         type: string
 *                       avgLtv:
 *                         type: number
 *                         description: 平均生命周期价值
 *                       retentionRate:
 *                         type: number
 *                         description: 留存率
 *                       avgOrderValue:
 *                         type: number
 *                         description: 平均订单价值
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/user-quality',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getUserQuality
)

/**
 * @openapi
 * /api/manage/attribution/custom-reports:
 *   get:
 *     summary: 获取自定义报表列表
 *     description: 获取所有自定义归因报表配置
 *     tags:
 *       - Admin - Attribution
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
 *     responses:
 *       200:
 *         description: 成功获取报表列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       createdBy:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/custom-reports',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getCustomReports
)

/**
 * @openapi
 * /api/manage/attribution/custom-reports:
 *   post:
 *     summary: 创建自定义报表
 *     description: 创建新的自定义归因分析报表
 *     tags:
 *       - Admin - Attribution
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
 *               - config
 *             properties:
 *               name:
 *                 type: string
 *                 description: 报表名称
 *                 example: "Q1营销渠道分析"
 *               description:
 *                 type: string
 *                 description: 报表描述
 *               config:
 *                 type: object
 *                 description: 报表配置(维度、指标、筛选条件等)
 *                 properties:
 *                   dimensions:
 *                     type: array
 *                     items:
 *                       type: string
 *                   metrics:
 *                     type: array
 *                     items:
 *                       type: string
 *                   filters:
 *                     type: object
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/custom-reports',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.createCustomReport
)

/**
 * @openapi
 * /api/manage/attribution/custom-reports/{id}:
 *   put:
 *     summary: 更新自定义报表
 *     description: 更新指定自定义报表的配置
 *     tags:
 *       - Admin - Attribution
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
 *               description:
 *                 type: string
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/custom-reports/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.EDIT),
  attributionController.updateCustomReport
)

/**
 * @openapi
 * /api/manage/attribution/custom-reports/{id}:
 *   delete:
 *     summary: 删除自定义报表
 *     description: 删除指定的自定义报表
 *     tags:
 *       - Admin - Attribution
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/custom-reports/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.DELETE),
  attributionController.deleteCustomReport
)

/**
 * @openapi
 * /api/manage/attribution/custom-reports/{id}/data:
 *   get:
 *     summary: 获取自定义报表数据
 *     description: 执行并获取指定自定义报表的数据结果
 *     tags:
 *       - Admin - Attribution
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 报表ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 数据开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 数据结束日期
 *     responses:
 *       200:
 *         description: 成功获取报表数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: 根据报表配置返回的数据结构
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/custom-reports/:id/data',
  authenticate,
  requirePermission(Resource.STATS, Action.VIEW),
  attributionController.getCustomReportData
)

export default router
