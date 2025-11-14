/**
 * paymentService 单元测试
 */

import * as paymentService from '../../../services/user/paymentService'

// Mock 依赖模块
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

// Mock 数据
const mockOrder = {
  rows: [
    {
      order_id: 'ORD20250113123456',
      user_id: 'user_123',
      amount: '88.00',
      status: 'pending',
    },
  ],
  rowCount: 1,
}

const mockPayment = {
  rows: [
    {
      id: 1,
      payment_id: 'PAY1736754000000ABC123',
      order_id: 'ORD20250113123456',
      user_id: 'user_123',
      amount: '88.00',
      pay_method: '支付宝',
      third_party_order_no: 'ALIPAY_1736754000000_ABC123',
      third_party_transaction_no: null,
      status: 'pending',
      pay_time: null,
      error_message: null,
      created_at: new Date('2025-01-13'),
    },
  ],
  rowCount: 1,
}

describe('paymentService - 支付服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createPayment - 创建支付订单', () => {
    it('应该成功创建支付订单', async () => {
      // Mock 查询订单
      query.mockResolvedValueOnce(mockOrder)
      // Mock 检查是否已有pending支付
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // Mock 插入支付记录
      query.mockResolvedValueOnce(mockPayment)

      const result = await paymentService.createPayment('user_123', 'ORD20250113123456', '支付宝')

      expect(result).toHaveProperty('payment_id')
      expect(result).toHaveProperty('order_id')
      expect(result).toHaveProperty('amount')
      expect(result).toHaveProperty('pay_method')
      expect(result).toHaveProperty('third_party_order_no')
      expect(result.status).toBe('pending')
      expect(query).toHaveBeenCalledTimes(3)
    })

    it('应该在订单不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(
        paymentService.createPayment('user_123', 'nonexistent', '支付宝')
      ).rejects.toThrow('订单不存在')
    })

    it('应该在订单状态不正确时抛出异常', async () => {
      query.mockResolvedValueOnce({
        rows: [{ ...mockOrder.rows[0], status: 'paid' }],
        rowCount: 1,
      })

      await expect(
        paymentService.createPayment('user_123', 'ORD20250113123456', '支付宝')
      ).rejects.toThrow('订单状态不正确，无法支付')
    })

    it('应该在已有待支付记录时抛出异常', async () => {
      query.mockResolvedValueOnce(mockOrder)
      query.mockResolvedValueOnce({
        rows: [{ payment_id: 'PAY123' }],
        rowCount: 1,
      })

      await expect(
        paymentService.createPayment('user_123', 'ORD20250113123456', '支付宝')
      ).rejects.toThrow('该订单已有待支付记录')
    })

    it('应该为支付宝生成正确前缀的第三方订单号', async () => {
      query.mockResolvedValueOnce(mockOrder)
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce(mockPayment)

      const result = await paymentService.createPayment('user_123', 'ORD20250113123456', '支付宝')

      expect(result.third_party_order_no).toMatch(/^ALIPAY_/)
    })

    it('应该为微信生成正确前缀的第三方订单号', async () => {
      query.mockResolvedValueOnce(mockOrder)
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({
        rows: [
          {
            ...mockPayment.rows[0],
            pay_method: '微信',
            third_party_order_no: 'WECHAT_1736754000000_ABC123',
          },
        ],
        rowCount: 1,
      })

      const result = await paymentService.createPayment('user_123', 'ORD20250113123456', '微信')

      expect(result.third_party_order_no).toMatch(/^WECHAT_/)
    })
  })

  describe('paymentSuccess - 支付成功回调', () => {
    it('应该成功处理支付成功回调', async () => {
      // Mock BEGIN
      query.mockResolvedValueOnce({})
      // Mock 更新支付记录
      query.mockResolvedValueOnce({
        rows: [{ order_id: 'ORD20250113123456', user_id: 'user_123' }],
        rowCount: 1,
      })
      // Mock 更新订单状态
      query.mockResolvedValueOnce({})
      // Mock 查询订单金额
      query.mockResolvedValueOnce({ rows: [{ amount: '88.00' }], rowCount: 1 })
      // Mock 更新用户统计
      query.mockResolvedValueOnce({})
      // Mock COMMIT
      query.mockResolvedValueOnce({})

      const result = await paymentService.paymentSuccess('PAY123', 'TRANS456')

      expect(result.success).toBe(true)
      expect(result.orderId).toBe('ORD20250113123456')
      expect(query).toHaveBeenCalledWith('BEGIN')
      expect(query).toHaveBeenCalledWith('COMMIT')
    })

    it('应该在支付记录不存在时回滚事务', async () => {
      query.mockResolvedValueOnce({}) // BEGIN
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // 更新支付记录失败
      query.mockResolvedValueOnce({}) // ROLLBACK

      await expect(paymentService.paymentSuccess('nonexistent', 'TRANS456')).rejects.toThrow(
        '支付记录不存在或状态不正确'
      )

      expect(query).toHaveBeenCalledWith('ROLLBACK')
    })

    it('应该在发生错误时回滚事务', async () => {
      query.mockResolvedValueOnce({}) // BEGIN
      query.mockRejectedValueOnce(new Error('Database error')) // 更新失败
      query.mockResolvedValueOnce({}) // ROLLBACK

      await expect(paymentService.paymentSuccess('PAY123', 'TRANS456')).rejects.toThrow(
        'Database error'
      )

      expect(query).toHaveBeenCalledWith('ROLLBACK')
    })

    it('应该正确更新用户的订单统计', async () => {
      query.mockResolvedValueOnce({}) // BEGIN
      query.mockResolvedValueOnce({
        rows: [{ order_id: 'ORD123', user_id: 'user_123' }],
        rowCount: 1,
      })
      query.mockResolvedValueOnce({}) // 更新订单状态
      query.mockResolvedValueOnce({ rows: [{ amount: '128.00' }], rowCount: 1 }) // 查询金额
      query.mockResolvedValueOnce({}) // 更新用户统计
      query.mockResolvedValueOnce({}) // COMMIT

      await paymentService.paymentSuccess('PAY123', 'TRANS456')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['128.00', 'user_123'])
      )
    })
  })

  describe('paymentFailed - 支付失败回调', () => {
    it('应该成功处理支付失败回调', async () => {
      query.mockResolvedValueOnce({
        rows: [{ order_id: 'ORD20250113123456' }],
        rowCount: 1,
      })

      const result = await paymentService.paymentFailed('PAY123', '余额不足')

      expect(result.success).toBe(true)
      expect(result.orderId).toBe('ORD20250113123456')
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE payments'),
        expect.arrayContaining(['余额不足', 'PAY123'])
      )
    })

    it('应该在支付记录不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(paymentService.paymentFailed('nonexistent', '余额不足')).rejects.toThrow(
        '支付记录不存在或状态不正确'
      )
    })

    it('应该记录错误信息', async () => {
      query.mockResolvedValueOnce({
        rows: [{ order_id: 'ORD123' }],
        rowCount: 1,
      })

      await paymentService.paymentFailed('PAY123', '网络错误')

      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining(['网络错误', 'PAY123'])
      )
    })
  })

  describe('getPaymentStatus - 查询支付状态', () => {
    it('应该成功查询支付状态', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            payment_id: 'PAY123',
            order_id: 'ORD123',
            amount: '88.00',
            pay_method: '支付宝',
            status: 'success',
            third_party_order_no: 'ALIPAY_123',
            third_party_transaction_no: 'TRANS456',
            pay_time: new Date('2025-01-13'),
            error_message: null,
            created_at: new Date('2025-01-13'),
            fortune_name: '生肖运势',
          },
        ],
        rowCount: 1,
      })

      const result = await paymentService.getPaymentStatus('user_123', 'PAY123')

      expect(result).toHaveProperty('payment_id')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('fortune_name')
      expect(result.payment_id).toBe('PAY123')
    })

    it('应该在支付记录不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(paymentService.getPaymentStatus('user_123', 'nonexistent')).rejects.toThrow(
        '支付记录不存在'
      )
    })

    it('应该包含订单关联的算命服务名称', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            payment_id: 'PAY123',
            fortune_name: '八字精批',
          },
        ],
        rowCount: 1,
      })

      const result = await paymentService.getPaymentStatus('user_123', 'PAY123')

      expect(result.fortune_name).toBe('八字精批')
    })
  })

  describe('getOrderPayments - 获取订单的支付记录', () => {
    it('应该成功获取订单的支付记录', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            payment_id: 'PAY123',
            amount: '88.00',
            pay_method: '支付宝',
            status: 'success',
            created_at: new Date('2025-01-13'),
          },
          {
            payment_id: 'PAY124',
            amount: '88.00',
            pay_method: '微信',
            status: 'failed',
            created_at: new Date('2025-01-12'),
          },
        ],
        rowCount: 2,
      })

      const result = await paymentService.getOrderPayments('user_123', 'ORD123')

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('payment_id')
      expect(result[0]).toHaveProperty('status')
    })

    it('应该返回空数组当没有支付记录时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await paymentService.getOrderPayments('user_123', 'ORD123')

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('应该按创建时间倒序排列', async () => {
      query.mockResolvedValueOnce({
        rows: [
          { payment_id: 'PAY2', created_at: new Date('2025-01-14') },
          { payment_id: 'PAY1', created_at: new Date('2025-01-13') },
        ],
        rowCount: 2,
      })

      const result = await paymentService.getOrderPayments('user_123', 'ORD123')

      expect(result[0].payment_id).toBe('PAY2')
      expect(result[1].payment_id).toBe('PAY1')
    })
  })

  describe('getUserPayments - 获取用户的支付记录列表', () => {
    it('应该成功获取用户支付记录列表', async () => {
      // Mock 查询总数
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      // Mock 查询列表
      query.mockResolvedValueOnce({
        rows: [
          {
            payment_id: 'PAY123',
            order_id: 'ORD123',
            amount: '88.00',
            status: 'success',
            fortune_name: '生肖运势',
          },
        ],
        rowCount: 1,
      })

      const result = await paymentService.getUserPayments('user_123', {})

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('pagination')
      expect(result.pagination.total).toBe(2)
    })

    it('应该支持分页查询', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await paymentService.getUserPayments('user_123', { page: 2, limit: 10 })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.totalPages).toBe(5)
    })

    it('应该支持按状态筛选', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '10' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await paymentService.getUserPayments('user_123', { status: 'success' })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('p.status = $2'),
        expect.arrayContaining(['user_123', 'success'])
      )
    })

    it('应该使用默认分页参数', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await paymentService.getUserPayments('user_123', {})

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('应该包含算命服务名称', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })
      query.mockResolvedValueOnce({
        rows: [
          {
            payment_id: 'PAY123',
            fortune_name: '流年运势',
          },
        ],
        rowCount: 1,
      })

      const result = await paymentService.getUserPayments('user_123', {})

      expect(result.items[0].fortune_name).toBe('流年运势')
    })
  })

  describe('cancelPayment - 取消支付', () => {
    it('应该成功取消支付', async () => {
      query.mockResolvedValueOnce({
        rows: [{ order_id: 'ORD123' }],
        rowCount: 1,
      })

      const result = await paymentService.cancelPayment('user_123', 'PAY123')

      expect(result.success).toBe(true)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("error_message = '用户取消支付'"),
        expect.arrayContaining(['PAY123', 'user_123'])
      )
    })

    it('应该在支付记录不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(paymentService.cancelPayment('user_123', 'nonexistent')).rejects.toThrow(
        '支付记录不存在或状态不允许取消'
      )
    })

    it('应该只能取消pending状态的支付', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(paymentService.cancelPayment('user_123', 'PAY123')).rejects.toThrow(
        '支付记录不存在或状态不允许取消'
      )

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'pending'"),
        expect.anything()
      )
    })

    it('应该将状态更新为failed并记录取消原因', async () => {
      query.mockResolvedValueOnce({
        rows: [{ order_id: 'ORD123' }],
        rowCount: 1,
      })

      await paymentService.cancelPayment('user_123', 'PAY123')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'failed'"),
        expect.anything()
      )
    })
  })
})
