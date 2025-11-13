// 审计日志服务

export interface AuditLog {
  id: string
  userId: string
  username: string
  action: string
  resource: string
  details: string
  ip: string
  userAgent?: string
  status: 'success' | 'failed'
  timestamp: string
}

// 模拟审计日志数据
let auditLogs: AuditLog[] = [
  {
    id: 'audit-001',
    userId: 'admin-001',
    username: 'admin',
    action: '登录',
    resource: '管理后台',
    details: '管理员登录系统',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0',
    status: 'success',
    timestamp: '2025-01-13 09:00:00'
  },
  {
    id: 'audit-002',
    userId: 'admin-001',
    username: 'admin',
    action: '更新',
    resource: '用户管理',
    details: '更新用户状态: user-001',
    ip: '192.168.1.100',
    status: 'success',
    timestamp: '2025-01-13 09:15:00'
  },
  {
    id: 'audit-003',
    userId: 'admin-002',
    username: 'manager',
    action: '查看',
    resource: '订单管理',
    details: '查看订单列表',
    ip: '192.168.1.101',
    status: 'success',
    timestamp: '2025-01-13 10:30:00'
  }
]

let nextAuditId = 4

/**
 * 添加审计日志
 */
export const addAuditLog = (logData: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog => {
  const newLog: AuditLog = {
    ...logData,
    id: `audit-${String(nextAuditId++).padStart(3, '0')}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
  }
  auditLogs.unshift(newLog) // 添加到开头
  return newLog
}

/**
 * 获取审计日志（支持分页和筛选）
 */
export const getAuditLogs = (params?: {
  page?: number
  pageSize?: number
  userId?: string
  action?: string
  resource?: string
  status?: string
  startDate?: string
  endDate?: string
}) => {
  let filteredLogs = [...auditLogs]

  // 用户筛选
  if (params?.userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === params.userId)
  }

  // 操作筛选
  if (params?.action) {
    filteredLogs = filteredLogs.filter(log => log.action === params.action)
  }

  // 资源筛选
  if (params?.resource) {
    filteredLogs = filteredLogs.filter(log => log.resource.includes(params.resource!))
  }

  // 状态筛选
  if (params?.status) {
    filteredLogs = filteredLogs.filter(log => log.status === params.status)
  }

  // 日期筛选
  if (params?.startDate) {
    filteredLogs = filteredLogs.filter(log => log.timestamp >= params.startDate!)
  }
  if (params?.endDate) {
    filteredLogs = filteredLogs.filter(log => log.timestamp <= params.endDate!)
  }

  // 分页
  const page = params?.page || 1
  const pageSize = params?.pageSize || 20
  const total = filteredLogs.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedLogs = filteredLogs.slice(start, end)

  return {
    data: paginatedLogs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

/**
 * 清空审计日志（保留最近N条）
 */
export const cleanAuditLogs = (keepCount: number = 1000): number => {
  const deletedCount = Math.max(0, auditLogs.length - keepCount)
  auditLogs = auditLogs.slice(0, keepCount)
  return deletedCount
}
