import express from 'express';
import {
  getSystemConfigs,
  getSystemConfig,
  createSystemConfig,
  updateSystemConfig,
  deleteSystemConfig,
  getConfigTypes,
  getBatchConfigs
} from '../controllers/systemConfigs';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

/**
 * @openapi
 * /api/manage/system-configs/types:
 *   get:
 *     summary: 获取配置类型列表
 *     description: 获取所有可用的系统配置类型
 *     tags:
 *       - Admin - System
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取配置类型
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["general", "payment", "notification", "sms"]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/types',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.VIEW),
  getConfigTypes
);

/**
 * @openapi
 * /api/manage/system-configs/batch:
 *   post:
 *     summary: 批量获取配置
 *     description: 根据配置键列表批量获取配置项
 *     tags:
 *       - Admin - System
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keys
 *             properties:
 *               keys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 配置键列表
 *                 example: ["site_name", "site_logo", "payment_enabled"]
 *     responses:
 *       200:
 *         description: 成功获取配置
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/batch',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.VIEW),
  getBatchConfigs
);

/**
 * @openapi
 * /api/manage/system-configs:
 *   get:
 *     summary: 获取所有配置
 *     description: 获取所有系统配置项,支持分页和类型筛选
 *     tags:
 *       - Admin - System
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
 *         name: type
 *         schema:
 *           type: string
 *         description: 配置类型筛选
 *     responses:
 *       200:
 *         description: 成功获取配置列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                       value:
 *                         type: string
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.VIEW),
  getSystemConfigs
);

/**
 * @openapi
 * /api/manage/system-configs/{key}:
 *   get:
 *     summary: 获取单个配置
 *     description: 根据配置键获取指定的配置项
 *     tags:
 *       - Admin - System
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 配置键
 *         example: "site_name"
 *     responses:
 *       200:
 *         description: 成功获取配置
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *                     type:
 *                       type: string
 *                     description:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:key',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.VIEW),
  getSystemConfig
);

/**
 * @openapi
 * /api/manage/system-configs:
 *   post:
 *     summary: 创建配置
 *     description: 创建新的系统配置项
 *     tags:
 *       - Admin - System
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 description: 配置键
 *                 example: "site_name"
 *               value:
 *                 type: string
 *                 description: 配置值
 *                 example: "算命测算平台"
 *               type:
 *                 type: string
 *                 description: 配置类型
 *                 example: "general"
 *               description:
 *                 type: string
 *                 description: 配置说明
 *                 example: "网站名称"
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
 */
router.post(
  '/',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.CREATE),
  createSystemConfig
);

/**
 * @openapi
 * /api/manage/system-configs/{key}:
 *   put:
 *     summary: 更新配置
 *     description: 更新指定的系统配置项
 *     tags:
 *       - Admin - System
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 配置键
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 description: 新的配置值
 *               type:
 *                 type: string
 *               description:
 *                 type: string
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:key',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.EDIT),
  updateSystemConfig
);

/**
 * @openapi
 * /api/manage/system-configs/{key}:
 *   delete:
 *     summary: 删除配置
 *     description: 删除指定的系统配置项
 *     tags:
 *       - Admin - System
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: 配置键
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:key',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.DELETE),
  deleteSystemConfig
);

export default router;
