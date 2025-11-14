/**
 * couponService 单元测试
 */

import * as couponService from '../../../services/user/couponService'

// Mock 依赖模块
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

// Mock 数据
const mockCoupons = {
  rows: [
    {
      id: 1,
      code: 'DISCOUNT10',
      name: '10元优惠券',
      type: 'fixed',
      value: '10.00',
      min_amount: '50.00',
      max_discount: null,
      total_count: 100,
      used_count: 50,
      valid_from: new Date('2025-01-01'),
      valid_until: new Date('2025-12-31'),
      target_users: 'all',
      applicable_types: null,
      status: 'active',
    },
    {
      id: 2,
      code: 'PERCENT20',
      name: '8折优惠券',
      type: 'discount',
      value: '0.2',
      min_amount: '100.00',
      max_discount: '50.00',
      total_count: 200,
      used_count: 100,
      valid_from: new Date('2025-01-01'),
      valid_until: new Date('2025-12-31'),
      target_users: 'all',
      applicable_types: null,
      status: 'active',
    },
  ],
  rowCount: 2,
}

const mockUserCoupons = {
  rows: [
    {
      id: 1,
      user_id: 'user_123',
      coupon_id: 1,
      order_id: null,
      status: 'unused',
      received_at: new Date('2025-01-10'),
      used_at: null,
      expired_at: new Date('2025-12-31'),
      code: 'DISCOUNT10',
      name: '10元优惠券',
      type: 'fixed',
      value: '10.00',
      min_amount: '50.00',
      max_discount: null,
      valid_from: new Date('2025-01-01'),
      valid_until: new Date('2025-12-31'),
      applicable_types: null,
    },
  ],
  rowCount: 1,
}

describe('couponService - 优惠券服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Date.now() 为固定时间
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-15T00:00:00.000Z')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getAvailableCoupons - 获取可领取的优惠券列表', () => {
    it('应该成功获取可领取的优惠券', async () => {
      query.mockResolvedValueOnce(mockCoupons)

      const result = await couponService.getAvailableCoupons()

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('code')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('remainingCount')
      expect(result[0].remainingCount).toBe(50) // 100 - 50
      expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), expect.any(Array))
    })

    it('应该正确计算剩余数量', async () => {
      query.mockResolvedValueOnce(mockCoupons)

      const result = await couponService.getAvailableCoupons()

      expect(result[0].remainingCount).toBe(50) // 100 - 50
      expect(result[1].remainingCount).toBe(100) // 200 - 100
    })

    it('应该在提供userId时检查用户是否已领取', async () => {
      query.mockResolvedValueOnce(mockCoupons)
      query.mockResolvedValueOnce({
        rows: [{ coupon_id: 1 }],
        rowCount: 1,
      })

      const result = await couponService.getAvailableCoupons('user_123')

      expect(result[0].isReceived).toBe(true)
      expect(result[1].isReceived).toBe(false)
      expect(query).toHaveBeenCalledTimes(2)
    })

    it('应该返回空数组当没有可用优惠券时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await couponService.getAvailableCoupons()

      expect(result).toHaveLength(0)
    })

    it('应该在没有userId时不检查领取状态', async () => {
      query.mockResolvedValueOnce(mockCoupons)

      const result = await couponService.getAvailableCoupons()

      expect(result[0]).not.toHaveProperty('isReceived')
      expect(query).toHaveBeenCalledTimes(1)
    })
  })

  describe('receiveCoupon - 领取优惠券', () => {
    it('应该成功领取优惠券', async () => {
      // Mock 查询优惠券
      query.mockResolvedValueOnce({ rows: [mockCoupons.rows[0]], rowCount: 1 })
      // Mock 检查是否已领取
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // Mock BEGIN
      query.mockResolvedValueOnce({})
      // Mock 插入用户优惠券
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 'user_123',
            coupon_id: 1,
            status: 'unused',
            received_at: new Date('2025-01-15'),
            expired_at: new Date('2025-12-31'),
          },
        ],
        rowCount: 1,
      })
      // Mock 更新优惠券使用次数
      query.mockResolvedValueOnce({})
      // Mock COMMIT
      query.mockResolvedValueOnce({})

      const result = await couponService.receiveCoupon('user_123', 1)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('coupon')
      expect(result.couponId).toBe(1)
      expect(result.status).toBe('unused')
      expect(query).toHaveBeenCalledWith('BEGIN')
      expect(query).toHaveBeenCalledWith('COMMIT')
    })

    it('应该在优惠券不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(couponService.receiveCoupon('user_123', 999)).rejects.toThrow('优惠券不存在')
    })

    it('应该在优惠券已失效时抛出异常', async () => {
      query.mockResolvedValueOnce({
        rows: [{ ...mockCoupons.rows[0], status: 'inactive' }],
        rowCount: 1,
      })

      await expect(couponService.receiveCoupon('user_123', 1)).rejects.toThrow('优惠券已失效')
    })

    it('应该在优惠券未到领取时间时抛出异常', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            ...mockCoupons.rows[0],
            valid_from: '2025-12-01T00:00:00.000Z',
          },
        ],
        rowCount: 1,
      })

      await expect(couponService.receiveCoupon('user_123', 1)).rejects.toThrow('优惠券未到领取时间')
    })

    it('应该在优惠券已过期时抛出异常', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            ...mockCoupons.rows[0],
            valid_until: '2024-12-31T00:00:00.000Z',
          },
        ],
        rowCount: 1,
      })

      await expect(couponService.receiveCoupon('user_123', 1)).rejects.toThrow('优惠券已过期')
    })

    it('应该在优惠券已被领完时抛出异常', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            ...mockCoupons.rows[0],
            total_count: 100,
            used_count: 100,
          },
        ],
        rowCount: 1,
      })

      await expect(couponService.receiveCoupon('user_123', 1)).rejects.toThrow('优惠券已被领完')
    })

    it('应该在用户已领取时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [mockCoupons.rows[0]], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })

      await expect(couponService.receiveCoupon('user_123', 1)).rejects.toThrow('您已领取过该优惠券')
    })

    it('应该在发生错误时回滚事务', async () => {
      query.mockResolvedValueOnce({ rows: [mockCoupons.rows[0]], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({}) // BEGIN
      query.mockRejectedValueOnce(new Error('Database error'))
      query.mockResolvedValueOnce({}) // ROLLBACK

      await expect(couponService.receiveCoupon('user_123', 1)).rejects.toThrow('Database error')
      expect(query).toHaveBeenCalledWith('ROLLBACK')
    })
  })

  describe('getUserCoupons - 获取用户的优惠券列表', () => {
    it('应该成功获取用户优惠券列表', async () => {
      // Mock 查询列表
      query.mockResolvedValueOnce(mockUserCoupons)
      // Mock 查询总数
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })

      const result = await couponService.getUserCoupons('user_123')

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('pagination')
      expect(result.items).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
    })

    it('应该支持分页查询', async () => {
      query.mockResolvedValueOnce(mockUserCoupons)
      query.mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 })

      const result = await couponService.getUserCoupons('user_123', { page: 2, limit: 10 })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.total).toBe(50)
      expect(result.pagination.totalPages).toBe(5)
    })

    it('应该支持按状态筛选', async () => {
      query.mockResolvedValueOnce(mockUserCoupons)
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })

      const result = await couponService.getUserCoupons('user_123', { status: 'unused' })

      expect(result.items[0].status).toBe('unused')
    })

    it('应该在状态为all时不筛选', async () => {
      query.mockResolvedValueOnce(mockUserCoupons)
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })

      await couponService.getUserCoupons('user_123', { status: 'all' })

      // 验证查询条件不包含状态筛选
      expect(query).toHaveBeenCalledWith(
        expect.not.stringContaining('uc.status ='),
        expect.any(Array)
      )
    })

    it('应该返回空列表当没有优惠券时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 })

      const result = await couponService.getUserCoupons('user_123')

      expect(result.items).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('应该包含优惠券详情', async () => {
      query.mockResolvedValueOnce(mockUserCoupons)
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })

      const result = await couponService.getUserCoupons('user_123')

      expect(result.items[0]).toHaveProperty('coupon')
      expect(result.items[0].coupon).toHaveProperty('code')
      expect(result.items[0].coupon).toHaveProperty('name')
      expect(result.items[0].coupon).toHaveProperty('type')
      expect(result.items[0].coupon).toHaveProperty('value')
    })
  })

  describe('getUsableCoupons - 获取用户可用的优惠券', () => {
    it('应该成功获取可用优惠券', async () => {
      const mockUsableCoupons = {
        rows: [
          {
            user_coupon_id: 1,
            coupon_id: 1,
            expired_at: new Date('2025-12-31'),
            code: 'DISCOUNT10',
            name: '10元优惠券',
            type: 'fixed',
            value: '10.00',
            min_amount: '50.00',
            max_discount: null,
            applicable_types: null,
          },
        ],
        rowCount: 1,
      }

      query.mockResolvedValueOnce(mockUsableCoupons)

      const result = await couponService.getUsableCoupons('user_123', 100)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE uc.user_id = $1'),
        expect.arrayContaining(['user_123', expect.any(String)])
      )
    })

    it('应该支持指定算命类型', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await couponService.getUsableCoupons('user_123', 100, 'fortune_1')

      expect(query).toHaveBeenCalled()
    })

    it('应该返回空数组当没有可用优惠券时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await couponService.getUsableCoupons('user_123', 100)

      expect(Array.isArray(result)).toBe(true)
    })
  })
})
