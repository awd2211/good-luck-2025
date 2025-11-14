/**
 * user/orderService 单元测试
 */

import * as orderService from '../../../../services/user/orderService'
import { query } from '../../../../config/database'

// Mock database
jest.mock('../../../../config/database', () => ({
  query: jest.fn(),
}))

describe('user/orderService - 用户订单服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createOrder - 创建订单', () => {
    it('应该成功创建订单', async () => {
      const mockFortune = {
        id: 'fortune_1',
        title: '八字精批',
        subtitle: '深度解析命理',
        price: '99.00',
        icon: 'icon.png',
        bg_color: '#FF6B6B',
      }

      const mockUser = {
        id: 'user_123',
        nickname: '测试用户',
        phone: '13900000001',
      }

      const mockOrder = {
        id: 'order_123',
        order_id: 'ORD20251114123456',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        fortune_name: '八字精批',
        amount: '99.00',
        status: 'pending',
        pay_method: null,
        create_time: '2025-11-14',
        update_time: '2025-11-14',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockFortune] }) // 查询算命服务
        .mockResolvedValueOnce({ rows: [mockUser] }) // 查询用户
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 创建订单

      const result = await orderService.createOrder('user_123', [
        { fortuneId: 'fortune_1', quantity: 1 },
      ])

      expect(result.orderId).toContain('ORD')
      expect(result.amount).toBe(99)
      expect(result.status).toBe('pending')
      expect(result.fortuneName).toBe('八字精批')
    })

    it('应该在算命服务不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(
        orderService.createOrder('user_123', [{ fortuneId: 'fortune_999', quantity: 1 }])
      ).rejects.toThrow('所选算命服务不存在或已下架')
    })

    it('应该在用户不存在时抛出异常', async () => {
      const mockFortune = {
        id: 'fortune_1',
        title: '八字精批',
        price: '99.00',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockFortune] }) // 查询算命服务
        .mockResolvedValueOnce({ rows: [] }) // 查询用户

      await expect(
        orderService.createOrder('user_not_exist', [{ fortuneId: 'fortune_1', quantity: 1 }])
      ).rejects.toThrow('用户不存在')
    })

    it('应该正确计算多个数量的总价', async () => {
      const mockFortune = {
        id: 'fortune_1',
        title: '八字精批',
        price: '50.00',
      }

      const mockUser = {
        id: 'user_123',
        nickname: '测试用户',
        phone: '13900000001',
      }

      const mockOrder = {
        id: 'order_123',
        order_id: 'ORD20251114123456',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        fortune_name: '八字精批',
        amount: '100.00',
        status: 'pending',
        pay_method: null,
        create_time: '2025-11-14',
        update_time: '2025-11-14',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockFortune] })
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [mockOrder] })

      const result = await orderService.createOrder('user_123', [
        { fortuneId: 'fortune_1', quantity: 2 },
      ])

      expect(result.amount).toBe(100)
    })

    it('应该支持指定支付方式', async () => {
      const mockFortune = {
        id: 'fortune_1',
        title: '八字精批',
        price: '99.00',
      }

      const mockUser = {
        id: 'user_123',
        nickname: '测试用户',
        phone: '13900000001',
      }

      const mockOrder = {
        id: 'order_123',
        order_id: 'ORD20251114123456',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        fortune_name: '八字精批',
        amount: '99.00',
        status: 'pending',
        pay_method: '支付宝',
        create_time: '2025-11-14',
        update_time: '2025-11-14',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockFortune] })
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [mockOrder] })

      const result = await orderService.createOrder(
        'user_123',
        [{ fortuneId: 'fortune_1', quantity: 1 }],
        '支付宝'
      )

      expect(result.payMethod).toBe('支付宝')
    })

    it('应该使用用户昵称或手机号作为用户名', async () => {
      const mockFortune = {
        id: 'fortune_1',
        title: '八字精批',
        price: '99.00',
      }

      const mockUser = {
        id: 'user_123',
        nickname: null,
        phone: '13900000001',
      }

      const mockOrder = {
        id: 'order_123',
        order_id: 'ORD20251114123456',
        user_id: 'user_123',
        username: '13900000001',
        fortune_type: 'fortune_1',
        fortune_name: '八字精批',
        amount: '99.00',
        status: 'pending',
        pay_method: null,
        create_time: '2025-11-14',
        update_time: '2025-11-14',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockFortune] })
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [mockOrder] })

      const result = await orderService.createOrder('user_123', [
        { fortuneId: 'fortune_1', quantity: 1 },
      ])

      expect(result.username).toBe('13900000001')
    })
  })

  describe('getUserOrders - 获取用户的订单列表', () => {
    it('应该返回用户的订单列表', async () => {
      const mockOrders = [
        {
          id: 'order_1',
          order_id: 'ORD20251114123456',
          user_id: 'user_123',
          username: '测试用户',
          fortune_type: 'fortune_1',
          fortune_name: '八字精批',
          amount: '99.00',
          status: 'completed',
          pay_method: '支付宝',
          create_time: '2025-11-14',
          update_time: '2025-11-14',
          title: '八字精批',
          subtitle: '深度解析',
          price: '99.00',
          icon: 'icon.png',
          bg_color: '#FF6B6B',
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockOrders }) // 查询订单
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // 查询总数

      const result = await orderService.getUserOrders('user_123')

      expect(result.items).toHaveLength(1)
      expect(result.items[0].orderId).toBe('ORD20251114123456')
      expect(result.items[0].fortuneInfo).toBeDefined()
      expect(result.pagination.total).toBe(1)
    })

    it('应该支持分页查询', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '50' }] })

      const result = await orderService.getUserOrders('user_123', { page: 2, limit: 10 })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.totalPages).toBe(5)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        ['user_123', 10, 10]
      )
    })

    it('应该支持按状态筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })

      await orderService.getUserOrders('user_123', { status: 'completed' })

      const firstCall = (query as jest.Mock).mock.calls[0]
      expect(firstCall[0]).toContain('o.status = $2')
      expect(firstCall[1]).toContain('completed')
    })

    it('应该按创建时间降序排序', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })

      await orderService.getUserOrders('user_123')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY o.create_time DESC'),
        expect.any(Array)
      )
    })

    it('应该关联算命服务信息', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })

      await orderService.getUserOrders('user_123')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN fortunes f ON o.fortune_type = f.id'),
        expect.any(Array)
      )
    })

    it('应该使用默认分页参数', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })

      const result = await orderService.getUserOrders('user_123')

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
    })

    it('应该处理没有关联算命服务的订单', async () => {
      const mockOrders = [
        {
          id: 'order_1',
          order_id: 'ORD20251114123456',
          user_id: 'user_123',
          username: '测试用户',
          fortune_type: 'fortune_1',
          fortune_name: '八字精批',
          amount: '99.00',
          status: 'completed',
          pay_method: '支付宝',
          create_time: '2025-11-14',
          update_time: '2025-11-14',
          title: null,
          subtitle: null,
          price: null,
          icon: null,
          bg_color: null,
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockOrders })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })

      const result = await orderService.getUserOrders('user_123')

      expect(result.items[0].fortuneInfo).toBeUndefined()
    })
  })

  describe('getOrderDetail - 获取订单详情', () => {
    it('应该返回订单详情', async () => {
      const mockOrder = {
        id: 'order_1',
        order_id: 'ORD20251114123456',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        fortune_name: '八字精批',
        amount: '99.00',
        status: 'completed',
        pay_method: '支付宝',
        create_time: '2025-11-14',
        update_time: '2025-11-14',
        title: '八字精批',
        subtitle: '深度解析',
        description: '详细描述',
        price: '99.00',
        original_price: '199.00',
        icon: 'icon.png',
        bg_color: '#FF6B6B',
        category: '命理',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockOrder] })

      const result = await orderService.getOrderDetail('user_123', 'order_1')

      expect(result.orderId).toBe('ORD20251114123456')
      expect(result.fortuneInfo).toBeDefined()
      expect(result.fortuneInfo?.description).toBe('详细描述')
      expect(result.fortuneInfo?.originalPrice).toBe(199)
    })

    it('应该在订单不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(orderService.getOrderDetail('user_123', 'order_999')).rejects.toThrow(
        '订单不存在'
      )
    })

    it('应该验证用户权限', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(orderService.getOrderDetail('user_123', 'order_1')).rejects.toThrow(
        '订单不存在'
      )

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE o.id = $1 AND o.user_id = $2'),
        ['order_1', 'user_123']
      )
    })
  })

  describe('cancelOrder - 取消订单', () => {
    it('应该成功取消待支付订单', async () => {
      const mockOrder = {
        id: 'order_1',
        status: 'pending',
      }

      const mockUpdatedOrder = {
        id: 'order_1',
        order_id: 'ORD20251114123456',
        status: 'cancelled',
        update_time: '2025-11-14',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 检查订单
        .mockResolvedValueOnce({ rows: [mockUpdatedOrder] }) // 更新订单

      const result = await orderService.cancelOrder('user_123', 'order_1')

      expect(result.status).toBe('cancelled')
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'cancelled'"),
        ['order_1', 'user_123']
      )
    })

    it('应该在订单不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(orderService.cancelOrder('user_123', 'order_999')).rejects.toThrow(
        '订单不存在'
      )
    })

    it('应该在订单状态不是pending时抛出异常', async () => {
      const mockOrder = {
        id: 'order_1',
        status: 'completed',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockOrder] })

      await expect(orderService.cancelOrder('user_123', 'order_1')).rejects.toThrow(
        '只能取消待支付的订单'
      )
    })
  })

  describe('deleteOrder - 删除订单', () => {
    it('应该成功删除已取消的订单', async () => {
      const mockOrder = {
        id: 'order_1',
        status: 'cancelled',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 检查订单
        .mockResolvedValueOnce({ rows: [] }) // 删除订单

      const result = await orderService.deleteOrder('user_123', 'order_1')

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM orders'),
        ['order_1', 'user_123']
      )
    })

    it('应该成功删除已完成的订单', async () => {
      const mockOrder = {
        id: 'order_1',
        status: 'completed',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [] })

      const result = await orderService.deleteOrder('user_123', 'order_1')

      expect(result).toBe(true)
    })

    it('应该成功删除已退款的订单', async () => {
      const mockOrder = {
        id: 'order_1',
        status: 'refunded',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [] })

      const result = await orderService.deleteOrder('user_123', 'order_1')

      expect(result).toBe(true)
    })

    it('应该在订单不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(orderService.deleteOrder('user_123', 'order_999')).rejects.toThrow(
        '订单不存在'
      )
    })

    it('应该在订单状态不允许删除时抛出异常', async () => {
      const mockOrder = {
        id: 'order_1',
        status: 'pending',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockOrder] })

      await expect(orderService.deleteOrder('user_123', 'order_1')).rejects.toThrow(
        '只能删除已取消、已完成或已退款的订单'
      )
    })
  })

  describe('getOrderStats - 获取订单统计', () => {
    it('应该返回正确的订单统计', async () => {
      const mockStats = {
        pending_count: '5',
        completed_count: '20',
        cancelled_count: '3',
        refunded_count: '1',
        total_spent: '1980.00',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockStats] })

      const result = await orderService.getOrderStats('user_123')

      expect(result.pendingCount).toBe(5)
      expect(result.completedCount).toBe(20)
      expect(result.cancelledCount).toBe(3)
      expect(result.refundedCount).toBe(1)
      expect(result.totalSpent).toBe(1980)
    })

    it('应该使用 FILTER 子句统计不同状态', async () => {
      ;(query as jest.Mock).mockResolvedValue({
        rows: [
          {
            pending_count: '0',
            completed_count: '0',
            cancelled_count: '0',
            refunded_count: '0',
            total_spent: '0',
          },
        ],
      })

      await orderService.getOrderStats('user_123')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("FILTER (WHERE status = 'pending')"),
        ['user_123']
      )
    })

    it('应该只统计已完成订单的总消费', async () => {
      ;(query as jest.Mock).mockResolvedValue({
        rows: [
          {
            pending_count: '2',
            completed_count: '10',
            cancelled_count: '1',
            refunded_count: '0',
            total_spent: '500.00',
          },
        ],
      })

      await orderService.getOrderStats('user_123')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("SUM(amount) FILTER (WHERE status = 'completed')"),
        ['user_123']
      )
    })

    it('应该将字符串转换为数字', async () => {
      const mockStats = {
        pending_count: '5',
        completed_count: '10',
        cancelled_count: '2',
        refunded_count: '1',
        total_spent: '999.99',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockStats] })

      const result = await orderService.getOrderStats('user_123')

      expect(typeof result.pendingCount).toBe('number')
      expect(typeof result.completedCount).toBe('number')
      expect(typeof result.totalSpent).toBe('number')
    })

    it('应该处理没有订单的情况', async () => {
      const mockStats = {
        pending_count: '0',
        completed_count: '0',
        cancelled_count: '0',
        refunded_count: '0',
        total_spent: '0',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockStats] })

      const result = await orderService.getOrderStats('user_123')

      expect(result.pendingCount).toBe(0)
      expect(result.totalSpent).toBe(0)
    })
  })
})
