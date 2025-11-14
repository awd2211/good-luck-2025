/**
 * financialService 单元测试
 */

import * as financialService from '../../../services/financialService'
import { query } from '../../../config/database'

// Mock database
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

describe('financialService - 财务服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFinancialStats - 获取财务统计', () => {
    it('应该返回完整的财务统计信息', async () => {
      const mockOrderStats = {
        total_revenue: '50000',
        today_revenue: '1000',
        total_orders: '500',
        today_orders: '10',
      }

      const mockUserCount = {
        total_users: '1200',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrderStats] }) // order stats query
        .mockResolvedValueOnce({ rows: [mockUserCount] }) // user count query

      const result = await financialService.getFinancialStats()

      expect(result).toHaveProperty('total_revenue')
      expect(result).toHaveProperty('today_revenue')
      expect(result).toHaveProperty('total_orders')
      expect(result).toHaveProperty('today_orders')
      expect(result).toHaveProperty('avg_order_value')
      expect(result).toHaveProperty('total_users')
    })

    it('应该正确计算平均订单价值', async () => {
      const mockOrderStats = {
        total_revenue: '10000',
        today_revenue: '500',
        total_orders: '100',
        today_orders: '5',
      }

      const mockUserCount = {
        total_users: '500',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrderStats] })
        .mockResolvedValueOnce({ rows: [mockUserCount] })

      const result = await financialService.getFinancialStats()

      expect(result.avg_order_value).toBe(100) // 10000 / 100
    })

    it('应该在没有订单时返回0的平均值', async () => {
      const mockOrderStats = {
        total_revenue: '0',
        today_revenue: '0',
        total_orders: '0',
        today_orders: '0',
      }

      const mockUserCount = {
        total_users: '100',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrderStats] })
        .mockResolvedValueOnce({ rows: [mockUserCount] })

      const result = await financialService.getFinancialStats()

      expect(result.avg_order_value).toBe(0)
    })

    it('应该查询完成状态的订单', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            {
              total_revenue: '0',
              today_revenue: '0',
              total_orders: '0',
              today_orders: '0',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ total_users: '0' }] })

      await financialService.getFinancialStats()

      const firstCall = (query as jest.Mock).mock.calls[0]
      expect(firstCall[0]).toContain("status = 'completed'")
    })

    it('应该查询今天的订单', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            {
              total_revenue: '1000',
              today_revenue: '100',
              total_orders: '10',
              today_orders: '1',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ total_users: '50' }] })

      await financialService.getFinancialStats()

      const firstCall = (query as jest.Mock).mock.calls[0]
      expect(firstCall[0]).toContain('CURRENT_DATE')
    })

    it('应该使用COALESCE处理NULL值', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            {
              total_revenue: '0',
              today_revenue: '0',
              total_orders: '0',
              today_orders: '0',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ total_users: '0' }] })

      await financialService.getFinancialStats()

      const firstCall = (query as jest.Mock).mock.calls[0]
      expect(firstCall[0]).toContain('COALESCE')
    })

    it('应该转换用户总数为整数', async () => {
      const mockOrderStats = {
        total_revenue: '5000',
        today_revenue: '500',
        total_orders: '50',
        today_orders: '5',
      }

      const mockUserCount = {
        total_users: '1234',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrderStats] })
        .mockResolvedValueOnce({ rows: [mockUserCount] })

      const result = await financialService.getFinancialStats()

      expect(result.total_users).toBe(1234)
      expect(typeof result.total_users).toBe('number')
    })
  })

  describe('getFinancialData - 获取财务数据', () => {
    it('应该返回按日期分组的财务数据', async () => {
      const mockFinancialData = [
        { date: '2025-11-13', revenue: '1000', order_count: '10' },
        { date: '2025-11-12', revenue: '800', order_count: '8' },
        { date: '2025-11-11', revenue: '1200', order_count: '12' },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockFinancialData })

      const result = await financialService.getFinancialData()

      expect(result).toEqual(mockFinancialData)
      expect(result).toHaveLength(3)
    })

    it('应该使用默认日期范围（最近30天）', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await financialService.getFinancialData()

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain("INTERVAL '30 days'")
      expect(call[1]).toEqual([undefined, undefined])
    })

    it('应该支持自定义开始日期', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await financialService.getFinancialData('2025-11-01')

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1][0]).toBe('2025-11-01')
    })

    it('应该支持自定义结束日期', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await financialService.getFinancialData(undefined, '2025-11-13')

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1][1]).toBe('2025-11-13')
    })

    it('应该支持同时指定开始和结束日期', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await financialService.getFinancialData('2025-11-01', '2025-11-13')

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1][0]).toBe('2025-11-01')
      expect(call[1][1]).toBe('2025-11-13')
    })

    it('应该按日期降序排序', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await financialService.getFinancialData()

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain('ORDER BY date DESC')
    })

    it('应该按日期分组', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await financialService.getFinancialData()

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain('GROUP BY DATE(created_at)')
    })

    it('应该只统计完成状态的订单', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await financialService.getFinancialData()

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain("status = 'completed'")
    })

    it('应该返回包含date、revenue、order_count的数据', async () => {
      const mockData = [
        { date: '2025-11-13', revenue: '500', order_count: '5' },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockData })

      const result = await financialService.getFinancialData()

      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('revenue')
      expect(result[0]).toHaveProperty('order_count')
    })

    it('应该处理空结果', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await financialService.getFinancialData()

      expect(result).toEqual([])
    })

    it('应该使用COALESCE处理日期参数', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await financialService.getFinancialData()

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain('COALESCE($1::date')
      expect(call[0]).toContain('COALESCE($2::date')
    })
  })
})
