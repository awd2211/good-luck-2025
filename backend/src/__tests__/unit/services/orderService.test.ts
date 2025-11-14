/**
 * orderService 单元测试
 */

import * as orderService from '../../../services/user/orderService'

// Mock 依赖模块
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

// Mock 数据
const mockFortunes = {
  rows: [
    {
      id: 'fortune_1',
      title: '生肖运势',
      subtitle: '2025年运势详批',
      price: '88.00',
      icon: 'icon.png',
      bg_color: '#FF6B6B',
    },
  ],
  rowCount: 1,
}

const mockUser = {
  rows: [
    {
      id: 'user_123',
      nickname: '测试用户',
      phone: '13900000001',
    },
  ],
  rowCount: 1,
}

const mockOrder = {
  rows: [
    {
      id: 'order_123',
      order_id: 'ORD20250113123456',
      user_id: 'user_123',
      username: '测试用户',
      fortune_type: 'fortune_1',
      fortune_name: '生肖运势',
      amount: '88.00',
      status: 'pending',
      pay_method: 'wechat',
      create_time: new Date('2025-01-13'),
      update_time: new Date('2025-01-13'),
    },
  ],
  rowCount: 1,
}

describe('orderService - 订单服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createOrder - 创建订单', () => {
    it('应该成功创建订单', async () => {
      // Mock 查询算命服务
      query.mockResolvedValueOnce(mockFortunes)
      // Mock 查询用户
      query.mockResolvedValueOnce(mockUser)
      // Mock 插入订单
      query.mockResolvedValueOnce(mockOrder)

      const items = [{ fortuneId: 'fortune_1', quantity: 1 }]
      const result = await orderService.createOrder('user_123', items, 'wechat')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('orderId')
      expect(result.userId).toBe('user_123')
      expect(result.amount).toBe(88)
      expect(result.status).toBe('pending')
      expect(result.payMethod).toBe('wechat')
      expect(query).toHaveBeenCalledTimes(3)
    })

    it('应该在算命服务不存在时抛出异常', async () => {
      // Mock 查询算命服务 - 不存在
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const items = [{ fortuneId: 'nonexistent', quantity: 1 }]
      await expect(orderService.createOrder('user_123', items)).rejects.toThrow(
        '所选算命服务不存在或已下架'
      )
    })

    it('应该在用户不存在时抛出异常', async () => {
      // Mock 查询算命服务
      query.mockResolvedValueOnce(mockFortunes)
      // Mock 查询用户 - 不存在
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const items = [{ fortuneId: 'fortune_1', quantity: 1 }]
      await expect(orderService.createOrder('nonexistent', items)).rejects.toThrow('用户不存在')
    })

    it('应该正确计算多个数量的总价', async () => {
      // Mock 查询算命服务
      query.mockResolvedValueOnce(mockFortunes)
      // Mock 查询用户
      query.mockResolvedValueOnce(mockUser)
      // Mock 插入订单 - 总价应该是 88 * 2 = 176
      query.mockResolvedValueOnce({
        rows: [
          {
            ...mockOrder.rows[0],
            amount: '176.00',
          },
        ],
        rowCount: 1,
      })

      const items = [{ fortuneId: 'fortune_1', quantity: 2 }]
      const result = await orderService.createOrder('user_123', items)

      expect(result.amount).toBe(176)
    })

    it('应该在不指定支付方式时正常创建订单', async () => {
      query.mockResolvedValueOnce(mockFortunes)
      query.mockResolvedValueOnce(mockUser)
      query.mockResolvedValueOnce({
        rows: [{ ...mockOrder.rows[0], pay_method: null }],
        rowCount: 1,
      })

      const items = [{ fortuneId: 'fortune_1', quantity: 1 }]
      const result = await orderService.createOrder('user_123', items)

      expect(result.payMethod).toBeNull()
    })
  })

  describe('getUserOrders - 获取用户订单列表', () => {
    const mockOrdersList = {
      rows: [
        {
          id: 'order_1',
          order_id: 'ORD20250113123456',
          user_id: 'user_123',
          username: '测试用户',
          fortune_type: 'fortune_1',
          fortune_name: '生肖运势',
          amount: '88.00',
          status: 'pending',
          pay_method: 'wechat',
          create_time: new Date('2025-01-13'),
          update_time: new Date('2025-01-13'),
          title: '生肖运势',
          subtitle: '2025年运势详批',
          price: '88.00',
          icon: 'icon.png',
          bg_color: '#FF6B6B',
        },
        {
          id: 'order_2',
          order_id: 'ORD20250112123456',
          user_id: 'user_123',
          username: '测试用户',
          fortune_type: 'fortune_2',
          fortune_name: '八字精批',
          amount: '128.00',
          status: 'completed',
          pay_method: 'alipay',
          create_time: new Date('2025-01-12'),
          update_time: new Date('2025-01-12'),
          title: '八字精批',
          subtitle: '一生运势详批',
          price: '128.00',
          icon: 'icon2.png',
          bg_color: '#4ECDC4',
        },
      ],
      rowCount: 2,
    }

    it('应该成功获取订单列表', async () => {
      // Mock 查询订单列表
      query.mockResolvedValueOnce(mockOrdersList)
      // Mock 查询总数
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })

      const result = await orderService.getUserOrders('user_123')

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('pagination')
      expect(result.items).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
    })

    it('应该支持分页查询', async () => {
      query.mockResolvedValueOnce({ rows: [mockOrdersList.rows[0]], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [{ total: '10' }], rowCount: 1 })

      const result = await orderService.getUserOrders('user_123', { page: 2, limit: 5 })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(5)
      expect(result.pagination.total).toBe(10)
      expect(result.pagination.totalPages).toBe(2)
    })

    it('应该支持按状态筛选', async () => {
      const pendingOrders = { rows: [mockOrdersList.rows[0]], rowCount: 1 }
      query.mockResolvedValueOnce(pendingOrders)
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })

      const result = await orderService.getUserOrders('user_123', { status: 'pending' })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].status).toBe('pending')
    })

    it('应该在状态为all时不筛选', async () => {
      query.mockResolvedValueOnce(mockOrdersList)
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })

      const result = await orderService.getUserOrders('user_123', { status: 'all' })

      expect(result.items).toHaveLength(2)
    })

    it('应该返回空列表当没有订单时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 })

      const result = await orderService.getUserOrders('user_123')

      expect(result.items).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('应该正确计算总页数', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({ rows: [{ total: '25' }], rowCount: 1 })

      const result = await orderService.getUserOrders('user_123', { limit: 10 })

      expect(result.pagination.totalPages).toBe(3) // 25 / 10 = 3
    })

    it('应该包含算命服务信息', async () => {
      query.mockResolvedValueOnce(mockOrdersList)
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })

      const result = await orderService.getUserOrders('user_123')

      expect(result.items[0]).toHaveProperty('fortuneInfo')
      expect(result.items[0].fortuneInfo).toHaveProperty('title')
      expect(result.items[0].fortuneInfo?.title).toBe('生肖运势')
    })
  })

  describe('getOrderDetail - 获取订单详情', () => {
    const mockOrderDetail = {
      rows: [
        {
          id: 'order_123',
          order_id: 'ORD20250113123456',
          user_id: 'user_123',
          username: '测试用户',
          fortune_type: 'fortune_1',
          fortune_name: '生肖运势',
          amount: '88.00',
          status: 'pending',
          pay_method: 'wechat',
          create_time: new Date('2025-01-13'),
          update_time: new Date('2025-01-13'),
          title: '生肖运势',
          subtitle: '2025年运势详批',
          description: '详细描述',
          price: '88.00',
          original_price: '128.00',
          icon: 'icon.png',
          bg_color: '#FF6B6B',
          category: '生肖运势',
        },
      ],
      rowCount: 1,
    }

    it('应该成功获取订单详情', async () => {
      query.mockResolvedValueOnce(mockOrderDetail)

      const result = await orderService.getOrderDetail('user_123', 'order_123')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('orderId')
      expect(result).toHaveProperty('fortuneInfo')
      expect(result.id).toBe('order_123')
      expect(result.fortuneInfo?.title).toBe('生肖运势')
    })

    it('应该在订单不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(orderService.getOrderDetail('user_123', 'nonexistent')).rejects.toThrow(
        '订单不存在'
      )
    })

    it('应该包含完整的算命服务信息', async () => {
      query.mockResolvedValueOnce(mockOrderDetail)

      const result = await orderService.getOrderDetail('user_123', 'order_123')

      expect(result.fortuneInfo).toHaveProperty('title')
      expect(result.fortuneInfo).toHaveProperty('subtitle')
      expect(result.fortuneInfo).toHaveProperty('description')
      expect(result.fortuneInfo).toHaveProperty('price')
      expect(result.fortuneInfo).toHaveProperty('originalPrice')
      expect(result.fortuneInfo).toHaveProperty('category')
    })
  })
})
