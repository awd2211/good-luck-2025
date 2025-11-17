import express from 'express';
import {
  getFortuneCategories,
  getFortuneCategory,
  createFortuneCategory,
  updateFortuneCategory,
  deleteFortuneCategory,
  updateCategoriesOrder
} from '../controllers/fortuneCategories';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

/**
 * @openapi
 * /api/manage/fortune-categories:
 *   get:
 *     summary: 获取算命服务分类列表
 *     description: 获取所有算命服务分类,支持排序
 *     tags:
 *       - Admin - Fortune Categories
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
 *       401:
 *         description: 未认证
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.VIEW),
  getFortuneCategories
);

/**
 * @openapi
 * /api/manage/fortune-categories/{id}:
 *   get:
 *     summary: 获取分类详情
 *     description: 根据ID获取单个算命服务分类的详细信息
 *     tags:
 *       - Admin - Fortune Categories
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分类ID
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
 *         description: 分类不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.VIEW),
  getFortuneCategory
);

/**
 * @openapi
 * /api/manage/fortune-categories:
 *   post:
 *     summary: 创建服务分类
 *     description: 创建新的算命服务分类
 *     tags:
 *       - Admin - Fortune Categories
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
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: 八字命理
 *                 description: 分类名称
 *               code:
 *                 type: string
 *                 example: bazi
 *                 description: 分类代码(唯一)
 *               description:
 *                 type: string
 *                 example: 通过生辰八字推算命运
 *                 description: 分类描述
 *               icon:
 *                 type: string
 *                 example: /icons/bazi.png
 *                 description: 分类图标URL
 *               sort_order:
 *                 type: integer
 *                 example: 1
 *                 description: 排序顺序
 *     responses:
 *       201:
 *         description: 创建成功
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
 */
router.post(
  '/',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.CREATE),
  createFortuneCategory
);

/**
 * @openapi
 * /api/manage/fortune-categories/{id}:
 *   put:
 *     summary: 更新分类信息
 *     description: 更新指定算命服务分类的信息
 *     tags:
 *       - Admin - Fortune Categories
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分类ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               sort_order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 分类不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.EDIT),
  updateFortuneCategory
);

/**
 * @openapi
 * /api/manage/fortune-categories/{id}:
 *   delete:
 *     summary: 删除分类
 *     description: 删除指定算命服务分类
 *     tags:
 *       - Admin - Fortune Categories
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分类ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 分类不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.DELETE),
  deleteFortuneCategory
);

/**
 * @openapi
 * /api/manage/fortune-categories/order/batch:
 *   patch:
 *     summary: 批量更新分类排序
 *     description: 批量更新多个分类的显示顺序
 *     tags:
 *       - Admin - Fortune Categories
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orders
 *             properties:
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     sort_order:
 *                       type: integer
 *                 example:
 *                   - id: "cat-001"
 *                     sort_order: 1
 *                   - id: "cat-002"
 *                     sort_order: 2
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
 *                   example: 分类排序已更新
 */
router.patch(
  '/order/batch',
  authenticate,
  requirePermission(Resource.FORTUNE_SERVICES, Action.EDIT),
  updateCategoriesOrder
);

export default router;
