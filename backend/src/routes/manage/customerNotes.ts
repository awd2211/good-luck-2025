/**
 * 管理端 - 客户备注管理路由
 */

import express from 'express';
import * as customerNoteController from '../../controllers/webchat/customerNoteController';

const router = express.Router();

/**
 * @openapi
 * /api/manage/customer-notes/statistics:
 *   get:
 *     summary: 获取备注统计
 *     description: 获取备注的统计信息,包括总数、重要备注数、本周/本月备注等
 *     tags:
 *       - Admin - Customer Notes
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
 *                     totalNotes:
 *                       type: integer
 *                       description: 总备注数
 *                     importantNotes:
 *                       type: integer
 *                       description: 重要备注数
 *                     notesThisWeek:
 *                       type: integer
 *                       description: 本周备注数
 *                     notesThisMonth:
 *                       type: integer
 *                       description: 本月备注数
 *                     topUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           noteCount:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/statistics', customerNoteController.getNoteStatistics);

/**
 * @openapi
 * /api/manage/customer-notes/search:
 *   get:
 *     summary: 搜索备注
 *     description: 根据关键词搜索客户备注
 *     tags:
 *       - Admin - Customer Notes
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用户ID筛选
 *       - in: query
 *         name: isImportant
 *         schema:
 *           type: boolean
 *         description: 是否重要
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
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/search', customerNoteController.searchNotes);

/**
 * @openapi
 * /api/manage/customer-notes/user/{userId}:
 *   get:
 *     summary: 获取指定用户的所有备注
 *     description: 获取某个客户的全部备注记录
 *     tags:
 *       - Admin - Customer Notes
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
 *         description: 成功获取用户备注
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
 *                       userId:
 *                         type: string
 *                       content:
 *                         type: string
 *                       isImportant:
 *                         type: boolean
 *                       createdBy:
 *                         type: string
 *                       creatorName:
 *                         type: string
 *                       creatorRole:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/user/:userId', customerNoteController.getUserNotes);

/**
 * @openapi
 * /api/manage/customer-notes/{id}/toggle-important:
 *   patch:
 *     summary: 切换备注重要状态
 *     description: 切换备注的重要标记
 *     tags:
 *       - Admin - Customer Notes
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 备注ID
 *     responses:
 *       200:
 *         description: 切换成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/toggle-important', customerNoteController.toggleImportant);

/**
 * @openapi
 * /api/manage/customer-notes/batch-delete:
 *   post:
 *     summary: 批量删除备注
 *     description: 批量删除多条备注记录
 *     tags:
 *       - Admin - Customer Notes
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - noteIds
 *             properties:
 *               noteIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 备注ID数组
 *     responses:
 *       200:
 *         description: 批量删除完成
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
router.post('/batch-delete', customerNoteController.batchDeleteNotes);

/**
 * @openapi
 * /api/manage/customer-notes:
 *   get:
 *     summary: 获取备注列表
 *     description: 获取所有客户备注,支持分页和筛选
 *     tags:
 *       - Admin - Customer Notes
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用户ID筛选
 *       - in: query
 *         name: isImportant
 *         schema:
 *           type: boolean
 *         description: 是否重要
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         description: 创建人ID
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 内容关键词
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
 *         description: 成功获取备注列表
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
router.get('/', customerNoteController.getNotes);

/**
 * @openapi
 * /api/manage/customer-notes:
 *   post:
 *     summary: 创建备注
 *     description: 为客户添加新的备注
 *     tags:
 *       - Admin - Customer Notes
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
 *               - content
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *               content:
 *                 type: string
 *                 description: 备注内容
 *               isImportant:
 *                 type: boolean
 *                 default: false
 *                 description: 是否重要
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
router.post('/', customerNoteController.createNote);

/**
 * @openapi
 * /api/manage/customer-notes/{id}:
 *   get:
 *     summary: 获取备注详情
 *     description: 获取指定备注的详细信息
 *     tags:
 *       - Admin - Customer Notes
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 备注ID
 *     responses:
 *       200:
 *         description: 成功获取备注详情
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
router.get('/:id', customerNoteController.getNoteById);

/**
 * @openapi
 * /api/manage/customer-notes/{id}:
 *   put:
 *     summary: 更新备注
 *     description: 更新指定备注的内容
 *     tags:
 *       - Admin - Customer Notes
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 备注ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: 备注内容
 *               isImportant:
 *                 type: boolean
 *                 description: 是否重要
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
router.put('/:id', customerNoteController.updateNote);

/**
 * @openapi
 * /api/manage/customer-notes/{id}:
 *   delete:
 *     summary: 删除备注
 *     description: 删除指定的客户备注
 *     tags:
 *       - Admin - Customer Notes
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 备注ID
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
router.delete('/:id', customerNoteController.deleteNote);

export default router;
