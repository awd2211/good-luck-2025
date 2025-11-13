import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

interface PrefetchConfig {
  [key: string]: () => Promise<any>
}

/**
 * 数据预加载 Hook
 * 在用户可能访问的页面提前加载数据
 */
export const useDataPrefetch = (config: PrefetchConfig) => {
  const location = useLocation()
  const prefetchedRoutes = useRef<Set<string>>(new Set())

  useEffect(() => {
    // 预加载当前路由的相关路由数据
    const currentPath = location.pathname
    const relatedRoutes = getRelatedRoutes(currentPath)

    relatedRoutes.forEach((route) => {
      if (!prefetchedRoutes.current.has(route) && config[route]) {
        prefetchRoute(route, config[route])
        prefetchedRoutes.current.add(route)
      }
    })
  }, [location.pathname, config])
}

/**
 * 获取相关路由
 * 根据当前路由预测用户可能访问的路由
 */
const getRelatedRoutes = (currentPath: string): string[] => {
  const routeRelations: Record<string, string[]> = {
    '/': ['/users', '/orders', '/statistics'],
    '/users': ['/orders', '/roles'],
    '/orders': ['/users', '/fortunes'],
    '/statistics': ['/users', '/orders'],
    '/fortunes': ['/orders'],
    '/roles': ['/users'],
    '/audit-log': ['/users', '/roles'],
    '/settings': [],
  }

  return routeRelations[currentPath] || []
}

/**
 * 预加载路由数据
 */
const prefetchRoute = async (route: string, fetcher: () => Promise<any>) => {
  try {
    const data = await fetcher()
    // 缓存数据到 sessionStorage
    sessionStorage.setItem(`prefetch_${route}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }))
    console.log(`[Prefetch] Successfully prefetched data for ${route}`)
  } catch (error) {
    console.error(`[Prefetch] Failed to prefetch data for ${route}:`, error)
  }
}

/**
 * 获取预加载的数据
 */
export const getPrefetchedData = <T = any>(route: string): T | null => {
  try {
    const cached = sessionStorage.getItem(`prefetch_${route}`)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)

    // 检查数据是否过期（5分钟）
    const isExpired = Date.now() - timestamp > 5 * 60 * 1000

    if (isExpired) {
      sessionStorage.removeItem(`prefetch_${route}`)
      return null
    }

    return data
  } catch {
    return null
  }
}

/**
 * 清除预加载数据
 */
export const clearPrefetchedData = (route?: string) => {
  if (route) {
    sessionStorage.removeItem(`prefetch_${route}`)
  } else {
    // 清除所有预加载数据
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('prefetch_')) {
        sessionStorage.removeItem(key)
      }
    })
  }
}

/**
 * 链接预加载 Hook
 * 在鼠标悬停在链接上时预加载数据
 */
export const useLinkPrefetch = () => {
  const handleMouseEnter = (route: string, fetcher: () => Promise<any>) => {
    // 延迟一点时间，避免误触
    const timer = setTimeout(() => {
      prefetchRoute(route, fetcher)
    }, 100)

    return () => clearTimeout(timer)
  }

  return { handleMouseEnter }
}

/**
 * 资源预加载工具
 */
export class ResourcePrefetcher {
  private static preloadedResources = new Set<string>()

  /**
   * 预加载脚本
   */
  static preloadScript(url: string) {
    if (this.preloadedResources.has(url)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'script'
    link.href = url
    document.head.appendChild(link)

    this.preloadedResources.add(url)
  }

  /**
   * 预加载样式
   */
  static preloadStyle(url: string) {
    if (this.preloadedResources.has(url)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = url
    document.head.appendChild(link)

    this.preloadedResources.add(url)
  }

  /**
   * 预加载图片
   */
  static preloadImage(url: string): Promise<void> {
    if (this.preloadedResources.has(url)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.preloadedResources.add(url)
        resolve()
      }
      img.onerror = reject
      img.src = url
    })
  }

  /**
   * 预加载字体
   */
  static preloadFont(url: string) {
    if (this.preloadedResources.has(url)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.href = url
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)

    this.preloadedResources.add(url)
  }

  /**
   * DNS预解析
   */
  static dnsPrefetch(domain: string) {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    document.head.appendChild(link)
  }

  /**
   * 预连接
   */
  static preconnect(domain: string) {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = domain
    document.head.appendChild(link)
  }
}

/**
 * 使用示例:
 *
 * // 1. 在App组件中配置预加载
 * const prefetchConfig = {
 *   '/users': () => fetch('/api/users').then(r => r.json()),
 *   '/orders': () => fetch('/api/orders').then(r => r.json()),
 * }
 *
 * useDataPrefetch(prefetchConfig)
 *
 * // 2. 在组件中获取预加载数据
 * const cachedData = getPrefetchedData('/users')
 * if (cachedData) {
 *   setData(cachedData)
 * } else {
 *   // 正常加载数据
 *   fetchData()
 * }
 *
 * // 3. 链接预加载
 * const { handleMouseEnter } = useLinkPrefetch()
 *
 * <Link
 *   to="/users"
 *   onMouseEnter={() => handleMouseEnter('/users', fetchUsers)}
 * >
 *   用户管理
 * </Link>
 *
 * // 4. 资源预加载
 * ResourcePrefetcher.preloadImage('/images/banner.jpg')
 * ResourcePrefetcher.dnsPrefetch('https://api.example.com')
 */
