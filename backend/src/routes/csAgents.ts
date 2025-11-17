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
 * @openapi
 * /api/manage/cs/agents:
 *   get:
 *     summary: 获取客服列表
 *     description: 获取所有客服人员列表,支持分页、搜索和状态筛选
 *     tags:
 *       - Admin - Customer Service
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
 *         description: 搜索关键词(姓名/工号)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [online, offline, busy]
 *         description: 客服状态筛选
 *     responses:
 *       200:
 *         description: 成功获取客服列表
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
 *                       employeeId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       email:
 *                         type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.VIEW),
  getAgents
)

/**
 * @openapi
 * /api/manage/cs/agents/stats:
 *   get:
 *     summary: 获取客服统计数据
 *     description: 获取所有客服的工作统计数据,包括会话数、响应时间等
 *     tags:
 *       - Admin - Customer Service
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
 *         description: 成功获取统计数据
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
 *                     totalSessions:
 *                       type: integer
 *                     avgResponseTime:
 *                       type: number
 *                     avgResolutionTime:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/stats',
  authenticate,
  requirePermission(Resource.CS_STATS, Action.VIEW),
  getAgentStats
)

/**
 * @openapi
 * /api/manage/cs/agents/{id}:
 *   get:
 *     summary: 获取客服详情
 *     description: 获取指定客服的详细信息
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客服ID
 *     responses:
 *       200:
 *         description: 成功获取客服详情
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     employeeId:
 *                       type: string
 *                     email:
 *                       type: string
 *                     status:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.VIEW),
  getAgentById
)

/**
 * @openapi
 * /api/manage/cs/agents:
 *   post:
 *     summary: 创建客服账号
 *     description: 创建新的客服人员账号
 *     tags:
 *       - Admin - Customer Service
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
 *               - employeeId
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 description: 客服姓名
 *                 example: "张三"
 *               employeeId:
 *                 type: string
 *                 description: 工号
 *                 example: "CS001"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱
 *                 example: "zhangsan@example.com"
 *               password:
 *                 type: string
 *                 description: 初始密码
 *                 example: "password123"
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.CREATE),
  createAgent
)

/**
 * @openapi
 * /api/manage/cs/agents/{id}:
 *   put:
 *     summary: 更新客服信息
 *     description: 更新指定客服的基本信息
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客服ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 客服姓名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.EDIT),
  updateAgent
)

/**
 * @openapi
 * /api/manage/cs/agents/{id}/status:
 *   put:
 *     summary: 更新客服状态
 *     description: 更新指定客服的在线状态
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客服ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [online, offline, busy]
 *                 description: 客服状态
 *                 example: "online"
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id/status',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.EDIT),
  updateAgentStatus
)

/**
 * @openapi
 * /api/manage/cs/agents/{id}:
 *   delete:
 *     summary: 删除客服账号
 *     description: 删除指定的客服人员账号
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 客服ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(Resource.CS_TEAM, Action.DELETE),
  deleteAgent
)

export default router
