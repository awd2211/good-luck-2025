/**
 * historyService 单元测试
 */

import * as historyService from '../../../services/user/historyService'

// Mock 依赖模块
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

// Mock 数据
const mockHistory = {
  rows: [
    {
      id: 'hist_1',
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
      rating: 4.8,
      sales_count: 1000,
    },
    {
      id: 'hist_2',
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
      rating: 4.9,
      sales_count: 800,
    },
  ],
  rowCount: 2,
}

describe('historyService - 浏览历史服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserHistory - 获取浏览历史', () => {
    it('应该成功获取浏览历史', async () => {
      // Mock 查询总数
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      // Mock 查询列表
      query.mockResolvedValueOnce(mockHistory)

      const result = await historyService.getUserHistory('user_123')

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('pagination')
      expect(result.items).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('应该支持分页查询', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [mockHistory.rows[0]], rowCount: 1 })

      const result = await historyService.getUserHistory('user_123', 2, 10)

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

    it('应该返回空列表当没有浏览历史时', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await historyService.getUserHistory('user_123')

      expect(result.items).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('应该正确计算总页数', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '25' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await historyService.getUserHistory('user_123', 1, 10)

      expect(result.pagination.totalPages).toBe(3) // ceil(25/10) = 3
    })

    it('应该使用默认分页参数', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockHistory)

      const result = await historyService.getUserHistory('user_123')

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('应该包含算命服务的完整信息', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockHistory)

      const result = await historyService.getUserHistory('user_123')

      expect(result.items[0]).toHaveProperty('title')
      expect(result.items[0]).toHaveProperty('subtitle')
      expect(result.items[0]).toHaveProperty('price')
      expect(result.items[0]).toHaveProperty('rating')
      expect(result.items[0]).toHaveProperty('sales_count')
    })
  })

  describe('addHistory - 添加浏览记录', () => {
    it('应该成功添加浏览记录', async () => {
      // Mock 查询商品
      query.mockResolvedValueOnce({
        rows: [{ id: 'fortune_1' }],
        rowCount: 1,
      })
      // Mock 删除旧记录
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // Mock 插入新记录
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'hist_new',
            user_id: 'user_123',
            fortune_id: 'fortune_1',
          },
        ],
        rowCount: 1,
      })

      const result = await historyService.addHistory('user_123', 'fortune_1')

      expect(result).toHaveProperty('id')
      expect(result.fortune_id).toBe('fortune_1')
      expect(query).toHaveBeenCalledTimes(3)
    })

    it('应该在商品不存在时抛出异常', async () => {
      // Mock 查询商品 - 不存在
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(historyService.addHistory('user_123', 'nonexistent')).rejects.toThrow(
        '商品不存在或已下架'
      )
    })

    it('应该删除旧的浏览记录并创建新记录', async () => {
      // Mock 查询商品
      query.mockResolvedValueOnce({ rows: [{ id: 'fortune_1' }], rowCount: 1 })
      // Mock 删除旧记录
      query.mockResolvedValueOnce({ rows: [{ id: 'hist_old' }], rowCount: 1 })
      // Mock 插入新记录
      query.mockResolvedValueOnce({
        rows: [{ id: 'hist_new', user_id: 'user_123', fortune_id: 'fortune_1' }],
        rowCount: 1,
      })

      await historyService.addHistory('user_123', 'fortune_1')

      expect(query).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM browse_history WHERE user_id = $1 AND fortune_id = $2',
        ['user_123', 'fortune_1']
      )
      expect(query).toHaveBeenCalledTimes(3)
    })
  })

  describe('removeHistory - 删除单条浏览记录', () => {
    it('应该成功删除浏览记录', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'hist_1',
            user_id: 'user_123',
            fortune_id: 'fortune_1',
          },
        ],
        rowCount: 1,
      })

      const result = await historyService.removeHistory('user_123', 'hist_1')

      expect(result).toHaveProperty('id')
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM browse_history WHERE id = $1 AND user_id = $2 RETURNING *',
        ['hist_1', 'user_123']
      )
    })

    it('应该在记录不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(historyService.removeHistory('user_123', 'nonexistent')).rejects.toThrow(
        '浏览记录不存在'
      )
    })
  })

  describe('clearHistory - 清空浏览历史', () => {
    it('应该成功清空浏览历史', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'hist_1' }, { id: 'hist_2' }, { id: 'hist_3' }],
        rowCount: 3,
      })

      const result = await historyService.clearHistory('user_123')

      expect(result.deletedCount).toBe(3)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM browse_history WHERE user_id = $1 RETURNING id',
        ['user_123']
      )
    })

    it('应该在没有浏览历史时返回0', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await historyService.clearHistory('user_123')

      expect(result.deletedCount).toBe(0)
    })
  })

  describe('batchRemoveHistory - 批量删除浏览记录', () => {
    it('应该成功批量删除记录', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'hist_1' }, { id: 'hist_2' }],
        rowCount: 2,
      })

      const result = await historyService.batchRemoveHistory('user_123', ['hist_1', 'hist_2'])

      expect(result.deletedCount).toBe(2)
      expect(result.deletedIds).toEqual(['hist_1', 'hist_2'])
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM browse_history'),
        ['user_123', 'hist_1', 'hist_2']
      )
    })

    it('应该在删除单个记录时正常工作', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'hist_1' }],
        rowCount: 1,
      })

      const result = await historyService.batchRemoveHistory('user_123', ['hist_1'])

      expect(result.deletedCount).toBe(1)
      expect(result.deletedIds).toEqual(['hist_1'])
    })

    it('应该在数组为空时抛出异常', async () => {
      await expect(historyService.batchRemoveHistory('user_123', [])).rejects.toThrow(
        '请选择要删除的记录'
      )
    })

    it('应该在传入null时抛出异常', async () => {
      await expect(historyService.batchRemoveHistory('user_123', null as any)).rejects.toThrow(
        '请选择要删除的记录'
      )
    })

    it('应该在部分记录不存在时返回实际删除的数量', async () => {
      // 只成功删除1个
      query.mockResolvedValueOnce({
        rows: [{ id: 'hist_1' }],
        rowCount: 1,
      })

      const result = await historyService.batchRemoveHistory('user_123', ['hist_1', 'hist_999'])

      expect(result.deletedCount).toBe(1)
      expect(result.deletedIds).toEqual(['hist_1'])
    })

    it('应该正确处理多个ID的参数化查询', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'hist_1' }, { id: 'hist_2' }, { id: 'hist_3' }],
        rowCount: 3,
      })

      await historyService.batchRemoveHistory('user_123', ['hist_1', 'hist_2', 'hist_3'])

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('IN ($2,$3,$4)'),
        ['user_123', 'hist_1', 'hist_2', 'hist_3']
      )
    })
  })
})
