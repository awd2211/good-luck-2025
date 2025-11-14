/**
 * couponController 单元测试
 */

import { Request, Response, NextFunction } from 'express'
import * as couponController from '../../../controllers/user/couponController'
import * as couponService from '../../../services/user/couponService'

// Mock couponService
jest.mock('../../../services/user/couponService')

describe('couponController - 优惠券控制器', () => {
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

  describe('getAvailableCoupons - 获取可领取的优惠券列表', () => {
    it('应该成功获取可领取的优惠券（已登录）', async () => {
      const mockCoupons = [
        {
          id: 1,
          name: '新人礼包',
          discount_type: 'fixed',
          discount_value: '10.00',
          min_amount: '50.00',
          remaining_quantity: 100,
          is_received: false,
        },
      ]

      ;(couponService.getAvailableCoupons as jest.Mock).mockResolvedValue(mockCoupons)

      await couponController.getAvailableCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(couponService.getAvailableCoupons).toHaveBeenCalledWith('user_123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCoupons,
      })
    })

    it('应该成功获取可领取的优惠券（未登录）', async () => {
      mockRequest.user = undefined

      const mockCoupons = [
        {
          id: 1,
          name: '新人礼包',
          remaining_quantity: 100,
        },
      ]

      ;(couponService.getAvailableCoupons as jest.Mock).mockResolvedValue(mockCoupons)

      await couponController.getAvailableCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(couponService.getAvailableCoupons).toHaveBeenCalledWith(undefined)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCoupons,
      })
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(couponService.getAvailableCoupons as jest.Mock).mockRejectedValue(error)

      await couponController.getAvailableCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('receiveCoupon - 领取优惠券', () => {
    it('应该成功领取优惠券', async () => {
      mockRequest.body = { couponId: 1 }

      const mockUserCoupon = {
        id: 'uc_1',
        user_id: 'user_123',
        coupon_id: 1,
        status: 'available',
      }

      ;(couponService.receiveCoupon as jest.Mock).mockResolvedValue(mockUserCoupon)

      await couponController.receiveCoupon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(couponService.receiveCoupon).toHaveBeenCalledWith('user_123', 1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '领取成功',
        data: mockUserCoupon,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.body = { couponId: 1 }

      await couponController.receiveCoupon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '未登录',
      })
      expect(couponService.receiveCoupon).not.toHaveBeenCalled()
    })

    it('应该在couponId为空时返回400', async () => {
      mockRequest.body = {}

      await couponController.receiveCoupon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '请提供优惠券ID',
      })
    })

    it('应该在couponId不是数字时返回400', async () => {
      mockRequest.body = { couponId: 'invalid' }

      await couponController.receiveCoupon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '请提供优惠券ID',
      })
    })

    it('应该在服务抛出Error时返回400', async () => {
      mockRequest.body = { couponId: 1 }
      const error = new Error('优惠券不存在')
      ;(couponService.receiveCoupon as jest.Mock).mockRejectedValue(error)

      await couponController.receiveCoupon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '优惠券不存在',
      })
    })

    it('应该在服务抛出非Error时调用next', async () => {
      mockRequest.body = { couponId: 1 }
      const error = 'Unknown error'
      ;(couponService.receiveCoupon as jest.Mock).mockRejectedValue(error)

      await couponController.receiveCoupon(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getUserCoupons - 获取用户的优惠券列表', () => {
    it('应该成功获取用户优惠券列表', async () => {
      const mockResult = {
        items: [
          {
            id: 'uc_1',
            coupon_id: 1,
            name: '新人礼包',
            status: 'available',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }

      ;(couponService.getUserCoupons as jest.Mock).mockResolvedValue(mockResult)

      await couponController.getUserCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(couponService.getUserCoupons).toHaveBeenCalledWith('user_123', {
        page: 1,
        limit: 20,
        status: undefined,
      })
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      })
    })

    it('应该支持分页查询', async () => {
      mockRequest.query = { page: '2', limit: '10' }

      ;(couponService.getUserCoupons as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      })

      await couponController.getUserCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(couponService.getUserCoupons).toHaveBeenCalledWith('user_123', {
        page: 2,
        limit: 10,
        status: undefined,
      })
    })

    it('应该支持按状态筛选', async () => {
      mockRequest.query = { status: 'available' }

      ;(couponService.getUserCoupons as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      await couponController.getUserCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(couponService.getUserCoupons).toHaveBeenCalledWith('user_123', {
        page: 1,
        limit: 20,
        status: 'available',
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await couponController.getUserCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(couponService.getUserCoupons).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(couponService.getUserCoupons as jest.Mock).mockRejectedValue(error)

      await couponController.getUserCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getUsableCoupons - 获取用户可用的优惠券', () => {
    it('应该成功获取可用优惠券', async () => {
      mockRequest.query = { amount: '100', fortuneType: '生肖运势' }

      const mockCoupons = [
        {
          id: 'uc_1',
          name: '满100减10',
          discount_value: '10.00',
        },
      ]

      ;(couponService.getUsableCoupons as jest.Mock).mockResolvedValue(mockCoupons)

      await couponController.getUsableCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(couponService.getUsableCoupons).toHaveBeenCalledWith(
        'user_123',
        100,
        '生肖运势'
      )
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCoupons,
      })
    })

    it('应该支持不指定fortuneType', async () => {
      mockRequest.query = { amount: '50' }

      ;(couponService.getUsableCoupons as jest.Mock).mockResolvedValue([])

      await couponController.getUsableCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(couponService.getUsableCoupons).toHaveBeenCalledWith(
        'user_123',
        50,
        undefined
      )
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.query = { amount: '100' }

      await couponController.getUsableCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(couponService.getUsableCoupons).not.toHaveBeenCalled()
    })

    it('应该在amount为空时返回400', async () => {
      mockRequest.query = {}

      await couponController.getUsableCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '请提供有效的订单金额',
      })
    })

    it('应该在amount不是数字时返回400', async () => {
      mockRequest.query = { amount: 'invalid' }

      await couponController.getUsableCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在amount小于等于0时返回400', async () => {
      mockRequest.query = { amount: '0' }

      await couponController.getUsableCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.query = { amount: '100' }
      const error = new Error('数据库错误')
      ;(couponService.getUsableCoupons as jest.Mock).mockRejectedValue(error)

      await couponController.getUsableCoupons(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getCouponStats - 获取优惠券统计', () => {
    it('应该成功获取优惠券统计', async () => {
      const mockStats = {
        total: 10,
        available: 5,
        used: 3,
        expired: 2,
      }

      ;(couponService.getCouponStats as jest.Mock).mockResolvedValue(mockStats)

      await couponController.getCouponStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(couponService.getCouponStats).toHaveBeenCalledWith('user_123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await couponController.getCouponStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(couponService.getCouponStats).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(couponService.getCouponStats as jest.Mock).mockRejectedValue(error)

      await couponController.getCouponStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })
})
