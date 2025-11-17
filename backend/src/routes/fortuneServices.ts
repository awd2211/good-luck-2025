import express from 'express';
import {
  getFortuneServices,
  getFortuneService,
  createFortuneService,
  updateFortuneService,
  deleteFortuneService,
  batchUpdateStatus,
  incrementViewCount,
  getServiceStats,
  getAllServicesStats,
  batchUpdateServices,
  batchDeleteServices,
  exportServices,
  importServices
} from '../controllers/fortuneServices';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

/**
 * @openapi
 * /api/manage/fortune-services/stats:
 *   get:
 *     summary: 获取所有服务统计
 *     description: 获取所有算命服务的统计概览数据
 *     tags:
 *       - Admin - Fortune Management
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取统计数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/stats',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.VIEW),
  getAllServicesStats
);

/**
 * @openapi
 * /api/manage/fortune-services/export:
 *   get:
 *     summary: 导出服务数据
 *     description: 导出算命服务数据为Excel或CSV格式
 *     tags:
 *       - Admin - Fortune Management
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, csv]
 *           default: excel
 *         description: 导出格式
 *     responses:
 *       200:
 *         description: 成功导出数据
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/export',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.VIEW),
  exportServices
);

/**
 * @openapi
 * /api/manage/fortune-services/batch-update:
 *   post:
 *     summary: 批量更新服务
 *     description: 批量更新多个算命服务的信息
 *     tags:
 *       - Admin - Fortune Management
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               updates:
 *                 type: object
 *     responses:
 *       200:
 *         description: 批量更新成功
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
  '/batch-update',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.EDIT),
  batchUpdateServices
);

/**
 * @openapi
 * /api/manage/fortune-services/batch-delete:
 *   post:
 *     summary: 批量删除服务
 *     description: 批量删除多个算命服务
 *     tags:
 *       - Admin - Fortune Management
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 服务ID列表
 *     responses:
 *       200:
 *         description: 批量删除成功
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
  '/batch-delete',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.DELETE),
  batchDeleteServices
);

/**
 * @openapi
 * /api/manage/fortune-services/import:
 *   post:
 *     summary: 导入服务数据
 *     description: 从Excel或CSV文件导入算命服务数据
 *     tags:
 *       - Admin - Fortune Management
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: 导入成功
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
  '/import',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.CREATE),
  importServices
);

/**
 * @openapi
 * /api/manage/fortune-services/batch/status:
 *   patch:
 *     summary: 批量更新状态
 *     description: 批量更新算命服务的启用/禁用状态
 *     tags:
 *       - Admin - Fortune Management
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - status
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: 状态更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch(
  '/batch/status',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.EDIT),
  batchUpdateStatus
);

/**
 * @openapi
 * /api/manage/fortune-services:
 *   get:
 *     summary: 获取服务列表
 *     description: 获取所有算命服务列表,支持分页和筛选
 *     tags:
 *       - Admin - Fortune Management
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: 成功获取服务列表
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
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.VIEW),
  getFortuneServices
);

/**
 * @openapi
 * /api/manage/fortune-services/{id}:
 *   get:
 *     summary: 获取服务详情
 *     description: 获取指定算命服务的详细信息
 *     tags:
 *       - Admin - Fortune Management
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
 *         description: 成功获取服务详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.VIEW),
  getFortuneService
);

/**
 * @openapi
 * /api/manage/fortune-services:
 *   post:
 *     summary: 创建服务
 *     description: 创建新的算命服务
 *     tags:
 *       - Admin - Fortune Management
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
 *               - category
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
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
  requirePermission(Resource.FORTUNE_SERVICES, Action.CREATE),
  createFortuneService
);

/**
 * @openapi
 * /api/manage/fortune-services/{id}:
 *   put:
 *     summary: 更新服务
 *     description: 更新指定算命服务的信息
 *     tags:
 *       - Admin - Fortune Management
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
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
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
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.EDIT),
  updateFortuneService
);

/**
 * @openapi
 * /api/manage/fortune-services/{id}:
 *   delete:
 *     summary: 删除服务
 *     description: 删除指定的算命服务
 *     tags:
 *       - Admin - Fortune Management
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.DELETE),
  deleteFortuneService
);

/**
 * @openapi
 * /api/manage/fortune-services/{id}/view:
 *   patch:
 *     summary: 更新浏览量
 *     description: 增加服务的浏览次数计数
 *     tags:
 *       - Admin - Fortune Management
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
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/:id/view',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.EDIT),
  incrementViewCount
);

/**
 * @openapi
 * /api/manage/fortune-services/{id}/stats:
 *   get:
 *     summary: 获取服务统计
 *     description: 获取指定服务的统计数据
 *     tags:
 *       - Admin - Fortune Management
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
 *         description: 成功获取统计数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id/stats',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.VIEW),
  getServiceStats
);

export default router;
