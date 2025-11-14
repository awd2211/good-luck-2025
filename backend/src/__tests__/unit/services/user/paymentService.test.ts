/**
 * user/paymentService 单元测试
 */

import * as paymentService from '../../../../services/user/paymentService'
import pool from '../../../../config/database'
import * as paypalService from '../../../../services/paypalService'
import * as stripeService from '../../../../services/stripeService'
import { generateId } from '../../../../utils/idGenerator'

// Mock dependencies
jest.mock('../../../../config/database')
jest.mock('../../../../services/paypalService')
jest.mock('../../../../services/stripeService')
jest.mock('../../../../utils/idGenerator')

describe('user/paymentService - 用户支付服务', () => {
  let mockClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock database client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    }

    ;(pool.connect as jest.Mock).mockResolvedValue(mockClient)
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  })

  describe('createPayment - 创建支付', () => {
    it('应该成功创建余额支付', async () => {
      const mockOrder = {
        id: 'order_1',
        order_id: 'ORD123',
        user_id: 'user_123',
        total_amount: 100,
        payment_status: 'unpaid',
      }

      const mockUser = {
        balance: 150,
      }

      ;(generateId as jest.Mock).mockReturnValue('TXN123')

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 查询订单
        .mockResolvedValueOnce({ rows: [] }) // 插入支付交易
        .mockResolvedValueOnce({ rows: [mockUser] }) // 查询用户余额
        .mockResolvedValueOnce({ rows: [] }) // 扣除余额
        .mockResolvedValueOnce({ rows: [] }) // 更新交易状态
        .mockResolvedValueOnce({ rows: [{ order_id: 'ORD123' }] }) // 查询订单ID
        .mockResolvedValueOnce({ rows: [] }) // 更新订单状态
        .mockResolvedValueOnce({}) // COMMIT

      const result = await paymentService.createPayment({
        userId: 'user_123',
        orderId: 'ORD123',
        amount: 100,
        paymentMethod: 'balance',
      })

      expect(result.success).toBe(true)
      expect(result.transactionId).toBe('TXN123')
      expect(result.message).toBe('余额支付成功')
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })

    it('应该成功创建PayPal支付', async () => {
      const mockOrder = {
        id: 'order_1',
        order_id: 'ORD123',
        user_id: 'user_123',
        total_amount: 100,
        payment_status: 'unpaid',
      }

      const mockPayPalResult = {
        paypalOrderId: 'PAYPAL123',
        approvalUrl: 'https://paypal.com/approve',
      }

      ;(generateId as jest.Mock).mockReturnValue('TXN123')
      ;(paypalService.createPayPalOrder as jest.Mock).mockResolvedValue(mockPayPalResult)

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 查询订单
        .mockResolvedValueOnce({ rows: [] }) // 插入支付交易
        .mockResolvedValueOnce({ rows: [] }) // 更新交易记录
        .mockResolvedValueOnce({}) // COMMIT

      const result = await paymentService.createPayment({
        userId: 'user_123',
        orderId: 'ORD123',
        amount: 100,
        paymentMethod: 'paypal',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })

      expect(result.success).toBe(true)
      expect(result.transactionId).toBe('TXN123')
      expect(result.paymentUrl).toBe('https://paypal.com/approve')
      expect(paypalService.createPayPalOrder).toHaveBeenCalled()
    })

    it('应该成功创建Stripe支付', async () => {
      const mockOrder = {
        id: 'order_1',
        order_id: 'ORD123',
        user_id: 'user_123',
        total_amount: 100,
        payment_status: 'unpaid',
      }

      const mockStripeResult = {
        paymentIntentId: 'pi_123',
        clientSecret: 'secret_123',
      }

      ;(generateId as jest.Mock).mockReturnValue('TXN123')
      ;(stripeService.createStripePaymentIntent as jest.Mock).mockResolvedValue(mockStripeResult)

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 查询订单
        .mockResolvedValueOnce({ rows: [] }) // 插入支付交易
        .mockResolvedValueOnce({ rows: [] }) // 更新交易记录
        .mockResolvedValueOnce({}) // COMMIT

      const result = await paymentService.createPayment({
        userId: 'user_123',
        orderId: 'ORD123',
        amount: 100,
        paymentMethod: 'stripe',
        userEmail: 'user@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.transactionId).toBe('TXN123')
      expect(result.clientSecret).toBe('secret_123')
      expect(stripeService.createStripePaymentIntent).toHaveBeenCalled()
    })

    it('应该在订单不存在时抛出异常', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // 查询订单
        .mockResolvedValueOnce({}) // ROLLBACK

      await expect(
        paymentService.createPayment({
          userId: 'user_123',
          orderId: 'ORD999',
          amount: 100,
          paymentMethod: 'balance',
        })
      ).rejects.toThrow('订单不存在')

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
    })

    it('应该在订单已支付时抛出异常', async () => {
      const mockOrder = {
        id: 'order_1',
        order_id: 'ORD123',
        user_id: 'user_123',
        total_amount: 100,
        payment_status: 'paid',
      }

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 查询订单
        .mockResolvedValueOnce({}) // ROLLBACK

      await expect(
        paymentService.createPayment({
          userId: 'user_123',
          orderId: 'ORD123',
          amount: 100,
          paymentMethod: 'balance',
        })
      ).rejects.toThrow('订单已支付')
    })

    it('应该在支付金额与订单金额不符时抛出异常', async () => {
      const mockOrder = {
        id: 'order_1',
        order_id: 'ORD123',
        user_id: 'user_123',
        total_amount: 100,
        payment_status: 'unpaid',
      }

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 查询订单
        .mockResolvedValueOnce({}) // ROLLBACK

      await expect(
        paymentService.createPayment({
          userId: 'user_123',
          orderId: 'ORD123',
          amount: 200,
          paymentMethod: 'balance',
        })
      ).rejects.toThrow('支付金额与订单金额不符')
    })

    it('应该在余额不足时抛出异常', async () => {
      const mockOrder = {
        id: 'order_1',
        order_id: 'ORD123',
        user_id: 'user_123',
        total_amount: 100,
        payment_status: 'unpaid',
      }

      const mockUser = {
        balance: 50,
      }

      ;(generateId as jest.Mock).mockReturnValue('TXN123')

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 查询订单
        .mockResolvedValueOnce({ rows: [] }) // 插入支付交易
        .mockResolvedValueOnce({ rows: [mockUser] }) // 查询用户余额
        .mockResolvedValueOnce({}) // ROLLBACK

      await expect(
        paymentService.createPayment({
          userId: 'user_123',
          orderId: 'ORD123',
          amount: 100,
          paymentMethod: 'balance',
        })
      ).rejects.toThrow('余额不足')
    })
  })

  describe('getPaymentStatus - 查询支付状态', () => {
    it('应该成功查询支付状态', async () => {
      const mockTransaction = {
        transaction_id: 'TXN123',
        order_id: 'ORD123',
        payment_method: 'paypal',
        provider: 'paypal',
        amount: 100,
        currency: 'USD',
        status: 'completed',
        created_at: '2025-11-14',
        paid_at: '2025-11-14',
      }

      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [mockTransaction] })

      const result = await paymentService.getPaymentStatus('TXN123', 'user_123')

      expect(result.transaction_id).toBe('TXN123')
      expect(result.status).toBe('completed')
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['TXN123', 'user_123']
      )
    })

    it('应该在交易记录不存在时抛出异常', async () => {
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(paymentService.getPaymentStatus('TXN999', 'user_123')).rejects.toThrow(
        '交易记录不存在'
      )
    })
  })

  describe('getUserPayments - 获取用户支付记录', () => {
    it('应该返回用户支付记录列表', async () => {
      const mockPayments = [
        {
          transaction_id: 'TXN123',
          order_id: 'ORD123',
          payment_method: 'paypal',
          amount: 100,
          currency: 'USD',
          status: 'completed',
          created_at: '2025-11-14',
          paid_at: '2025-11-14',
        },
      ]

      ;(pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // 查询总数
        .mockResolvedValueOnce({ rows: mockPayments }) // 查询支付记录

      const result = await paymentService.getUserPayments('user_123', 1, 20)

      expect(result.total).toBe(10)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].transaction_id).toBe('TXN123')
    })

    it('应该支持分页查询', async () => {
      ;(pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '50' }] })
        .mockResolvedValueOnce({ rows: [] })

      await paymentService.getUserPayments('user_123', 2, 10)

      const secondCall = (pool.query as jest.Mock).mock.calls[1]
      expect(secondCall[1]).toEqual(['user_123', 10, 10]) // offset = (2-1)*10 = 10
    })

    it('应该按创建时间降序排序', async () => {
      ;(pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] })

      await paymentService.getUserPayments('user_123')

      const secondCall = (pool.query as jest.Mock).mock.calls[1]
      expect(secondCall[0]).toContain('ORDER BY created_at DESC')
    })
  })

  describe('getAvailablePaymentMethods - 获取可用支付方式', () => {
    it('应该返回可用支付方式列表', async () => {
      const mockMethods = [
        {
          id: 1,
          method_code: 'paypal',
          method_name: 'PayPal',
          provider: 'paypal',
          icon: 'paypal.png',
          description: 'PayPal支付',
          min_amount: 1,
          max_amount: 10000,
          fee_type: 'percentage',
          fee_value: 0.03,
        },
      ]

      ;(pool.query as jest.Mock).mockResolvedValue({ rows: mockMethods })

      const result = await paymentService.getAvailablePaymentMethods()

      expect(result).toHaveLength(1)
      expect(result[0].method_code).toBe('paypal')
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE is_enabled = TRUE'),
        []
      )
    })

    it('应该按排序字段排序', async () => {
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })

      await paymentService.getAvailablePaymentMethods()

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY sort_order ASC'),
        []
      )
    })
  })

  describe('processRefund - 处理退款', () => {
    it('应该成功处理余额退款', async () => {
      const mockTransaction = {
        id: 1,
        order_id: 'ORD123',
        amount: 100,
        currency: 'USD',
        status: 'completed',
        provider: 'internal',
      }

      ;(generateId as jest.Mock).mockReturnValue('REFUND123')

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockTransaction] }) // 查询交易
        .mockResolvedValueOnce({ rows: [] }) // 增加余额
        .mockResolvedValueOnce({ rows: [] }) // 更新交易状态
        .mockResolvedValueOnce({ rows: [] }) // 创建退款记录
        .mockResolvedValueOnce({ rows: [] }) // 更新订单状态
        .mockResolvedValueOnce({}) // COMMIT

      const result = await paymentService.processRefund({
        transactionId: 'TXN123',
        userId: 'user_123',
        reason: '不想要了',
      })

      expect(result.success).toBe(true)
      expect(result.refundId).toBe('REFUND123')
      expect(result.message).toBe('退款成功')
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })

    it('应该在交易不存在时抛出异常', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // 查询交易
        .mockResolvedValueOnce({}) // ROLLBACK

      await expect(
        paymentService.processRefund({
          transactionId: 'TXN999',
          userId: 'user_123',
          reason: '不想要了',
        })
      ).rejects.toThrow('交易记录不存在')
    })

    it('应该在交易未完成时抛出异常', async () => {
      const mockTransaction = {
        id: 1,
        order_id: 'ORD123',
        amount: 100,
        status: 'pending',
        provider: 'internal',
      }

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [mockTransaction] }) // 查询交易
        .mockResolvedValueOnce({}) // ROLLBACK

      await expect(
        paymentService.processRefund({
          transactionId: 'TXN123',
          userId: 'user_123',
          reason: '不想要了',
        })
      ).rejects.toThrow('只能退款已完成的交易')
    })
  })
})
