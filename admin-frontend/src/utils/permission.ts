import { Permission, Role, rolePermissions } from '../config/permissions'

/**
 * 检查用户是否拥有指定权限
 */
export const hasPermission = (userRole: string, permission: Permission): boolean => {
  const role = userRole as Role
  const permissions = rolePermissions[role] || []
  return permissions.includes(permission)
}

/**
 * 检查用户是否拥有任意一个权限
 */
export const hasAnyPermission = (userRole: string, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * 检查用户是否拥有所有权限
 */
export const hasAllPermissions = (userRole: string, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * 获取用户的所有权限
 */
export const getUserPermissions = (userRole: string): Permission[] => {
  const role = userRole as Role
  return rolePermissions[role] || []
}

/**
 * 检查是否为超级管理员
 */
export const isSuperAdmin = (userRole: string): boolean => {
  return userRole === Role.SUPER_ADMIN
}

/**
 * 检查是否为管理员（包括超级管理员）
 */
export const isAdmin = (userRole: string): boolean => {
  return userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN
}
