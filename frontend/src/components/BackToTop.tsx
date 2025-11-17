import { useState, useEffect } from 'react'
import './BackToTop.css'

interface BackToTopProps {
  showAfter?: number // 滚动多少像素后显示
  scrollDuration?: number // 滚动动画持续时间(ms)
  position?: 'left' | 'right' // 按钮位置
  bottom?: number // 距离底部距离(px)
}

const BackToTop = ({
  showAfter = 300,
  scrollDuration = 500,
  position = 'right',
  bottom = 80,
}: BackToTopProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setIsVisible(scrollTop > showAfter)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // 初始检查

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [showAfter])

  const scrollToTop = () => {
    if (isScrolling) return

    setIsScrolling(true)
    const startPosition = window.pageYOffset
    const startTime = performance.now()

    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / scrollDuration, 1)
      const easeProgress = easeInOutCubic(progress)

      window.scrollTo(0, startPosition * (1 - easeProgress))

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      } else {
        setIsScrolling(false)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  return (
    <button
      className={`back-to-top ${isVisible ? 'visible' : ''} ${position}`}
      onClick={scrollToTop}
      disabled={isScrolling}
      style={{ bottom: `${bottom}px` }}
      aria-label="返回顶部"
    >
      <span className="back-to-top-icon">⬆️</span>
      <span className="back-to-top-text">顶部</span>
    </button>
  )
}

export default BackToTop
