/**
 * refundService 单元测试
 */

import * as refundService from '../../../services/refundService'
import { query } from '../../../config/database'

// Mock database
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

describe('refundService - 退款服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllRefunds - 获取所有退款记录', () => {
    it('应该返回分页的退款列表', async () => {
      const mockRefunds = [
        { id: 1, order_id: 'ORD001', amount: 100, status: 'pending' },
        { id: 2, order_id: 'ORD002', amount: 200, status: 'approved' },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockRefunds }) // data query
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // count query

      const result = await refundService.getAllRefunds({
        page: 1,
        pageSize: 10,
      })

      expect(result.data).toEqual(mockRefunds)
      expect(result.total).toBe(10)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.totalPages).toBe(1)
    })

    it('应该使用默认分页参数', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })

      const result = await refundService.getAllRefunds()

      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('应该按status筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })

      await refundService.getAllRefunds({ status: 'pending' })

      const dataCall = (query as jest.Mock).mock.calls[0]
      expect(dataCall[0]).toContain('AND status = $1')
      expect(dataCall[1]).toContain('pending')
    })

    it('应该按user_id筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })

      await refundService.getAllRefunds({ user_id: 'user-123' })

      const dataCall = (query as jest.Mock).mock.calls[0]
      expect(dataCall[0]).toContain('AND user_id = $1')
      expect(dataCall[1]).toContain('user-123')
    })

    it('应该支持同时按status和user_id筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })

      await refundService.getAllRefunds({
        status: 'approved',
        user_id: 'user-456',
      })

      const dataCall = (query as jest.Mock).mock.calls[0]
      expect(dataCall[0]).toContain('AND status = $1')
      expect(dataCall[0]).toContain('AND user_id = $2')
      expect(dataCall[1]).toContain('approved')
      expect(dataCall[1]).toContain('user-456')
    })

    it('应该按created_at降序排序', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })

      await refundService.getAllRefunds()

      const dataCall = (query as jest.Mock).mock.calls[0]
      expect(dataCall[0]).toContain('ORDER BY created_at DESC')
    })

    it('应该正确计算偏移量', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '50' }] })

      await refundService.getAllRefunds({ page: 3, pageSize: 20 })

      const dataCall = (query as jest.Mock).mock.calls[0]
      // page 3, pageSize 20 -> offset = (3-1) * 20 = 40
      expect(dataCall[1]).toContain(20) // pageSize
      expect(dataCall[1]).toContain(40) // offset
    })
  })

  describe('getRefundById - 根据ID获取退款', () => {
    it('应该返回指定ID的退款', async () => {
      const mockRefund = {
        id: 1,
        order_id: 'ORD001',
        amount: 100,
        status: 'pending',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockRefund] })

      const result = await refundService.getRefundById(1)

      expect(result).toEqual(mockRefund)
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM refunds WHERE id = $1',
        [1]
      )
    })

    it('应该在退款不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await refundService.getRefundById(999)

      expect(result).toBeNull()
    })
  })

  describe('createRefund - 创建退款', () => {
    it('应该成功创建退款', async () => {
      const newRefund = {
        refund_no: 'REF20251113001',
        order_id: 'ORD001',
        user_id: 'user-123',
        amount: 99.99,
        reason: '商品有问题',
        description: '商品质量不符合描述',
        status: 'pending' as const,
      }

      const createdRefund = { id: 1, ...newRefund }
      ;(query as jest.Mock).mockResolvedValue({ rows: [createdRefund] })

      const result = await refundService.createRefund(newRefund)

      expect(result).toEqual(createdRefund)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO refunds'),
        expect.arrayContaining([
          newRefund.refund_no,
          newRefund.order_id,
          newRefund.user_id,
          newRefund.amount,
          newRefund.reason,
          newRefund.description,
          newRefund.status,
        ])
      )
    })

    it('应该使用默认status为pending', async () => {
      const minimalRefund = {
        order_id: 'ORD002',
        user_id: 'user-456',
        amount: 50,
        reason: '不想要了',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await refundService.createRefund(minimalRefund)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1]).toContain('pending') // 默认status
    })

    it('应该支持可选的description字段', async () => {
      const refundWithoutDesc = {
        order_id: 'ORD003',
        user_id: 'user-789',
        amount: 75,
        reason: '尺寸不合适',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await refundService.createRefund(refundWithoutDesc)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1]).toContain(undefined) // description is undefined
    })
  })

  describe('reviewRefund - 审核退款', () => {
    it('应该成功批准退款', async () => {
      const reviewData = {
        action: 'approve' as const,
        reviewer_id: 'admin-001',
        reviewer_name: '张管理员',
        review_comment: '同意退款',
        refund_method: '原路退回',
      }

      const updatedRefund = {
        id: 1,
        status: 'approved',
        ...reviewData,
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [updatedRefund] })

      const result = await refundService.reviewRefund(1, reviewData)

      expect(result).toEqual(updatedRefund)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refunds'),
        [
          'approved', // status
          reviewData.reviewer_id,
          reviewData.reviewer_name,
          reviewData.review_comment,
          reviewData.refund_method,
          1, // id
        ]
      )
    })

    it('应该成功拒绝退款', async () => {
      const reviewData = {
        action: 'reject' as const,
        reviewer_id: 'admin-002',
        reviewer_name: '李管理员',
        review_comment: '不符合退款条件',
      }

      const updatedRefund = {
        id: 2,
        status: 'rejected',
        ...reviewData,
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [updatedRefund] })

      const result = await refundService.reviewRefund(2, reviewData)

      expect(result).toEqual(updatedRefund)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1][0]).toBe('rejected') // status应该是rejected
    })

    it('应该支持可选的review_comment', async () => {
      const reviewData = {
        action: 'approve' as const,
        reviewer_id: 'admin-003',
        reviewer_name: '王管理员',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 3 }] })

      await refundService.reviewRefund(3, reviewData)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1][3]).toBeUndefined() // review_comment is undefined
    })

    it('应该在退款不存在时返回null', async () => {
      const reviewData = {
        action: 'approve' as const,
        reviewer_id: 'admin-001',
        reviewer_name: '管理员',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await refundService.reviewRefund(999, reviewData)

      expect(result).toBeNull()
    })
  })

  describe('updateRefundStatus - 更新退款状态', () => {
    it('应该成功更新退款状态', async () => {
      const updatedRefund = {
        id: 1,
        status: 'processing',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [updatedRefund] })

      const result = await refundService.updateRefundStatus(1, 'processing')

      expect(result).toEqual(updatedRefund)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refunds'),
        ['processing', 1]
      )
    })

    it('应该在状态为completed时设置completed_at', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await refundService.updateRefundStatus(1, 'completed')

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain('completed_at = CASE WHEN $1 = \'completed\' THEN CURRENT_TIMESTAMP ELSE completed_at END')
      expect(call[1][0]).toBe('completed')
    })

    it('应该更新updated_at时间戳', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await refundService.updateRefundStatus(1, 'cancelled')

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain('updated_at = CURRENT_TIMESTAMP')
    })

    it('应该在退款不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await refundService.updateRefundStatus(999, 'completed')

      expect(result).toBeNull()
    })

    it('应该支持多种状态', async () => {
      const statuses = ['pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled']

      for (const status of statuses) {
        jest.clearAllMocks()
        ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1, status }] })

        await refundService.updateRefundStatus(1, status)

        const call = (query as jest.Mock).mock.calls[0]
        expect(call[1][0]).toBe(status)
      }
    })
  })

  describe('deleteRefund - 删除退款', () => {
    it('应该成功删除退款', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 1 })

      const result = await refundService.deleteRefund(1)

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM refunds WHERE id = $1',
        [1]
      )
    })

    it('应该在退款不存在时返回false', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 0 })

      const result = await refundService.deleteRefund(999)

      expect(result).toBe(false)
    })

    it('应该在rowCount为null时返回false', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: null })

      const result = await refundService.deleteRefund(1)

      expect(result).toBe(false)
    })
  })
})
