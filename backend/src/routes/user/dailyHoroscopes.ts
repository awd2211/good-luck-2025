import { Router } from 'express'
import * as dailyHoroscopeController from '../../controllers/user/dailyHoroscopeController'

const router = Router()

/**
 * @openapi
 * /api/daily-horoscopes/today:
 *   get:
 *     summary: 获取今日运势
 *     description: 根据生肖获取今日运势信息
 *     tags:
 *       - User - Daily Horoscopes
 *     parameters:
 *       - in: query
 *         name: zodiac
 *         required: true
 *         schema:
 *           type: string
 *           enum: [rat, ox, tiger, rabbit, dragon, snake, horse, goat, monkey, rooster, dog, pig]
 *         description: 生肖类型
 *         example: "dragon"
 *     responses:
 *       200:
 *         description: 成功获取今日运势
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
 *                     zodiac:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date
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
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/today', dailyHoroscopeController.getTodayHoroscope)

/**
 * @openapi
 * /api/daily-horoscopes/all:
 *   get:
 *     summary: 获取所有生肖的今日运势
 *     description: 获取十二生肖的今日运势列表
 *     tags:
 *       - User - Daily Horoscopes
 *     responses:
 *       200:
 *         description: 成功获取所有运势
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
 *                       zodiac:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date
 *                       content:
 *                         type: object
 *                       luckyNumber:
 *                         type: integer
 *                       luckyColor:
 *                         type: string
 *                       rating:
 *                         type: integer
 */
router.get('/all', dailyHoroscopeController.getAllHoroscopes)

export default router
