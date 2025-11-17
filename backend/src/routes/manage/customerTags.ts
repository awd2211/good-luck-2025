/**
 * 管理端 - 客户标签管理路由
 */

import express from 'express';
import * as customerTagController from '../../controllers/webchat/customerTagController';

const router = express.Router();

/**
 * @openapi
 * /api/manage/customer-tags/statistics:
 *   get:
 *     summary: 获取标签统计
 *     description: 获取标签的使用统计信息,包括总数、最常用标签等
 *     tags:
 *       - Admin - Customer Tags
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取统计信息
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
 *                     totalTags:
 *                       type: integer
 *                       description: 总标签数
 *                     activeTags:
 *                       type: integer
 *                       description: 激活标签数
 *                     totalAssignments:
 *                       type: integer
 *                       description: 总分配数
 *                     topUsedTags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tagId:
 *                             type: integer
 *                           tagName:
 *                             type: string
 *                           tagColor:
 *                             type: string
 *                           usageCount:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/statistics', customerTagController.getTagStatistics);

/**
 * @openapi
 * /api/manage/customer-tags/search:
 *   get:
 *     summary: 搜索带有特定标签的用户
 *     description: 根据标签ID搜索用户,支持"与"和"或"逻辑
 *     tags:
 *       - Admin - Customer Tags
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tagIds
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *         description: 标签ID数组
 *       - in: query
 *         name: matchAll
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否匹配所有标签(true=与,false=或)
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
 *         description: 搜索成功
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
 *                       id:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/search', customerTagController.searchUsersByTags);

/**
 * @openapi
 * /api/manage/customer-tags/users/{userId}:
 *   get:
 *     summary: 获取用户的所有标签
 *     description: 获取指定用户的所有已分配标签
 *     tags:
 *       - Admin - Customer Tags
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户标签
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
 *                       id:
 *                         type: integer
 *                       tagId:
 *                         type: integer
 *                       tagName:
 *                         type: string
 *                       tagColor:
 *                         type: string
 *                       assignedBy:
 *                         type: integer
 *                       assignedByName:
 *                         type: string
 *                       assignedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/users/:userId', customerTagController.getUserTags);

/**
 * @openapi
 * /api/manage/customer-tags/assign:
 *   post:
 *     summary: 为用户分配标签
 *     description: 为单个用户分配一个标签
 *     tags:
 *       - Admin - Customer Tags
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
 *               - tagId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *               tagId:
 *                 type: integer
 *                 description: 标签ID
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
 */
router.post('/assign', customerTagController.assignTagToUser);

/**
 * @openapi
 * /api/manage/customer-tags/remove:
 *   post:
 *     summary: 移除用户标签
 *     description: 从用户移除指定标签
 *     tags:
 *       - Admin - Customer Tags
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
 *               - tagId
 *             properties:
 *               userId:
 *                 type: string
 *               tagId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 移除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/remove', customerTagController.removeTagFromUser);

/**
 * @openapi
 * /api/manage/customer-tags/batch-assign:
 *   post:
 *     summary: 批量分配标签
 *     description: 为多个用户批量分配多个标签
 *     tags:
 *       - Admin - Customer Tags
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
 *               - tagIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 用户ID数组
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 标签ID数组
 *     responses:
 *       200:
 *         description: 批量分配完成
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
 *                     success:
 *                       type: integer
 *                       description: 成功数
 *                     failed:
 *                       type: integer
 *                       description: 失败数
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/batch-assign', customerTagController.batchAssignTags);

/**
 * @openapi
 * /api/manage/customer-tags:
 *   get:
 *     summary: 获取标签列表
 *     description: 获取所有客户标签,支持分页和搜索
 *     tags:
 *       - Admin - Customer Tags
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
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词(标签名或描述)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 是否激活
 *     responses:
 *       200:
 *         description: 成功获取标签列表
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
 *                       id:
 *                         type: integer
 *                       tagName:
 *                         type: string
 *                       tagColor:
 *                         type: string
 *                       description:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       usageCount:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', customerTagController.getTags);

/**
 * @openapi
 * /api/manage/customer-tags:
 *   post:
 *     summary: 创建标签
 *     description: 创建新的客户标签
 *     tags:
 *       - Admin - Customer Tags
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tagName
 *               - tagColor
 *             properties:
 *               tagName:
 *                 type: string
 *                 description: 标签名称
 *                 example: "VIP客户"
 *               tagColor:
 *                 type: string
 *                 description: 标签颜色(支持hex/颜色名)
 *                 example: "#FFD700"
 *               description:
 *                 type: string
 *                 description: 标签描述
 *               isActive:
 *                 type: boolean
 *                 default: true
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
router.post('/', customerTagController.createTag);

/**
 * @openapi
 * /api/manage/customer-tags/{id}:
 *   get:
 *     summary: 获取标签详情
 *     description: 获取指定标签的详细信息
 *     tags:
 *       - Admin - Customer Tags
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 标签ID
 *     responses:
 *       200:
 *         description: 成功获取标签详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', customerTagController.getTagById);

/**
 * @openapi
 * /api/manage/customer-tags/{id}:
 *   put:
 *     summary: 更新标签
 *     description: 更新指定标签的信息
 *     tags:
 *       - Admin - Customer Tags
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 标签ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagName:
 *                 type: string
 *               tagColor:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
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
router.put('/:id', customerTagController.updateTag);

/**
 * @openapi
 * /api/manage/customer-tags/{id}:
 *   delete:
 *     summary: 删除标签
 *     description: 删除指定的客户标签(仅当无用户使用时可删除)
 *     tags:
 *       - Admin - Customer Tags
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 标签ID
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
router.delete('/:id', customerTagController.deleteTag);

export default router;
