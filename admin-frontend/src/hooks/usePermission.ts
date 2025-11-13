import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Permission } from '../config/permissions'
import { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, isAdmin } from '../utils/permission'

/**
 * 权限管理 Hook
 */
export const usePermission = () => {
  const { user } = useAuth()

  const checkPermission = useMemo(() => {
    return {
      /**
       * 检查是否拥有指定权限
       */
      has: (permission: Permission): boolean => {
        if (!user) return false
        return hasPermission(user.role, permission)
      },

      /**
       * 检查是否拥有任意一个权限
       */
      hasAny: (permissions: Permission[]): boolean => {
        if (!user) return false
        return hasAnyPermission(user.role, permissions)
      },

      /**
       * 检查是否拥有所有权限
       */
      hasAll: (permissions: Permission[]): boolean => {
        if (!user) return false
        return hasAllPermissions(user.role, permissions)
      },

      /**
       * 检查是否为超级管理员
       */
      isSuperAdmin: (): boolean => {
        if (!user) return false
        return isSuperAdmin(user.role)
      },

      /**
       * 检查是否为管理员
       */
      isAdmin: (): boolean => {
        if (!user) return false
        return isAdmin(user.role)
      },
    }
  }, [user])

  return checkPermission
}
