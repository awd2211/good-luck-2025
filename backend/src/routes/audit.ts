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
 * @openapi
 * /api/manage/audit:
 *   get:
 *     summary: 获取审计日志列表
 *     description: 分页获取审计日志，支持按操作类型、资源类型、时间范围筛选
 *     tags:
 *       - Admin - Audit
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
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT]
 *         description: 操作类型筛选
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: 资源类型筛选
 *       - in: query
 *         name: admin_id
 *         schema:
 *           type: string
 *         description: 管理员ID筛选
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始时间
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束时间
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                         example: audit-001
 *                       admin_id:
 *                         type: string
 *                         example: admin-001
 *                       action:
 *                         type: string
 *                         example: UPDATE
 *                       resource:
 *                         type: string
 *                         example: users
 *                       resource_id:
 *                         type: string
 *                         example: user-001
 *                       details:
 *                         type: object
 *                         description: 操作详情
 *                       ip_address:
 *                         type: string
 *                         example: 192.168.1.1
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getLogs)

/**
 * @openapi
 * /api/manage/audit/stats/overview:
 *   get:
 *     summary: 获取审计统计概览
 *     description: 获取审计日志的统计信息，包括操作类型分布、资源分布等
 *     tags:
 *       - Admin - Audit
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 1000
 *                     actionDistribution:
 *                       type: object
 *                       properties:
 *                         CREATE:
 *                           type: integer
 *                           example: 200
 *                         UPDATE:
 *                           type: integer
 *                           example: 300
 *                         DELETE:
 *                           type: integer
 *                           example: 100
 *                         VIEW:
 *                           type: integer
 *                           example: 400
 *                     resourceDistribution:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 */
router.get('/stats/overview', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getStats)

/**
 * @openapi
 * /api/manage/audit/stats/trend:
 *   get:
 *     summary: 获取操作趋势
 *     description: 获取指定时间范围内的操作趋势数据
 *     tags:
 *       - Admin - Audit
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: 统计天数
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                       date:
 *                         type: string
 *                         format: date
 *                       count:
 *                         type: integer
 */
router.get('/stats/trend', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getTrend)

/**
 * @openapi
 * /api/manage/audit/stats/anomalies:
 *   get:
 *     summary: 检测异常操作
 *     description: 检测可疑的异常操作，如短时间内大量删除、异常IP等
 *     tags:
 *       - Admin - Audit
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                       type:
 *                         type: string
 *                         example: mass_delete
 *                       admin_id:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 */
router.get('/stats/anomalies', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getAnomalies)

/**
 * @openapi
 * /api/manage/audit/archive/list:
 *   get:
 *     summary: 获取归档日志列表
 *     description: 获取已归档的审计日志
 *     tags:
 *       - Admin - Audit
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
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/archive/list', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getArchived)

/**
 * @openapi
 * /api/manage/audit/{id}:
 *   get:
 *     summary: 获取审计日志详情
 *     description: 根据ID获取单条审计日志的详细信息
 *     tags:
 *       - Admin - Audit
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 审计日志ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       404:
 *         description: 日志不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), getLogDetail)

/**
 * @openapi
 * /api/manage/audit:
 *   post:
 *     summary: 创建审计日志
 *     description: 手动创建一条审计日志（通常由系统自动创建）
 *     tags:
 *       - Admin - Audit
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - resource
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT]
 *               resource:
 *                 type: string
 *               resource_id:
 *                 type: string
 *               details:
 *                 type: object
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/', authenticate, requirePermission(Resource.AUDIT, Action.VIEW), addLog)

/**
 * @openapi
 * /api/manage/audit/archive:
 *   post:
 *     summary: 归档旧日志
 *     description: 将指定时间之前的日志归档（仅超级管理员和管理员可用）
 *     tags:
 *       - Admin - Audit
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               before_date:
 *                 type: string
 *                 format: date-time
 *                 description: 归档此日期之前的日志
 *     responses:
 *       200:
 *         description: 归档成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 已归档1000条日志
 */
router.post('/archive', authenticate, requireRole(ADMIN_MANAGER_ROLES), archiveLogs)

/**
 * @openapi
 * /api/manage/audit/clean:
 *   post:
 *     summary: 清理旧日志
 *     description: 删除指定时间之前的日志（仅超级管理员可用，保留兼容性）
 *     tags:
 *       - Admin - Audit
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               before_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: 清理成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/clean', authenticate, requireRole(ADMIN_MANAGER_ROLES), cleanLogs)

export default router
