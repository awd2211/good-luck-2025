import express from 'express'
import {
  getOrders,
  getOrder,
  addOrder,
  modifyOrder,
  changeOrderStatus,
  removeOrder,
  getStats,
  getTodayStats
} from '../controllers/orderController'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'

const router = express.Router()

/**
 * 订单管理 - 所有接口都需要认证和权限
 */

// 统计需要在参数化路由之前
router.get('/stats', authenticate, requirePermission(Resource.ORDERS, Action.VIEW), getStats)
router.get('/today-stats', authenticate, requirePermission(Resource.ORDERS, Action.VIEW), getTodayStats)

// 查询操作 - 需要读取权限
router.get('/', authenticate, requirePermission(Resource.ORDERS, Action.VIEW), getOrders)
router.get('/:id', authenticate, requirePermission(Resource.ORDERS, Action.VIEW), getOrder)

// 创建操作 - 需要创建权限
router.post('/', authenticate, requirePermission(Resource.ORDERS, Action.CREATE), addOrder)

// 更新操作 - 需要更新权限
router.put('/:id', authenticate, requirePermission(Resource.ORDERS, Action.EDIT), modifyOrder)
router.patch('/:id/status', authenticate, requirePermission(Resource.ORDERS, Action.EDIT), changeOrderStatus)

// 删除操作 - 需要删除权限
router.delete('/:id', authenticate, requirePermission(Resource.ORDERS, Action.DELETE), removeOrder)

export default router
