import { Request, Response } from 'express'
import {
  getDashboardStats,
  getRevenueTrend,
  getUserGrowthTrend,
  getFortuneTypeDistribution
} from '../services/statsService'

/**
 * 获取仪表板统计数据
 */
export const getDashboard = (req: Request, res: Response) => {
  try {
    const stats = getDashboardStats()

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    })
  }
}

/**
 * 获取收入趋势
 */
export const getRevenue = (req: Request, res: Response) => {
  try {
    const { days } = req.query
    const data = getRevenueTrend(days ? parseInt(days as string) : 7)

    res.json({
      success: true,
      data
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取收入趋势失败'
    })
  }
}

/**
 * 获取用户增长趋势
 */
export const getUserGrowth = (req: Request, res: Response) => {
  try {
    const { days } = req.query
    const data = getUserGrowthTrend(days ? parseInt(days as string) : 7)

    res.json({
      success: true,
      data
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户增长趋势失败'
    })
  }
}

/**
 * 获取功能使用分布
 */
export const getDistribution = (req: Request, res: Response) => {
  try {
    const data = getFortuneTypeDistribution()

    res.json({
      success: true,
      data
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取功能分布失败'
    })
  }
}
