/**
 * statsService 单元测试
 */

import * as statsService from '../../../services/statsService'
import * as userService from '../../../services/userService'
import * as orderService from '../../../services/orderService'

// Mock dependencies
jest.mock('../../../services/userService')
jest.mock('../../../services/orderService')

describe('statsService - 统计服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getDashboardStats - 获取仪表板统计数据', () => {
    it('应该返回完整的仪表板统计', () => {
      // Mock user stats
      ;(userService.getUserStats as jest.Mock).mockReturnValue({
        total: 1000,
        active: 800,
        inactive: 200,
      })

      // Mock order stats
      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 500,
        completed: 400,
        pending: 80,
        cancelled: 20,
        totalRevenue: 50000,
        averageAmount: 100,
        byFortuneType: {
          '八字精批': { count: 150, revenue: 15000 },
          '流年运势': { count: 100, revenue: 10000 },
        },
      })

      // Mock today stats
      ;(orderService.getTodayOrderStats as jest.Mock).mockReturnValue({
        total: 10,
        revenue: 1000,
      })

      const result = statsService.getDashboardStats()

      expect(result).toHaveProperty('users')
      expect(result).toHaveProperty('orders')
      expect(result).toHaveProperty('revenue')
      expect(result).toHaveProperty('fortuneTypes')
    })

    it('应该返回正确的用户统计', () => {
      ;(userService.getUserStats as jest.Mock).mockReturnValue({
        total: 1200,
        active: 950,
        inactive: 250,
      })

      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageAmount: 0,
        byFortuneType: {},
      })

      ;(orderService.getTodayOrderStats as jest.Mock).mockReturnValue({
        total: 0,
        revenue: 0,
      })

      const result = statsService.getDashboardStats()

      expect(result.users).toEqual({
        total: 1200,
        active: 950,
        inactive: 250,
      })
    })

    it('应该返回正确的订单统计', () => {
      ;(userService.getUserStats as jest.Mock).mockReturnValue({
        total: 0,
        active: 0,
        inactive: 0,
      })

      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 600,
        completed: 500,
        pending: 80,
        cancelled: 20,
        totalRevenue: 60000,
        averageAmount: 120,
        byFortuneType: {},
      })

      ;(orderService.getTodayOrderStats as jest.Mock).mockReturnValue({
        total: 15,
        revenue: 1500,
      })

      const result = statsService.getDashboardStats()

      expect(result.orders).toEqual({
        total: 600,
        today: 15,
        completed: 500,
        pending: 80,
        cancelled: 20,
      })
    })

    it('应该返回正确的收入统计', () => {
      ;(userService.getUserStats as jest.Mock).mockReturnValue({
        total: 0,
        active: 0,
        inactive: 0,
      })

      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 500,
        completed: 400,
        pending: 80,
        cancelled: 20,
        totalRevenue: 50000,
        averageAmount: 125,
        byFortuneType: {},
      })

      ;(orderService.getTodayOrderStats as jest.Mock).mockReturnValue({
        total: 10,
        revenue: 1250,
      })

      const result = statsService.getDashboardStats()

      expect(result.revenue).toEqual({
        total: 50000,
        today: 1250,
        average: 125,
        growthRate: 11.28,
      })
    })

    it('应该返回算命类型统计', () => {
      ;(userService.getUserStats as jest.Mock).mockReturnValue({
        total: 0,
        active: 0,
        inactive: 0,
      })

      const fortuneTypeData = {
        '八字精批': { count: 150, revenue: 15000 },
        '流年运势': { count: 100, revenue: 10000 },
        '姓名详批': { count: 80, revenue: 8000 },
      }

      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 330,
        completed: 330,
        pending: 0,
        cancelled: 0,
        totalRevenue: 33000,
        averageAmount: 100,
        byFortuneType: fortuneTypeData,
      })

      ;(orderService.getTodayOrderStats as jest.Mock).mockReturnValue({
        total: 0,
        revenue: 0,
      })

      const result = statsService.getDashboardStats()

      expect(result.fortuneTypes).toEqual(fortuneTypeData)
    })

    it('应该包含固定的增长率', () => {
      ;(userService.getUserStats as jest.Mock).mockReturnValue({
        total: 0,
        active: 0,
        inactive: 0,
      })

      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageAmount: 0,
        byFortuneType: {},
      })

      ;(orderService.getTodayOrderStats as jest.Mock).mockReturnValue({
        total: 0,
        revenue: 0,
      })

      const result = statsService.getDashboardStats()

      expect(result.revenue.growthRate).toBe(11.28)
    })
  })

  describe('getRevenueTrend - 获取收入趋势', () => {
    it('应该返回默认7天的收入趋势', () => {
      const result = statsService.getRevenueTrend()

      expect(result).toHaveLength(7)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('revenue')
    })

    it('应该返回指定天数的收入趋势', () => {
      const result = statsService.getRevenueTrend(14)

      expect(result).toHaveLength(14)
    })

    it('应该返回最近的日期在最后', () => {
      const result = statsService.getRevenueTrend(7)

      const firstDate = new Date(result[0].date)
      const lastDate = new Date(result[6].date)

      expect(lastDate.getTime()).toBeGreaterThan(firstDate.getTime())
    })

    it('应该返回正确的日期格式 (YYYY-MM-DD)', () => {
      const result = statsService.getRevenueTrend(3)

      result.forEach((item) => {
        expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('应该返回正数的收入值', () => {
      const result = statsService.getRevenueTrend(5)

      result.forEach((item) => {
        expect(item.revenue).toBeGreaterThan(0)
        expect(typeof item.revenue).toBe('number')
      })
    })

    it('应该返回3000-8000范围内的收入', () => {
      const result = statsService.getRevenueTrend(10)

      result.forEach((item) => {
        expect(item.revenue).toBeGreaterThanOrEqual(3000)
        expect(item.revenue).toBeLessThanOrEqual(8000)
      })
    })

    it('应该支持返回1天的数据', () => {
      const result = statsService.getRevenueTrend(1)

      expect(result).toHaveLength(1)
    })
  })

  describe('getUserGrowthTrend - 获取用户增长趋势', () => {
    it('应该返回默认7天的用户增长趋势', () => {
      const result = statsService.getUserGrowthTrend()

      expect(result).toHaveLength(7)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('newUsers')
      expect(result[0]).toHaveProperty('totalUsers')
    })

    it('应该返回指定天数的用户增长趋势', () => {
      const result = statsService.getUserGrowthTrend(14)

      expect(result).toHaveLength(14)
    })

    it('应该累加用户总数', () => {
      const result = statsService.getUserGrowthTrend(5)

      // 总用户数应该是递增的
      for (let i = 1; i < result.length; i++) {
        expect(result[i].totalUsers).toBeGreaterThan(result[i - 1].totalUsers)
      }
    })

    it('应该返回正确的累加逻辑', () => {
      const result = statsService.getUserGrowthTrend(3)

      // 每日新增应该被累加到总用户数
      expect(result[1].totalUsers).toBe(result[0].totalUsers + result[1].newUsers)
      expect(result[2].totalUsers).toBe(result[1].totalUsers + result[2].newUsers)
    })

    it('应该返回正数的新增用户', () => {
      const result = statsService.getUserGrowthTrend(5)

      result.forEach((item) => {
        expect(item.newUsers).toBeGreaterThan(0)
        expect(typeof item.newUsers).toBe('number')
      })
    })

    it('应该返回10-60范围内的新增用户', () => {
      const result = statsService.getUserGrowthTrend(10)

      result.forEach((item) => {
        expect(item.newUsers).toBeGreaterThanOrEqual(10)
        expect(item.newUsers).toBeLessThanOrEqual(60)
      })
    })

    it('应该从1000的基数开始', () => {
      const result = statsService.getUserGrowthTrend(1)

      // 第一天的总用户数应该是1000 + 新增用户
      expect(result[0].totalUsers).toBeGreaterThanOrEqual(1010)
      expect(result[0].totalUsers).toBeLessThanOrEqual(1060)
    })

    it('应该返回正确的日期格式', () => {
      const result = statsService.getUserGrowthTrend(3)

      result.forEach((item) => {
        expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })
  })

  describe('getFortuneTypeDistribution - 获取功能使用占比', () => {
    it('应该返回算命类型分布', () => {
      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 300,
        completed: 300,
        pending: 0,
        cancelled: 0,
        totalRevenue: 30000,
        averageAmount: 100,
        byFortuneType: {
          '八字精批': { count: 150, revenue: 15000 },
          '流年运势': { count: 100, revenue: 10000 },
          '姓名详批': { count: 50, revenue: 5000 },
        },
      })

      const result = statsService.getFortuneTypeDistribution()

      expect(result).toHaveLength(3)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('count')
      expect(result[0]).toHaveProperty('revenue')
      expect(result[0]).toHaveProperty('percentage')
    })

    it('应该按count降序排序', () => {
      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 280,
        completed: 280,
        pending: 0,
        cancelled: 0,
        totalRevenue: 28000,
        averageAmount: 100,
        byFortuneType: {
          '八字精批': { count: 150, revenue: 15000 },
          '流年运势': { count: 100, revenue: 10000 },
          '姓名详批': { count: 30, revenue: 3000 },
        },
      })

      const result = statsService.getFortuneTypeDistribution()

      expect(result[0].name).toBe('八字精批')
      expect(result[0].count).toBe(150)
      expect(result[1].name).toBe('流年运势')
      expect(result[1].count).toBe(100)
      expect(result[2].name).toBe('姓名详批')
      expect(result[2].count).toBe(30)
    })

    it('应该正确计算百分比', () => {
      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 100,
        completed: 100,
        pending: 0,
        cancelled: 0,
        totalRevenue: 10000,
        averageAmount: 100,
        byFortuneType: {
          '八字精批': { count: 50, revenue: 5000 },
          '流年运势': { count: 30, revenue: 3000 },
          '姓名详批': { count: 20, revenue: 2000 },
        },
      })

      const result = statsService.getFortuneTypeDistribution()

      expect(result[0].percentage).toBe('50.00')
      expect(result[1].percentage).toBe('30.00')
      expect(result[2].percentage).toBe('20.00')
    })

    it('应该处理空的算命类型数据', () => {
      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageAmount: 0,
        byFortuneType: {},
      })

      const result = statsService.getFortuneTypeDistribution()

      expect(result).toHaveLength(0)
    })

    it('应该包含所有必要字段', () => {
      ;(orderService.getOrderStats as jest.Mock).mockReturnValue({
        total: 200,
        completed: 200,
        pending: 0,
        cancelled: 0,
        totalRevenue: 20000,
        averageAmount: 100,
        byFortuneType: {
          '八字精批': { count: 100, revenue: 10000 },
          '流年运势': { count: 100, revenue: 10000 },
        },
      })

      const result = statsService.getFortuneTypeDistribution()

      result.forEach((item) => {
        expect(item).toHaveProperty('name')
        expect(item).toHaveProperty('count')
        expect(item).toHaveProperty('revenue')
        expect(item).toHaveProperty('percentage')
        expect(typeof item.name).toBe('string')
        expect(typeof item.count).toBe('number')
        expect(typeof item.revenue).toBe('number')
        expect(typeof item.percentage).toBe('string')
      })
    })
  })
})
