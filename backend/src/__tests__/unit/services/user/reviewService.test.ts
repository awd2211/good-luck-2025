/**
 * user/reviewService 单元测试
 */

import * as reviewService from '../../../../services/user/reviewService'
import { query } from '../../../../config/database'

// Mock database
jest.mock('../../../../config/database', () => ({
  query: jest.fn(),
}))

describe('user/reviewService - 用户评价服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createReview - 创建评价', () => {
    it('应该成功创建评价', async () => {
      const mockOrder = {
        order_id: 'ORD123',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        status: 'completed',
      }

      const mockReview = {
        id: 1,
        order_id: 'ORD123',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        rating: 5,
        content: '很准确',
        images: null,
        tags: '准确,靠谱',
        is_anonymous: false,
        status: 'published',
        helpful_count: 0,
        created_at: '2025-11-14',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 查询订单
        .mockResolvedValueOnce({ rows: [] }) // 检查是否已评价
        .mockResolvedValueOnce({ rows: [mockReview] }) // 创建评价

      const result = await reviewService.createReview('user_123', {
        orderId: 'ORD123',
        rating: 5,
        content: '很准确',
        tags: ['准确', '靠谱'],
      })

      expect(result.id).toBe(1)
      expect(result.rating).toBe(5)
      expect(result.content).toBe('很准确')
      expect(result.tags).toEqual(['准确', '靠谱'])
    })

    it('应该支持匿名评价', async () => {
      const mockOrder = {
        order_id: 'ORD123',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        status: 'completed',
      }

      const mockReview = {
        id: 1,
        order_id: 'ORD123',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        rating: 5,
        content: '很准确',
        images: null,
        tags: null,
        is_anonymous: true,
        status: 'published',
        helpful_count: 0,
        created_at: '2025-11-14',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockReview] })

      const result = await reviewService.createReview('user_123', {
        orderId: 'ORD123',
        rating: 5,
        content: '很准确',
        isAnonymous: true,
      })

      expect(result.username).toBe('匿名用户')
      expect(result.isAnonymous).toBe(true)
    })

    it('应该支持带图片的评价', async () => {
      const mockOrder = {
        order_id: 'ORD123',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        status: 'completed',
      }

      const mockReview = {
        id: 1,
        order_id: 'ORD123',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        rating: 5,
        content: '很准确',
        images: 'img1.jpg,img2.jpg',
        tags: null,
        is_anonymous: false,
        status: 'published',
        helpful_count: 0,
        created_at: '2025-11-14',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockReview] })

      const result = await reviewService.createReview('user_123', {
        orderId: 'ORD123',
        rating: 5,
        content: '很准确',
        images: ['img1.jpg', 'img2.jpg'],
      })

      expect(result.images).toEqual(['img1.jpg', 'img2.jpg'])
    })

    it('应该在订单不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(
        reviewService.createReview('user_123', {
          orderId: 'ORD999',
          rating: 5,
        })
      ).rejects.toThrow('订单不存在')
    })

    it('应该在订单未完成时抛出异常', async () => {
      const mockOrder = {
        order_id: 'ORD123',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        status: 'pending',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockOrder] })

      await expect(
        reviewService.createReview('user_123', {
          orderId: 'ORD123',
          rating: 5,
        })
      ).rejects.toThrow('只能评价已完成的订单')
    })

    it('应该在订单已评价时抛出异常', async () => {
      const mockOrder = {
        order_id: 'ORD123',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        status: 'completed',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // 已存在评价

      await expect(
        reviewService.createReview('user_123', {
          orderId: 'ORD123',
          rating: 5,
        })
      ).rejects.toThrow('该订单已评价')
    })

    it('应该在评分超出范围时抛出异常', async () => {
      const mockOrder = {
        order_id: 'ORD123',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        status: 'completed',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [] })

      await expect(
        reviewService.createReview('user_123', {
          orderId: 'ORD123',
          rating: 6,
        })
      ).rejects.toThrow('评分必须在1-5之间')
    })
  })

  describe('getUserReviews - 获取用户的评价列表', () => {
    it('应该返回用户的评价列表', async () => {
      const mockReviews = [
        {
          id: 1,
          order_id: 'ORD123',
          user_id: 'user_123',
          username: '测试用户',
          fortune_type: 'fortune_1',
          rating: 5,
          content: '很准确',
          images: 'img1.jpg',
          tags: '准确',
          is_anonymous: false,
          status: 'published',
          helpful_count: 10,
          reply_content: '感谢支持',
          reply_at: '2025-11-14',
          created_at: '2025-11-14',
          updated_at: '2025-11-14',
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockReviews }) // 查询评价
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // 查询总数

      const result = await reviewService.getUserReviews('user_123')

      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe(1)
      expect(result.items[0].rating).toBe(5)
      expect(result.pagination.total).toBe(1)
    })

    it('应该支持分页查询', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '50' }] })

      const result = await reviewService.getUserReviews('user_123', { page: 2, limit: 10 })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.totalPages).toBe(5)
    })

    it('应该按创建时间降序排序', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })

      await reviewService.getUserReviews('user_123')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY r.created_at DESC'),
        expect.any(Array)
      )
    })

    it('应该处理匿名评价', async () => {
      const mockReviews = [
        {
          id: 1,
          order_id: 'ORD123',
          user_id: 'user_123',
          username: '测试用户',
          fortune_type: 'fortune_1',
          rating: 5,
          content: '很准确',
          images: null,
          tags: null,
          is_anonymous: true,
          status: 'published',
          helpful_count: 0,
          reply_content: null,
          reply_at: null,
          created_at: '2025-11-14',
          updated_at: '2025-11-14',
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockReviews })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })

      const result = await reviewService.getUserReviews('user_123')

      expect(result.items[0].username).toBe('匿名用户')
    })
  })

  describe('getFortuneReviews - 获取算命服务的评价列表', () => {
    it('应该返回算命服务的评价列表和统计', async () => {
      const mockReviews = [
        {
          id: 1,
          order_id: 'ORD123',
          user_id: 'user_123',
          username: '测试用户',
          fortune_type: 'fortune_1',
          rating: 5,
          content: '很准确',
          images: null,
          tags: null,
          is_anonymous: false,
          helpful_count: 10,
          reply_content: null,
          reply_at: null,
          created_at: '2025-11-14',
        },
      ]

      const mockStats = {
        total: '10',
        avg_rating: '4.5',
        rating_5: '5',
        rating_4: '3',
        rating_3: '1',
        rating_2: '1',
        rating_1: '0',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockReviews }) // 查询评价
        .mockResolvedValueOnce({ rows: [mockStats] }) // 查询统计

      const result = await reviewService.getFortuneReviews('fortune_1')

      expect(result.items).toHaveLength(1)
      expect(result.stats.total).toBe(10)
      expect(result.stats.avgRating).toBe('4.5')
      expect(result.stats.rating5).toBe(5)
    })

    it('应该支持按评分筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0', avg_rating: null }] })

      await reviewService.getFortuneReviews('fortune_1', { rating: 5 })

      const firstCall = (query as jest.Mock).mock.calls[0]
      expect(firstCall[0]).toContain('r.rating = $2')
      expect(firstCall[1]).toContain(5)
    })

    it('应该只返回已发布的评价', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0', avg_rating: null }] })

      await reviewService.getFortuneReviews('fortune_1')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("r.status = 'published'"),
        expect.any(Array)
      )
    })

    it('应该使用FILTER子句统计各评分数量', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0', avg_rating: null }] })

      await reviewService.getFortuneReviews('fortune_1')

      const secondCall = (query as jest.Mock).mock.calls[1]
      expect(secondCall[0]).toContain('FILTER (WHERE rating = 5)')
      expect(secondCall[0]).toContain('FILTER (WHERE rating = 1)')
    })

    it('应该处理没有评分的情况', async () => {
      const mockStats = {
        total: '0',
        avg_rating: null,
        rating_5: '0',
        rating_4: '0',
        rating_3: '0',
        rating_2: '0',
        rating_1: '0',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockStats] })

      const result = await reviewService.getFortuneReviews('fortune_1')

      expect(result.stats.avgRating).toBe('0.0')
    })
  })

  describe('getReviewDetail - 获取评价详情', () => {
    it('应该返回评价详情', async () => {
      const mockReview = {
        id: 1,
        order_id: 'ORD123',
        user_id: 'user_123',
        username: '测试用户',
        fortune_type: 'fortune_1',
        rating: 5,
        content: '很准确',
        images: 'img1.jpg,img2.jpg',
        tags: '准确,靠谱',
        is_anonymous: false,
        status: 'published',
        helpful_count: 10,
        reply_content: '感谢支持',
        reply_at: '2025-11-14',
        created_at: '2025-11-14',
        updated_at: '2025-11-14',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockReview] })

      const result = await reviewService.getReviewDetail(1)

      expect(result.id).toBe(1)
      expect(result.rating).toBe(5)
      expect(result.images).toEqual(['img1.jpg', 'img2.jpg'])
      expect(result.tags).toEqual(['准确', '靠谱'])
    })

    it('应该在评价不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(reviewService.getReviewDetail(999)).rejects.toThrow('评价不存在')
    })
  })

  describe('deleteReview - 删除评价', () => {
    it('应该成功删除自己的评价', async () => {
      const mockReview = {
        id: 1,
        user_id: 'user_123',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockReview] }) // 查询评价
        .mockResolvedValueOnce({ rows: [] }) // 删除评价

      const result = await reviewService.deleteReview('user_123', 1)

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith('DELETE FROM reviews WHERE id = $1', [1])
    })

    it('应该在评价不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(reviewService.deleteReview('user_123', 999)).rejects.toThrow('评价不存在')
    })

    it('应该在尝试删除他人评价时抛出异常', async () => {
      const mockReview = {
        id: 1,
        user_id: 'user_456',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockReview] })

      await expect(reviewService.deleteReview('user_123', 1)).rejects.toThrow('无权删除此评价')
    })
  })

  describe('markHelpful - 点赞评价', () => {
    it('应该成功点赞评价', async () => {
      const mockResult = {
        helpful_count: 11,
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockResult] })

      const result = await reviewService.markHelpful(1)

      expect(result.helpfulCount).toBe(11)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('helpful_count = helpful_count + 1'),
        [1]
      )
    })

    it('应该在评价不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(reviewService.markHelpful(999)).rejects.toThrow('评价不存在')
    })
  })

  describe('canReviewOrder - 检查订单是否可以评价', () => {
    it('应该返回可以评价', async () => {
      const mockOrder = {
        order_id: 'ORD123',
        status: 'completed',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] }) // 查询订单
        .mockResolvedValueOnce({ rows: [] }) // 检查是否已评价

      const result = await reviewService.canReviewOrder('user_123', 'ORD123')

      expect(result.canReview).toBe(true)
    })

    it('应该在订单不存在时返回不能评价', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await reviewService.canReviewOrder('user_123', 'ORD999')

      expect(result.canReview).toBe(false)
      expect(result.reason).toBe('订单不存在')
    })

    it('应该在订单未完成时返回不能评价', async () => {
      const mockOrder = {
        order_id: 'ORD123',
        status: 'pending',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockOrder] })

      const result = await reviewService.canReviewOrder('user_123', 'ORD123')

      expect(result.canReview).toBe(false)
      expect(result.reason).toBe('订单未完成')
    })

    it('应该在订单已评价时返回不能评价', async () => {
      const mockOrder = {
        order_id: 'ORD123',
        status: 'completed',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })

      const result = await reviewService.canReviewOrder('user_123', 'ORD123')

      expect(result.canReview).toBe(false)
      expect(result.reason).toBe('已评价')
    })
  })
})
