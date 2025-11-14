import { Request, Response } from 'express'
import { getTodayHoroscopeByZodiac, getAllTodayHoroscopes } from '../../services/user/dailyHoroscopeService'

/**
 * 获取指定生肖的今日运势
 */
export const getTodayHoroscope = async (req: Request, res: Response) => {
  try {
    const { zodiac } = req.query

    if (!zodiac) {
      return res.status(400).json({
        success: false,
        message: '请提供生肖参数',
      })
    }

    const horoscope = await getTodayHoroscopeByZodiac(zodiac as string)

    if (!horoscope) {
      return res.status(404).json({
        success: false,
        message: '未找到该生肖的运势',
      })
    }

    res.json({
      success: true,
      data: horoscope,
    })
  } catch (error) {
    console.error('获取今日运势失败:', error)
    res.status(500).json({
      success: false,
      message: '获取今日运势失败',
    })
  }
}

/**
 * 获取所有生肖的今日运势
 */
export const getAllHoroscopes = async (req: Request, res: Response) => {
  try {
    const horoscopes = await getAllTodayHoroscopes()

    res.json({
      success: true,
      data: horoscopes,
    })
  } catch (error) {
    console.error('获取运势列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取运势列表失败',
    })
  }
}
