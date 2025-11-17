import { type ReactNode, type TouchEvent, useRef, useState } from 'react'
import './PullToRefresh.css'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  disabled?: boolean
  threshold?: number
  maxPullDistance?: number
}

const PullToRefresh = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  maxPullDistance = 120,
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullStatus, setPullStatus] = useState<'idle' | 'pulling' | 'release' | 'refreshing'>('idle')
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return

    // 只在页面顶部才能触发下拉刷新
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop > 0) return

    startY.current = e.touches[0].clientY
    setPullStatus('pulling')
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || pullStatus !== 'pulling') return

    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop > 0) {
      setPullDistance(0)
      setPullStatus('idle')
      return
    }

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0) {
      // 阻止默认滚动
      e.preventDefault()

      // 计算实际下拉距离(有阻尼效果)
      const actualDistance = Math.min(distance * 0.5, maxPullDistance)
      setPullDistance(actualDistance)

      // 更新状态
      if (actualDistance >= threshold) {
        setPullStatus('release')
      } else {
        setPullStatus('pulling')
      }
    }
  }

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return

    if (pullDistance >= threshold) {
      // 触发刷新
      setIsRefreshing(true)
      setPullStatus('refreshing')
      setPullDistance(threshold)

      try {
        await onRefresh()
      } catch (error) {
        console.error('刷新失败:', error)
      } finally {
        // 刷新完成后的动画
        setTimeout(() => {
          setPullDistance(0)
          setIsRefreshing(false)
          setPullStatus('idle')
        }, 300)
      }
    } else {
      // 未达到阈值,回弹
      setPullDistance(0)
      setPullStatus('idle')
    }
  }

  const getStatusText = () => {
    switch (pullStatus) {
      case 'pulling':
        return '下拉刷新'
      case 'release':
        return '释放更新'
      case 'refreshing':
        return '刷新中...'
      default:
        return ''
    }
  }

  const getStatusIcon = () => {
    switch (pullStatus) {
      case 'pulling':
        return '⬇️'
      case 'release':
        return '⬆️'
      case 'refreshing':
        return '🔄'
      default:
        return ''
    }
  }

  return (
    <div
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉指示器 */}
      <div
        className={`pull-indicator ${pullStatus}`}
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div className="pull-content">
          <span className={`pull-icon ${isRefreshing ? 'spinning' : ''}`}>
            {getStatusIcon()}
          </span>
          <span className="pull-text">{getStatusText()}</span>
        </div>
      </div>

      {/* 主内容 */}
      <div
        className="pull-content-wrapper"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullStatus === 'idle' ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default PullToRefresh
