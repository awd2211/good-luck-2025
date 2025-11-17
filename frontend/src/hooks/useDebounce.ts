import { useState, useEffect } from 'react'

/**
 * 防抖Hook - 延迟更新值
 * @param value 需要防抖的值
 * @param delay 延迟时间(ms),默认300ms
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 设置定时器
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 清理函数:在下次effect执行前或组件卸载时清除定时器
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 防抖搜索Hook - 专门用于搜索场景
 * @param initialValue 初始搜索值
 * @param delay 防抖延迟(ms),默认300ms
 */
export function useDebouncedSearch(initialValue: string = '', delay: number = 300) {
  const [searchValue, setSearchValue] = useState(initialValue)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedValue = useDebounce(searchValue, delay)

  // 监听原始值变化,设置搜索状态
  useEffect(() => {
    if (searchValue !== debouncedValue) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchValue, debouncedValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  const clearSearch = () => {
    setSearchValue('')
  }

  return {
    searchValue,        // 即时的搜索值(用于输入框显示)
    debouncedValue,     // 防抖后的值(用于实际搜索)
    isSearching,        // 是否正在等待防抖
    handleChange,       // 处理输入变化
    clearSearch,        // 清空搜索
    setSearchValue,     // 手动设置搜索值
  }
}
