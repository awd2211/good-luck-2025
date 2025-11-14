/**
 * notificationScheduler 单元测试
 */

import * as scheduler from '../../../services/notificationScheduler'
import pool from '../../../config/database'
import * as cron from 'node-cron'

// Mock dependencies
jest.mock('../../../config/database')
jest.mock('node-cron')

describe('notificationScheduler - 通知调度器', () => {
  const mockQuery = pool.query as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    ;(console.log as jest.Mock).mockRestore()
    ;(console.error as jest.Mock).mockRestore()
  })

  describe('runSchedulerOnce - 手动执行调度', () => {
    it('应该处理没有待发送通知的情况', async () => {
      mockQuery.mockResolvedValue({ rows: [] })

      await scheduler.runSchedulerOnce()

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      )
    })

    it('应该成功发送定时通知给所有用户', async () => {
      const mockNotification = {
        id: 1,
        title: '系统通知',
        content: '测试内容',
        type: 'system',
        priority: 'normal',
        target: 'all',
      }

      const mockUsers = [{ id: 'user1' }, { id: 'user2' }, { id: 'user3' }]

      mockQuery
        .mockResolvedValueOnce({ rows: [mockNotification] }) // 查询待发送通知
        .mockResolvedValueOnce({ rows: mockUsers }) // 查询目标用户
        .mockResolvedValueOnce({ rows: [] }) // 更新通知发送状态
        .mockResolvedValueOnce({ rows: [] }) // 记录发送日志

      await scheduler.runSchedulerOnce()

      // 验证更新通知状态
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        [3, 1]
      )

      // 验证记录发送日志
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_send_logs'),
        [1, 'all', 3]
      )

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('发现 1 条待发送的定时通知')
      )
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('定时通知已发送')
      )
    })

    it('应该成功发送通知给VIP用户', async () => {
      const mockNotification = {
        id: 2,
        title: 'VIP专属通知',
        content: 'VIP内容',
        type: 'promotion',
        priority: 'high',
        target: 'vip',
      }

      const mockVipUsers = [{ id: 'vip1' }, { id: 'vip2' }]

      mockQuery
        .mockResolvedValueOnce({ rows: [mockNotification] })
        .mockResolvedValueOnce({ rows: mockVipUsers }) // VIP用户查询
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      await scheduler.runSchedulerOnce()

      // 验证VIP用户查询
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('is_vip = TRUE'),
        ['active']
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        [2, 2]
      )
    })

    it('应该成功发送通知给新用户', async () => {
      const mockNotification = {
        id: 3,
        title: '新用户欢迎',
        content: '欢迎内容',
        type: 'welcome',
        priority: 'normal',
        target: 'new',
      }

      const mockNewUsers = [{ id: 'new1' }]

      mockQuery
        .mockResolvedValueOnce({ rows: [mockNotification] })
        .mockResolvedValueOnce({ rows: mockNewUsers }) // 新用户查询
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })

      await scheduler.runSchedulerOnce()

      // 验证新用户查询
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '7 days'"),
        ['active']
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        [1, 3]
      )
    })

    it('应该处理多个待发送通知', async () => {
      const mockNotifications = [
        { id: 1, title: '通知1', target: 'all' },
        { id: 2, title: '通知2', target: 'vip' },
      ]

      const mockUsers = [{ id: 'user1' }]

      mockQuery
        .mockResolvedValueOnce({ rows: mockNotifications }) // 查询通知
        .mockResolvedValueOnce({ rows: mockUsers }) // 第1个通知的用户
        .mockResolvedValueOnce({ rows: [] }) // 更新第1个通知
        .mockResolvedValueOnce({ rows: [] }) // 记录第1个日志
        .mockResolvedValueOnce({ rows: mockUsers }) // 第2个通知的用户
        .mockResolvedValueOnce({ rows: [] }) // 更新第2个通知
        .mockResolvedValueOnce({ rows: [] }) // 记录第2个日志

      await scheduler.runSchedulerOnce()

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('发现 2 条待发送的定时通知')
      )
    })

    it('应该在发送单个通知失败时记录错误日志', async () => {
      const mockNotification = {
        id: 1,
        title: '通知',
        target: 'all',
      }

      mockQuery
        .mockResolvedValueOnce({ rows: [mockNotification] })
        .mockRejectedValueOnce(new Error('数据库错误'))
        .mockResolvedValueOnce({ rows: [] }) // 错误日志记录

      await scheduler.runSchedulerOnce()

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('发送定时通知失败'),
        expect.any(Error)
      )

      // 验证记录失败日志
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_send_logs'),
        [1, 'all', '数据库错误']
      )
    })

    it('应该在查询通知失败时捕获错误', async () => {
      mockQuery.mockRejectedValueOnce(new Error('查询失败'))

      await scheduler.runSchedulerOnce()

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('处理定时通知时出错'),
        expect.any(Error)
      )
    })
  })

  describe('startNotificationScheduler - 启动调度器', () => {
    it('应该成功启动调度器', () => {
      const mockTask = {
        stop: jest.fn(),
      }

      ;(cron.schedule as jest.Mock).mockReturnValue(mockTask)

      const task = scheduler.startNotificationScheduler()

      expect(cron.schedule).toHaveBeenCalledWith(
        '* * * * *', // 每分钟
        expect.any(Function)
      )

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('启动通知定时发送调度器')
      )
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('通知调度器已启动')
      )

      expect(task).toBe(mockTask)
    })
  })

  describe('stopNotificationScheduler - 停止调度器', () => {
    it('应该成功停止调度器', () => {
      const mockTask = {
        stop: jest.fn(),
      } as any

      scheduler.stopNotificationScheduler(mockTask)

      expect(mockTask.stop).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('通知调度器已停止')
      )
    })
  })
})
