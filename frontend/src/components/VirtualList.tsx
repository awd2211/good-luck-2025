import { type ReactNode, useRef, useState, useCallback } from 'react'
import './VirtualList.css'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  onEndReached?: () => void
  endReachedThreshold?: number
}

function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  className = '',
  onEndReached,
  endReachedThreshold = 100,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  // 计算可见范围
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2)

  // 总高度
  const totalHeight = items.length * itemHeight

  // 可见项目
  const visibleItems = items.slice(startIndex, endIndex)

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    setScrollTop(target.scrollTop)

    // 检测是否接近底部
    if (onEndReached) {
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
      if (scrollBottom < endReachedThreshold) {
        onEndReached()
      }
    }
  }, [onEndReached, endReachedThreshold])

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div
        className="virtual-list-content"
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index
          return (
            <div
              key={actualIndex}
              className="virtual-list-item"
              style={{
                position: 'absolute',
                top: actualIndex * itemHeight,
                height: itemHeight,
                width: '100%',
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VirtualList
