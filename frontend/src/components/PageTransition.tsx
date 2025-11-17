import { type ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './PageTransition.css'

interface PageTransitionProps {
  children: ReactNode
  mode?: 'fade' | 'slide' | 'scale' | 'none'
  duration?: number
}

const PageTransition = ({
  children,
  mode = 'fade',
  duration = 300,
}: PageTransitionProps) => {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter')

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // 路由变化,开始退出动画
      setTransitionStage('exit')
    }
  }, [location, displayLocation])

  useEffect(() => {
    if (transitionStage === 'exit') {
      // 退出动画完成后,更新内容并开始进入动画
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('enter')
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [transitionStage, location, duration])

  if (mode === 'none') {
    return <>{children}</>
  }

  return (
    <div
      className={`page-transition ${mode} ${transitionStage}`}
      style={{
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}

export default PageTransition
