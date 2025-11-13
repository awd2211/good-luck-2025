import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spin } from 'antd'

interface PrivateRouteProps {
  children: React.ReactNode
}

/**
 * 私有路由守卫组件
 * 保护需要登录才能访问的路由
 */
const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, loading } = useAuth()

  // 加载中显示加载动画
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}>
        <Spin size="large" />
      </div>
    )
  }

  // 未登录跳转到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 已登录显示页面内容
  return <>{children}</>
}

export default PrivateRoute
