import express from 'express';
import {
  getBirthFortune,
  getBaziAnalysis,
  getFlowYearFortune,
  getNameAnalysis,
  getMarriageAnalysis
} from '../controllers/fortuneController';
import { cacheMiddleware } from '../middleware/cache';
import { validate } from '../middleware/validate';
import {
  birthFortuneSchema,
  baziSchema,
  flowYearSchema,
  nameSchema,
  marriageSchema
} from '../validators/fortuneSchemas';

const router = express.Router();

/**
 * @openapi
 * /api/fortune/birth-animal:
 *   post:
 *     summary: 生肖运势
 *     description: 根据出生年月日计算生肖运势(公开接口,有缓存)
 *     tags:
 *       - Fortune - Calculation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - month
 *               - day
 *             properties:
 *               year:
 *                 type: integer
 *                 example: 1990
 *                 description: 出生年份
 *               month:
 *                 type: integer
 *                 example: 5
 *                 description: 出生月份(1-12)
 *               day:
 *                 type: integer
 *                 example: 15
 *                 description: 出生日期(1-31)
 *     responses:
 *       200:
 *         description: 计算成功
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
 *                     animal:
 *                       type: string
 *                       example: 马
 *                     fortune:
 *                       type: string
 *                       example: 今年运势不错...
 *                     lucky:
 *                       type: object
 *                     unlucky:
 *                       type: object
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/birth-animal', validate(birthFortuneSchema), cacheMiddleware, getBirthFortune);

/**
 * @openapi
 * /api/fortune/bazi:
 *   post:
 *     summary: 八字精批
 *     description: 根据出生时辰计算详细八字分析(公开接口,有缓存)
 *     tags:
 *       - Fortune - Calculation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - month
 *               - day
 *               - hour
 *               - gender
 *             properties:
 *               year:
 *                 type: integer
 *                 example: 1990
 *               month:
 *                 type: integer
 *                 example: 5
 *               day:
 *                 type: integer
 *                 example: 15
 *               hour:
 *                 type: integer
 *                 example: 14
 *                 description: 出生小时(0-23)
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 example: male
 *                 description: 性别
 *     responses:
 *       200:
 *         description: 计算成功
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
 *                     bazi:
 *                       type: string
 *                       example: 庚午年 辛巳月 甲子日 辛未时
 *                     wuxing:
 *                       type: object
 *                       description: 五行分析
 *                     personality:
 *                       type: string
 *                       description: 性格分析
 *                     career:
 *                       type: string
 *                       description: 事业运势
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/bazi', validate(baziSchema), cacheMiddleware, getBaziAnalysis);

/**
 * @openapi
 * /api/fortune/flow-year:
 *   post:
 *     summary: 流年运势
 *     description: 计算指定年份的流年运势(公开接口,有缓存)
 *     tags:
 *       - Fortune - Calculation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - birthYear
 *               - birthMonth
 *               - birthDay
 *               - targetYear
 *             properties:
 *               birthYear:
 *                 type: integer
 *                 example: 1990
 *               birthMonth:
 *                 type: integer
 *                 example: 5
 *               birthDay:
 *                 type: integer
 *                 example: 15
 *               targetYear:
 *                 type: integer
 *                 example: 2025
 *                 description: 要查询的年份
 *     responses:
 *       200:
 *         description: 计算成功
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
 *                     year:
 *                       type: integer
 *                       example: 2025
 *                     overall:
 *                       type: string
 *                       description: 整体运势
 *                     love:
 *                       type: string
 *                       description: 爱情运势
 *                     career:
 *                       type: string
 *                       description: 事业运势
 *                     wealth:
 *                       type: string
 *                       description: 财运
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/flow-year', validate(flowYearSchema), cacheMiddleware, getFlowYearFortune);

/**
 * @openapi
 * /api/fortune/name:
 *   post:
 *     summary: 姓名详批
 *     description: 根据姓名分析五格数理和吉凶(公开接口,有缓存)
 *     tags:
 *       - Fortune - Calculation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: 张三
 *                 description: 姓名(中文)
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 example: male
 *                 description: 性别(可选)
 *     responses:
 *       200:
 *         description: 计算成功
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
 *                     name:
 *                       type: string
 *                       example: 张三
 *                     wuge:
 *                       type: object
 *                       description: 五格数理
 *                     meaning:
 *                       type: string
 *                       description: 姓名含义
 *                     score:
 *                       type: integer
 *                       example: 85
 *                       description: 综合评分(0-100)
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/name', validate(nameSchema), cacheMiddleware, getNameAnalysis);

/**
 * @openapi
 * /api/fortune/marriage:
 *   post:
 *     summary: 婚姻分析
 *     description: 根据双方生辰八字分析婚姻匹配度(公开接口,有缓存)
 *     tags:
 *       - Fortune - Calculation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - male
 *               - female
 *             properties:
 *               male:
 *                 type: object
 *                 required:
 *                   - year
 *                   - month
 *                   - day
 *                 properties:
 *                   year:
 *                     type: integer
 *                     example: 1990
 *                   month:
 *                     type: integer
 *                     example: 5
 *                   day:
 *                     type: integer
 *                     example: 15
 *                   hour:
 *                     type: integer
 *                     example: 14
 *               female:
 *                 type: object
 *                 required:
 *                   - year
 *                   - month
 *                   - day
 *                 properties:
 *                   year:
 *                     type: integer
 *                     example: 1992
 *                   month:
 *                     type: integer
 *                     example: 8
 *                   day:
 *                     type: integer
 *                     example: 20
 *                   hour:
 *                     type: integer
 *                     example: 10
 *     responses:
 *       200:
 *         description: 计算成功
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
 *                     compatibility:
 *                       type: integer
 *                       example: 85
 *                       description: 匹配度(0-100)
 *                     analysis:
 *                       type: string
 *                       description: 详细分析
 *                     suggestions:
 *                       type: string
 *                       description: 建议
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/marriage', validate(marriageSchema), cacheMiddleware, getMarriageAnalysis);

export default router;
