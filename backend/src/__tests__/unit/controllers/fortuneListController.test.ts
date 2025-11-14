/**
 * fortuneListController 单元测试
 */

import { Request, Response, NextFunction } from 'express'
import * as fortuneListController from '../../../controllers/user/fortuneListController'
import * as fortuneListService from '../../../services/user/fortuneListService'

// Mock fortuneListService
jest.mock('../../../services/user/fortuneListService')

describe('fortuneListController - 算命列表控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      user: { id: 'user_123', phone: '13900000001' },
      body: {},
      params: {},
      query: {},
    }
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
    jest.clearAllMocks()
  })

  describe('getFortuneList - 获取算命服务列表', () => {
    it('应该成功获取算命服务列表', async () => {
      const mockResult = {
        items: [
          {
            id: 'fortune_1',
            name: '生肖运势',
            price: '88.00',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }

      ;(fortuneListService.getFortuneList as jest.Mock).mockResolvedValue(mockResult)

      await fortuneListController.getFortuneList(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getFortuneList).toHaveBeenCalledWith({
        category: undefined,
        page: 1,
        limit: 20,
        sort: undefined,
        keyword: undefined,
      })
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      })
    })

    it('应该支持分类筛选', async () => {
      mockRequest.query = { category: '生肖' }

      ;(fortuneListService.getFortuneList as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      await fortuneListController.getFortuneList(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getFortuneList).toHaveBeenCalledWith({
        category: '生肖',
        page: 1,
        limit: 20,
        sort: undefined,
        keyword: undefined,
      })
    })

    it('应该支持分页查询', async () => {
      mockRequest.query = { page: '2', limit: '10' }

      ;(fortuneListService.getFortuneList as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      })

      await fortuneListController.getFortuneList(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getFortuneList).toHaveBeenCalledWith({
        category: undefined,
        page: 2,
        limit: 10,
        sort: undefined,
        keyword: undefined,
      })
    })

    it('应该支持排序', async () => {
      mockRequest.query = { sort: 'price_asc' }

      ;(fortuneListService.getFortuneList as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      await fortuneListController.getFortuneList(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getFortuneList).toHaveBeenCalledWith({
        category: undefined,
        page: 1,
        limit: 20,
        sort: 'price_asc',
        keyword: undefined,
      })
    })

    it('应该支持关键词搜索', async () => {
      mockRequest.query = { keyword: '运势' }

      ;(fortuneListService.getFortuneList as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      await fortuneListController.getFortuneList(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getFortuneList).toHaveBeenCalledWith({
        category: undefined,
        page: 1,
        limit: 20,
        sort: undefined,
        keyword: '运势',
      })
    })

    it('应该支持组合查询', async () => {
      mockRequest.query = {
        category: '生肖',
        page: '2',
        limit: '10',
        sort: 'price_asc',
        keyword: '运势',
      }

      ;(fortuneListService.getFortuneList as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      })

      await fortuneListController.getFortuneList(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getFortuneList).toHaveBeenCalledWith({
        category: '生肖',
        page: 2,
        limit: 10,
        sort: 'price_asc',
        keyword: '运势',
      })
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(fortuneListService.getFortuneList as jest.Mock).mockRejectedValue(error)

      await fortuneListController.getFortuneList(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getFortuneDetail - 获取算命服务详情', () => {
    it('应该成功获取算命服务详情（已登录）', async () => {
      mockRequest.params = { id: 'fortune_1' }

      const mockFortune = {
        id: 'fortune_1',
        name: '生肖运势',
        price: '88.00',
        is_favorited: false,
      }

      ;(fortuneListService.getFortuneDetail as jest.Mock).mockResolvedValue(mockFortune)

      await fortuneListController.getFortuneDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getFortuneDetail).toHaveBeenCalledWith('fortune_1', 'user_123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFortune,
      })
    })

    it('应该成功获取算命服务详情（未登录）', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: 'fortune_1' }

      const mockFortune = {
        id: 'fortune_1',
        name: '生肖运势',
        price: '88.00',
      }

      ;(fortuneListService.getFortuneDetail as jest.Mock).mockResolvedValue(mockFortune)

      await fortuneListController.getFortuneDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getFortuneDetail).toHaveBeenCalledWith('fortune_1', undefined)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFortune,
      })
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.params = { id: 'fortune_999' }
      const error = new Error('服务不存在')
      ;(fortuneListService.getFortuneDetail as jest.Mock).mockRejectedValue(error)

      await fortuneListController.getFortuneDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getPopularFortunes - 获取热门服务', () => {
    it('应该成功获取热门服务', async () => {
      const mockFortunes = [
        {
          id: 'fortune_1',
          name: '生肖运势',
          price: '88.00',
          sales_count: 1000,
        },
      ]

      ;(fortuneListService.getPopularFortunes as jest.Mock).mockResolvedValue(mockFortunes)

      await fortuneListController.getPopularFortunes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getPopularFortunes).toHaveBeenCalledWith(10)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFortunes,
      })
    })

    it('应该支持自定义限制数量', async () => {
      mockRequest.query = { limit: '5' }

      ;(fortuneListService.getPopularFortunes as jest.Mock).mockResolvedValue([])

      await fortuneListController.getPopularFortunes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getPopularFortunes).toHaveBeenCalledWith(5)
    })

    it('应该使用默认限制数量', async () => {
      mockRequest.query = {}

      ;(fortuneListService.getPopularFortunes as jest.Mock).mockResolvedValue([])

      await fortuneListController.getPopularFortunes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getPopularFortunes).toHaveBeenCalledWith(10)
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(fortuneListService.getPopularFortunes as jest.Mock).mockRejectedValue(error)

      await fortuneListController.getPopularFortunes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getRecommendedFortunes - 获取推荐服务', () => {
    it('应该成功获取推荐服务', async () => {
      const mockFortunes = [
        {
          id: 'fortune_1',
          name: '生肖运势',
          price: '88.00',
          rating: 4.9,
        },
      ]

      ;(fortuneListService.getRecommendedFortunes as jest.Mock).mockResolvedValue(mockFortunes)

      await fortuneListController.getRecommendedFortunes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getRecommendedFortunes).toHaveBeenCalledWith(10)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFortunes,
      })
    })

    it('应该支持自定义限制数量', async () => {
      mockRequest.query = { limit: '8' }

      ;(fortuneListService.getRecommendedFortunes as jest.Mock).mockResolvedValue([])

      await fortuneListController.getRecommendedFortunes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getRecommendedFortunes).toHaveBeenCalledWith(8)
    })

    it('应该使用默认限制数量', async () => {
      mockRequest.query = {}

      ;(fortuneListService.getRecommendedFortunes as jest.Mock).mockResolvedValue([])

      await fortuneListController.getRecommendedFortunes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getRecommendedFortunes).toHaveBeenCalledWith(10)
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(fortuneListService.getRecommendedFortunes as jest.Mock).mockRejectedValue(error)

      await fortuneListController.getRecommendedFortunes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getCategories - 获取分类列表', () => {
    it('应该成功获取分类列表', async () => {
      const mockCategories = [
        {
          id: 'cat_1',
          name: '生肖',
          count: 10,
        },
        {
          id: 'cat_2',
          name: '星座',
          count: 8,
        },
      ]

      ;(fortuneListService.getCategories as jest.Mock).mockResolvedValue(mockCategories)

      await fortuneListController.getCategories(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(fortuneListService.getCategories).toHaveBeenCalled()
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategories,
      })
    })

    it('应该返回空数组当没有分类时', async () => {
      ;(fortuneListService.getCategories as jest.Mock).mockResolvedValue([])

      await fortuneListController.getCategories(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      })
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(fortuneListService.getCategories as jest.Mock).mockRejectedValue(error)

      await fortuneListController.getCategories(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })
})
