/**
 * feedbackService 单元测试
 */

import * as feedbackService from '../../../services/feedbackService'
import { query } from '../../../config/database'

// Mock database
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

describe('feedbackService - 反馈服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllFeedbacks - 获取所有反馈', () => {
    it('应该返回分页的反馈列表', async () => {
      const mockFeedbacks = [
        { id: 1, title: '反馈1', type: 'bug', status: 'pending' },
        { id: 2, title: '反馈2', type: 'feature', status: 'resolved' },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockFeedbacks }) // data query
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // count query

      const result = await feedbackService.getAllFeedbacks({
        page: 1,
        pageSize: 10,
      })

      expect(result.data).toEqual(mockFeedbacks)
      expect(result.total).toBe(10)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.totalPages).toBe(1)
    })

    it('应该使用默认分页参数', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })

      const result = await feedbackService.getAllFeedbacks()

      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('应该按status筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })

      await feedbackService.getAllFeedbacks({ status: 'pending' })

      const dataCall = (query as jest.Mock).mock.calls[0]
      expect(dataCall[0]).toContain('AND status = $1')
      expect(dataCall[1]).toContain('pending')
    })

    it('应该按type筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })

      await feedbackService.getAllFeedbacks({ type: 'bug' })

      const dataCall = (query as jest.Mock).mock.calls[0]
      expect(dataCall[0]).toContain('AND type = $1')
      expect(dataCall[1]).toContain('bug')
    })

    it('应该按priority筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })

      await feedbackService.getAllFeedbacks({ priority: 'high' })

      const dataCall = (query as jest.Mock).mock.calls[0]
      expect(dataCall[0]).toContain('AND priority = $1')
      expect(dataCall[1]).toContain('high')
    })

    it('应该支持多条件筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })

      await feedbackService.getAllFeedbacks({
        status: 'pending',
        type: 'bug',
        priority: 'high',
      })

      const dataCall = (query as jest.Mock).mock.calls[0]
      expect(dataCall[0]).toContain('AND status = $1')
      expect(dataCall[0]).toContain('AND type = $2')
      expect(dataCall[0]).toContain('AND priority = $3')
      expect(dataCall[1]).toContain('pending')
      expect(dataCall[1]).toContain('bug')
      expect(dataCall[1]).toContain('high')
    })

    it('应该按created_at降序排序', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })

      await feedbackService.getAllFeedbacks()

      const dataCall = (query as jest.Mock).mock.calls[0]
      expect(dataCall[0]).toContain('ORDER BY created_at DESC')
    })

    it('应该正确计算偏移量', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '50' }] })

      await feedbackService.getAllFeedbacks({ page: 2, pageSize: 15 })

      const dataCall = (query as jest.Mock).mock.calls[0]
      // page 2, pageSize 15 -> offset = (2-1) * 15 = 15
      expect(dataCall[1]).toContain(15) // pageSize and offset are both 15
    })
  })

  describe('getFeedbackById - 根据ID获取反馈', () => {
    it('应该返回指定ID的反馈', async () => {
      const mockFeedback = {
        id: 1,
        title: '测试反馈',
        type: 'suggestion',
        status: 'pending',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockFeedback] })

      const result = await feedbackService.getFeedbackById(1)

      expect(result).toEqual(mockFeedback)
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM feedbacks WHERE id = $1',
        [1]
      )
    })

    it('应该在反馈不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await feedbackService.getFeedbackById(999)

      expect(result).toBeNull()
    })
  })

  describe('createFeedback - 创建反馈', () => {
    it('应该成功创建反馈', async () => {
      const newFeedback = {
        user_id: 'user-123',
        username: '张三',
        type: 'bug',
        category: '功能问题',
        title: '登录失败',
        content: '无法使用手机号登录',
        contact: '13800138000',
        images: 'https://example.com/screenshot.png',
        priority: 'high',
        status: 'pending' as const,
      }

      const createdFeedback = { id: 1, ...newFeedback }
      ;(query as jest.Mock).mockResolvedValue({ rows: [createdFeedback] })

      const result = await feedbackService.createFeedback(newFeedback)

      expect(result).toEqual(createdFeedback)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO feedbacks'),
        expect.arrayContaining([
          newFeedback.user_id,
          newFeedback.username,
          newFeedback.type,
          newFeedback.category,
          newFeedback.title,
          newFeedback.content,
          newFeedback.contact,
          newFeedback.images,
          newFeedback.priority,
          newFeedback.status,
        ])
      )
    })

    it('应该使用默认值', async () => {
      const minimalFeedback = {
        user_id: 'user-456',
        username: '李四',
        type: 'suggestion',
        title: '建议',
        content: '希望增加更多功能',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await feedbackService.createFeedback(minimalFeedback)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1]).toContain('normal') // 默认priority
      expect(call[1]).toContain('pending') // 默认status
    })

    it('应该支持可选字段', async () => {
      const feedbackWithOptional = {
        user_id: 'user-789',
        username: '王五',
        type: 'feature',
        title: '新功能请求',
        content: '希望支持导出功能',
        contact: 'wangwu@example.com',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await feedbackService.createFeedback(feedbackWithOptional)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1]).toContain(undefined) // category is undefined
      expect(call[1]).toContain(undefined) // images is undefined
    })

    it('应该支持不同的反馈类型', async () => {
      const types = ['bug', 'feature', 'suggestion', 'complaint', 'other']

      for (const type of types) {
        jest.clearAllMocks()
        ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

        await feedbackService.createFeedback({
          user_id: 'user-123',
          username: '测试',
          type,
          title: '测试',
          content: '测试内容',
        })

        const call = (query as jest.Mock).mock.calls[0]
        expect(call[1]).toContain(type)
      }
    })

    it('应该支持不同的优先级', async () => {
      const priorities = ['low', 'normal', 'high', 'urgent']

      for (const priority of priorities) {
        jest.clearAllMocks()
        ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

        await feedbackService.createFeedback({
          user_id: 'user-123',
          username: '测试',
          type: 'bug',
          title: '测试',
          content: '测试内容',
          priority,
        })

        const call = (query as jest.Mock).mock.calls[0]
        expect(call[1]).toContain(priority)
      }
    })
  })

  describe('updateFeedback - 更新反馈', () => {
    it('应该成功更新反馈状态', async () => {
      const updateData = {
        status: 'resolved',
        handler_id: 'admin-001',
        handler_name: '张管理员',
        handler_comment: '问题已修复',
      }

      const updatedFeedback = { id: 1, ...updateData }
      ;(query as jest.Mock).mockResolvedValue({ rows: [updatedFeedback] })

      const result = await feedbackService.updateFeedback(1, updateData)

      expect(result).toEqual(updatedFeedback)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE feedbacks'),
        [
          updateData.status,
          updateData.handler_id,
          updateData.handler_name,
          updateData.handler_comment,
          1, // id
        ]
      )
    })

    it('应该在状态为resolved或closed时设置resolved_at', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await feedbackService.updateFeedback(1, { status: 'resolved' })

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain('resolved_at = CASE WHEN $1 IN (\'resolved\', \'closed\') THEN CURRENT_TIMESTAMP ELSE resolved_at END')
    })

    it('应该更新updated_at时间戳', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await feedbackService.updateFeedback(1, { status: 'processing' })

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain('updated_at = CURRENT_TIMESTAMP')
    })

    it('应该支持可选的handler字段', async () => {
      const updateData = {
        status: 'processing',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await feedbackService.updateFeedback(1, updateData)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1][1]).toBeUndefined() // handler_id
      expect(call[1][2]).toBeUndefined() // handler_name
      expect(call[1][3]).toBeUndefined() // handler_comment
    })

    it('应该在反馈不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await feedbackService.updateFeedback(999, {
        status: 'resolved',
      })

      expect(result).toBeNull()
    })

    it('应该支持多种状态', async () => {
      const statuses = ['pending', 'processing', 'resolved', 'closed', 'rejected']

      for (const status of statuses) {
        jest.clearAllMocks()
        ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1, status }] })

        await feedbackService.updateFeedback(1, { status })

        const call = (query as jest.Mock).mock.calls[0]
        expect(call[1][0]).toBe(status)
      }
    })
  })

  describe('deleteFeedback - 删除反馈', () => {
    it('应该成功删除反馈', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 1 })

      const result = await feedbackService.deleteFeedback(1)

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM feedbacks WHERE id = $1',
        [1]
      )
    })

    it('应该在反馈不存在时返回false', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 0 })

      const result = await feedbackService.deleteFeedback(999)

      expect(result).toBe(false)
    })

    it('应该在rowCount为null时返回false', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: null })

      const result = await feedbackService.deleteFeedback(1)

      expect(result).toBe(false)
    })
  })
})
