import { Request, Response } from 'express'
import { getAuditLogs, addAuditLog, cleanAuditLogs } from '../services/auditService'

/**
 * 获取审计日志
 */
export const getLogs = (req: Request, res: Response) => {
  try {
    const { page, pageSize, userId, action, resource, status, startDate, endDate } = req.query

    const result = getAuditLogs({
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      userId: userId as string,
      action: action as string,
      resource: resource as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string
    })

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取审计日志失败'
    })
  }
}

/**
 * 添加审计日志
 */
export const addLog = (req: Request, res: Response) => {
  try {
    const logData = req.body

    if (!logData.action || !logData.resource) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      })
    }

    // 从请求中获取用户信息和IP
    const userId = req.user?.id || 'unknown'
    const username = req.user?.username || 'unknown'
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent']

    const newLog = addAuditLog({
      userId,
      username,
      ip,
      userAgent,
      ...logData
    })

    res.status(201).json({
      success: true,
      message: '审计日志添加成功',
      data: newLog
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加审计日志失败'
    })
  }
}

/**
 * 清空审计日志
 */
export const cleanLogs = (req: Request, res: Response) => {
  try {
    const { keepCount } = req.body

    const deletedCount = cleanAuditLogs(keepCount || 1000)

    res.json({
      success: true,
      message: `已清理${deletedCount}条历史日志`,
      data: { deletedCount }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清理审计日志失败'
    })
  }
}
