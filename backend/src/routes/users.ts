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
 * @openapi
 * /api/manage/users/stats:
 *   get:
 *     summary: 获取用户统计信息
 *     description: 获取用户总数、活跃用户、新增用户等统计数据
 *     tags:
 *       - Admin - Users (General)
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', authenticate, requirePermission(Resource.USERS, Action.VIEW), getStats)

/**
 * @openapi
 * /api/manage/users/batch-status:
 *   post:
 *     summary: 批量更新用户状态
 *     description: 批量启用或禁用用户账号
 *     tags:
 *       - Admin - Users (General)
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - status
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user-1", "user-2"]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/batch-status', authenticate, requirePermission(Resource.USERS, Action.EDIT), batchUpdateStatus)

/**
 * @openapi
 * /api/manage/users:
 *   get:
 *     summary: 获取用户列表
 *     description: 分页获取用户列表,支持搜索和筛选
 *     tags:
 *       - Admin - Users (General)
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索用户名或手机号
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', authenticate, requirePermission(Resource.USERS, Action.VIEW), getUsers)

/**
 * @openapi
 * /api/manage/users/{id}:
 *   get:
 *     summary: 获取用户详情
 *     description: 根据ID获取单个用户的详细信息
 *     tags:
 *       - Admin - Users (General)
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/:id', authenticate, requirePermission(Resource.USERS, Action.VIEW), getUser)

/**
 * @openapi
 * /api/manage/users:
 *   post:
 *     summary: 创建用户
 *     description: 创建新用户账号
 *     tags:
 *       - Admin - Users (General)
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "13900000001"
 *               username:
 *                 type: string
 *                 example: testuser
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/', authenticate, requirePermission(Resource.USERS, Action.CREATE), addUser)

/**
 * @openapi
 * /api/manage/users/{id}:
 *   put:
 *     summary: 更新用户信息
 *     description: 更新指定用户的信息
 *     tags:
 *       - Admin - Users (General)
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put('/:id', authenticate, requirePermission(Resource.USERS, Action.EDIT), modifyUser)

/**
 * @openapi
 * /api/manage/users/{id}:
 *   delete:
 *     summary: 删除用户
 *     description: 删除指定用户(软删除)
 *     tags:
 *       - Admin - Users (General)
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete('/:id', authenticate, requirePermission(Resource.USERS, Action.DELETE), removeUser)

export default router
