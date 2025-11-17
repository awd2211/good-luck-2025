import { Router } from 'express';
import * as userController from '../../controllers/manage/userController';
import { requirePermission } from '../../middleware/auth';
import { Resource, Action } from '../../config/permissions';

const router = Router();

/**
 * @openapi
 * /api/manage/users:
 *   get:
 *     summary: 获取用户列表
 *     description: 管理端接口,分页获取用户列表,支持搜索和筛选
 *     tags:
 *       - Admin - Users
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
 *         description: 搜索关键词(手机号、用户名)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['active', 'inactive', 'banned']
 *         description: 用户状态筛选
 *     responses:
 *       200:
 *         description: 成功返回用户列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', requirePermission(Resource.USERS, Action.VIEW), userController.getUsers);

/**
 * @openapi
 * /api/manage/users:
 *   post:
 *     summary: 创建新用户
 *     description: 管理端接口,创建新用户
 *     tags:
 *       - Admin - Users
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
 *               - username
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "13800138000"
 *                 description: 手机号
 *               username:
 *                 type: string
 *                 example: "newuser"
 *                 description: 用户名
 *               password:
 *                 type: string
 *                 example: "password123"
 *                 description: 密码
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *                 description: 邮箱(可选)
 *               nickname:
 *                 type: string
 *                 example: "昵称"
 *                 description: 昵称(可选)
 *               balance:
 *                 type: number
 *                 example: 0
 *                 description: 初始余额(可选)
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 参数错误或手机号已存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', requirePermission(Resource.USERS, Action.CREATE), userController.createUser);

/**
 * @openapi
 * /api/manage/users/stats:
 *   get:
 *     summary: 获取用户统计信息
 *     description: 获取用户总数、活跃用户数等统计数据
 *     tags:
 *       - Admin - Users
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 1000
 *                     active:
 *                       type: integer
 *                       example: 850
 *                     inactive:
 *                       type: integer
 *                       example: 100
 *                     banned:
 *                       type: integer
 *                       example: 50
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', requirePermission(Resource.USERS, Action.VIEW), userController.getUserStats);

/**
 * @openapi
 * /api/manage/users/export:
 *   get:
 *     summary: 导出用户数据
 *     description: 导出用户数据为CSV格式
 *     tags:
 *       - Admin - Users
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功导出用户数据
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/export', requirePermission(Resource.USERS, Action.VIEW), userController.exportUsers);

/**
 * @openapi
 * /api/manage/users/{id}:
 *   get:
 *     summary: 获取单个用户详情
 *     description: 获取指定用户的详细信息
 *     tags:
 *       - Admin - Users
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *         example: "user-001"
 *     responses:
 *       200:
 *         description: 成功返回用户详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', requirePermission(Resource.USERS, Action.VIEW), userController.getUserById);

/**
 * @openapi
 * /api/manage/users/{id}:
 *   put:
 *     summary: 更新用户信息
 *     description: 更新指定用户的信息
 *     tags:
 *       - Admin - Users
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *         example: "user-001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newusername"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               status:
 *                 type: string
 *                 enum: ['active', 'inactive', 'banned']
 *                 example: "active"
 *               balance:
 *                 type: number
 *                 example: 100.00
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', requirePermission(Resource.USERS, Action.EDIT), userController.updateUser);

/**
 * @openapi
 * /api/manage/users/{id}/reset-password:
 *   post:
 *     summary: 重置用户密码
 *     description: 管理端接口,重置指定用户的密码
 *     tags:
 *       - Admin - Users
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *         example: "user-001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *                 description: 新密码(最少6位)
 *     responses:
 *       200:
 *         description: 重置成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/reset-password', requirePermission(Resource.USERS, Action.EDIT), userController.resetUserPassword);

/**
 * @openapi
 * /api/manage/users/batch-status:
 *   post:
 *     summary: 批量更新用户状态
 *     description: 批量更新多个用户的状态
 *     tags:
 *       - Admin - Users
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
 *                 example: ["user-001", "user-002"]
 *                 description: 用户ID数组
 *               status:
 *                 type: string
 *                 enum: ['active', 'inactive', 'banned']
 *                 example: "active"
 *                 description: 新状态
 *     responses:
 *       200:
 *         description: 批量更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/batch-status', requirePermission(Resource.USERS, Action.EDIT), userController.batchUpdateUserStatus);

/**
 * @openapi
 * /api/manage/users/{id}:
 *   delete:
 *     summary: 删除用户
 *     description: 删除指定用户(软删除)
 *     tags:
 *       - Admin - Users
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *         example: "user-001"
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未认证或无权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', requirePermission(Resource.USERS, Action.DELETE), userController.deleteUser);

export default router;
