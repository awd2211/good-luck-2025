import express from 'express';
import {
  getAdmins,
  getAdmin,
  addAdmin,
  modifyAdmin,
  removeAdmin,
  getStats,
} from '../controllers/adminController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

/**
 * @openapi
 * /api/manage/admins/stats:
 *   get:
 *     summary: 获取管理员统计信息
 *     description: 获取管理员总数、各角色分布、活跃状态等统计信息
 *     tags:
 *       - Admin - Admins
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
 *                       example: 10
 *                       description: 管理员总数
 *                     roleDistribution:
 *                       type: object
 *                       properties:
 *                         super_admin:
 *                           type: integer
 *                           example: 1
 *                         admin:
 *                           type: integer
 *                           example: 3
 *                         manager:
 *                           type: integer
 *                           example: 4
 *                         operator:
 *                           type: integer
 *                           example: 2
 *                     activeCount:
 *                       type: integer
 *                       example: 9
 *                       description: 活跃管理员数
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
router.get('/stats', authenticate, requirePermission(Resource.ADMINS, Action.VIEW), getStats);

/**
 * @openapi
 * /api/manage/admins:
 *   get:
 *     summary: 获取管理员列表
 *     description: 分页获取管理员列表，支持按角色、状态筛选和搜索
 *     tags:
 *       - Admin - Admins
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [super_admin, admin, manager, operator, viewer]
 *         description: 按角色筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: 按状态筛选
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索用户名或邮箱
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
 *                     $ref: '#/components/schemas/Admin'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 1
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
router.get('/', authenticate, requirePermission(Resource.ADMINS, Action.VIEW), getAdmins);

/**
 * @openapi
 * /api/manage/admins/{id}:
 *   get:
 *     summary: 获取管理员详情
 *     description: 根据ID获取单个管理员的详细信息
 *     tags:
 *       - Admin - Admins
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 管理员ID
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
 *                   $ref: '#/components/schemas/Admin'
 *       404:
 *         description: 管理员不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
router.get('/:id', authenticate, requirePermission(Resource.ADMINS, Action.VIEW), getAdmin);

/**
 * @openapi
 * /api/manage/admins:
 *   post:
 *     summary: 创建新管理员
 *     description: 创建一个新的管理员账号（仅超级管理员和管理员可用）
 *     tags:
 *       - Admin - Admins
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 example: newadmin
 *                 description: 管理员用户名（唯一）
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *                 description: 管理员密码（至少6位）
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newadmin@fortune.com
 *                 description: 管理员邮箱（唯一）
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin, manager, operator, viewer]
 *                 example: manager
 *                 description: 管理员角色
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: 管理员状态
 *     responses:
 *       201:
 *         description: 创建成功
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
 *                   example: 管理员创建成功
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: 参数错误或用户名/邮箱已存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
router.post('/', authenticate, requirePermission(Resource.ADMINS, Action.CREATE), addAdmin);

/**
 * @openapi
 * /api/manage/admins/{id}:
 *   put:
 *     summary: 更新管理员信息
 *     description: 更新指定管理员的信息（仅超级管理员和管理员可用）
 *     tags:
 *       - Admin - Admins
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 管理员ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: updatedadmin
 *                 description: 管理员用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 example: updated@fortune.com
 *                 description: 管理员邮箱
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin, manager, operator, viewer]
 *                 example: operator
 *                 description: 管理员角色
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 管理员状态
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 新密码（可选，如果需要重置密码）
 *     responses:
 *       200:
 *         description: 更新成功
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
 *                   example: 管理员信息更新成功
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 管理员不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
router.put('/:id', authenticate, requirePermission(Resource.ADMINS, Action.EDIT), modifyAdmin);

/**
 * @openapi
 * /api/manage/admins/{id}:
 *   delete:
 *     summary: 删除管理员
 *     description: 删除指定管理员（仅超级管理员可用，不能删除自己）
 *     tags:
 *       - Admin - Admins
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 管理员ID
 *     responses:
 *       200:
 *         description: 删除成功
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
 *                   example: 管理员删除成功
 *       400:
 *         description: 不能删除自己
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 管理员不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
router.delete('/:id', authenticate, requirePermission(Resource.ADMINS, Action.DELETE), removeAdmin);

export default router;
