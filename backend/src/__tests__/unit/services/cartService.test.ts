/**
 * cartService 单元测试
 */

import * as cartService from '../../../services/user/cartService'
import { mockQueryResponses, resetDatabaseMocks } from '../../mocks/database'

// Mock 依赖模块
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

// Mock 数据
const mockCartItems = {
  rows: [
    {
      id: 'cart_1',
      fortune_id: 'fortune_1',
      quantity: 1,
      item_price: '88.00',
      created_at: new Date('2025-01-01'),
      title: '生肖运势',
      subtitle: '2025年运势详批',
      category: '生肖运势',
      description: '详细描述',
      price: '88.00',
      original_price: '128.00',
      icon: 'icon.png',
      bg_color: '#FF6B6B',
    },
    {
      id: 'cart_2',
      fortune_id: 'fortune_2',
      quantity: 2,
      item_price: '128.00',
      created_at: new Date('2025-01-02'),
      title: '八字精批',
      subtitle: '一生运势详批',
      category: '八字算命',
      description: '详细描述',
      price: '128.00',
      original_price: '188.00',
      icon: 'icon2.png',
      bg_color: '#4ECDC4',
    },
  ],
  rowCount: 2,
}

const mockFortune = {
  rows: [
    {
      id: 'fortune_1',
      title: '生肖运势',
      price: '88.00',
    },
  ],
  rowCount: 1,
}

describe('cartService - 购物车服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetDatabaseMocks()
  })

  describe('getUserCart - 获取用户购物车', () => {
    it('应该成功获取购物车并计算总价', async () => {
      query.mockResolvedValueOnce(mockCartItems)

      const result = await cartService.getUserCart('user_123')

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('count')
      expect(result).toHaveProperty('total')
      expect(result.count).toBe(2)
      expect(result.items).toHaveLength(2)
      // 总价 = 88 * 1 + 128 * 2 = 344
      expect(result.total).toBe('344.00')
      expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['user_123'])
    })

    it('应该返回空购物车', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await cartService.getUserCart('user_123')

      expect(result.count).toBe(0)
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe('0.00')
    })

    it('应该正确计算单个商品的总价', async () => {
      query.mockResolvedValueOnce({
        rows: [mockCartItems.rows[0]],
        rowCount: 1,
      })

      const result = await cartService.getUserCart('user_123')

      expect(result.count).toBe(1)
      expect(result.total).toBe('88.00')
    })
  })

  describe('addToCart - 添加到购物车', () => {
    it('应该成功添加新商品到购物车', async () => {
      // Mock 查询商品
      query.mockResolvedValueOnce(mockFortune)
      // Mock 检查购物车中是否已存在
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // Mock 插入购物车
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'cart_new',
            user_id: 'user_123',
            fortune_id: 'fortune_1',
            quantity: 1,
            price: '88.00',
          },
        ],
        rowCount: 1,
      })

      const result = await cartService.addToCart('user_123', 'fortune_1', 1)

      expect(result).toHaveProperty('id')
      expect(result.fortune_id).toBe('fortune_1')
      expect(result.quantity).toBe(1)
      expect(query).toHaveBeenCalledTimes(3)
    })

    it('应该在商品已存在时更新数量', async () => {
      // Mock 查询商品
      query.mockResolvedValueOnce(mockFortune)
      // Mock 查询购物车中已存在的商品
      query.mockResolvedValueOnce({
        rows: [{ id: 'cart_1', quantity: 1 }],
        rowCount: 1,
      })
      // Mock 更新数量
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'cart_1',
            user_id: 'user_123',
            fortune_id: 'fortune_1',
            quantity: 2, // 原来1个 + 新加1个 = 2个
            price: '88.00',
          },
        ],
        rowCount: 1,
      })

      const result = await cartService.addToCart('user_123', 'fortune_1', 1)

      expect(result.quantity).toBe(2)
      expect(query).toHaveBeenCalledTimes(3)
    })

    it('应该在添加多个数量时正确更新', async () => {
      // Mock 查询商品
      query.mockResolvedValueOnce(mockFortune)
      // Mock 查询购物车中已存在的商品
      query.mockResolvedValueOnce({
        rows: [{ id: 'cart_1', quantity: 1 }],
        rowCount: 1,
      })
      // Mock 更新数量
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'cart_1',
            quantity: 4, // 原来1个 + 新加3个 = 4个
          },
        ],
        rowCount: 1,
      })

      const result = await cartService.addToCart('user_123', 'fortune_1', 3)

      expect(result.quantity).toBe(4)
    })

    it('应该在商品不存在时抛出异常', async () => {
      // Mock 查询商品 - 不存在
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(cartService.addToCart('user_123', 'nonexistent', 1)).rejects.toThrow(
        '商品不存在或已下架'
      )
    })

    it('应该使用默认数量1', async () => {
      query.mockResolvedValueOnce(mockFortune)
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({
        rows: [{ id: 'cart_new', quantity: 1 }],
        rowCount: 1,
      })

      const result = await cartService.addToCart('user_123', 'fortune_1')

      expect(result.quantity).toBe(1)
    })
  })

  describe('updateCartItem - 更新购物车商品数量', () => {
    it('应该成功更新商品数量', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'cart_1',
            user_id: 'user_123',
            fortune_id: 'fortune_1',
            quantity: 5,
          },
        ],
        rowCount: 1,
      })

      const result = await cartService.updateCartItem('user_123', 'cart_1', 5)

      expect(result.quantity).toBe(5)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE cart_items'),
        [5, 'cart_1', 'user_123']
      )
    })

    it('应该在购物车商品不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(cartService.updateCartItem('user_123', 'nonexistent', 2)).rejects.toThrow(
        '购物车商品不存在'
      )
    })

    it('应该在数量小于1时抛出异常', async () => {
      await expect(cartService.updateCartItem('user_123', 'cart_1', 0)).rejects.toThrow(
        '数量必须大于0'
      )

      await expect(cartService.updateCartItem('user_123', 'cart_1', -1)).rejects.toThrow(
        '数量必须大于0'
      )
    })

    it('应该允许更新数量为1', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'cart_1', quantity: 1 }],
        rowCount: 1,
      })

      const result = await cartService.updateCartItem('user_123', 'cart_1', 1)

      expect(result.quantity).toBe(1)
    })
  })

  describe('removeFromCart - 删除购物车商品', () => {
    it('应该成功删除购物车商品', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'cart_1' }],
        rowCount: 1,
      })

      const result = await cartService.removeFromCart('user_123', 'cart_1')

      expect(result).toHaveProperty('id')
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
        ['cart_1', 'user_123']
      )
    })

    it('应该在商品不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(cartService.removeFromCart('user_123', 'nonexistent')).rejects.toThrow(
        '购物车商品不存在'
      )
    })
  })

  describe('batchRemoveFromCart - 批量删除购物车商品', () => {
    it('应该成功批量删除商品', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'cart_1' }, { id: 'cart_2' }],
        rowCount: 2,
      })

      const result = await cartService.batchRemoveFromCart('user_123', ['cart_1', 'cart_2'])

      expect(result.deletedCount).toBe(2)
      expect(result.deletedIds).toEqual(['cart_1', 'cart_2'])
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM cart_items'),
        ['user_123', 'cart_1', 'cart_2']
      )
    })

    it('应该在删除单个商品时正常工作', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'cart_1' }],
        rowCount: 1,
      })

      const result = await cartService.batchRemoveFromCart('user_123', ['cart_1'])

      expect(result.deletedCount).toBe(1)
      expect(result.deletedIds).toEqual(['cart_1'])
    })

    it('应该在数组为空时抛出异常', async () => {
      await expect(cartService.batchRemoveFromCart('user_123', [])).rejects.toThrow(
        '请选择要删除的商品'
      )
    })

    it('应该在传入null时抛出异常', async () => {
      await expect(cartService.batchRemoveFromCart('user_123', null as any)).rejects.toThrow(
        '请选择要删除的商品'
      )
    })

    it('应该在部分商品不存在时返回实际删除的数量', async () => {
      // 只成功删除1个
      query.mockResolvedValueOnce({
        rows: [{ id: 'cart_1' }],
        rowCount: 1,
      })

      const result = await cartService.batchRemoveFromCart('user_123', ['cart_1', 'cart_999'])

      expect(result.deletedCount).toBe(1)
      expect(result.deletedIds).toEqual(['cart_1'])
    })
  })

  describe('clearCart - 清空购物车', () => {
    it('应该成功清空购物车', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'cart_1' }, { id: 'cart_2' }, { id: 'cart_3' }],
        rowCount: 3,
      })

      const result = await cartService.clearCart('user_123')

      expect(result.deletedCount).toBe(3)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM cart_items WHERE user_id = $1 RETURNING id',
        ['user_123']
      )
    })

    it('应该在购物车为空时返回0', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await cartService.clearCart('user_123')

      expect(result.deletedCount).toBe(0)
    })
  })
})
