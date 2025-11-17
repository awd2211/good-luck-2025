import express from 'express';
import {
  getDailyHoroscopes,
  getDailyHoroscope,
  createDailyHoroscope,
  updateDailyHoroscope,
  deleteDailyHoroscope,
  getHoroscopeByDateAndType,
  batchGenerateHoroscopes
} from '../controllers/dailyHoroscopes';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

/**
 * @openapi
 * /api/manage/daily-horoscopes:
 *   get:
 *     summary: 获取每日运势列表
 *     description: 获取所有每日运势记录,支持分页和筛选
 *     tags:
 *       - Admin - Daily Horoscopes
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
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 筛选日期
 *       - in: query
 *         name: zodiac_type
 *         schema:
 *           type: string
 *           enum: [rat, ox, tiger, rabbit, dragon, snake, horse, goat, monkey, rooster, dog, pig]
 *         description: 生肖类型
 *     responses:
 *       200:
 *         description: 成功获取运势列表
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
 *                       date:
 *                         type: string
 *                         format: date
 *                       zodiacType:
 *                         type: string
 *                       content:
 *                         type: object
 *                       luckyNumber:
 *                         type: integer
 *                       luckyColor:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW), getDailyHoroscopes);

/**
 * @openapi
 * /api/manage/daily-horoscopes/by-date/{date}/{type}:
 *   get:
 *     summary: 根据日期和生肖获取运势
 *     description: 获取指定日期和生肖类型的每日运势
 *     tags:
 *       - Admin - Daily Horoscopes
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 日期(YYYY-MM-DD)
 *         example: "2025-01-15"
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [rat, ox, tiger, rabbit, dragon, snake, horse, goat, monkey, rooster, dog, pig]
 *         description: 生肖类型
 *         example: "dragon"
 *     responses:
 *       200:
 *         description: 成功获取运势
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
 *                     id:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date
 *                     zodiacType:
 *                       type: string
 *                     content:
 *                       type: object
 *                     luckyNumber:
 *                       type: integer
 *                     luckyColor:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/by-date/:date/:type', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW), getHoroscopeByDateAndType);

/**
 * @openapi
 * /api/manage/daily-horoscopes/batch-generate:
 *   post:
 *     summary: 批量生成每日运势
 *     description: 为指定日期批量生成所有生肖的每日运势
 *     tags:
 *       - Admin - Daily Horoscopes
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: 生成日期
 *                 example: "2025-01-15"
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *                 description: 是否覆盖已存在的运势
 *     responses:
 *       201:
 *         description: 批量生成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     generatedCount:
 *                       type: integer
 *                       description: 生成的运势数量
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/batch-generate', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE), batchGenerateHoroscopes);

/**
 * @openapi
 * /api/manage/daily-horoscopes/{id}:
 *   get:
 *     summary: 获取单个每日运势
 *     description: 根据ID获取指定的每日运势详情
 *     tags:
 *       - Admin - Daily Horoscopes
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 运势ID
 *     responses:
 *       200:
 *         description: 成功获取运势详情
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
 *                     id:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date
 *                     zodiacType:
 *                       type: string
 *                     content:
 *                       type: object
 *                       properties:
 *                         overall:
 *                           type: string
 *                         love:
 *                           type: string
 *                         career:
 *                           type: string
 *                         wealth:
 *                           type: string
 *                         health:
 *                           type: string
 *                     luckyNumber:
 *                       type: integer
 *                     luckyColor:
 *                       type: string
 *                     rating:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW), getDailyHoroscope);

/**
 * @openapi
 * /api/manage/daily-horoscopes:
 *   post:
 *     summary: 创建每日运势
 *     description: 创建新的每日运势记录
 *     tags:
 *       - Admin - Daily Horoscopes
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - zodiacType
 *               - content
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: 日期
 *                 example: "2025-01-15"
 *               zodiacType:
 *                 type: string
 *                 enum: [rat, ox, tiger, rabbit, dragon, snake, horse, goat, monkey, rooster, dog, pig]
 *                 description: 生肖类型
 *                 example: "dragon"
 *               content:
 *                 type: object
 *                 description: 运势内容
 *                 properties:
 *                   overall:
 *                     type: string
 *                     description: 综合运势
 *                   love:
 *                     type: string
 *                     description: 爱情运势
 *                   career:
 *                     type: string
 *                     description: 事业运势
 *                   wealth:
 *                     type: string
 *                     description: 财运
 *                   health:
 *                     type: string
 *                     description: 健康运势
 *               luckyNumber:
 *                 type: integer
 *                 description: 幸运数字
 *                 example: 8
 *               luckyColor:
 *                 type: string
 *                 description: 幸运颜色
 *                 example: "红色"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: 运势评分(1-5星)
 *                 example: 4
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE), createDailyHoroscope);

/**
 * @openapi
 * /api/manage/daily-horoscopes/{id}:
 *   put:
 *     summary: 更新每日运势
 *     description: 更新指定的每日运势记录
 *     tags:
 *       - Admin - Daily Horoscopes
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 运势ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *                 properties:
 *                   overall:
 *                     type: string
 *                   love:
 *                     type: string
 *                   career:
 *                     type: string
 *                   wealth:
 *                     type: string
 *                   health:
 *                     type: string
 *               luckyNumber:
 *                 type: integer
 *               luckyColor:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
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
router.put('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.EDIT), updateDailyHoroscope);

/**
 * @openapi
 * /api/manage/daily-horoscopes/{id}:
 *   delete:
 *     summary: 删除每日运势
 *     description: 删除指定的每日运势记录
 *     tags:
 *       - Admin - Daily Horoscopes
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 运势ID
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
router.delete('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.DELETE), deleteDailyHoroscope);

export default router;
