/**
 * 客服会话管理路由
 */
import express from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'
import {
  getSessions,
  getSessionById,
  createSession,
  assignSession,
  transferSession,
  closeSession,
  getSessionMessages
} from '../controllers/csSessionController'

const router = express.Router()

/**
 * @route   GET /api/manage/cs/sessions
 * @desc    获取客服会话列表
 * @access  需要 CS_SESSIONS:READ 权限
 */
router.get(
  '/',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.VIEW),
  getSessions
)

/**
 * @route   GET /api/manage/cs/sessions/:id
 * @desc    获取单个会话详情
 * @access  需要 CS_SESSIONS:READ 权限
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.VIEW),
  getSessionById
)

/**
 * @route   GET /api/manage/cs/sessions/:id/messages
 * @desc    获取会话消息列表
 * @access  需要 CS_MESSAGES:READ 权限
 */
router.get(
  '/:id/messages',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.VIEW),
  getSessionMessages
)

/**
 * @route   POST /api/manage/cs/sessions
 * @desc    创建客服会话
 * @access  需要 CS_SESSIONS:CREATE 权限
 */
router.post(
  '/',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.CREATE),
  createSession
)

/**
 * @route   POST /api/manage/cs/sessions/:id/assign
 * @desc    分配会话给客服
 * @access  需要 CS_SESSIONS:UPDATE 权限
 */
router.post(
  '/:id/assign',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.EDIT),
  assignSession
)

/**
 * @route   POST /api/manage/cs/sessions/:id/transfer
 * @desc    转移会话给其他客服
 * @access  需要 CS_SESSIONS:UPDATE 权限
 */
router.post(
  '/:id/transfer',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.EDIT),
  transferSession
)

/**
 * @route   POST /api/manage/cs/sessions/:id/close
 * @desc    关闭会话
 * @access  需要 CS_SESSIONS:UPDATE 权限
 */
router.post(
  '/:id/close',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.EDIT),
  closeSession
)

export default router
