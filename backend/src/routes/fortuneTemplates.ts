import express from 'express';
import {
  getFortuneTemplates,
  getFortuneTemplate,
  getTemplatesByService,
  createFortuneTemplate,
  updateFortuneTemplate,
  deleteFortuneTemplate,
  duplicateTemplate,
  getTemplateTypes
} from '../controllers/fortuneTemplates';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

/**
 * @openapi
 * /api/manage/fortune-templates/types:
 *   get:
 *     summary: 获取模板类型列表
 *     description: 获取所有可用的算命模板类型
 *     tags:
 *       - Admin - Fortune Management
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取类型列表
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
 *                     type: string
 *                   example: ["生肖运势", "八字精批", "流年运势"]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/types',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW),
  getTemplateTypes
);

/**
 * @openapi
 * /api/manage/fortune-templates:
 *   get:
 *     summary: 获取模板列表
 *     description: 获取所有算命模板,支持分页和筛选
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
 *         name: type
 *         schema:
 *           type: string
 *         description: 模板类型
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *         description: 服务ID
 *     responses:
 *       200:
 *         description: 成功获取模板列表
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
  requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW),
  getFortuneTemplates
);

/**
 * @openapi
 * /api/manage/fortune-templates/service/{serviceId}:
 *   get:
 *     summary: 根据服务获取模板
 *     description: 获取指定服务关联的所有模板
 *     tags:
 *       - Admin - Fortune Management
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: 服务ID
 *     responses:
 *       200:
 *         description: 成功获取模板列表
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
  '/service/:serviceId',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW),
  getTemplatesByService
);

/**
 * @openapi
 * /api/manage/fortune-templates/{id}:
 *   get:
 *     summary: 获取模板详情
 *     description: 获取指定算命模板的详细信息
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
 *         description: 成功获取模板详情
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
  requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW),
  getFortuneTemplate
);

/**
 * @openapi
 * /api/manage/fortune-templates:
 *   post:
 *     summary: 创建模板
 *     description: 创建新的算命模板
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
 *               - type
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *                 description: 模板名称
 *               type:
 *                 type: string
 *                 description: 模板类型
 *               content:
 *                 type: string
 *                 description: 模板内容
 *               serviceId:
 *                 type: string
 *                 description: 关联服务ID
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
  requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE),
  createFortuneTemplate
);

/**
 * @openapi
 * /api/manage/fortune-templates/{id}:
 *   put:
 *     summary: 更新模板
 *     description: 更新指定算命模板的信息
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
 *               type:
 *                 type: string
 *               content:
 *                 type: string
 *               serviceId:
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
  requirePermission(Resource.FORTUNE_CONTENT, Action.EDIT),
  updateFortuneTemplate
);

/**
 * @openapi
 * /api/manage/fortune-templates/{id}:
 *   delete:
 *     summary: 删除模板
 *     description: 删除指定的算命模板
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
  requirePermission(Resource.FORTUNE_CONTENT, Action.DELETE),
  deleteFortuneTemplate
);

/**
 * @openapi
 * /api/manage/fortune-templates/{id}/duplicate:
 *   post:
 *     summary: 复制模板
 *     description: 复制指定的算命模板,创建一个副本
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
 *         description: 要复制的模板ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 新模板的名称
 *                 example: "八字精批模板 - 副本"
 *     responses:
 *       201:
 *         description: 复制成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:id/duplicate',
  authenticate,
  requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE),
  duplicateTemplate
);

export default router;
