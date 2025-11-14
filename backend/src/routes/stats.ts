import express from 'express'
import {
  getDashboard,
  getRevenue,
  getUserGrowth,
  getDistribution
} from '../controllers/statsController'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'

const router = express.Router()

/**
 * 统计数据 - 所有接口都需要认证和读取权限
 */

router.get('/dashboard', authenticate, requirePermission(Resource.STATS, Action.VIEW), getDashboard)
router.get('/revenue', authenticate, requirePermission(Resource.STATS, Action.VIEW), getRevenue)
router.get('/user-growth', authenticate, requirePermission(Resource.STATS, Action.VIEW), getUserGrowth)
router.get('/distribution', authenticate, requirePermission(Resource.STATS, Action.VIEW), getDistribution)

export default router
