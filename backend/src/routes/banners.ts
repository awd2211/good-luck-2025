import { Router } from 'express';
import {
  getBanners,
  getBanner,
  addBanner,
  modifyBanner,
  removeBanner,
  changeBannerPosition,
} from '../controllers/bannerController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

/**
 * @openapi
 * /api/manage/banners:
 *   get:
 *     summary: 获取横幅列表
 *     description: 分页获取横幅列表，支持按状态筛选和排序
 *     tags:
 *       - Admin - Banners
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
 *           enum: [active, inactive]
 *         description: 按状态筛选
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
 *                     $ref: '#/components/schemas/Banner'
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
router.get('/', authenticate, requirePermission(Resource.BANNERS, Action.VIEW), getBanners);

/**
 * @openapi
 * /api/manage/banners/{id}:
 *   get:
 *     summary: 获取横幅详情
 *     description: 根据ID获取单个横幅的详细信息
 *     tags:
 *       - Admin - Banners
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 横幅ID
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
 *                   $ref: '#/components/schemas/Banner'
 *       404:
 *         description: 横幅不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', authenticate, requirePermission(Resource.BANNERS, Action.VIEW), getBanner);

/**
 * @openapi
 * /api/manage/banners:
 *   post:
 *     summary: 创建新横幅
 *     description: 创建一个新的横幅广告
 *     tags:
 *       - Admin - Banners
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - image_url
 *             properties:
 *               title:
 *                 type: string
 *                 example: 新春特惠
 *                 description: 横幅标题
 *               image_url:
 *                 type: string
 *                 example: https://example.com/banner.jpg
 *                 description: 横幅图片URL
 *               link_url:
 *                 type: string
 *                 example: /fortunes/special
 *                 description: 点击跳转链接
 *               sort_order:
 *                 type: integer
 *                 example: 1
 *                 description: 排序顺序（数字越小越靠前）
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: 横幅状态
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: 开始展示时间
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: 结束展示时间
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
 *                   example: 横幅创建成功
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, requirePermission(Resource.BANNERS, Action.CREATE), addBanner);

/**
 * @openapi
 * /api/manage/banners/{id}:
 *   put:
 *     summary: 更新横幅信息
 *     description: 更新指定横幅的信息
 *     tags:
 *       - Admin - Banners
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 横幅ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               image_url:
 *                 type: string
 *               link_url:
 *                 type: string
 *               sort_order:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
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
 *                   example: 横幅更新成功
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       404:
 *         description: 横幅不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', authenticate, requirePermission(Resource.BANNERS, Action.EDIT), modifyBanner);

/**
 * @openapi
 * /api/manage/banners/{id}/position:
 *   patch:
 *     summary: 修改横幅排序位置
 *     description: 快速修改横幅的显示顺序
 *     tags:
 *       - Admin - Banners
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 横幅ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sort_order
 *             properties:
 *               sort_order:
 *                 type: integer
 *                 example: 1
 *                 description: 新的排序顺序
 *     responses:
 *       200:
 *         description: 修改成功
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
 *                   example: 位置修改成功
 */
router.patch('/:id/position', authenticate, requirePermission(Resource.BANNERS, Action.EDIT), changeBannerPosition);

/**
 * @openapi
 * /api/manage/banners/{id}:
 *   delete:
 *     summary: 删除横幅
 *     description: 删除指定横幅
 *     tags:
 *       - Admin - Banners
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 横幅ID
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
 *                   example: 横幅删除成功
 *       404:
 *         description: 横幅不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', authenticate, requirePermission(Resource.BANNERS, Action.DELETE), removeBanner);

export default router;
