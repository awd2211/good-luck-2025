/**
 * 操作日志工具
 */

export enum LogAction {
  // 用户操作
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_EXPORT = 'user.export',

  // 订单操作
  ORDER_CREATE = 'order.create',
  ORDER_UPDATE = 'order.update',
  ORDER_DELETE = 'order.delete',
  ORDER_REFUND = 'order.refund',
  ORDER_EXPORT = 'order.export',

  // 算命操作
  FORTUNE_CREATE = 'fortune.create',
  FORTUNE_UPDATE = 'fortune.update',
  FORTUNE_DELETE = 'fortune.delete',

  // 系统操作
  SETTINGS_UPDATE = 'settings.update',
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  PASSWORD_CHANGE = 'auth.password_change',
}

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface AuditLog {
  id: string
  userId: string
  username: string
  action: LogAction
  level: LogLevel
  module: string
  description: string
  details?: any
  ip?: string
  userAgent?: string
  timestamp: string
}

// 操作日志中文描述
export const actionDescriptions: Record<LogAction, string> = {
  [LogAction.USER_CREATE]: '创建用户',
  [LogAction.USER_UPDATE]: '更新用户',
  [LogAction.USER_DELETE]: '删除用户',
  [LogAction.USER_EXPORT]: '导出用户',
  [LogAction.ORDER_CREATE]: '创建订单',
  [LogAction.ORDER_UPDATE]: '更新订单',
  [LogAction.ORDER_DELETE]: '删除订单',
  [LogAction.ORDER_REFUND]: '订单退款',
  [LogAction.ORDER_EXPORT]: '导出订单',
  [LogAction.FORTUNE_CREATE]: '创建算命',
  [LogAction.FORTUNE_UPDATE]: '更新算命',
  [LogAction.FORTUNE_DELETE]: '删除算命',
  [LogAction.SETTINGS_UPDATE]: '更新设置',
  [LogAction.LOGIN]: '登录系统',
  [LogAction.LOGOUT]: '退出系统',
  [LogAction.PASSWORD_CHANGE]: '修改密码',
}

/**
 * 记录操作日志
 */
export const createAuditLog = (
  action: LogAction,
  description: string,
  details?: any,
  level: LogLevel = LogLevel.INFO
): void => {
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}')

  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: user.id || 'unknown',
    username: user.username || 'unknown',
    action,
    level,
    module: action.split('.')[0],
    description,
    details,
    ip: 'N/A', // 可以通过API获取
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  }

  // 保存到本地存储（实际项目应该发送到服务器）
  saveLogToStorage(log)

  // 打印到控制台
  console.log(`[AUDIT LOG] ${log.username} - ${description}`, log)
}

/**
 * 保存日志到本地存储
 */
const saveLogToStorage = (log: AuditLog): void => {
  const logs = getLogsFromStorage()
  logs.unshift(log)

  // 只保留最近1000条日志
  const trimmedLogs = logs.slice(0, 1000)

  localStorage.setItem('audit_logs', JSON.stringify(trimmedLogs))
}

/**
 * 从本地存储获取日志
 */
export const getLogsFromStorage = (): AuditLog[] => {
  try {
    const logsStr = localStorage.getItem('audit_logs')
    return logsStr ? JSON.parse(logsStr) : []
  } catch {
    return []
  }
}

/**
 * 清空本地日志
 */
export const clearLogsFromStorage = (): void => {
  localStorage.removeItem('audit_logs')
}

/**
 * 导出日志为JSON
 */
export const exportLogsAsJSON = (): void => {
  const logs = getLogsFromStorage()
  const dataStr = JSON.stringify(logs, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`
  a.click()

  URL.revokeObjectURL(url)
}
