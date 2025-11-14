/**
 * 客服人员管理路由
 */
import express from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'
import {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  updateAgentStatus,
  getAgentStats
} from '../controllers/csAgentController'

const router = express.Router()

/**
 * @route   GET /api/manage/cs/agents
 * @desc    获取客服列表
 * @access  需要 CS_AGENTS:READ 权限
 */
router.get(
  '/',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.VIEW),
  getAgents
)

/**
 * @route   GET /api/manage/cs/agents/stats
 * @desc    获取客服统计数据
 * @access  需要 CS_STATS:READ 权限
 */
router.get(
  '/stats',
  authenticate,
  requirePermission(Resource.CS_STATS, Action.VIEW),
  getAgentStats
)

/**
 * @route   GET /api/manage/cs/agents/:id
 * @desc    获取单个客服详情
 * @access  需要 CS_AGENTS:READ 权限
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.VIEW),
  getAgentById
)

/**
 * @route   POST /api/manage/cs/agents
 * @desc    创建客服账号
 * @access  需要 CS_AGENTS:CREATE 权限
 */
router.post(
  '/',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.CREATE),
  createAgent
)

/**
 * @route   PUT /api/manage/cs/agents/:id
 * @desc    更新客服信息
 * @access  需要 CS_AGENTS:UPDATE 权限
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.EDIT),
  updateAgent
)

/**
 * @route   PUT /api/manage/cs/agents/:id/status
 * @desc    更新客服状态
 * @access  需要 CS_AGENTS:UPDATE 权限
 */
router.put(
  '/:id/status',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.EDIT),
  updateAgentStatus
)

/**
 * @route   DELETE /api/manage/cs/agents/:id
 * @desc    删除客服账号
 * @access  需要 CS_AGENTS:DELETE 权限
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.DELETE),
  deleteAgent
)

export default router
