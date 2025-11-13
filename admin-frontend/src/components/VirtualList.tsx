import { useState, useRef, CSSProperties, ReactNode } from 'react'

interface VirtualListProps<T> {
  data: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => ReactNode
  overscan?: number
  className?: string
}

/**
 * 虚拟滚动列表组件
 * 只渲染可见区域的列表项，提升长列表性能
 */
function VirtualList<T>({
  data,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 计算可见区域
  const totalHeight = data.length * itemHeight
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(data.length, startIndex + visibleCount + overscan * 2)
  const visibleData = data.slice(startIndex, endIndex)

  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }

  // 样式
  const containerStyle: CSSProperties = {
    height: containerHeight,
    overflow: 'auto',
    position: 'relative',
  }

  const contentStyle: CSSProperties = {
    height: totalHeight,
    position: 'relative',
  }

  const itemsStyle: CSSProperties = {
    position: 'absolute',
    top: startIndex * itemHeight,
    left: 0,
    right: 0,
  }

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      style={containerStyle}
      onScroll={handleScroll}
    >
      <div style={contentStyle}>
        <div style={itemsStyle}>
          {visibleData.map((item, index) => {
            const actualIndex = startIndex + index
            return (
              <div
                key={actualIndex}
                style={{ height: itemHeight }}
              >
                {renderItem(item, actualIndex)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default VirtualList

/**
 * 使用示例:
 *
 * const data = Array.from({ length: 10000 }, (_, i) => ({
 *   id: i,
 *   name: `Item ${i}`,
 * }))
 *
 * <VirtualList
 *   data={data}
 *   itemHeight={50}
 *   containerHeight={600}
 *   renderItem={(item, index) => (
 *     <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
 *       {item.name}
 *     </div>
 *   )}
 * />
 */
