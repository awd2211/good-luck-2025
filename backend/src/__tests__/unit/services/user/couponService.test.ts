/**
 * user/couponService 单元测试
 */

import * as couponService from '../../../../services/user/couponService'
import { query } from '../../../../config/database'

// Mock database
jest.mock('../../../../config/database', () => ({
  query: jest.fn(),
}))

describe('user/couponService - 用户优惠券服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAvailableCoupons - 获取可领取的优惠券列表', () => {
    it('应该返回可领取的优惠券列表', async () => {
      const mockCoupons = [
        {
          id: 1,
          code: 'SAVE10',
          name: '满100减10',
          type: 'fixed',
          value: '10',
          min_amount: '100',
          max_discount: null,
          total_count: 1000,
          used_count: 50,
          valid_from: '2025-01-01',
          valid_until: '2025-12-31',
          target_users: 'all',
          applicable_types: null,
        },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockCoupons })

      const result = await couponService.getAvailableCoupons()

      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('SAVE10')
      expect(result[0].remainingCount).toBe(950)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('FROM coupons'),
        expect.any(Array)
      )
    })

    it('应该过滤失效的优惠券', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await couponService.getAvailableCoupons()

      expect(result).toHaveLength(0)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE c.status = 'active'"),
        expect.any(Array)
      )
    })

    it('应该包含用户已领取状态（当提供userId时）', async () => {
      const mockCoupons = [
        {
          id: 1,
          code: 'SAVE10',
          name: '满100减10',
          type: 'fixed',
          value: '10',
          min_amount: null,
          max_discount: null,
          total_count: 1000,
          used_count: 50,
          valid_from: '2025-01-01',
          valid_until: '2025-12-31',
          target_users: 'all',
          applicable_types: null,
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockCoupons }) // 查询优惠券
        .mockResolvedValueOnce({ rows: [{ coupon_id: 1 }] }) // 查询已领取

      const result = await couponService.getAvailableCoupons('user_123')

      expect(result[0].isReceived).toBe(true)
      expect(query).toHaveBeenCalledTimes(2)
    })

    it('应该按价值和过期时间排序', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await couponService.getAvailableCoupons()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY c.value DESC, c.valid_until ASC'),
        expect.any(Array)
      )
    })
  })

  describe('receiveCoupon - 领取优惠券', () => {
    it('应该成功领取优惠券', async () => {
      const mockCoupon = {
        id: 1,
        code: 'SAVE10',
        name: '满100减10',
        type: 'fixed',
        value: '10',
        min_amount: '100',
        max_discount: null,
        total_count: 1000,
        used_count: 50,
        valid_from: '2025-01-01',
        valid_until: '2025-12-31',
        target_users: 'all',
        status: 'active',
      }

      const mockUserCoupon = {
        id: 1,
        user_id: 'user_123',
        coupon_id: 1,
        status: 'unused',
        received_at: '2025-11-14',
        expired_at: '2025-12-31',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockCoupon] }) // 查询优惠券
        .mockResolvedValueOnce({ rows: [] }) // 检查是否已领取
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockUserCoupon] }) // INSERT user_coupon
        .mockResolvedValueOnce({ rows: [] }) // UPDATE coupon
        .mockResolvedValueOnce({ rows: [] }) // COMMIT

      const result = await couponService.receiveCoupon('user_123', 1)

      expect(result.id).toBe(1)
      expect(result.userId).toBe('user_123')
      expect(result.status).toBe('unused')
      expect(result.coupon.code).toBe('SAVE10')
      expect(query).toHaveBeenCalledWith('BEGIN')
      expect(query).toHaveBeenCalledWith('COMMIT')
    })

    it('应该在优惠券不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(couponService.receiveCoupon('user_123', 999)).rejects.toThrow(
        '优惠券不存在'
      )
    })

    it('应该在优惠券已失效时抛出异常', async () => {
      const mockCoupon = {
        id: 1,
        status: 'inactive',
        total_count: 1000,
        used_count: 50,
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockCoupon] })

      await expect(couponService.receiveCoupon('user_123', 1)).rejects.toThrow('优惠券已失效')
    })

    it('应该在优惠券已被领完时抛出异常', async () => {
      const mockCoupon = {
        id: 1,
        status: 'active',
        total_count: 100,
        used_count: 100,
        valid_from: '2025-01-01',
        valid_until: '2025-12-31',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockCoupon] })

      await expect(couponService.receiveCoupon('user_123', 1)).rejects.toThrow('优惠券已被领完')
    })

    it('应该在用户已领取时抛出异常', async () => {
      const mockCoupon = {
        id: 1,
        status: 'active',
        total_count: 1000,
        used_count: 50,
        valid_from: '2025-01-01',
        valid_until: '2025-12-31',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockCoupon] }) // 查询优惠券
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // 检查已领取

      await expect(couponService.receiveCoupon('user_123', 1)).rejects.toThrow(
        '您已领取过该优惠券'
      )
    })

    it('应该在发生错误时回滚事务', async () => {
      const mockCoupon = {
        id: 1,
        status: 'active',
        total_count: 1000,
        used_count: 50,
        valid_from: '2025-01-01',
        valid_until: '2025-12-31',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockCoupon] }) // 查询优惠券
        .mockResolvedValueOnce({ rows: [] }) // 检查是否已领取
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('数据库错误')) // INSERT 失败
        .mockResolvedValueOnce({ rows: [] }) // ROLLBACK

      await expect(couponService.receiveCoupon('user_123', 1)).rejects.toThrow('数据库错误')

      expect(query).toHaveBeenCalledWith('ROLLBACK')
    })
  })

  describe('getUserCoupons - 获取用户的优惠券列表', () => {
    it('应该返回用户的优惠券列表', async () => {
      const mockUserCoupons = [
        {
          id: 1,
          user_id: 'user_123',
          coupon_id: 1,
          order_id: null,
          status: 'unused',
          received_at: '2025-11-14',
          used_at: null,
          expired_at: '2025-12-31',
          code: 'SAVE10',
          name: '满100减10',
          type: 'fixed',
          value: '10',
          min_amount: '100',
          max_discount: null,
          valid_from: '2025-01-01',
          valid_until: '2025-12-31',
          applicable_types: null,
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockUserCoupons }) // 查询优惠券
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // 查询总数

      const result = await couponService.getUserCoupons('user_123')

      expect(result.items).toHaveLength(1)
      expect(result.items[0].coupon.code).toBe('SAVE10')
      expect(result.pagination.total).toBe(1)
    })

    it('应该支持按状态筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })

      await couponService.getUserCoupons('user_123', { status: 'unused' })

      const firstCall = (query as jest.Mock).mock.calls[0]
      expect(firstCall[0]).toContain("uc.status = $2")
      expect(firstCall[1]).toContain('unused')
    })

    it('应该支持分页查询', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '50' }] })

      const result = await couponService.getUserCoupons('user_123', { page: 2, limit: 10 })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.totalPages).toBe(5)
    })

    it('应该按状态优先级排序', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })

      await couponService.getUserCoupons('user_123')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY'),
        expect.any(Array)
      )
    })

    it('应该使用默认分页参数', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })

      const result = await couponService.getUserCoupons('user_123')

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })
  })

  describe('getUsableCoupons - 获取用户可用的优惠券', () => {
    it('应该返回满足金额条件的优惠券', async () => {
      const mockUserCoupons = [
        {
          user_coupon_id: 1,
          coupon_id: 1,
          expired_at: '2025-12-31',
          code: 'SAVE10',
          name: '满100减10',
          type: 'fixed',
          value: '10',
          min_amount: '100',
          max_discount: null,
          applicable_types: null,
        },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockUserCoupons })

      const result = await couponService.getUsableCoupons('user_123', 150)

      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('SAVE10')
      expect(result[0].discountAmount).toBe(10)
    })

    it('应该过滤不满足最小金额的优惠券', async () => {
      const mockUserCoupons = [
        {
          user_coupon_id: 1,
          coupon_id: 1,
          expired_at: '2025-12-31',
          code: 'SAVE10',
          name: '满100减10',
          type: 'fixed',
          value: '10',
          min_amount: '100',
          max_discount: null,
          applicable_types: null,
        },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockUserCoupons })

      const result = await couponService.getUsableCoupons('user_123', 50)

      expect(result).toHaveLength(0)
    })

    it('应该正确计算折扣优惠券的金额', async () => {
      const mockUserCoupons = [
        {
          user_coupon_id: 1,
          coupon_id: 1,
          expired_at: '2025-12-31',
          code: 'DISCOUNT10',
          name: '9折券',
          type: 'discount',
          value: '10', // 10% off = 90% pay
          min_amount: null,
          max_discount: null,
          applicable_types: null,
        },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockUserCoupons })

      const result = await couponService.getUsableCoupons('user_123', 100)

      expect(result).toHaveLength(1)
      expect(result[0].discountAmount).toBe(10) // 100 * 0.1
    })

    it('应该限制最大优惠金额', async () => {
      const mockUserCoupons = [
        {
          user_coupon_id: 1,
          coupon_id: 1,
          expired_at: '2025-12-31',
          code: 'SAVE50',
          name: '满100减50（最多减20）',
          type: 'fixed',
          value: '50',
          min_amount: '100',
          max_discount: '20',
          applicable_types: null,
        },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockUserCoupons })

      const result = await couponService.getUsableCoupons('user_123', 150)

      expect(result[0].discountAmount).toBe(20) // 限制最大20
    })

    it('应该过滤不适用类型的优惠券', async () => {
      const mockUserCoupons = [
        {
          user_coupon_id: 1,
          coupon_id: 1,
          expired_at: '2025-12-31',
          code: 'BAZI10',
          name: '八字专用券',
          type: 'fixed',
          value: '10',
          min_amount: null,
          max_discount: null,
          applicable_types: '八字精批,八字合婚',
        },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockUserCoupons })

      const result = await couponService.getUsableCoupons('user_123', 100, '流年运势')

      expect(result).toHaveLength(0)
    })

    it('应该包含适用类型的优惠券', async () => {
      const mockUserCoupons = [
        {
          user_coupon_id: 1,
          coupon_id: 1,
          expired_at: '2025-12-31',
          code: 'BAZI10',
          name: '八字专用券',
          type: 'fixed',
          value: '10',
          min_amount: null,
          max_discount: null,
          applicable_types: '八字精批,八字合婚',
        },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockUserCoupons })

      const result = await couponService.getUsableCoupons('user_123', 100, '八字精批')

      expect(result).toHaveLength(1)
    })

    it('优惠金额不应超过订单金额', async () => {
      const mockUserCoupons = [
        {
          user_coupon_id: 1,
          coupon_id: 1,
          expired_at: '2025-12-31',
          code: 'SAVE100',
          name: '满10减100',
          type: 'fixed',
          value: '100',
          min_amount: '10',
          max_discount: null,
          applicable_types: null,
        },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockUserCoupons })

      const result = await couponService.getUsableCoupons('user_123', 50)

      expect(result[0].discountAmount).toBe(50) // 不能超过订单金额
    })
  })

  describe('useCoupon - 使用优惠券', () => {
    it('应该成功使用优惠券', async () => {
      const mockUserCoupon = {
        id: 1,
        status: 'unused',
        expired_at: '2025-12-31T23:59:59Z',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockUserCoupon] }) // 查询优惠券
        .mockResolvedValueOnce({ rows: [] }) // 更新状态

      const result = await couponService.useCoupon('user_123', 1, 'ORDER123')

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'used'"),
        ['ORDER123', 1]
      )
    })

    it('应该在优惠券不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(couponService.useCoupon('user_123', 999, 'ORDER123')).rejects.toThrow(
        '优惠券不存在'
      )
    })

    it('应该在优惠券已使用时抛出异常', async () => {
      const mockUserCoupon = {
        id: 1,
        status: 'used',
        expired_at: '2025-12-31',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUserCoupon] })

      await expect(couponService.useCoupon('user_123', 1, 'ORDER123')).rejects.toThrow(
        '优惠券已使用或已过期'
      )
    })

    it('应该在优惠券已过期时抛出异常', async () => {
      const mockUserCoupon = {
        id: 1,
        status: 'unused',
        expired_at: '2020-01-01T00:00:00Z',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUserCoupon] })

      await expect(couponService.useCoupon('user_123', 1, 'ORDER123')).rejects.toThrow(
        '优惠券已过期'
      )
    })
  })

  describe('getCouponStats - 获取用户优惠券统计', () => {
    it('应该返回正确的统计信息', async () => {
      const mockStats = {
        unused_count: '5',
        used_count: '10',
        expired_count: '3',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockStats] })

      const result = await couponService.getCouponStats('user_123')

      expect(result.unusedCount).toBe(5)
      expect(result.usedCount).toBe(10)
      expect(result.expiredCount).toBe(3)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) FILTER'),
        ['user_123']
      )
    })

    it('应该使用 FILTER 子句统计不同状态', async () => {
      ;(query as jest.Mock).mockResolvedValue({
        rows: [{ unused_count: '0', used_count: '0', expired_count: '0' }],
      })

      await couponService.getCouponStats('user_123')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("FILTER (WHERE status = 'unused'"),
        expect.any(Array)
      )
    })

    it('应该将字符串转换为数字', async () => {
      const mockStats = {
        unused_count: '10',
        used_count: '20',
        expired_count: '5',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockStats] })

      const result = await couponService.getCouponStats('user_123')

      expect(typeof result.unusedCount).toBe('number')
      expect(typeof result.usedCount).toBe('number')
      expect(typeof result.expiredCount).toBe('number')
    })
  })
})
