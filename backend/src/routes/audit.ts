import express from 'express'
import { getLogs, addLog, cleanLogs } from '../controllers/auditController'
import { authenticate, requirePermission, requireRole } from '../middleware/auth'
import { Resource, Action, ADMIN_MANAGER_ROLES } from '../config/permissions'

const router = express.Router()

/**
 * 审计日志 - 所有接口都需要认证和权限
 */

// 查询操作 - 需要读取权限
router.get('/', authenticate, requirePermission(Resource.AUDIT, Action.READ), getLogs)

// 创建操作 - 系统自动创建，也允许手动创建
router.post('/', authenticate, requirePermission(Resource.AUDIT, Action.READ), addLog)

// 清理操作 - 只有超级管理员可以执行
router.post('/clean', authenticate, requireRole(ADMIN_MANAGER_ROLES), cleanLogs)

export default router
