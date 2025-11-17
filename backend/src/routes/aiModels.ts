import express from 'express';
import {
  getAIModels,
  getAIModelsByProvider,
  getAIModel,
  createAIModel,
  updateAIModel,
  deleteAIModel,
  testAIModel,
  getAIModelStats,
  setDefaultAIModel,
  batchUpdateAIModels,
  batchDeleteAIModels
} from '../controllers/aiModels';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

/**
 * @openapi
 * /api/manage/ai-models:
 *   get:
 *     summary: 获取AI模型列表
 *     description: 获取所有AI模型配置列表
 *     tags:
 *       - Admin - AI Models
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
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [openai, anthropic, google, azure, custom]
 *         description: 按供应商筛选
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
  requirePermission(Resource.SYSTEM_CONFIG, Action.VIEW),
  getAIModels
);

/**
 * @openapi
 * /api/manage/ai-models/by-provider/{provider}:
 *   get:
 *     summary: 按供应商获取AI模型
 *     description: 获取指定供应商的所有AI模型（用于下拉选择）
 *     tags:
 *       - Admin - AI Models
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [openai, anthropic, google, azure, custom]
 *         description: AI供应商
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       model_id:
 *                         type: string
 */
router.get(
  '/by-provider/:provider',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.VIEW),
  getAIModelsByProvider
);

/**
 * @openapi
 * /api/manage/ai-models/{id}:
 *   get:
 *     summary: 获取AI模型详情
 *     description: 根据ID获取单个AI模型的详细配置
 *     tags:
 *       - Admin - AI Models
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: AI模型ID
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
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                       example: GPT-4
 *                     provider:
 *                       type: string
 *                       example: openai
 *                     model_id:
 *                       type: string
 *                       example: gpt-4-turbo
 *                     api_key:
 *                       type: string
 *                     api_endpoint:
 *                       type: string
 *                     is_default:
 *                       type: boolean
 *                     status:
 *                       type: string
 *       404:
 *         description: AI模型不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.VIEW),
  getAIModel
);

/**
 * @openapi
 * /api/manage/ai-models:
 *   post:
 *     summary: 创建AI模型配置
 *     description: 添加新的AI模型配置
 *     tags:
 *       - Admin - AI Models
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
 *               - provider
 *               - model_id
 *               - api_key
 *             properties:
 *               name:
 *                 type: string
 *                 example: GPT-4 Turbo
 *               provider:
 *                 type: string
 *                 enum: [openai, anthropic, google, azure, custom]
 *                 example: openai
 *               model_id:
 *                 type: string
 *                 example: gpt-4-turbo
 *               api_key:
 *                 type: string
 *                 example: sk-...
 *               api_endpoint:
 *                 type: string
 *                 example: https://api.openai.com/v1
 *               max_tokens:
 *                 type: integer
 *                 example: 4096
 *               temperature:
 *                 type: number
 *                 example: 0.7
 *               is_default:
 *                 type: boolean
 *                 default: false
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.CREATE),
  createAIModel
);

/**
 * @openapi
 * /api/manage/ai-models/{id}:
 *   put:
 *     summary: 更新AI模型配置
 *     description: 更新指定AI模型的配置信息
 *     tags:
 *       - Admin - AI Models
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
 *               api_key:
 *                 type: string
 *               api_endpoint:
 *                 type: string
 *               max_tokens:
 *                 type: integer
 *               temperature:
 *                 type: number
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
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.EDIT),
  updateAIModel
);

/**
 * @openapi
 * /api/manage/ai-models/{id}:
 *   delete:
 *     summary: 删除AI模型配置
 *     description: 删除指定的AI模型配置
 *     tags:
 *       - Admin - AI Models
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
 *       404:
 *         description: AI模型不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.DELETE),
  deleteAIModel
);

/**
 * @openapi
 * /api/manage/ai-models/{id}/test:
 *   post:
 *     summary: 测试AI模型连接
 *     description: 测试指定AI模型的API连接是否正常
 *     tags:
 *       - Admin - AI Models
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: Hello, how are you?
 *                 description: 测试提示词
 *     responses:
 *       200:
 *         description: 测试成功
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
 *                   example: AI模型连接正常
 *                 response:
 *                   type: string
 *                   description: AI模型的响应
 *       400:
 *         description: 测试失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/:id/test',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.EDIT),
  testAIModel
);

/**
 * @openapi
 * /api/manage/ai-models/{id}/stats:
 *   get:
 *     summary: 获取AI模型使用统计
 *     description: 获取指定AI模型的调用次数、成功率等统计信息
 *     tags:
 *       - Admin - AI Models
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
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
 *                   properties:
 *                     total_calls:
 *                       type: integer
 *                       example: 1000
 *                     success_rate:
 *                       type: number
 *                       example: 0.98
 *                     avg_response_time:
 *                       type: number
 *                       example: 1.5
 */
router.get(
  '/:id/stats',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.VIEW),
  getAIModelStats
);

/**
 * @openapi
 * /api/manage/ai-models/{id}/set-default:
 *   post:
 *     summary: 设置为默认AI模型
 *     description: 将指定AI模型设置为默认模型
 *     tags:
 *       - Admin - AI Models
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
 *         description: 设置成功
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
 *                   example: 默认模型已更新
 */
router.post(
  '/:id/set-default',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.EDIT),
  setDefaultAIModel
);

/**
 * @openapi
 * /api/manage/ai-models/batch-update:
 *   post:
 *     summary: 批量更新AI模型
 *     description: 批量更新多个AI模型的配置
 *     tags:
 *       - Admin - AI Models
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
 *               - updates
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["model-001", "model-002"]
 *               updates:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [active, inactive]
 *                   max_tokens:
 *                     type: integer
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/batch-update',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.EDIT),
  batchUpdateAIModels
);

/**
 * @openapi
 * /api/manage/ai-models/batch-delete:
 *   post:
 *     summary: 批量删除AI模型
 *     description: 批量删除多个AI模型配置
 *     tags:
 *       - Admin - AI Models
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
 *                 example: ["model-001", "model-002"]
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
 *                   example: 成功删除2个AI模型
 */
router.post(
  '/batch-delete',
  authenticate,
  requirePermission(Resource.SYSTEM_CONFIG, Action.DELETE),
  batchDeleteAIModels
);

export default router;
