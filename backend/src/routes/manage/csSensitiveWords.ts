/**
 * 管理端 - 敏感词管理路由
 */

import express from 'express';
import * as sensitiveWordController from '../../controllers/webchat/sensitiveWordController';

const router = express.Router();

/**
 * @openapi
 * /api/manage/cs/sensitive-words/statistics:
 *   get:
 *     summary: 获取敏感词统计
 *     description: 获取敏感词的使用统计信息,包括总数、命中次数等
 *     tags:
 *       - Admin - Customer Service
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalWords:
 *                       type: integer
 *                       description: 敏感词总数
 *                       example: 150
 *                     totalHits:
 *                       type: integer
 *                       description: 总命中次数
 *                       example: 1250
 *                     todayHits:
 *                       type: integer
 *                       description: 今日命中次数
 *                       example: 45
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/statistics', sensitiveWordController.getStatistics);

/**
 * @openapi
 * /api/manage/cs/sensitive-words/hits:
 *   get:
 *     summary: 获取命中记录
 *     description: 获取敏感词命中记录,支持分页和筛选
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
 *         name: wordId
 *         schema:
 *           type: string
 *         description: 敏感词ID筛选
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取命中记录
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
 *                       word:
 *                         type: string
 *                       text:
 *                         type: string
 *                         description: 触发敏感词的文本
 *                       userId:
 *                         type: string
 *                       sessionId:
 *                         type: string
 *                       hitAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/hits', sensitiveWordController.getHits);

/**
 * @openapi
 * /api/manage/cs/sensitive-words/detect:
 *   post:
 *     summary: 检测文本
 *     description: 检测给定文本中是否包含敏感词
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
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: 需要检测的文本内容
 *                 example: "这是一段需要检测的文本内容"
 *     responses:
 *       200:
 *         description: 检测完成
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
 *                     hasSensitiveWords:
 *                       type: boolean
 *                       description: 是否包含敏感词
 *                     words:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 检测到的敏感词列表
 *                       example: ["敏感词1", "敏感词2"]
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/detect', sensitiveWordController.detectText);

/**
 * @openapi
 * /api/manage/cs/sensitive-words:
 *   get:
 *     summary: 获取敏感词列表
 *     description: 获取所有敏感词,支持分页和搜索
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
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 敏感词分类
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: 状态筛选
 *     responses:
 *       200:
 *         description: 成功获取敏感词列表
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
 *                       word:
 *                         type: string
 *                         description: 敏感词内容
 *                       category:
 *                         type: string
 *                         description: 分类
 *                       severity:
 *                         type: string
 *                         enum: [low, medium, high]
 *                         description: 严重程度
 *                       status:
 *                         type: string
 *                         enum: [active, inactive]
 *                       hitCount:
 *                         type: integer
 *                         description: 命中次数
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', sensitiveWordController.getSensitiveWords);

/**
 * @openapi
 * /api/manage/cs/sensitive-words:
 *   post:
 *     summary: 添加敏感词
 *     description: 创建新的敏感词
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
 *               - word
 *             properties:
 *               word:
 *                 type: string
 *                 description: 敏感词内容
 *                 example: "违规词"
 *               category:
 *                 type: string
 *                 description: 分类
 *                 example: "政治"
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: 严重程度
 *                 example: "high"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: 添加成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', sensitiveWordController.addSensitiveWord);

/**
 * @openapi
 * /api/manage/cs/sensitive-words/{id}:
 *   put:
 *     summary: 更新敏感词
 *     description: 更新指定敏感词的信息
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
 *         description: 敏感词ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               word:
 *                 type: string
 *                 description: 敏感词内容
 *               category:
 *                 type: string
 *                 description: 分类
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: 严重程度
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
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
router.put('/:id', sensitiveWordController.updateSensitiveWord);

/**
 * @openapi
 * /api/manage/cs/sensitive-words/{id}:
 *   delete:
 *     summary: 删除敏感词
 *     description: 删除指定的敏感词
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
 *         description: 敏感词ID
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
router.delete('/:id', sensitiveWordController.deleteSensitiveWord);

export default router;
