import { type ReactNode, type TouchEvent, type MouseEvent as ReactMouseEvent, useRef, useState } from 'react'
import './SwipeableListItem.css'

interface SwipeableListItemProps {
  children: ReactNode
  onDelete?: () => void | Promise<void>
  deleteText?: string
  deleteColor?: string
  threshold?: number
  disabled?: boolean
}

const SwipeableListItem = ({
  children,
  onDelete,
  deleteText = '删除',
  deleteColor = '#ff4d4f',
  threshold = 80,
  disabled = false,
}: SwipeableListItemProps) => {
  const [translateX, setTranslateX] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isDeleting) return
    startX.current = e.touches[0].clientX
    currentX.current = translateX
    isDragging.current = true
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || disabled || isDeleting) return

    const touch = e.touches[0]
    const diff = touch.clientX - startX.current
    const newTranslate = currentX.current + diff

    // 只允许向左滑动
    if (newTranslate < 0) {
      // 添加阻尼效果
      const damping = Math.abs(newTranslate) > threshold ? 0.5 : 1
      setTranslateX(Math.max(newTranslate * damping, -threshold * 1.5))
    } else {
      setTranslateX(0)
    }
  }

  const handleTouchEnd = async () => {
    if (!isDragging.current || disabled || isDeleting) return
    isDragging.current = false

    if (Math.abs(translateX) >= threshold) {
      // 达到阈值,显示删除按钮
      setTranslateX(-threshold)
    } else {
      // 未达到阈值,回弹
      setTranslateX(0)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return

    try {
      setIsDeleting(true)
      await onDelete()
    } catch (error) {
      console.error('删除失败:', error)
      setIsDeleting(false)
      setTranslateX(0)
    }
  }

  const handleClickOutside = (e: ReactMouseEvent) => {
    if (translateX !== 0 && containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setTranslateX(0)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`swipeable-list-item ${isDeleting ? 'deleting' : ''}`}
      onClick={handleClickOutside}
    >
      {/* 主内容 */}
      <div
        className="swipeable-content"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* 删除按钮区域 */}
      <div
        className="swipeable-actions"
        style={{
          right: translateX < 0 ? '0' : `-${threshold}px`,
        }}
      >
        <button
          className="delete-button"
          style={{ backgroundColor: deleteColor }}
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <span className="delete-spinner">🔄</span>
              删除中...
            </>
          ) : (
            <>
              <span className="delete-icon">🗑️</span>
              {deleteText}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default SwipeableListItem
