import Redis from 'ioredis'
import { config } from './index'

let redisClient: Redis | null = null

/**
 * 获取Redis客户端实例
 */
export const getRedisClient = (): Redis | null => {
  if (!config.redis.enabled) {
    console.log('📦 Redis未启用')
    return null
  }

  if (!redisClient) {
    try {
      redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        maxRetriesPerRequest: 3,
      })

      redisClient.on('connect', () => {
        console.log('✅ Redis连接成功')
      })

      redisClient.on('error', (err) => {
        console.error('❌ Redis连接错误:', err.message)
      })

      redisClient.on('close', () => {
        console.log('⚠️  Redis连接已关闭')
      })
    } catch (error) {
      console.error('❌ Redis初始化失败:', error)
      return null
    }
  }

  return redisClient
}

/**
 * 关闭Redis连接
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    console.log('✅ Redis连接已关闭')
  }
}

/**
 * Redis缓存辅助函数
 */
export class RedisCache {
  private client: Redis | null

  constructor() {
    this.client = getRedisClient()
  }

  /**
   * 设置缓存
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.client) return false

    try {
      const serialized = JSON.stringify(value)
      if (ttl) {
        await this.client.setex(key, ttl, serialized)
      } else {
        await this.client.set(key, serialized)
      }
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null

    try {
      const data = await this.client.get(key)
      if (!data) return null
      return JSON.parse(data) as T
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<boolean> {
    if (!this.client) return false

    try {
      await this.client.del(key)
      return true
    } catch (error) {
      console.error('Redis del error:', error)
      return false
    }
  }

  /**
   * 批量删除缓存（模糊匹配）
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.client) return 0

    try {
      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0

      await this.client.del(...keys)
      return keys.length
    } catch (error) {
      console.error('Redis delPattern error:', error)
      return 0
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) return false

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis exists error:', error)
      return false
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client) return false

    try {
      await this.client.expire(key, ttl)
      return true
    } catch (error) {
      console.error('Redis expire error:', error)
      return false
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    if (!this.client) return -1

    try {
      return await this.client.ttl(key)
    } catch (error) {
      console.error('Redis ttl error:', error)
      return -1
    }
  }

  /**
   * 批量设置
   */
  async mset(data: Record<string, any>, ttl?: number): Promise<boolean> {
    if (!this.client) return false

    try {
      const pipeline = this.client.pipeline()

      for (const [key, value] of Object.entries(data)) {
        const serialized = JSON.stringify(value)
        if (ttl) {
          pipeline.setex(key, ttl, serialized)
        } else {
          pipeline.set(key, serialized)
        }
      }

      await pipeline.exec()
      return true
    } catch (error) {
      console.error('Redis mset error:', error)
      return false
    }
  }

  /**
   * 批量获取
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.client) return keys.map(() => null)

    try {
      const values = await this.client.mget(...keys)
      return values.map(v => v ? JSON.parse(v) as T : null)
    } catch (error) {
      console.error('Redis mget error:', error)
      return keys.map(() => null)
    }
  }

  /**
   * 增加计数
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    if (!this.client) return 0

    try {
      return await this.client.incrby(key, increment)
    } catch (error) {
      console.error('Redis incr error:', error)
      return 0
    }
  }

  /**
   * 减少计数
   */
  async decr(key: string, decrement: number = 1): Promise<number> {
    if (!this.client) return 0

    try {
      return await this.client.decrby(key, decrement)
    } catch (error) {
      console.error('Redis decr error:', error)
      return 0
    }
  }
}

// 导出单例实例
export const redisCache = new RedisCache()
