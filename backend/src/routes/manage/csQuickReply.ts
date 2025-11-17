/**
 * 管理端 - 快捷回复路由
 */

import express from 'express';
import * as quickReplyController from '../../controllers/webchat/quickReplyController';

const router = express.Router();

/**
 * @openapi
 * /api/manage/cs/quick-reply/categories:
 *   get:
 *     summary: 获取分类列表
 *     description: 获取快捷回复的分类列表
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取分类列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/categories', quickReplyController.getCategories);

/**
 * @openapi
 * /api/manage/cs/quick-reply/top:
 *   get:
 *     summary: 获取热门快捷回复
 *     description: 获取使用次数最多的热门快捷回复
 *     tags:
 *       - Admin - Customer Service
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量
 *     responses:
 *       200:
 *         description: 成功获取热门回复
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/top', quickReplyController.getTopReplies);

/**
 * @openapi
 * /api/manage/cs/quick-reply:
 *   get:
 *     summary: 获取快捷回复列表
 *     description: 获取所有快捷回复,支持分页和分类筛选
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 分类筛选
 *     responses:
 *       200:
 *         description: 成功获取快捷回复列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', quickReplyController.getQuickReplies);

/**
 * @openapi
 * /api/manage/cs/quick-reply/{id}:
 *   get:
 *     summary: 获取单个快捷回复
 *     description: 获取指定快捷回复的详细信息
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
 *         description: 快捷回复ID
 *     responses:
 *       200:
 *         description: 成功获取详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', quickReplyController.getQuickReply);

/**
 * @openapi
 * /api/manage/cs/quick-reply:
 *   post:
 *     summary: 创建快捷回复
 *     description: 创建新的快捷回复模板
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
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: 标题
 *               content:
 *                 type: string
 *                 description: 回复内容
 *               category:
 *                 type: string
 *                 description: 分类
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
router.post('/', quickReplyController.createQuickReply);

/**
 * @openapi
 * /api/manage/cs/quick-reply/{id}:
 *   put:
 *     summary: 更新快捷回复
 *     description: 更新指定的快捷回复模板
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
 *         description: 快捷回复ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
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
router.put('/:id', quickReplyController.updateQuickReply);

/**
 * @openapi
 * /api/manage/cs/quick-reply/{id}:
 *   delete:
 *     summary: 删除快捷回复
 *     description: 删除指定的快捷回复模板
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
 *         description: 快捷回复ID
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
router.delete('/:id', quickReplyController.deleteQuickReply);

/**
 * @openapi
 * /api/manage/cs/quick-reply/{id}/use:
 *   post:
 *     summary: 增加使用次数
 *     description: 记录快捷回复的使用,增加使用次数计数
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
 *         description: 快捷回复ID
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
router.post('/:id/use', quickReplyController.incrementUseCount);

export default router;
