// 统计数据服务
import { getUserStats } from './userService'
import { getOrderStats, getTodayOrderStats } from './orderService'

/**
 * 获取仪表板统计数据
 */
export const getDashboardStats = () => {
  const userStats = getUserStats()
  const orderStats = getOrderStats()
  const todayStats = getTodayOrderStats()

  // 模拟增长率
  const growthRate = 11.28

  return {
    users: {
      total: userStats.total,
      active: userStats.active,
      inactive: userStats.inactive
    },
    orders: {
      total: orderStats.total,
      today: todayStats.total,
      completed: orderStats.completed,
      pending: orderStats.pending,
      cancelled: orderStats.cancelled
    },
    revenue: {
      total: orderStats.totalRevenue,
      today: todayStats.revenue,
      average: orderStats.averageAmount,
      growthRate
    },
    fortuneTypes: orderStats.byFortuneType
  }
}

/**
 * 获取收入趋势数据（最近7天）
 */
export const getRevenueTrend = (days: number = 7) => {
  const data = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    // 模拟数据
    const revenue = Math.floor(Math.random() * 5000) + 3000

    data.push({
      date: dateStr,
      revenue
    })
  }

  return data
}

/**
 * 获取用户增长趋势（最近7天）
 */
export const getUserGrowthTrend = (days: number = 7) => {
  const data = []
  const today = new Date()
  let cumulative = 1000 // 起始用户数

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    // 模拟每日新增
    const newUsers = Math.floor(Math.random() * 50) + 10
    cumulative += newUsers

    data.push({
      date: dateStr,
      newUsers,
      totalUsers: cumulative
    })
  }

  return data
}

/**
 * 获取功能使用占比
 */
export const getFortuneTypeDistribution = () => {
  const orderStats = getOrderStats()
  const distribution = []

  for (const [name, data] of Object.entries(orderStats.byFortuneType)) {
    distribution.push({
      name,
      count: data.count,
      revenue: data.revenue,
      percentage: ((data.count / orderStats.completed) * 100).toFixed(2)
    })
  }

  // 按使用次数排序
  distribution.sort((a, b) => b.count - a.count)

  return distribution
}
