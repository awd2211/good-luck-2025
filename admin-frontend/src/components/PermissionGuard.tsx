import { ReactNode } from 'react'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'
import { Result, Button } from 'antd'
import { LockOutlined } from '@ant-design/icons'

interface PermissionGuardProps {
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
  noFallback?: boolean
  children: ReactNode
}

/**
 * 权限守卫组件
 * 根据权限控制组件是否显示
 */
const PermissionGuard = ({
  permission,
  permissions,
  requireAll = false,
  fallback,
  noFallback = false,
  children,
}: PermissionGuardProps) => {
  const checkPermission = usePermission()

  // 检查权限
  let hasAccess = false

  if (permission) {
    hasAccess = checkPermission.has(permission)
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? checkPermission.hasAll(permissions)
      : checkPermission.hasAny(permissions)
  } else {
    // 没有指定权限，默认允许访问
    hasAccess = true
  }

  // 没有权限
  if (!hasAccess) {
    if (noFallback) {
      return null
    }

    if (fallback) {
      return <>{fallback}</>
    }

    // 默认无权限提示
    return (
      <Result
        status="403"
        icon={<LockOutlined />}
        title="无访问权限"
        subTitle="抱歉，您没有权限访问此功能"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回
          </Button>
        }
      />
    )
  }

  // 有权限，显示内容
  return <>{children}</>
}

export default PermissionGuard
