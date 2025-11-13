import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

interface CacheEntry {
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

/**
 * LRU缓存实现
 * - 支持TTL（过期时间）
 * - 支持maxKeys（最大条目数）
 * - LRU淘汰策略
 * - 统计信息
 */
class LRUCache {
  private cache: Map<string, CacheEntry>;
  private ttl: number;
  private maxKeys: number;
  private stats: CacheStats;

  constructor(ttl: number = 300000, maxKeys: number = 1000) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxKeys = maxKeys;
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize: maxKeys
    };

    // 定期清理过期缓存
    setInterval(() => this.cleanExpired(), 60000); // 每分钟清理一次
  }

  /**
   * 获取缓存
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();

    // 检查是否过期
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateSize();
      return null;
    }

    // 更新访问信息（LRU）
    entry.accessCount++;
    entry.lastAccess = now;

    // 移到Map的末尾（最近使用）
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.data;
  }

  /**
   * 设置缓存
   */
  set(key: string, data: any): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果超过最大数量，删除最少使用的
    if (this.cache.size >= this.maxKeys) {
      this.evictLRU();
    }

    // 添加新条目
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 0,
      lastAccess: now
    });

    this.updateSize();
  }

  /**
   * LRU淘汰策略
   */
  private evictLRU(): void {
    // Map的键是按插入顺序排列的，第一个是最旧的
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      console.log(`🗑️  缓存淘汰: ${firstKey}`);
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 清理过期缓存: ${cleanedCount} 条`);
      this.updateSize();
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.updateSize();
    console.log('🗑️  缓存已清空');
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      size: this.cache.size
    };
  }

  /**
   * 获取命中率
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total * 100).toFixed(2) as any : 0;
  }

  /**
   * 更新大小统计
   */
  private updateSize(): void {
    this.stats.size = this.cache.size;
  }
}

// 创建缓存实例
const cache = new LRUCache(config.cache.ttl, config.cache.maxKeys);

// 缓存中间件
export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 只缓存 POST 请求（算命API使用POST）
  if (req.method !== 'POST') {
    return next();
  }

  // 生成缓存键
  const key = `${req.originalUrl}_${JSON.stringify(req.body)}`;
  const cachedData = cache.get(key);

  if (cachedData) {
    // 缓存命中
    if (config.app.isDevelopment) {
      console.log(`✅ 缓存命中: ${req.originalUrl}`);
    }
    return res.json(cachedData);
  }

  // 缓存未命中
  if (config.app.isDevelopment) {
    console.log(`❌ 缓存未命中: ${req.originalUrl}`);
  }

  // 保存原始的 json 方法
  const originalJson = res.json.bind(res);

  // 重写 json 方法以缓存响应
  res.json = function (data: any) {
    // 只缓存成功的响应
    if (res.statusCode === 200) {
      cache.set(key, data);
      if (config.app.isDevelopment) {
        console.log(`💾 数据已缓存: ${req.originalUrl}`);
      }
    }
    return originalJson(data);
  };

  next();
};

/**
 * 获取缓存统计信息的路由处理器
 */
export const getCacheStats = (req: Request, res: Response) => {
  const stats = cache.getStats();
  const hitRate = cache.getHitRate();

  res.json({
    ...stats,
    hitRate: `${hitRate}%`,
    ttl: `${config.cache.ttl / 1000}秒`
  });
};

/**
 * 清空缓存的路由处理器
 */
export const clearCache = (req: Request, res: Response) => {
  cache.clear();
  res.json({
    success: true,
    message: '缓存已清空'
  });
};

export default cache;
