/**
 * statsController 单元测试
 */

import { Request, Response } from 'express'
import * as statsController from '../../../controllers/statsController'
import * as statsService from '../../../services/statsService'

jest.mock('../../../services/statsService')

describe('statsController - 统计控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockJson: jest.Mock
  let mockStatus: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockJson = jest.fn()
    mockStatus = jest.fn().mockReturnValue({ json: mockJson })
    mockRequest = { query: {} }
    mockResponse = { json: mockJson, status: mockStatus }
  })

  describe('getDashboard - 获取仪表板统计', () => {
    it('应该成功获取统计数据', () => {
      const mockStats = {
        totalUsers: 100,
        totalOrders: 50,
        totalRevenue: 5000,
        todayUsers: 10,
      }
      ;(statsService.getDashboardStats as jest.Mock).mockReturnValue(mockStats)

      statsController.getDashboard(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({ success: true, data: mockStats })
    })

    it('应该在发生错误时返回500', () => {
      ;(statsService.getDashboardStats as jest.Mock).mockImplementation(() => {
        throw new Error('数据库错误')
      })

      statsController.getDashboard(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(500)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '获取统计数据失败',
      })
    })
  })

  describe('getRevenue - 获取收入趋势', () => {
    it('应该成功获取收入趋势', () => {
      const mockData = [
        { date: '2025-11-01', revenue: 100 },
        { date: '2025-11-02', revenue: 200 },
      ]
      ;(statsService.getRevenueTrend as jest.Mock).mockReturnValue(mockData)

      statsController.getRevenue(mockRequest as Request, mockResponse as Response)

      expect(statsService.getRevenueTrend).toHaveBeenCalledWith(7)
      expect(mockJson).toHaveBeenCalledWith({ success: true, data: mockData })
    })

    it('应该支持自定义天数', () => {
      mockRequest.query = { days: '30' }
      ;(statsService.getRevenueTrend as jest.Mock).mockReturnValue([])

      statsController.getRevenue(mockRequest as Request, mockResponse as Response)

      expect(statsService.getRevenueTrend).toHaveBeenCalledWith(30)
    })
  })

  describe('getUserGrowth - 获取用户增长趋势', () => {
    it('应该成功获取用户增长趋势', () => {
      const mockData = [
        { date: '2025-11-01', count: 10 },
        { date: '2025-11-02', count: 15 },
      ]
      ;(statsService.getUserGrowthTrend as jest.Mock).mockReturnValue(mockData)

      statsController.getUserGrowth(mockRequest as Request, mockResponse as Response)

      expect(statsService.getUserGrowthTrend).toHaveBeenCalledWith(7)
      expect(mockJson).toHaveBeenCalledWith({ success: true, data: mockData })
    })

    it('应该支持自定义天数', () => {
      mockRequest.query = { days: '14' }
      ;(statsService.getUserGrowthTrend as jest.Mock).mockReturnValue([])

      statsController.getUserGrowth(mockRequest as Request, mockResponse as Response)

      expect(statsService.getUserGrowthTrend).toHaveBeenCalledWith(14)
    })
  })

  describe('getDistribution - 获取功能分布', () => {
    it('应该成功获取功能分布', () => {
      const mockData = [
        { name: '生肖运势', value: 100 },
        { name: '八字精批', value: 80 },
      ]
      ;(statsService.getFortuneTypeDistribution as jest.Mock).mockReturnValue(mockData)

      statsController.getDistribution(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({ success: true, data: mockData })
    })

    it('应该在发生错误时返回500', () => {
      ;(statsService.getFortuneTypeDistribution as jest.Mock).mockImplementation(() => {
        throw new Error('获取失败')
      })

      statsController.getDistribution(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(500)
    })
  })
})
