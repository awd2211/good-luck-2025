import express from 'express'
import {
  getLogs,
  getLogDetail,
  addLog,
  getStats,
  archiveLogs,
  getArchived,
  getAnomalies,
  getTrend,
  cleanLogs
} from '../controllers/auditController'
import { authenticate, requirePermission, requireRole } from '../middleware/auth'
import { Resource, Action, ADMIN_MANAGER_ROLES } from '../config/permissions'

const router = express.Router()

/**
 * 审计日志 - 所有接口都需要认证和权限
 */

// 查询操作 - 需要读取权限
router.get('/', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getLogs)

// 获取统计信息 (必须在 /:id 之前)
router.get('/stats/overview', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getStats)

// 获取操作趋势 (必须在 /:id 之前)
router.get('/stats/trend', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getTrend)

// 检测异常 (必须在 /:id 之前)
router.get('/stats/anomalies', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getAnomalies)

// 获取归档日志 (必须在 /:id 之前)
router.get('/archive/list', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getArchived)

// 获取日志详情 (放在最后,避免捕获其他路由)
router.get('/:id', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getLogDetail)

// 创建操作 - 系统自动创建，也允许手动创建
router.post('/', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), addLog)

// 归档操作 - 只有超级管理员可以执行
router.post('/archive', authenticate, requireRole(ADMIN_MANAGER_ROLES), archiveLogs)

// 清理操作 - 只有超级管理员可以执行(保留兼容)
router.post('/clean', authenticate, requireRole(ADMIN_MANAGER_ROLES), cleanLogs)

export default router
