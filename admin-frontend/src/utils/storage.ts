/**
 * 安全的 localStorage 封装
 * 解决 Safari 隐私模式、存储空间满等问题
 */

interface StorageAPI {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

class SafeStorage implements StorageAPI {
  private storage: Storage | null = null
  private fallbackData: Map<string, string> = new Map()

  constructor(storageType: 'local' | 'session' = 'local') {
    try {
      const testKey = '__storage_test__'
      const testStorage = storageType === 'local' ? window.localStorage : window.sessionStorage

      // 测试是否可以写入
      testStorage.setItem(testKey, 'test')
      testStorage.removeItem(testKey)

      this.storage = testStorage
    } catch (e) {
      console.warn(`${storageType}Storage不可用，使用内存存储作为降级方案:`, e)
      this.storage = null
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.storage) {
        return this.storage.getItem(key)
      }
      return this.fallbackData.get(key) || null
    } catch (e) {
      console.error(`获取存储项失败 [${key}]:`, e)
      return this.fallbackData.get(key) || null
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (this.storage) {
        this.storage.setItem(key, value)
      }
      // 同时保存到fallback，以防storage失效
      this.fallbackData.set(key, value)
    } catch (e) {
      console.error(`设置存储项失败 [${key}]:`, e)
      // 如果是存储空间满了
      if (e instanceof DOMException && (
        e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        console.warn('存储空间已满，尝试清理旧数据...')
        this.clearOldData()
        try {
          // 重试一次
          if (this.storage) {
            this.storage.setItem(key, value)
          }
        } catch (retryError) {
          console.error('清理后仍然无法存储:', retryError)
        }
      }
      // 无论如何都保存到内存
      this.fallbackData.set(key, value)
    }
  }

  removeItem(key: string): void {
    try {
      if (this.storage) {
        this.storage.removeItem(key)
      }
      this.fallbackData.delete(key)
    } catch (e) {
      console.error(`删除存储项失败 [${key}]:`, e)
      this.fallbackData.delete(key)
    }
  }

  clear(): void {
    try {
      if (this.storage) {
        this.storage.clear()
      }
      this.fallbackData.clear()
    } catch (e) {
      console.error('清空存储失败:', e)
      this.fallbackData.clear()
    }
  }

  /**
   * 清理旧数据（简单实现：清理所有数据）
   * 更复杂的实现可以基于时间戳或使用频率
   */
  private clearOldData(): void {
    try {
      if (this.storage) {
        // 保留重要的键
        const keysToKeep = ['token', 'user', 'admin_token', 'admin_user']
        const dataToKeep: { [key: string]: string } = {}

        keysToKeep.forEach(key => {
          const value = this.storage!.getItem(key)
          if (value) {
            dataToKeep[key] = value
          }
        })

        // 清空
        this.storage.clear()

        // 恢复重要数据
        Object.entries(dataToKeep).forEach(([key, value]) => {
          this.storage!.setItem(key, value)
        })
      }
    } catch (e) {
      console.error('清理旧数据失败:', e)
    }
  }
}

// 导出单例实例
export const safeLocalStorage = new SafeStorage('local')
export const safeSessionStorage = new SafeStorage('session')

// 便捷方法
export const storage = {
  get(key: string): string | null {
    return safeLocalStorage.getItem(key)
  },

  set(key: string, value: string): void {
    safeLocalStorage.setItem(key, value)
  },

  remove(key: string): void {
    safeLocalStorage.removeItem(key)
  },

  clear(): void {
    safeLocalStorage.clear()
  },

  // JSON 便捷方法
  getJSON<T = any>(key: string): T | null {
    const value = safeLocalStorage.getItem(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch (e) {
      console.error(`解析JSON失败 [${key}]:`, e)
      return null
    }
  },

  setJSON(key: string, value: any): void {
    try {
      const jsonString = JSON.stringify(value)
      safeLocalStorage.setItem(key, jsonString)
    } catch (e) {
      console.error(`序列化JSON失败 [${key}]:`, e)
    }
  }
}

export default storage
