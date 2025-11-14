import express from 'express'
import {
  getUsers,
  getUser,
  addUser,
  modifyUser,
  removeUser,
  batchUpdateStatus,
  getStats
} from '../controllers/userController'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'

const router = express.Router()

/**
 * 用户管理 - 所有接口都需要认证和权限
 */

// 统计和批量操作需要在参数化路由之前
router.get('/stats', authenticate, requirePermission(Resource.USERS, Action.VIEW), getStats)
router.post('/batch-status', authenticate, requirePermission(Resource.USERS, Action.EDIT), batchUpdateStatus)

// 查询操作 - 需要读取权限
router.get('/', authenticate, requirePermission(Resource.USERS, Action.VIEW), getUsers)
router.get('/:id', authenticate, requirePermission(Resource.USERS, Action.VIEW), getUser)

// 创建操作 - 需要创建权限
router.post('/', authenticate, requirePermission(Resource.USERS, Action.CREATE), addUser)

// 更新操作 - 需要更新权限
router.put('/:id', authenticate, requirePermission(Resource.USERS, Action.EDIT), modifyUser)

// 删除操作 - 需要删除权限
router.delete('/:id', authenticate, requirePermission(Resource.USERS, Action.DELETE), removeUser)

export default router
