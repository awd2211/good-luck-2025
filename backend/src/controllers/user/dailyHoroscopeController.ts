import { Request, Response } from 'express'
import { getTodayHoroscope as getTodayHoroscopeService, getAllTodayHoroscopes } from '../../services/user/dailyHoroscopeService'

/**
 * 获取指定类型和值的今日运势
 */
export const getTodayHoroscope = async (req: Request, res: Response) => {
  try {
    const { type, value } = req.query

    if (!type || !value) {
      return res.status(400).json({
        success: false,
        message: '请提供type和value参数',
      })
    }

    const horoscope = await getTodayHoroscopeService(type as string, value as string)

    if (!horoscope) {
      return res.status(404).json({
        success: false,
        message: '未找到该运势',
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
 * 获取指定类型的所有今日运势
 */
export const getAllHoroscopes = async (req: Request, res: Response) => {
  try {
    const { type } = req.query

    if (!type) {
      return res.status(400).json({
        success: false,
        message: '请提供type参数（zodiac或birth_animal）',
      })
    }

    const horoscopes = await getAllTodayHoroscopes(type as string)

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
