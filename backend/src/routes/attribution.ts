import { Router } from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'
import * as attributionController from '../controllers/attribution'

const router = Router()

// 渠道管理 API
router.get(
  '/channels',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getChannels
)

router.post(
  '/channels',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.createChannel
)

router.put(
  '/channels/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.UPDATE),
  attributionController.updateChannel
)

router.delete(
  '/channels/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.DELETE),
  attributionController.deleteChannel
)

// UTM模板管理 API
router.get(
  '/utm-templates',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getUtmTemplates
)

router.post(
  '/utm-templates',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.createUtmTemplate
)

router.put(
  '/utm-templates/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.UPDATE),
  attributionController.updateUtmTemplate
)

router.delete(
  '/utm-templates/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.DELETE),
  attributionController.deleteUtmTemplate
)

// 推广码管理 API
router.get(
  '/promotion-codes',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getPromotionCodes
)

router.post(
  '/promotion-codes',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.createPromotionCode
)

router.put(
  '/promotion-codes/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.UPDATE),
  attributionController.updatePromotionCode
)

router.delete(
  '/promotion-codes/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.DELETE),
  attributionController.deletePromotionCode
)

// 转化事件定义 API
router.get(
  '/conversion-events',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getConversionEvents
)

router.post(
  '/conversion-events',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.createConversionEvent
)

router.put(
  '/conversion-events/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.UPDATE),
  attributionController.updateConversionEvent
)

router.delete(
  '/conversion-events/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.DELETE),
  attributionController.deleteConversionEvent
)

// 数据追踪 API（供前端调用，记录用户访问）
router.post(
  '/track-visit',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.trackVisit
)

// 分析 API - 实时看板
router.get(
  '/dashboard',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getDashboard
)

// 分析 API - 转化漏斗
router.get(
  '/funnel',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getFunnel
)

// 分析 API - 多触点归因
router.get(
  '/touchpoints',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getTouchpoints
)

// 分析 API - 归因模型对比
router.get(
  '/model-comparison',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getModelComparison
)

// 分析 API - ROI计算
router.get(
  '/roi',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getRoi
)

// 分析 API - 渠道对比
router.get(
  '/channel-comparison',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getChannelComparison
)

// 分析 API - 时间趋势
router.get(
  '/trends',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getTrends
)

// 分析 API - 用户质量
router.get(
  '/user-quality',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getUserQuality
)

// 自定义报表 API
router.get(
  '/custom-reports',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getCustomReports
)

router.post(
  '/custom-reports',
  authenticate,
  requirePermission(Resource.STATS, Action.CREATE),
  attributionController.createCustomReport
)

router.put(
  '/custom-reports/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.UPDATE),
  attributionController.updateCustomReport
)

router.delete(
  '/custom-reports/:id',
  authenticate,
  requirePermission(Resource.STATS, Action.DELETE),
  attributionController.deleteCustomReport
)

router.get(
  '/custom-reports/:id/data',
  authenticate,
  requirePermission(Resource.STATS, Action.READ),
  attributionController.getCustomReportData
)

export default router
