/**
 * 管理端 - 会话转接管理路由
 */

import express from 'express';
import * as sessionTransferController from '../../controllers/webchat/sessionTransferController';

const router = express.Router();

/**
 * @openapi
 * /api/manage/session-transfers/statistics:
 *   get:
 *     summary: 获取转接统计
 *     description: 获取会话转接的统计信息
 *     tags:
 *       - Admin - Session Transfers
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
 *                     totalTransfers:
 *                       type: integer
 *                     pendingTransfers:
 *                       type: integer
 *                     acceptedTransfers:
 *                       type: integer
 *                     rejectedTransfers:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/statistics', sessionTransferController.getTransferStatistics);

/**
 * @openapi
 * /api/manage/session-transfers/pending:
 *   get:
 *     summary: 获取当前客服的待处理转接
 *     description: 获取分配给当前客服的待处理转接请求
 *     tags:
 *       - Admin - Session Transfers
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取待处理转接
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/pending', sessionTransferController.getPendingTransfers);

/**
 * @openapi
 * /api/manage/session-transfers/{id}/accept:
 *   post:
 *     summary: 接受转接
 *     description: 客服接受转接请求
 *     tags:
 *       - Admin - Session Transfers
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 转接ID
 *     responses:
 *       200:
 *         description: 接受成功
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
router.post('/:id/accept', sessionTransferController.acceptTransfer);

/**
 * @openapi
 * /api/manage/session-transfers/{id}/reject:
 *   post:
 *     summary: 拒绝转接
 *     description: 客服拒绝转接请求
 *     tags:
 *       - Admin - Session Transfers
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 转接ID
 *     responses:
 *       200:
 *         description: 拒绝成功
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
router.post('/:id/reject', sessionTransferController.rejectTransfer);

/**
 * @openapi
 * /api/manage/session-transfers/{id}/cancel:
 *   delete:
 *     summary: 取消转接
 *     description: 发起人取消pending状态的转接
 *     tags:
 *       - Admin - Session Transfers
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 转接ID
 *     responses:
 *       200:
 *         description: 取消成功
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
router.delete('/:id/cancel', sessionTransferController.cancelTransfer);

/**
 * @openapi
 * /api/manage/session-transfers:
 *   get:
 *     summary: 获取转接列表
 *     description: 获取所有会话转接记录,支持分页和筛选
 *     tags:
 *       - Admin - Session Transfers
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: integer
 *         description: 会话ID筛选
 *       - in: query
 *         name: fromAgentId
 *         schema:
 *           type: integer
 *         description: 转出客服ID
 *       - in: query
 *         name: toAgentId
 *         schema:
 *           type: integer
 *         description: 接收客服ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         description: 转接状态
 *       - in: query
 *         name: transferType
 *         schema:
 *           type: string
 *           enum: [manual, auto]
 *         description: 转接类型
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
 *         description: 成功获取转接列表
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
router.get('/', sessionTransferController.getTransfers);

/**
 * @openapi
 * /api/manage/session-transfers:
 *   post:
 *     summary: 创建转接请求
 *     description: 发起会话转接请求
 *     tags:
 *       - Admin - Session Transfers
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - toAgentId
 *             properties:
 *               sessionId:
 *                 type: integer
 *                 description: 会话ID
 *               fromAgentId:
 *                 type: integer
 *                 description: 转出客服ID(可选)
 *               toAgentId:
 *                 type: integer
 *                 description: 接收客服ID
 *               transferReason:
 *                 type: string
 *                 description: 转接原因
 *               transferNotes:
 *                 type: string
 *                 description: 转接备注
 *               transferType:
 *                 type: string
 *                 enum: [manual, auto]
 *                 default: manual
 *                 description: 转接类型
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: 会话已有待处理的转接
 */
router.post('/', sessionTransferController.createTransfer);

/**
 * @openapi
 * /api/manage/session-transfers/{id}:
 *   get:
 *     summary: 获取转接详情
 *     description: 获取指定转接的详细信息
 *     tags:
 *       - Admin - Session Transfers
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 转接ID
 *     responses:
 *       200:
 *         description: 成功获取转接详情
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
router.get('/:id', sessionTransferController.getTransferById);

export default router;
