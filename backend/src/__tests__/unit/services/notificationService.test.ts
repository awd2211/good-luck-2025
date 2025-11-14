/**
 * notificationService 单元测试
 */

import * as notificationService from '../../../services/notificationService'
import { query } from '../../../config/database'

// Mock database
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

describe('notificationService - 通知服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllNotifications - 获取所有通知', () => {
    it('应该返回分页的通知列表', async () => {
      const mockNotifications = [
        { id: 1, title: '通知1', type: 'info', priority: 1 },
        { id: 2, title: '通知2', type: 'warning', priority: 2 },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: mockNotifications })

      const result = await notificationService.getAllNotifications({
        page: 1,
        pageSize: 10,
      })

      expect(result.data).toEqual(mockNotifications)
      expect(result.total).toBe(10)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.totalPages).toBe(1)
    })

    it('应该支持按状态筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] })

      await notificationService.getAllNotifications({ status: 'active' })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        ['active']
      )
    })

    it('应该支持按类型筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [] })

      await notificationService.getAllNotifications({ type: 'warning' })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE type = $1'),
        ['warning']
      )
    })

    it('应该支持同时按状态和类型筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [] })

      await notificationService.getAllNotifications({
        status: 'active',
        type: 'error',
      })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1 AND type = $2'),
        ['active', 'error']
      )
    })

    it('应该在status和type为all时不添加筛选条件', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] })

      await notificationService.getAllNotifications({
        status: 'all',
        type: 'all',
      })

      const firstCall = (query as jest.Mock).mock.calls[0]
      expect(firstCall[0]).not.toContain('WHERE')
    })

    it('应该按优先级和创建时间降序排序', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] })

      await notificationService.getAllNotifications()

      const dataCall = (query as jest.Mock).mock.calls[1]
      expect(dataCall[0]).toContain('ORDER BY priority DESC, created_at DESC')
    })
  })

  describe('getActiveNotifications - 获取激活的通知', () => {
    it('应该只返回激活状态的通知', async () => {
      const mockNotifications = [
        { id: 1, title: '激活通知1', status: 'active' },
        { id: 2, title: '激活通知2', status: 'active' },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockNotifications })

      const result = await notificationService.getActiveNotifications('user')

      expect(result).toEqual(mockNotifications)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        ['user']
      )
    })

    it('应该过滤目标用户', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await notificationService.getActiveNotifications('admin')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("target = $1 OR target = 'all'"),
        ['admin']
      )
    })

    it('应该使用默认目标all', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await notificationService.getActiveNotifications()

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        ['all']
      )
    })

    it('应该过滤未开始的通知', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await notificationService.getActiveNotifications()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('start_date IS NULL OR start_date <= NOW()'),
        expect.any(Array)
      )
    })

    it('应该过滤已结束的通知', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await notificationService.getActiveNotifications()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('end_date IS NULL OR end_date >= NOW()'),
        expect.any(Array)
      )
    })

    it('应该按优先级和创建时间降序排序', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await notificationService.getActiveNotifications()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY priority DESC, created_at DESC'),
        expect.any(Array)
      )
    })
  })

  describe('getNotificationById - 根据ID获取通知', () => {
    it('应该返回指定ID的通知', async () => {
      const mockNotification = { id: 1, title: '测试通知', type: 'info' }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockNotification] })

      const result = await notificationService.getNotificationById(1)

      expect(result).toEqual(mockNotification)
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM notifications WHERE id = $1',
        [1]
      )
    })

    it('应该在通知不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await notificationService.getNotificationById(999)

      expect(result).toBeNull()
    })
  })

  describe('createNotification - 创建通知', () => {
    it('应该成功创建通知', async () => {
      const newNotification = {
        title: '新通知',
        content: '这是通知内容',
        type: 'info' as const,
        priority: 5,
        status: 'active' as const,
        target: 'user',
        created_by: 'admin_123',
      }

      const createdNotification = { id: 1, ...newNotification }
      ;(query as jest.Mock).mockResolvedValue({ rows: [createdNotification] })

      const result = await notificationService.createNotification(newNotification)

      expect(result).toEqual(createdNotification)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications'),
        expect.arrayContaining([
          newNotification.title,
          newNotification.content,
          newNotification.type,
          newNotification.priority,
          newNotification.status,
          newNotification.target,
        ])
      )
    })

    it('应该使用默认值创建通知', async () => {
      const minimalNotification = {
        title: '最小通知',
        content: '内容',
        type: 'info' as const,
        priority: 0,
        status: 'active' as const,
        target: 'all',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await notificationService.createNotification(minimalNotification)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1]).toContain(null) // start_date
      expect(call[1]).toContain(null) // end_date
      expect(call[1]).toContain(null) // created_by
    })

    it('应该处理开始和结束日期', async () => {
      const notificationWithDates = {
        title: '限时通知',
        content: '内容',
        type: 'warning' as const,
        priority: 1,
        status: 'active' as const,
        target: 'all',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await notificationService.createNotification(notificationWithDates)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1]).toContain(notificationWithDates.start_date)
      expect(call[1]).toContain(notificationWithDates.end_date)
    })

    it('应该处理所有通知类型', async () => {
      const types = ['info', 'warning', 'success', 'error'] as const

      for (const type of types) {
        jest.clearAllMocks()
        ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

        await notificationService.createNotification({
          title: '测试',
          content: '内容',
          type,
          priority: 0,
          status: 'active',
          target: 'all',
        })

        const call = (query as jest.Mock).mock.calls[0]
        expect(call[1]).toContain(type)
      }
    })
  })

  describe('updateNotification - 更新通知', () => {
    it('应该成功更新通知', async () => {
      const updateData = {
        title: '更新后的标题',
        priority: 10,
      }

      const updatedNotification = { id: 1, ...updateData }
      ;(query as jest.Mock).mockResolvedValue({ rows: [updatedNotification] })

      const result = await notificationService.updateNotification(1, updateData)

      expect(result).toEqual(updatedNotification)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications SET'),
        expect.arrayContaining([...Object.values(updateData), 1])
      )
    })

    it('应该过滤掉不应更新的字段', async () => {
      const updateData = {
        title: '新标题',
        id: 999, // 应该被忽略
        created_at: new Date(), // 应该被忽略
        updated_at: new Date(), // 应该被忽略
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{}] })

      await notificationService.updateNotification(1, updateData)

      const call = (query as jest.Mock).mock.calls[0]
      // 检查SET子句中没有这些字段 (不包含WHERE中的id)
      expect(call[0]).toContain('UPDATE notifications SET title = $1')
      expect(call[0]).not.toContain('created_at =')
      expect(call[0]).not.toContain('updated_at =')
      // 只有title被更新，所以参数应该是 [title, id]
      expect(call[1]).toEqual(['新标题', 1])
    })

    it('应该在没有字段更新时返回null', async () => {
      const result = await notificationService.updateNotification(1, {})

      expect(result).toBeNull()
      expect(query).not.toHaveBeenCalled()
    })

    it('应该在通知不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await notificationService.updateNotification(999, {
        title: '新标题',
      })

      expect(result).toBeNull()
    })
  })

  describe('deleteNotification - 删除通知', () => {
    it('应该成功删除通知', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 1 })

      const result = await notificationService.deleteNotification(1)

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM notifications WHERE id = $1 RETURNING id',
        [1]
      )
    })

    it('应该在通知不存在时返回false', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 0 })

      const result = await notificationService.deleteNotification(999)

      expect(result).toBe(false)
    })
  })

  describe('batchUpdateNotificationStatus - 批量更新通知状态', () => {
    it('应该成功批量更新通知状态', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 3 })

      const result = await notificationService.batchUpdateNotificationStatus(
        [1, 2, 3],
        'inactive'
      )

      expect(result).toBe(3)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications SET status = $1 WHERE id IN ($2,$3,$4)'),
        ['inactive', 1, 2, 3]
      )
    })

    it('应该能将状态设为active', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 2 })

      await notificationService.batchUpdateNotificationStatus([1, 2], 'active')

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1][0]).toBe('active')
    })

    it('应该处理单个ID', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 1 })

      const result = await notificationService.batchUpdateNotificationStatus(
        [5],
        'inactive'
      )

      expect(result).toBe(1)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id IN ($2)'),
        ['inactive', 5]
      )
    })

    it('应该处理空数组', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 0 })

      const result = await notificationService.batchUpdateNotificationStatus(
        [],
        'active'
      )

      expect(result).toBe(0)
    })

    it('应该返回0当没有行被更新', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: undefined })

      const result = await notificationService.batchUpdateNotificationStatus(
        [999],
        'active'
      )

      expect(result).toBe(0)
    })
  })
})
