import { useState, useEffect, useRef, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface UseCacheOptions {
  staleTime?: number // 数据过期时间(ms),默认5分钟
  cacheKey: string   // 缓存键
}

// 全局缓存存储
const globalCache = new Map<string, CacheEntry<any>>()

/**
 * 轻量级缓存Hook
 * 用于缓存API请求结果,减少重复请求
 */
export function useCache<T>(
  fetchFn: () => Promise<T>,
  options: UseCacheOptions
) {
  const { staleTime = 5 * 60 * 1000, cacheKey } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)

  // 检查缓存是否有效
  const isCacheValid = useCallback((entry: CacheEntry<T> | undefined): boolean => {
    if (!entry) return false
    const age = Date.now() - entry.timestamp
    return age < staleTime
  }, [staleTime])

  // 从缓存获取数据
  const getCachedData = useCallback((): T | null => {
    const cached = globalCache.get(cacheKey) as CacheEntry<T> | undefined
    if (cached && isCacheValid(cached)) {
      return cached.data
    }
    return null
  }, [cacheKey, isCacheValid])

  // 设置缓存
  const setCachedData = useCallback((newData: T) => {
    globalCache.set(cacheKey, {
      data: newData,
      timestamp: Date.now(),
    })
  }, [cacheKey])

  // 执行请求
  const executeFetch = useCallback(async (force = false) => {
    // 检查缓存
    if (!force) {
      const cached = getCachedData()
      if (cached) {
        setData(cached)
        return cached
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchFn()

      if (isMountedRef.current) {
        setData(result)
        setCachedData(result)
      }

      return result
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        throw error
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [fetchFn, getCachedData, setCachedData])

  // 初始加载
  useEffect(() => {
    isMountedRef.current = true
    executeFetch()

    return () => {
      isMountedRef.current = false
    }
  }, [cacheKey]) // 只在cacheKey变化时重新加载

  // 刷新数据
  const refresh = useCallback(() => {
    return executeFetch(true)
  }, [executeFetch])

  // 清除缓存
  const clearCache = useCallback(() => {
    globalCache.delete(cacheKey)
  }, [cacheKey])

  return {
    data,
    isLoading,
    error,
    refresh,
    clearCache,
  }
}

/**
 * 清除所有缓存
 */
export function clearAllCache() {
  globalCache.clear()
}

/**
 * 清除匹配前缀的缓存
 */
export function clearCacheByPrefix(prefix: string) {
  const keys = Array.from(globalCache.keys())
  keys.forEach(key => {
    if (key.startsWith(prefix)) {
      globalCache.delete(key)
    }
  })
}

/**
 * 预加载数据到缓存
 */
export function prefetchData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return fetchFn().then(data => {
    globalCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    })
    return data
  })
}
