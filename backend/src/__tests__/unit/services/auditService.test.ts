/**
 * auditService 单元测试
 */

import * as auditService from '../../../services/auditService'

describe('auditService - 审计服务', () => {
  beforeEach(() => {
    // 清空审计日志以确保测试隔离
    auditService.cleanAuditLogs(0)
  })

  describe('addAuditLog - 添加审计日志', () => {
    it('应该成功添加审计日志', () => {
      const logData = {
        userId: 'user-001',
        username: 'testuser',
        action: '创建',
        resource: '订单',
        details: '创建新订单',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        status: 'success' as const,
      }

      const result = auditService.addAuditLog(logData)

      expect(result).toMatchObject(logData)
      expect(result.id).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('应该生成唯一的ID', () => {
      const log1 = auditService.addAuditLog({
        userId: 'user-001',
        username: 'user1',
        action: '登录',
        resource: '系统',
        details: '用户登录',
        ip: '127.0.0.1',
        status: 'success',
      })

      const log2 = auditService.addAuditLog({
        userId: 'user-002',
        username: 'user2',
        action: '登录',
        resource: '系统',
        details: '用户登录',
        ip: '127.0.0.1',
        status: 'success',
      })

      expect(log1.id).not.toBe(log2.id)
    })

    it('应该生成ISO格式的时间戳', () => {
      const result = auditService.addAuditLog({
        userId: 'user-001',
        username: 'user1',
        action: '测试',
        resource: '测试',
        details: '测试',
        ip: '127.0.0.1',
        status: 'success',
      })

      // 格式应该是 YYYY-MM-DD HH:mm:ss
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('应该将新日志添加到列表开头', () => {
      auditService.addAuditLog({
        userId: 'user-001',
        username: 'user1',
        action: '第一条',
        resource: '测试',
        details: '测试',
        ip: '127.0.0.1',
        status: 'success',
      })

      auditService.addAuditLog({
        userId: 'user-002',
        username: 'user2',
        action: '第二条',
        resource: '测试',
        details: '测试',
        ip: '127.0.0.1',
        status: 'success',
      })

      const logs = auditService.getAuditLogs({ pageSize: 10 })
      expect(logs.data[0].action).toBe('第二条')
      expect(logs.data[1].action).toBe('第一条')
    })

    it('应该处理可选的userAgent字段', () => {
      const logWithoutUA = auditService.addAuditLog({
        userId: 'user-001',
        username: 'user1',
        action: '测试',
        resource: '测试',
        details: '测试',
        ip: '127.0.0.1',
        status: 'success',
      })

      expect(logWithoutUA.userAgent).toBeUndefined()

      const logWithUA = auditService.addAuditLog({
        userId: 'user-002',
        username: 'user2',
        action: '测试',
        resource: '测试',
        details: '测试',
        ip: '127.0.0.1',
        userAgent: 'Chrome/90.0',
        status: 'success',
      })

      expect(logWithUA.userAgent).toBe('Chrome/90.0')
    })

    it('应该支持failed状态', () => {
      const result = auditService.addAuditLog({
        userId: 'user-001',
        username: 'user1',
        action: '登录',
        resource: '系统',
        details: '登录失败',
        ip: '127.0.0.1',
        status: 'failed',
      })

      expect(result.status).toBe('failed')
    })
  })

  describe('getAuditLogs - 获取审计日志', () => {
    beforeEach(() => {
      // 添加测试数据
      auditService.addAuditLog({
        userId: 'user-001',
        username: 'admin',
        action: '登录',
        resource: '系统',
        details: '管理员登录',
        ip: '192.168.1.1',
        status: 'success',
      })

      auditService.addAuditLog({
        userId: 'user-002',
        username: 'manager',
        action: '查看',
        resource: '订单管理',
        details: '查看订单列表',
        ip: '192.168.1.2',
        status: 'success',
      })

      auditService.addAuditLog({
        userId: 'user-001',
        username: 'admin',
        action: '删除',
        resource: '用户管理',
        details: '删除用户',
        ip: '192.168.1.1',
        status: 'failed',
      })
    })

    it('应该返回分页的审计日志', () => {
      const result = auditService.getAuditLogs({
        page: 1,
        pageSize: 2,
      })

      expect(result.data.length).toBeLessThanOrEqual(2)
      expect(result.total).toBeGreaterThanOrEqual(3)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(2)
      expect(result.totalPages).toBeGreaterThanOrEqual(2)
    })

    it('应该使用默认分页参数', () => {
      const result = auditService.getAuditLogs()

      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('应该按userId筛选', () => {
      const result = auditService.getAuditLogs({ userId: 'user-001' })

      expect(result.total).toBe(2)
      expect(result.data.every((log) => log.userId === 'user-001')).toBe(true)
    })

    it('应该按action筛选', () => {
      const result = auditService.getAuditLogs({ action: '查看' })

      expect(result.total).toBe(1)
      expect(result.data[0].action).toBe('查看')
    })

    it('应该按resource筛选（支持部分匹配）', () => {
      const result = auditService.getAuditLogs({ resource: '管理' })

      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(
        result.data.every((log) => log.resource.includes('管理'))
      ).toBe(true)
    })

    it('应该按status筛选', () => {
      const result = auditService.getAuditLogs({ status: 'failed' })

      expect(result.total).toBe(1)
      expect(result.data[0].status).toBe('failed')
    })

    it('应该按开始日期筛选', () => {
      const now = new Date().toISOString().substring(0, 19).replace('T', ' ')

      const result = auditService.getAuditLogs({ startDate: now })

      // 所有日志的时间戳应该 >= startDate
      expect(
        result.data.every((log) => log.timestamp >= now)
      ).toBe(true)
    })

    it('应该按结束日期筛选', () => {
      const future = '2099-12-31 23:59:59'

      const result = auditService.getAuditLogs({ endDate: future })

      // 所有日志的时间戳应该 <= endDate
      expect(
        result.data.every((log) => log.timestamp <= future)
      ).toBe(true)
    })

    it('应该支持多个筛选条件组合', () => {
      const result = auditService.getAuditLogs({
        userId: 'user-001',
        status: 'success',
      })

      expect(result.total).toBe(1)
      expect(result.data[0].userId).toBe('user-001')
      expect(result.data[0].status).toBe('success')
    })

    it('应该正确计算totalPages', () => {
      // 添加更多日志以测试分页
      for (let i = 0; i < 10; i++) {
        auditService.addAuditLog({
          userId: `user-${i}`,
          username: `user${i}`,
          action: '测试',
          resource: '测试',
          details: '测试',
          ip: '127.0.0.1',
          status: 'success',
        })
      }

      const result = auditService.getAuditLogs({
        page: 1,
        pageSize: 5,
      })

      expect(result.totalPages).toBe(Math.ceil(result.total / 5))
    })

    it('应该正确处理空结果', () => {
      auditService.cleanAuditLogs(0)

      const result = auditService.getAuditLogs()

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })

    it('应该正确处理超出范围的page参数', () => {
      const result = auditService.getAuditLogs({
        page: 999,
        pageSize: 10,
      })

      expect(result.data).toEqual([])
      expect(result.page).toBe(999)
    })
  })

  describe('cleanAuditLogs - 清空审计日志', () => {
    beforeEach(() => {
      // 添加10条测试日志
      for (let i = 0; i < 10; i++) {
        auditService.addAuditLog({
          userId: `user-${i}`,
          username: `user${i}`,
          action: '测试',
          resource: '测试',
          details: `测试日志 ${i}`,
          ip: '127.0.0.1',
          status: 'success',
        })
      }
    })

    it('应该保留指定数量的最新日志', () => {
      const deletedCount = auditService.cleanAuditLogs(5)

      expect(deletedCount).toBe(5)

      const logs = auditService.getAuditLogs()
      expect(logs.total).toBe(5)
    })

    it('应该使用默认值保留1000条日志', () => {
      const deletedCount = auditService.cleanAuditLogs()

      expect(deletedCount).toBe(0) // 只有10条，不会删除
      expect(auditService.getAuditLogs().total).toBe(10)
    })

    it('应该能清空所有日志', () => {
      const deletedCount = auditService.cleanAuditLogs(0)

      expect(deletedCount).toBe(10)
      expect(auditService.getAuditLogs().total).toBe(0)
    })

    it('应该保留最新的日志', () => {
      // 最后添加的日志应该被保留
      const lastLog = auditService.addAuditLog({
        userId: 'last-user',
        username: 'last',
        action: '最后一条',
        resource: '测试',
        details: '最后一条日志',
        ip: '127.0.0.1',
        status: 'success',
      })

      auditService.cleanAuditLogs(1)

      const logs = auditService.getAuditLogs()
      expect(logs.total).toBe(1)
      expect(logs.data[0].userId).toBe('last-user')
    })

    it('应该在keepCount大于日志数量时不删除', () => {
      const deletedCount = auditService.cleanAuditLogs(100)

      expect(deletedCount).toBe(0)
      expect(auditService.getAuditLogs().total).toBe(10)
    })

    it('应该返回实际删除的数量', () => {
      const deletedCount1 = auditService.cleanAuditLogs(7)
      expect(deletedCount1).toBe(3)

      const deletedCount2 = auditService.cleanAuditLogs(5)
      expect(deletedCount2).toBe(2)

      const deletedCount3 = auditService.cleanAuditLogs(5)
      expect(deletedCount3).toBe(0) // 已经是5条了
    })
  })
})
