/**
 * reviewService 单元测试
 */

import * as reviewService from '../../../services/user/reviewService'

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
      username: '测试用户',
      fortune_type: 'fortune_1',
      status: 'completed',
    },
  ],
  rowCount: 1,
}

const mockReview = {
  rows: [
    {
      id: 1,
      order_id: 'ORD20250113123456',
      user_id: 'user_123',
      username: '测试用户',
      fortune_type: 'fortune_1',
      rating: 5,
      content: '非常准确，很满意！',
      images: 'image1.jpg,image2.jpg',
      tags: '准确,专业',
      is_anonymous: false,
      status: 'published',
      helpful_count: 10,
      reply_content: null,
      reply_at: null,
      created_at: new Date('2025-01-13'),
      updated_at: new Date('2025-01-13'),
    },
  ],
  rowCount: 1,
}

describe('reviewService - 评价服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createReview - 创建评价', () => {
    it('应该成功创建评价', async () => {
      // Mock 查询订单
      query.mockResolvedValueOnce(mockOrder)
      // Mock 检查是否已评价
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // Mock 插入评价
      query.mockResolvedValueOnce(mockReview)

      const result = await reviewService.createReview('user_123', {
        orderId: 'ORD20250113123456',
        rating: 5,
        content: '非常准确，很满意！',
        images: ['image1.jpg', 'image2.jpg'],
        tags: ['准确', '专业'],
        isAnonymous: false,
      })

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('rating')
      expect(result.rating).toBe(5)
      expect(result.content).toBe('非常准确，很满意！')
      expect(result.images).toEqual(['image1.jpg', 'image2.jpg'])
      expect(result.tags).toEqual(['准确', '专业'])
      expect(query).toHaveBeenCalledTimes(3)
    })

    it('应该在订单不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(
        reviewService.createReview('user_123', {
          orderId: 'nonexistent',
          rating: 5,
        })
      ).rejects.toThrow('订单不存在')
    })

    it('应该在订单未完成时抛出异常', async () => {
      query.mockResolvedValueOnce({
        rows: [{ ...mockOrder.rows[0], status: 'pending' }],
        rowCount: 1,
      })

      await expect(
        reviewService.createReview('user_123', {
          orderId: 'ORD20250113123456',
          rating: 5,
        })
      ).rejects.toThrow('只能评价已完成的订单')
    })

    it('应该在订单已评价时抛出异常', async () => {
      query.mockResolvedValueOnce(mockOrder)
      query.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })

      await expect(
        reviewService.createReview('user_123', {
          orderId: 'ORD20250113123456',
          rating: 5,
        })
      ).rejects.toThrow('该订单已评价')
    })

    it('应该在评分小于1时抛出异常', async () => {
      query.mockResolvedValueOnce(mockOrder)
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(
        reviewService.createReview('user_123', {
          orderId: 'ORD20250113123456',
          rating: 0,
        })
      ).rejects.toThrow('评分必须在1-5之间')
    })

    it('应该在评分大于5时抛出异常', async () => {
      query.mockResolvedValueOnce(mockOrder)
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(
        reviewService.createReview('user_123', {
          orderId: 'ORD20250113123456',
          rating: 6,
        })
      ).rejects.toThrow('评分必须在1-5之间')
    })

    it('应该支持匿名评价', async () => {
      query.mockResolvedValueOnce(mockOrder)
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({
        rows: [{ ...mockReview.rows[0], is_anonymous: true }],
        rowCount: 1,
      })

      const result = await reviewService.createReview('user_123', {
        orderId: 'ORD20250113123456',
        rating: 5,
        isAnonymous: true,
      })

      expect(result.isAnonymous).toBe(true)
      expect(result.username).toBe('匿名用户')
    })

    it('应该在没有内容时正常创建', async () => {
      query.mockResolvedValueOnce(mockOrder)
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({
        rows: [{ ...mockReview.rows[0], content: null }],
        rowCount: 1,
      })

      const result = await reviewService.createReview('user_123', {
        orderId: 'ORD20250113123456',
        rating: 5,
      })

      expect(result.content).toBeNull()
    })

    it('应该在没有图片时返回空数组', async () => {
      query.mockResolvedValueOnce(mockOrder)
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({
        rows: [{ ...mockReview.rows[0], images: null }],
        rowCount: 1,
      })

      const result = await reviewService.createReview('user_123', {
        orderId: 'ORD20250113123456',
        rating: 5,
      })

      expect(result.images).toEqual([])
    })

    it('应该在没有标签时返回空数组', async () => {
      query.mockResolvedValueOnce(mockOrder)
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({
        rows: [{ ...mockReview.rows[0], tags: null }],
        rowCount: 1,
      })

      const result = await reviewService.createReview('user_123', {
        orderId: 'ORD20250113123456',
        rating: 5,
      })

      expect(result.tags).toEqual([])
    })
  })

  describe('getUserReviews - 获取用户的评价列表', () => {
    it('应该成功获取用户评价列表', async () => {
      // Mock 查询列表
      query.mockResolvedValueOnce(mockReview)
      // Mock 查询总数
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })

      const result = await reviewService.getUserReviews('user_123')

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('pagination')
      expect(result.items).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
    })

    it('应该支持分页查询', async () => {
      query.mockResolvedValueOnce(mockReview)
      query.mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 })

      const result = await reviewService.getUserReviews('user_123', { page: 2, limit: 10 })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.total).toBe(50)
      expect(result.pagination.totalPages).toBe(5)
    })

    it('应该返回空列表当没有评价时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      query.mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 })

      const result = await reviewService.getUserReviews('user_123')

      expect(result.items).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('应该正确处理匿名评价', async () => {
      query.mockResolvedValueOnce({
        rows: [{ ...mockReview.rows[0], is_anonymous: true }],
        rowCount: 1,
      })
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })

      const result = await reviewService.getUserReviews('user_123')

      expect(result.items[0].username).toBe('匿名用户')
    })

    it('应该正确解析图片和标签', async () => {
      query.mockResolvedValueOnce(mockReview)
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })

      const result = await reviewService.getUserReviews('user_123')

      expect(result.items[0].images).toEqual(['image1.jpg', 'image2.jpg'])
      expect(result.items[0].tags).toEqual(['准确', '专业'])
    })

    it('应该在没有图片时返回空数组', async () => {
      query.mockResolvedValueOnce({
        rows: [{ ...mockReview.rows[0], images: null }],
        rowCount: 1,
      })
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })

      const result = await reviewService.getUserReviews('user_123')

      expect(result.items[0].images).toEqual([])
    })

    it('应该包含回复信息', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            ...mockReview.rows[0],
            reply_content: '感谢您的好评',
            reply_at: new Date('2025-01-14'),
          },
        ],
        rowCount: 1,
      })
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })

      const result = await reviewService.getUserReviews('user_123')

      expect(result.items[0].replyContent).toBe('感谢您的好评')
      expect(result.items[0]).toHaveProperty('replyAt')
    })
  })

})
