/**
 * healthService 单元测试
 */

import { performHealthCheck } from '../../../services/healthService'
import pool from '../../../config/database'
import { getRedisClient } from '../../../config/redis'
import { config } from '../../../config'

// Mock database
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    totalCount: 10,
    idleCount: 5,
    waitingCount: 0,
  },
}))

// Mock redis
jest.mock('../../../config/redis', () => ({
  getRedisClient: jest.fn(),
}))

// Mock config
jest.mock('../../../config', () => ({
  config: {
    redis: {
      enabled: true,
    },
    app: {
      nodeEnv: 'test',
    },
  },
}))

describe('healthService - 健康检查服务', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    jest.clearAllMocks()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('performHealthCheck - 执行健康检查', () => {
    it('应该在所有检查通过时返回healthy状态', async () => {
      // Mock successful database check
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      // Mock successful redis check
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      const result = await performHealthCheck()

      expect(result.status).toBe('healthy')
      expect(result.checks.database.status).toBe('ok')
      expect(result.checks.redis.status).toBe('ok')
      expect(result.checks.memory.status).toMatch(/ok|warning|critical/)
      expect(result.timestamp).toBeDefined()
      expect(result.uptime).toBeGreaterThan(0)
      expect(result.environment).toBe('test')
    })

    it('应该在数据库连接失败时返回unhealthy状态', async () => {
      // Mock database error
      ;(pool.query as jest.Mock).mockRejectedValue(new Error('数据库连接失败'))

      // Mock successful redis check
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      const result = await performHealthCheck()

      expect(result.status).toBe('unhealthy')
      expect(result.checks.database.status).toBe('error')
      expect(result.checks.database.message).toContain('数据库连接失败')
      expect(result.warnings).toContainEqual(expect.stringContaining('数据库连接失败'))
    })

    it('应该在Redis未启用时返回disabled状态', async () => {
      // Mock successful database check
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      // Mock Redis disabled
      ;(config.redis.enabled as boolean) = false

      const result = await performHealthCheck()

      expect(result.checks.redis.status).toBe('disabled')
      expect(result.checks.redis.message).toBe('Redis未启用')

      // Reset config
      ;(config.redis.enabled as boolean) = true
    })

    it('应该在Redis连接失败时包含告警', async () => {
      // Mock successful database check
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      // Mock redis error
      const mockRedis = {
        ping: jest.fn().mockRejectedValue(new Error('Redis连接失败')),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      const result = await performHealthCheck()

      expect(result.checks.redis.status).toBe('error')
      expect(result.checks.redis.message).toContain('Redis连接失败')
      expect(result.warnings).toContainEqual(expect.stringContaining('Redis连接失败'))
    })

    it('应该在Redis客户端未初始化时返回error状态', async () => {
      // Mock successful database check
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      // Mock Redis client not initialized
      ;(getRedisClient as jest.Mock).mockReturnValue(null)

      const result = await performHealthCheck()

      expect(result.checks.redis.status).toBe('error')
      expect(result.checks.redis.message).toBe('Redis客户端未初始化')
    })

    it('应该返回数据库连接池信息', async () => {
      // Mock successful database check
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      // Mock successful redis check
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      const result = await performHealthCheck()

      expect(result.checks.database.connectionPool).toEqual({
        total: 10,
        idle: 5,
        waiting: 0,
      })
      expect(result.checks.database.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('应该返回内存使用信息', async () => {
      // Mock successful database check
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      // Mock successful redis check
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      const result = await performHealthCheck()

      expect(result.checks.memory).toBeDefined()
      expect(result.checks.memory.usage).toBeDefined()
      expect(result.checks.memory.usage.rss).toMatch(/MB$/)
      expect(result.checks.memory.usage.heapTotal).toMatch(/MB$/)
      expect(result.checks.memory.usage.heapUsed).toMatch(/MB$/)
      expect(result.checks.memory.usage.external).toMatch(/MB$/)
      expect(result.checks.memory.usage.percentUsed).toBeGreaterThanOrEqual(0)
    })

    it('应该在连接池使用率过高时添加告警', async () => {
      // Mock successful database check with high pool usage
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })
      ;(pool.totalCount as number) = 10
      ;(pool.idleCount as number) = 0 // 0% idle = 100% used
      ;(pool.waitingCount as number) = 2

      // Mock successful redis check
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      const result = await performHealthCheck()

      expect(result.warnings.some(w => w.includes('连接池使用率'))).toBe(true)
    })

    it('应该并行执行所有检查', async () => {
      // Mock all checks
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      const startTime = Date.now()
      await performHealthCheck()
      const elapsed = Date.now() - startTime

      // 并行执行应该很快完成（<100ms）
      expect(elapsed).toBeLessThan(100)
    })

    it('应该包含正确的时间戳格式', async () => {
      // Mock successful checks
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      const result = await performHealthCheck()

      // ISO 8601格式
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })

    it('应该返回进程运行时间', async () => {
      // Mock successful checks
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      const result = await performHealthCheck()

      expect(result.uptime).toBeGreaterThan(0)
      expect(typeof result.uptime).toBe('number')
    })

    it('应该支持includeMetrics参数', async () => {
      // Mock successful checks
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      // Mock global metrics
      ;(global as any).apiMetrics = {
        total: 100,
        averageResponseTime: 50,
        slowestEndpoint: '/api/test',
        slowestTime: 200,
      }

      const result = await performHealthCheck(true)

      expect(result.metrics).toBeDefined()
      expect(result.metrics?.total).toBe(100)
      expect(result.metrics?.averageResponseTime).toBe(50)

      // Clean up
      delete (global as any).apiMetrics
    })

    it('应该在API响应时间过慢时添加告警', async () => {
      // Mock successful checks
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      // Mock slow API metrics
      ;(global as any).apiMetrics = {
        total: 100,
        averageResponseTime: 3500, // > 3000ms (critical)
        slowestEndpoint: '/api/slow',
        slowestTime: 5000,
      }

      const result = await performHealthCheck(true)

      expect(result.status).toBe('degraded')
      expect(result.warnings.some(w => w.includes('响应时间'))).toBe(true)

      // Clean up
      delete (global as any).apiMetrics
    })

    it('应该在没有全局metrics时正常工作', async () => {
      // Mock successful checks
      ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ '?column?': 1 }] })

      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      ;(getRedisClient as jest.Mock).mockReturnValue(mockRedis)

      // Ensure no global metrics
      delete (global as any).apiMetrics

      const result = await performHealthCheck(true)

      expect(result.metrics).toBeUndefined()
      // Status can be healthy or degraded depending on memory usage
      expect(['healthy', 'degraded']).toContain(result.status)
    })
  })
})
