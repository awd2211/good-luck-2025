/**
 * orderController 单元测试
 */

import { Request, Response, NextFunction } from 'express'
import * as orderController from '../../../controllers/user/orderController'
import * as orderService from '../../../services/user/orderService'

// Mock orderService
jest.mock('../../../services/user/orderService')

describe('orderController - 订单控制器', () => {
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

  describe('createOrder - 创建订单', () => {
    it('应该成功创建订单', async () => {
      mockRequest.body = {
        items: [{ fortuneId: 'fortune_1', quantity: 1 }],
        payMethod: '支付宝',
      }

      const mockOrder = {
        order_id: 'ORD20250113123456',
        amount: '88.00',
        status: 'pending',
      }

      ;(orderService.createOrder as jest.Mock).mockResolvedValue(mockOrder)

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(orderService.createOrder).toHaveBeenCalledWith(
        'user_123',
        [{ fortuneId: 'fortune_1', quantity: 1 }],
        '支付宝'
      )
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '订单创建成功',
        data: mockOrder,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.body = {
        items: [{ fortuneId: 'fortune_1', quantity: 1 }],
      }

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(orderService.createOrder).not.toHaveBeenCalled()
    })

    it('应该在items为空时返回400', async () => {
      mockRequest.body = {}

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '请提供订单项',
      })
    })

    it('应该在items不是数组时返回400', async () => {
      mockRequest.body = { items: 'not-array' }

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在items为空数组时返回400', async () => {
      mockRequest.body = { items: [] }

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在订单项缺少fortuneId时返回400', async () => {
      mockRequest.body = {
        items: [{ quantity: 1 }],
      }

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '订单项格式错误：缺少fortuneId',
      })
    })

    it('应该在订单项fortuneId不是字符串时返回400', async () => {
      mockRequest.body = {
        items: [{ fortuneId: 123, quantity: 1 }],
      }

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在订单项数量小于1时返回400', async () => {
      mockRequest.body = {
        items: [{ fortuneId: 'fortune_1', quantity: 0 }],
      }

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '订单项格式错误：数量必须大于0',
      })
    })

    it('应该在服务抛出错误时返回400', async () => {
      mockRequest.body = {
        items: [{ fortuneId: 'fortune_1', quantity: 1 }],
      }

      const error = new Error('商品不存在')
      ;(orderService.createOrder as jest.Mock).mockRejectedValue(error)

      await orderController.createOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '商品不存在',
      })
    })
  })

  describe('getUserOrders - 获取用户订单列表', () => {
    it('应该成功获取订单列表', async () => {
      const mockResult = {
        items: [
          { order_id: 'ORD1', amount: '88.00', status: 'pending' },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }

      ;(orderService.getUserOrders as jest.Mock).mockResolvedValue(mockResult)

      await orderController.getUserOrders(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(orderService.getUserOrders).toHaveBeenCalledWith('user_123', {
        page: 1,
        limit: 10,
        status: undefined,
      })
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      })
    })

    it('应该支持分页查询', async () => {
      mockRequest.query = { page: '2', limit: '20' }

      ;(orderService.getUserOrders as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
      })

      await orderController.getUserOrders(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(orderService.getUserOrders).toHaveBeenCalledWith('user_123', {
        page: 2,
        limit: 20,
        status: undefined,
      })
    })

    it('应该支持按状态筛选', async () => {
      mockRequest.query = { status: 'paid' }

      ;(orderService.getUserOrders as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      })

      await orderController.getUserOrders(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(orderService.getUserOrders).toHaveBeenCalledWith('user_123', {
        page: 1,
        limit: 10,
        status: 'paid',
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await orderController.getUserOrders(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(orderService.getUserOrders).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(orderService.getUserOrders as jest.Mock).mockRejectedValue(error)

      await orderController.getUserOrders(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('getOrderDetail - 获取订单详情', () => {
    it('应该成功获取订单详情', async () => {
      mockRequest.params = { id: 'ORD123' }

      const mockOrder = {
        order_id: 'ORD123',
        amount: '88.00',
        status: 'pending',
      }

      ;(orderService.getOrderDetail as jest.Mock).mockResolvedValue(mockOrder)

      await orderController.getOrderDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(orderService.getOrderDetail).toHaveBeenCalledWith('user_123', 'ORD123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: 'ORD123' }

      await orderController.getOrderDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(orderService.getOrderDetail).not.toHaveBeenCalled()
    })

    it('应该在订单不存在时返回404', async () => {
      mockRequest.params = { id: 'ORD999' }

      const error = new Error('订单不存在')
      ;(orderService.getOrderDetail as jest.Mock).mockRejectedValue(error)

      await orderController.getOrderDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '订单不存在',
      })
    })

    it('应该在其他错误时调用next', async () => {
      mockRequest.params = { id: 'ORD123' }

      const error = new Error('数据库错误')
      ;(orderService.getOrderDetail as jest.Mock).mockRejectedValue(error)

      await orderController.getOrderDetail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('cancelOrder - 取消订单', () => {
    it('应该成功取消订单', async () => {
      mockRequest.params = { id: 'ORD123' }

      ;(orderService.cancelOrder as jest.Mock).mockResolvedValue({ success: true })

      await orderController.cancelOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(orderService.cancelOrder).toHaveBeenCalledWith('user_123', 'ORD123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '订单已取消',
        data: { success: true },
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: 'ORD123' }

      await orderController.cancelOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(orderService.cancelOrder).not.toHaveBeenCalled()
    })

    it('应该在订单不存在时返回404', async () => {
      mockRequest.params = { id: 'ORD999' }

      const error = new Error('订单不存在')
      ;(orderService.cancelOrder as jest.Mock).mockRejectedValue(error)

      await orderController.cancelOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '订单不存在',
      })
    })

    it('应该在其他错误时返回400', async () => {
      mockRequest.params = { id: 'ORD123' }

      const error = new Error('订单状态不允许取消')
      ;(orderService.cancelOrder as jest.Mock).mockRejectedValue(error)

      await orderController.cancelOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '订单状态不允许取消',
      })
    })
  })

  describe('deleteOrder - 删除订单', () => {
    it('应该成功删除订单', async () => {
      mockRequest.params = { id: 'ORD123' }

      ;(orderService.deleteOrder as jest.Mock).mockResolvedValue(undefined)

      await orderController.deleteOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(orderService.deleteOrder).toHaveBeenCalledWith('user_123', 'ORD123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '订单已删除',
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: 'ORD123' }

      await orderController.deleteOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(orderService.deleteOrder).not.toHaveBeenCalled()
    })

    it('应该在订单不存在时返回404', async () => {
      mockRequest.params = { id: 'ORD999' }

      const error = new Error('订单不存在')
      ;(orderService.deleteOrder as jest.Mock).mockRejectedValue(error)

      await orderController.deleteOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })

    it('应该在其他错误时返回400', async () => {
      mockRequest.params = { id: 'ORD123' }

      const error = new Error('订单状态不允许删除')
      ;(orderService.deleteOrder as jest.Mock).mockRejectedValue(error)

      await orderController.deleteOrder(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getOrderStats - 获取订单统计', () => {
    it('应该成功获取订单统计', async () => {
      const mockStats = {
        total: 10,
        pending: 2,
        paid: 5,
        completed: 3,
        cancelled: 0,
      }

      ;(orderService.getOrderStats as jest.Mock).mockResolvedValue(mockStats)

      await orderController.getOrderStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(orderService.getOrderStats).toHaveBeenCalledWith('user_123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await orderController.getOrderStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(orderService.getOrderStats).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(orderService.getOrderStats as jest.Mock).mockRejectedValue(error)

      await orderController.getOrderStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })
})
