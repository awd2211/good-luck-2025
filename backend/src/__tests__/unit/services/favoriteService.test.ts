/**
 * favoriteService 单元测试
 */

import * as favoriteService from '../../../services/user/favoriteService'

// Mock 依赖模块
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

// Mock 数据
const mockFavorites = {
  rows: [
    {
      id: 'fav_1',
      fortune_id: 'fortune_1',
      created_at: new Date('2025-01-13'),
      title: '生肖运势',
      subtitle: '2025年运势详批',
      category: '生肖运势',
      description: '详细描述',
      price: '88.00',
      original_price: '128.00',
      icon: 'icon.png',
      bg_color: '#FF6B6B',
      sales_count: 1000,
      rating: 4.8,
    },
    {
      id: 'fav_2',
      fortune_id: 'fortune_2',
      created_at: new Date('2025-01-12'),
      title: '八字精批',
      subtitle: '一生运势详批',
      category: '八字算命',
      description: '详细描述',
      price: '128.00',
      original_price: '188.00',
      icon: 'icon2.png',
      bg_color: '#4ECDC4',
      sales_count: 800,
      rating: 4.9,
    },
  ],
  rowCount: 2,
}

describe('favoriteService - 收藏服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserFavorites - 获取用户收藏列表', () => {
    it('应该成功获取收藏列表', async () => {
      // Mock 查询总数
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      // Mock 查询列表
      query.mockResolvedValueOnce(mockFavorites)

      const result = await favoriteService.getUserFavorites('user_123')

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('pagination')
      expect(result.items).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('应该支持分页查询', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [mockFavorites.rows[0]], rowCount: 1 })

      const result = await favoriteService.getUserFavorites('user_123', 2, 10)

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.total).toBe(50)
      expect(result.pagination.totalPages).toBe(5)
      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        ['user_123', 10, 10] // offset = (2-1) * 10 = 10
      )
    })

    it('应该返回空列表当没有收藏时', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await favoriteService.getUserFavorites('user_123')

      expect(result.items).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('应该正确计算总页数', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '25' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await favoriteService.getUserFavorites('user_123', 1, 10)

      expect(result.pagination.totalPages).toBe(3) // ceil(25/10) = 3
    })

    it('应该使用默认分页参数', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockFavorites)

      const result = await favoriteService.getUserFavorites('user_123')

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })
  })

  describe('addFavorite - 添加收藏', () => {
    it('应该成功添加收藏', async () => {
      // Mock 查询商品
      query.mockResolvedValueOnce({
        rows: [{ id: 'fortune_1', title: '生肖运势' }],
        rowCount: 1,
      })
      // Mock 检查是否已收藏
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // Mock 插入收藏
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'fav_new',
            user_id: 'user_123',
            fortune_id: 'fortune_1',
          },
        ],
        rowCount: 1,
      })

      const result = await favoriteService.addFavorite('user_123', 'fortune_1')

      expect(result).toHaveProperty('id')
      expect(result.fortune_id).toBe('fortune_1')
      expect(query).toHaveBeenCalledTimes(3)
    })

    it('应该在商品不存在时抛出异常', async () => {
      // Mock 查询商品 - 不存在
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(favoriteService.addFavorite('user_123', 'nonexistent')).rejects.toThrow(
        '商品不存在或已下架'
      )
    })

    it('应该在已收藏时抛出异常', async () => {
      // Mock 查询商品
      query.mockResolvedValueOnce({
        rows: [{ id: 'fortune_1', title: '生肖运势' }],
        rowCount: 1,
      })
      // Mock 检查是否已收藏 - 已收藏
      query.mockResolvedValueOnce({
        rows: [{ id: 'fav_1' }],
        rowCount: 1,
      })

      await expect(favoriteService.addFavorite('user_123', 'fortune_1')).rejects.toThrow(
        '已收藏该商品'
      )
    })
  })

  describe('removeFavorite - 取消收藏', () => {
    it('应该成功取消收藏', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'fav_1',
            user_id: 'user_123',
            fortune_id: 'fortune_1',
          },
        ],
        rowCount: 1,
      })

      const result = await favoriteService.removeFavorite('user_123', 'fortune_1')

      expect(result).toHaveProperty('id')
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM favorites WHERE user_id = $1 AND fortune_id = $2 RETURNING *',
        ['user_123', 'fortune_1']
      )
    })

    it('应该在未收藏时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(favoriteService.removeFavorite('user_123', 'fortune_1')).rejects.toThrow(
        '未收藏该商品'
      )
    })
  })

  describe('checkFavorite - 检查是否已收藏', () => {
    it('应该返回true当已收藏时', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'fav_1' }],
        rowCount: 1,
      })

      const result = await favoriteService.checkFavorite('user_123', 'fortune_1')

      expect(result.isFavorited).toBe(true)
    })

    it('应该返回false当未收藏时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await favoriteService.checkFavorite('user_123', 'fortune_1')

      expect(result.isFavorited).toBe(false)
    })
  })

  describe('batchCheckFavorites - 批量检查收藏状态', () => {
    it('应该成功批量检查收藏状态', async () => {
      query.mockResolvedValueOnce({
        rows: [{ fortune_id: 'fortune_1' }, { fortune_id: 'fortune_3' }],
        rowCount: 2,
      })

      const result = await favoriteService.batchCheckFavorites('user_123', [
        'fortune_1',
        'fortune_2',
        'fortune_3',
      ])

      expect(result).toEqual({
        fortune_1: true,
        fortune_2: false,
        fortune_3: true,
      })
    })

    it('应该在所有商品都未收藏时返回全false', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await favoriteService.batchCheckFavorites('user_123', [
        'fortune_1',
        'fortune_2',
      ])

      expect(result).toEqual({
        fortune_1: false,
        fortune_2: false,
      })
    })

    it('应该在所有商品都已收藏时返回全true', async () => {
      query.mockResolvedValueOnce({
        rows: [{ fortune_id: 'fortune_1' }, { fortune_id: 'fortune_2' }],
        rowCount: 2,
      })

      const result = await favoriteService.batchCheckFavorites('user_123', [
        'fortune_1',
        'fortune_2',
      ])

      expect(result).toEqual({
        fortune_1: true,
        fortune_2: true,
      })
    })

    it('应该在空数组时返回空对象', async () => {
      const result = await favoriteService.batchCheckFavorites('user_123', [])

      expect(result).toEqual({})
      expect(query).not.toHaveBeenCalled()
    })

    it('应该在null时返回空对象', async () => {
      const result = await favoriteService.batchCheckFavorites('user_123', null as any)

      expect(result).toEqual({})
      expect(query).not.toHaveBeenCalled()
    })

    it('应该正确处理单个商品', async () => {
      query.mockResolvedValueOnce({
        rows: [{ fortune_id: 'fortune_1' }],
        rowCount: 1,
      })

      const result = await favoriteService.batchCheckFavorites('user_123', ['fortune_1'])

      expect(result).toEqual({
        fortune_1: true,
      })
    })
  })
})
