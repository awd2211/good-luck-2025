/**
 * favoriteController 单元测试
 */

import { Request, Response, NextFunction } from 'express'
import * as favoriteController from '../../../controllers/user/favoriteController'
import * as favoriteService from '../../../services/user/favoriteService'

// Mock favoriteService
jest.mock('../../../services/user/favoriteService')

describe('favoriteController - 收藏控制器', () => {
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

  describe('getFavorites - 获取收藏列表', () => {
    it('应该成功获取收藏列表', async () => {
      const mockResult = {
        items: [
          {
            id: 'fav_1',
            fortune_id: 'fortune_1',
            title: '生肖运势',
            price: '88.00',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }

      ;(favoriteService.getUserFavorites as jest.Mock).mockResolvedValue(mockResult)

      await favoriteController.getFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(favoriteService.getUserFavorites).toHaveBeenCalledWith('user_123', 1, 20)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      })
    })

    it('应该支持分页查询', async () => {
      mockRequest.query = { page: '2', limit: '10' }

      ;(favoriteService.getUserFavorites as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      })

      await favoriteController.getFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(favoriteService.getUserFavorites).toHaveBeenCalledWith('user_123', 2, 10)
    })

    it('应该使用默认分页参数', async () => {
      mockRequest.query = {}

      ;(favoriteService.getUserFavorites as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      await favoriteController.getFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(favoriteService.getUserFavorites).toHaveBeenCalledWith('user_123', 1, 20)
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await favoriteController.getFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '未登录',
      })
      expect(favoriteService.getUserFavorites).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(favoriteService.getUserFavorites as jest.Mock).mockRejectedValue(error)

      await favoriteController.getFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('addFavorite - 添加收藏', () => {
    it('应该成功添加收藏', async () => {
      mockRequest.body = { fortuneId: 'fortune_1' }

      const mockFavorite = {
        id: 'fav_1',
        user_id: 'user_123',
        fortune_id: 'fortune_1',
      }

      ;(favoriteService.addFavorite as jest.Mock).mockResolvedValue(mockFavorite)

      await favoriteController.addFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(favoriteService.addFavorite).toHaveBeenCalledWith('user_123', 'fortune_1')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '收藏成功',
        data: mockFavorite,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.body = { fortuneId: 'fortune_1' }

      await favoriteController.addFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(favoriteService.addFavorite).not.toHaveBeenCalled()
    })

    it('应该在fortuneId为空时返回400', async () => {
      mockRequest.body = {}

      await favoriteController.addFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '商品ID不能为空',
      })
      expect(favoriteService.addFavorite).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.body = { fortuneId: 'fortune_1' }
      const error = new Error('商品不存在')
      ;(favoriteService.addFavorite as jest.Mock).mockRejectedValue(error)

      await favoriteController.addFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('removeFavorite - 取消收藏', () => {
    it('应该成功取消收藏', async () => {
      mockRequest.params = { fortuneId: 'fortune_1' }

      ;(favoriteService.removeFavorite as jest.Mock).mockResolvedValue(undefined)

      await favoriteController.removeFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(favoriteService.removeFavorite).toHaveBeenCalledWith('user_123', 'fortune_1')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '已取消收藏',
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { fortuneId: 'fortune_1' }

      await favoriteController.removeFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(favoriteService.removeFavorite).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.params = { fortuneId: 'fortune_1' }
      const error = new Error('收藏不存在')
      ;(favoriteService.removeFavorite as jest.Mock).mockRejectedValue(error)

      await favoriteController.removeFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('checkFavorite - 检查是否收藏', () => {
    it('应该成功检查收藏状态（已收藏）', async () => {
      mockRequest.params = { fortuneId: 'fortune_1' }

      ;(favoriteService.checkFavorite as jest.Mock).mockResolvedValue(true)

      await favoriteController.checkFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(favoriteService.checkFavorite).toHaveBeenCalledWith('user_123', 'fortune_1')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: true,
      })
    })

    it('应该成功检查收藏状态（未收藏）', async () => {
      mockRequest.params = { fortuneId: 'fortune_1' }

      ;(favoriteService.checkFavorite as jest.Mock).mockResolvedValue(false)

      await favoriteController.checkFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: false,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { fortuneId: 'fortune_1' }

      await favoriteController.checkFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(favoriteService.checkFavorite).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.params = { fortuneId: 'fortune_1' }
      const error = new Error('数据库错误')
      ;(favoriteService.checkFavorite as jest.Mock).mockRejectedValue(error)

      await favoriteController.checkFavorite(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('batchCheckFavorites - 批量检查收藏状态', () => {
    it('应该成功批量检查收藏状态', async () => {
      mockRequest.body = { fortuneIds: ['fortune_1', 'fortune_2', 'fortune_3'] }

      const mockResult = {
        fortune_1: true,
        fortune_2: false,
        fortune_3: true,
      }

      ;(favoriteService.batchCheckFavorites as jest.Mock).mockResolvedValue(mockResult)

      await favoriteController.batchCheckFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(favoriteService.batchCheckFavorites).toHaveBeenCalledWith('user_123', [
        'fortune_1',
        'fortune_2',
        'fortune_3',
      ])
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      })
    })

    it('应该支持空数组', async () => {
      mockRequest.body = { fortuneIds: [] }

      ;(favoriteService.batchCheckFavorites as jest.Mock).mockResolvedValue({})

      await favoriteController.batchCheckFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(favoriteService.batchCheckFavorites).toHaveBeenCalledWith('user_123', [])
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.body = { fortuneIds: ['fortune_1'] }

      await favoriteController.batchCheckFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(favoriteService.batchCheckFavorites).not.toHaveBeenCalled()
    })

    it('应该在fortuneIds不是数组时返回400', async () => {
      mockRequest.body = { fortuneIds: 'not-an-array' }

      await favoriteController.batchCheckFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '参数格式错误',
      })
      expect(favoriteService.batchCheckFavorites).not.toHaveBeenCalled()
    })

    it('应该在fortuneIds为null时返回400', async () => {
      mockRequest.body = { fortuneIds: null }

      await favoriteController.batchCheckFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.body = { fortuneIds: ['fortune_1'] }
      const error = new Error('数据库错误')
      ;(favoriteService.batchCheckFavorites as jest.Mock).mockRejectedValue(error)

      await favoriteController.batchCheckFavorites(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })
})
