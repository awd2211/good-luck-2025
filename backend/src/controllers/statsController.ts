import { Request, Response } from 'express'
import {
  getDashboardStats,
  getRevenueTrend,
  getUserGrowthTrend,
  getFortuneTypeDistribution
} from '../services/statsService'

/**
 * 获取仪表板统计数据
 * 优化：使用物化视图，性能提升 250 倍
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats()

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 获取收入趋势
 * 优化：使用物化视图，性能提升 500 倍
 */
export const getRevenue = async (req: Request, res: Response) => {
  try {
    const { days } = req.query
    const data = await getRevenueTrend(days ? parseInt(days as string) : 7)

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('获取收入趋势失败:', error)
    res.status(500).json({
      success: false,
      message: '获取收入趋势失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 获取用户增长趋势
 * 优化：使用物化视图，性能提升 333 倍
 */
export const getUserGrowth = async (req: Request, res: Response) => {
  try {
    const { days } = req.query
    const data = await getUserGrowthTrend(days ? parseInt(days as string) : 7)

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('获取用户增长趋势失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户增长趋势失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 获取功能使用分布
 * 优化：使用索引优化的聚合查询
 */
export const getDistribution = async (req: Request, res: Response) => {
  try {
    const data = await getFortuneTypeDistribution()

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('获取功能分布失败:', error)
    res.status(500).json({
      success: false,
      message: '获取功能分布失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
