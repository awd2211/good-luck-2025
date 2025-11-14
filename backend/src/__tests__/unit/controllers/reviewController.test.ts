/**
 * reviewController 单元测试
 */

import { Request, Response, NextFunction } from 'express'
import * as reviewController from '../../../controllers/user/reviewController'
import * as reviewService from '../../../services/user/reviewService'

// Mock reviewService
jest.mock('../../../services/user/reviewService')

describe('reviewController - 评价控制器', () => {
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

  describe('createReview - 创建评价', () => {
    it('应该成功创建评价', async () => {
      mockRequest.body = {
        orderId: 'ORD123',
        rating: 5,
        content: '非常准确',
        images: ['img1.jpg', 'img2.jpg'],
        tags: ['准确', '专业'],
        isAnonymous: false,
      }

      const mockReview = {
        id: 1,
        order_id: 'ORD123',
        user_id: 'user_123',
        rating: 5,
        content: '非常准确',
      }

      ;(reviewService.createReview as jest.Mock).mockResolvedValue(mockReview)

      await reviewController.createReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(reviewService.createReview).toHaveBeenCalledWith('user_123', {
        orderId: 'ORD123',
        rating: 5,
        content: '非常准确',
        images: ['img1.jpg', 'img2.jpg'],
        tags: ['准确', '专业'],
        isAnonymous: false,
      })
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '评价成功',
        data: mockReview,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.body = { orderId: 'ORD123', rating: 5 }

      await reviewController.createReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(reviewService.createReview).not.toHaveBeenCalled()
    })

    it('应该在orderId为空时返回400', async () => {
      mockRequest.body = { rating: 5 }

      await reviewController.createReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '请提供订单号',
      })
    })

    it('应该在orderId不是字符串时返回400', async () => {
      mockRequest.body = { orderId: 123, rating: 5 }

      await reviewController.createReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在rating为空时返回400', async () => {
      mockRequest.body = { orderId: 'ORD123' }

      await reviewController.createReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '评分必须在1-5之间',
      })
    })

    it('应该在rating不是数字时返回400', async () => {
      mockRequest.body = { orderId: 'ORD123', rating: 'five' }

      await reviewController.createReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在rating小于1时返回400', async () => {
      mockRequest.body = { orderId: 'ORD123', rating: 0 }

      await reviewController.createReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在rating大于5时返回400', async () => {
      mockRequest.body = { orderId: 'ORD123', rating: 6 }

      await reviewController.createReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在服务抛出Error时返回400', async () => {
      mockRequest.body = { orderId: 'ORD123', rating: 5 }
      const error = new Error('订单不存在')
      ;(reviewService.createReview as jest.Mock).mockRejectedValue(error)

      await reviewController.createReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '订单不存在',
      })
    })

    it('应该在服务抛出非Error时调用next', async () => {
      mockRequest.body = { orderId: 'ORD123', rating: 5 }
      const error = 'Unknown error'
      ;(reviewService.createReview as jest.Mock).mockRejectedValue(error)

      await reviewController.createReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getUserReviews - 获取用户的评价列表', () => {
    it('应该成功获取用户评价列表', async () => {
      const mockResult = {
        items: [
          {
            id: 1,
            order_id: 'ORD123',
            rating: 5,
            content: '非常准确',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }

      ;(reviewService.getUserReviews as jest.Mock).mockResolvedValue(mockResult)

      await reviewController.getUserReviews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(reviewService.getUserReviews).toHaveBeenCalledWith('user_123', {
        page: 1,
        limit: 20,
      })
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      })
    })

    it('应该支持分页查询', async () => {
      mockRequest.query = { page: '2', limit: '10' }

      ;(reviewService.getUserReviews as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      })

      await reviewController.getUserReviews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(reviewService.getUserReviews).toHaveBeenCalledWith('user_123', {
        page: 2,
        limit: 10,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await reviewController.getUserReviews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(reviewService.getUserReviews).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(reviewService.getUserReviews as jest.Mock).mockRejectedValue(error)

      await reviewController.getUserReviews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getFortuneReviews - 获取算命服务的评价列表', () => {
    it('应该成功获取算命服务评价列表', async () => {
      mockRequest.params = { fortuneType: '生肖运势' }

      const mockResult = {
        items: [{ id: 1, rating: 5 }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }

      ;(reviewService.getFortuneReviews as jest.Mock).mockResolvedValue(mockResult)

      await reviewController.getFortuneReviews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(reviewService.getFortuneReviews).toHaveBeenCalledWith('生肖运势', {
        page: 1,
        limit: 20,
        rating: undefined,
      })
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      })
    })

    it('应该支持按评分筛选', async () => {
      mockRequest.params = { fortuneType: '生肖运势' }
      mockRequest.query = { rating: '5' }

      ;(reviewService.getFortuneReviews as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      await reviewController.getFortuneReviews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(reviewService.getFortuneReviews).toHaveBeenCalledWith('生肖运势', {
        page: 1,
        limit: 20,
        rating: 5,
      })
    })

    it('应该支持分页查询', async () => {
      mockRequest.params = { fortuneType: '生肖运势' }
      mockRequest.query = { page: '3', limit: '15' }

      ;(reviewService.getFortuneReviews as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 3, limit: 15, total: 0, totalPages: 0 },
      })

      await reviewController.getFortuneReviews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(reviewService.getFortuneReviews).toHaveBeenCalledWith('生肖运势', {
        page: 3,
        limit: 15,
        rating: undefined,
      })
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.params = { fortuneType: '生肖运势' }
      const error = new Error('数据库错误')
      ;(reviewService.getFortuneReviews as jest.Mock).mockRejectedValue(error)

      await reviewController.getFortuneReviews(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getReviewDetail - 获取评价详情', () => {
    it('应该成功获取评价详情', async () => {
      mockRequest.params = { id: '1' }

      const mockReview = {
        id: 1,
        rating: 5,
        content: '非常准确',
      }

      ;(reviewService.getReviewDetail as jest.Mock).mockResolvedValue(mockReview)

      await reviewController.getReviewDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(reviewService.getReviewDetail).toHaveBeenCalledWith(1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockReview,
      })
    })

    it('应该在id不是数字时返回400', async () => {
      mockRequest.params = { id: 'invalid' }

      await reviewController.getReviewDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '无效的评价ID',
      })
    })

    it('应该在评价不存在时返回404', async () => {
      mockRequest.params = { id: '999' }
      const error = new Error('评价不存在')
      ;(reviewService.getReviewDetail as jest.Mock).mockRejectedValue(error)

      await reviewController.getReviewDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '评价不存在',
      })
    })

    it('应该在其他错误时调用next', async () => {
      mockRequest.params = { id: '1' }
      const error = new Error('数据库错误')
      ;(reviewService.getReviewDetail as jest.Mock).mockRejectedValue(error)

      await reviewController.getReviewDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('deleteReview - 删除评价', () => {
    it('应该成功删除评价', async () => {
      mockRequest.params = { id: '1' }

      ;(reviewService.deleteReview as jest.Mock).mockResolvedValue(undefined)

      await reviewController.deleteReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(reviewService.deleteReview).toHaveBeenCalledWith('user_123', 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '删除成功',
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: '1' }

      await reviewController.deleteReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(reviewService.deleteReview).not.toHaveBeenCalled()
    })

    it('应该在id不是数字时返回400', async () => {
      mockRequest.params = { id: 'invalid' }

      await reviewController.deleteReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '无效的评价ID',
      })
    })

    it('应该在评价不存在时返回404', async () => {
      mockRequest.params = { id: '999' }
      const error = new Error('评价不存在')
      ;(reviewService.deleteReview as jest.Mock).mockRejectedValue(error)

      await reviewController.deleteReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '评价不存在',
      })
    })

    it('应该在其他Error时返回400', async () => {
      mockRequest.params = { id: '1' }
      const error = new Error('无权删除此评价')
      ;(reviewService.deleteReview as jest.Mock).mockRejectedValue(error)

      await reviewController.deleteReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '无权删除此评价',
      })
    })

    it('应该在非Error时调用next', async () => {
      mockRequest.params = { id: '1' }
      const error = 'Unknown error'
      ;(reviewService.deleteReview as jest.Mock).mockRejectedValue(error)

      await reviewController.deleteReview(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('markHelpful - 点赞评价', () => {
    it('应该成功点赞评价', async () => {
      mockRequest.params = { id: '1' }

      const mockResult = { helpful_count: 10 }
      ;(reviewService.markHelpful as jest.Mock).mockResolvedValue(mockResult)

      await reviewController.markHelpful(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(reviewService.markHelpful).toHaveBeenCalledWith(1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '标记成功',
        data: mockResult,
      })
    })

    it('应该在id不是数字时返回400', async () => {
      mockRequest.params = { id: 'invalid' }

      await reviewController.markHelpful(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '无效的评价ID',
      })
    })

    it('应该在评价不存在时返回404', async () => {
      mockRequest.params = { id: '999' }
      const error = new Error('评价不存在')
      ;(reviewService.markHelpful as jest.Mock).mockRejectedValue(error)

      await reviewController.markHelpful(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '评价不存在',
      })
    })

    it('应该在其他错误时调用next', async () => {
      mockRequest.params = { id: '1' }
      const error = new Error('数据库错误')
      ;(reviewService.markHelpful as jest.Mock).mockRejectedValue(error)

      await reviewController.markHelpful(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('canReviewOrder - 检查订单是否可以评价', () => {
    it('应该成功检查订单可以评价', async () => {
      mockRequest.params = { orderId: 'ORD123' }

      const mockResult = { canReview: true }
      ;(reviewService.canReviewOrder as jest.Mock).mockResolvedValue(mockResult)

      await reviewController.canReviewOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(reviewService.canReviewOrder).toHaveBeenCalledWith('user_123', 'ORD123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      })
    })

    it('应该成功检查订单不可以评价', async () => {
      mockRequest.params = { orderId: 'ORD123' }

      const mockResult = { canReview: false, reason: '订单未完成' }
      ;(reviewService.canReviewOrder as jest.Mock).mockResolvedValue(mockResult)

      await reviewController.canReviewOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { orderId: 'ORD123' }

      await reviewController.canReviewOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(reviewService.canReviewOrder).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.params = { orderId: 'ORD123' }
      const error = new Error('数据库错误')
      ;(reviewService.canReviewOrder as jest.Mock).mockRejectedValue(error)

      await reviewController.canReviewOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })
})
