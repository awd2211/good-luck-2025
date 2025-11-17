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
 * @openapi
 * /api/manage/cs/sessions:
 *   get:
 *     summary: 获取客服会话列表
 *     description: 获取所有客服会话列表,支持分页、状态筛选和时间范围查询
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, closed]
 *         description: 会话状态筛选
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *         description: 客服ID筛选
 *     responses:
 *       200:
 *         description: 成功获取会话列表
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
 *                       userId:
 *                         type: string
 *                       agentId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
  requirePermission(Resource.CS_WORKBENCH, Action.VIEW),
  getSessions
)

/**
 * @openapi
 * /api/manage/cs/sessions/{id}:
 *   get:
 *     summary: 获取会话详情
 *     description: 获取指定客服会话的详细信息
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
 *         description: 会话ID
 *     responses:
 *       200:
 *         description: 成功获取会话详情
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
 *                     userId:
 *                       type: string
 *                     agentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
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
  requirePermission(Resource.CS_WORKBENCH, Action.VIEW),
  getSessionById
)

/**
 * @openapi
 * /api/manage/cs/sessions/{id}/messages:
 *   get:
 *     summary: 获取会话消息列表
 *     description: 获取指定会话的所有消息记录
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
 *         description: 会话ID
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
 *           default: 50
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取消息列表
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
 *                       content:
 *                         type: string
 *                       senderId:
 *                         type: string
 *                       senderType:
 *                         type: string
 *                         enum: [user, agent, system]
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id/messages',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.VIEW),
  getSessionMessages
)

/**
 * @openapi
 * /api/manage/cs/sessions:
 *   post:
 *     summary: 创建客服会话
 *     description: 创建新的客服会话
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *                 example: "user-123"
 *               initialMessage:
 *                 type: string
 *                 description: 初始消息
 *                 example: "您好,我需要帮助"
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
  requirePermission(Resource.CS_WORKBENCH, Action.CREATE),
  createSession
)

/**
 * @openapi
 * /api/manage/cs/sessions/{id}/assign:
 *   post:
 *     summary: 分配会话给客服
 *     description: 将会话分配给指定客服人员
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
 *         description: 会话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *             properties:
 *               agentId:
 *                 type: string
 *                 description: 客服ID
 *                 example: "agent-001"
 *     responses:
 *       200:
 *         description: 分配成功
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
router.post(
  '/:id/assign',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.EDIT),
  assignSession
)

/**
 * @openapi
 * /api/manage/cs/sessions/{id}/transfer:
 *   post:
 *     summary: 转移会话给其他客服
 *     description: 将会话从一个客服转移给另一个客服
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
 *         description: 会话ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetAgentId
 *             properties:
 *               targetAgentId:
 *                 type: string
 *                 description: 目标客服ID
 *                 example: "agent-002"
 *               reason:
 *                 type: string
 *                 description: 转移原因
 *                 example: "客服下班"
 *     responses:
 *       200:
 *         description: 转移成功
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
router.post(
  '/:id/transfer',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.EDIT),
  transferSession
)

/**
 * @openapi
 * /api/manage/cs/sessions/{id}/close:
 *   post:
 *     summary: 关闭会话
 *     description: 结束并关闭指定的客服会话
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
 *         description: 会话ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedback:
 *                 type: string
 *                 description: 会话结束反馈
 *                 example: "问题已解决"
 *               rating:
 *                 type: integer
 *                 description: 满意度评分
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *     responses:
 *       200:
 *         description: 关闭成功
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
router.post(
  '/:id/close',
  authenticate,
  requirePermission(Resource.CS_WORKBENCH, Action.EDIT),
  closeSession
)

export default router
