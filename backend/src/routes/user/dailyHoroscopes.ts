import { Router } from 'express'
import * as dailyHoroscopeController from '../../controllers/user/dailyHoroscopeController'

const router = Router()

/**
 * @route   GET /api/daily-horoscopes/today
 * @desc    获取今日运势（根据生肖）
 * @access  Public
 * @query   zodiac (required) - 生肖 (rat, ox, tiger, rabbit, dragon, snake, horse, goat, monkey, rooster, dog, pig)
 */
router.get('/today', dailyHoroscopeController.getTodayHoroscope)

/**
 * @route   GET /api/daily-horoscopes/all
 * @desc    获取所有生肖的今日运势
 * @access  Public
 */
router.get('/all', dailyHoroscopeController.getAllHoroscopes)

export default router
