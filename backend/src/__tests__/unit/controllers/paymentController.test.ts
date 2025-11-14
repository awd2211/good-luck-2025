/**
 * paymentController 单元测试
 */

import { Request, Response, NextFunction } from 'express'
import * as paymentController from '../../../controllers/user/paymentController'
import * as paymentService from '../../../services/user/paymentService'

// Mock paymentService
jest.mock('../../../services/user/paymentService')

describe('paymentController - 支付控制器', () => {
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

  describe('createPayment - 创建支付订单', () => {
    it('应该成功创建支付订单', async () => {
      mockRequest.body = {
        orderId: 'ORD123',
        payMethod: '支付宝',
      }

      const mockPayment = {
        payment_id: 'PAY123',
        order_id: 'ORD123',
        amount: '88.00',
        status: 'pending',
      }

      ;(paymentService.createPayment as jest.Mock).mockResolvedValue(mockPayment)

      await paymentController.createPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.createPayment).toHaveBeenCalledWith(
        'user_123',
        'ORD123',
        '支付宝'
      )
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '支付订单创建成功',
        data: mockPayment,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.body = { orderId: 'ORD123', payMethod: '支付宝' }

      await paymentController.createPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(paymentService.createPayment).not.toHaveBeenCalled()
    })

    it('应该在订单ID为空时返回400', async () => {
      mockRequest.body = { payMethod: '支付宝' }

      await paymentController.createPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '订单ID不能为空',
      })
    })

    it('应该在支付方式为空时返回400', async () => {
      mockRequest.body = { orderId: 'ORD123' }

      await paymentController.createPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '支付方式不能为空',
      })
    })

    it('应该在支付方式不支持时返回400', async () => {
      mockRequest.body = {
        orderId: 'ORD123',
        payMethod: 'PayPal',
      }

      await paymentController.createPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '不支持的支付方式',
      })
    })

    it('应该支持微信支付', async () => {
      mockRequest.body = {
        orderId: 'ORD123',
        payMethod: '微信',
      }

      ;(paymentService.createPayment as jest.Mock).mockResolvedValue({})

      await paymentController.createPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.createPayment).toHaveBeenCalledWith(
        'user_123',
        'ORD123',
        '微信'
      )
    })

    it('应该支持银行卡支付', async () => {
      mockRequest.body = {
        orderId: 'ORD123',
        payMethod: '银行卡',
      }

      ;(paymentService.createPayment as jest.Mock).mockResolvedValue({})

      await paymentController.createPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.createPayment).toHaveBeenCalledWith(
        'user_123',
        'ORD123',
        '银行卡'
      )
    })

    it('应该在服务抛出错误时返回400', async () => {
      mockRequest.body = {
        orderId: 'ORD999',
        payMethod: '支付宝',
      }

      const error = new Error('订单不存在')
      ;(paymentService.createPayment as jest.Mock).mockRejectedValue(error)

      await paymentController.createPayment(
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
  })

  describe('paymentCallback - 支付回调', () => {
    it('应该成功处理支付成功回调', async () => {
      mockRequest.body = {
        paymentId: 'PAY123',
        transactionNo: 'TRANS456',
        status: 'success',
      }

      const mockResult = { success: true, orderId: 'ORD123' }
      ;(paymentService.paymentSuccess as jest.Mock).mockResolvedValue(mockResult)

      await paymentController.paymentCallback(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.paymentSuccess).toHaveBeenCalledWith('PAY123', 'TRANS456')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '支付成功',
        data: mockResult,
      })
    })

    it('应该成功处理支付失败回调', async () => {
      mockRequest.body = {
        paymentId: 'PAY123',
        status: 'failed',
        errorMessage: '余额不足',
      }

      const mockResult = { success: true, orderId: 'ORD123' }
      ;(paymentService.paymentFailed as jest.Mock).mockResolvedValue(mockResult)

      await paymentController.paymentCallback(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.paymentFailed).toHaveBeenCalledWith('PAY123', '余额不足')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '支付失败已记录',
        data: mockResult,
      })
    })

    it('应该使用默认错误信息处理失败回调', async () => {
      mockRequest.body = {
        paymentId: 'PAY123',
        status: 'failed',
      }

      ;(paymentService.paymentFailed as jest.Mock).mockResolvedValue({})

      await paymentController.paymentCallback(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.paymentFailed).toHaveBeenCalledWith('PAY123', '支付失败')
    })

    it('应该在paymentId为空时返回400', async () => {
      mockRequest.body = {
        status: 'success',
        transactionNo: 'TRANS456',
      }

      await paymentController.paymentCallback(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '支付ID不能为空',
      })
    })

    it('应该在status为空时返回400', async () => {
      mockRequest.body = {
        paymentId: 'PAY123',
        transactionNo: 'TRANS456',
      }

      await paymentController.paymentCallback(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '支付状态不能为空',
      })
    })

    it('应该在成功状态但缺少交易流水号时返回400', async () => {
      mockRequest.body = {
        paymentId: 'PAY123',
        status: 'success',
      }

      await paymentController.paymentCallback(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '交易流水号不能为空',
      })
    })

    it('应该在不支持的状态时返回400', async () => {
      mockRequest.body = {
        paymentId: 'PAY123',
        status: 'unknown',
      }

      await paymentController.paymentCallback(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '不支持的支付状态',
      })
    })
  })

  describe('getPaymentStatus - 查询支付状态', () => {
    it('应该成功查询支付状态', async () => {
      mockRequest.params = { paymentId: 'PAY123' }

      const mockPayment = {
        payment_id: 'PAY123',
        status: 'success',
        amount: '88.00',
      }

      ;(paymentService.getPaymentStatus as jest.Mock).mockResolvedValue(mockPayment)

      await paymentController.getPaymentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.getPaymentStatus).toHaveBeenCalledWith('user_123', 'PAY123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPayment,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { paymentId: 'PAY123' }

      await paymentController.getPaymentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(paymentService.getPaymentStatus).not.toHaveBeenCalled()
    })

    it('应该在支付不存在时返回404', async () => {
      mockRequest.params = { paymentId: 'PAY999' }

      const error = new Error('支付记录不存在')
      ;(paymentService.getPaymentStatus as jest.Mock).mockRejectedValue(error)

      await paymentController.getPaymentStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })
  })

  describe('getOrderPayments - 获取订单的支付记录', () => {
    it('应该成功获取订单支付记录', async () => {
      mockRequest.params = { orderId: 'ORD123' }

      const mockPayments = [
        { payment_id: 'PAY1', status: 'success' },
        { payment_id: 'PAY2', status: 'failed' },
      ]

      ;(paymentService.getOrderPayments as jest.Mock).mockResolvedValue(mockPayments)

      await paymentController.getOrderPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.getOrderPayments).toHaveBeenCalledWith('user_123', 'ORD123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPayments,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { orderId: 'ORD123' }

      await paymentController.getOrderPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })
  })

  describe('getUserPayments - 获取用户支付记录列表', () => {
    it('应该成功获取支付记录列表', async () => {
      const mockResult = {
        items: [{ payment_id: 'PAY1', status: 'success' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }

      ;(paymentService.getUserPayments as jest.Mock).mockResolvedValue(mockResult)

      await paymentController.getUserPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.getUserPayments).toHaveBeenCalledWith('user_123', {
        page: 1,
        limit: 20,
        status: undefined,
      })
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        items: mockResult.items,
        pagination: mockResult.pagination,
      })
    })

    it('应该支持分页查询', async () => {
      mockRequest.query = { page: '2', limit: '10' }

      ;(paymentService.getUserPayments as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      })

      await paymentController.getUserPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.getUserPayments).toHaveBeenCalledWith('user_123', {
        page: 2,
        limit: 10,
        status: undefined,
      })
    })

    it('应该支持按状态筛选', async () => {
      mockRequest.query = { status: 'success' }

      ;(paymentService.getUserPayments as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      await paymentController.getUserPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.getUserPayments).toHaveBeenCalledWith('user_123', {
        page: 1,
        limit: 20,
        status: 'success',
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await paymentController.getUserPayments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })
  })

  describe('cancelPayment - 取消支付', () => {
    it('应该成功取消支付', async () => {
      mockRequest.params = { paymentId: 'PAY123' }

      ;(paymentService.cancelPayment as jest.Mock).mockResolvedValue({ success: true })

      await paymentController.cancelPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(paymentService.cancelPayment).toHaveBeenCalledWith('user_123', 'PAY123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '支付已取消',
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { paymentId: 'PAY123' }

      await paymentController.cancelPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(paymentService.cancelPayment).not.toHaveBeenCalled()
    })

    it('应该在支付状态不允许取消时返回400', async () => {
      mockRequest.params = { paymentId: 'PAY123' }

      const error = new Error('支付记录不存在或状态不允许取消')
      ;(paymentService.cancelPayment as jest.Mock).mockRejectedValue(error)

      await paymentController.cancelPayment(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })
  })
})
