/**
 * 邮件发送历史服务
 */

import { query } from '../config/database'

export interface EmailSendHistory {
  id: number
  scenario_key: string
  scenario_name: string
  recipient_email: string
  subject: string
  content: string
  status: 'success' | 'failed'
  message_id: string | null
  error_message: string | null
  provider: string | null
  sent_at: string
  user_id: string | null
  metadata: Record<string, any>
}

export interface HistoryFilters {
  scenarioKey?: string
  status?: 'success' | 'failed'
  recipientEmail?: string
  startDate?: string
  endDate?: string
  provider?: string
  page?: number
  limit?: number
}

/**
 * 获取邮件发送历史列表
 */
export async function getHistoryList(filters: HistoryFilters): Promise<{
  data: EmailSendHistory[]
  total: number
  page: number
  limit: number
}> {
  const {
    scenarioKey,
    status,
    recipientEmail,
    startDate,
    endDate,
    provider,
    page = 1,
    limit = 20
  } = filters

  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  if (scenarioKey) {
    conditions.push(`scenario_key = $${paramIndex}`)
    params.push(scenarioKey)
    paramIndex++
  }

  if (status) {
    conditions.push(`status = $${paramIndex}`)
    params.push(status)
    paramIndex++
  }

  if (recipientEmail) {
    conditions.push(`recipient_email ILIKE $${paramIndex}`)
    params.push(`%${recipientEmail}%`)
    paramIndex++
  }

  if (startDate) {
    conditions.push(`sent_at >= $${paramIndex}`)
    params.push(startDate)
    paramIndex++
  }

  if (endDate) {
    conditions.push(`sent_at <= $${paramIndex}`)
    params.push(endDate)
    paramIndex++
  }

  if (provider) {
    conditions.push(`provider = $${paramIndex}`)
    params.push(provider)
    paramIndex++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total FROM email_send_history ${whereClause}`,
    params
  )
  const total = parseInt(countResult.rows[0].total)

  // 获取数据
  const offset = (page - 1) * limit
  params.push(limit, offset)

  const result = await query(
    `SELECT * FROM email_send_history
     ${whereClause}
     ORDER BY sent_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  )

  return {
    data: result.rows,
    total,
    page,
    limit
  }
}

/**
 * 获取单个邮件历史详情
 */
export async function getHistoryById(id: number): Promise<EmailSendHistory | null> {
  const result = await query(
    `SELECT * FROM email_send_history WHERE id = $1`,
    [id]
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}

/**
 * 获取统计信息
 */
export async function getHistoryStats(filters?: {
  startDate?: string
  endDate?: string
}): Promise<{
  total: number
  success: number
  failed: number
  successRate: number
  byScenario: Record<string, { total: number; success: number; failed: number }>
  byProvider: Record<string, number>
  recentFailures: Array<{
    id: number
    scenario_name: string
    recipient_email: string
    error_message: string
    sent_at: string
  }>
}> {
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  if (filters?.startDate) {
    conditions.push(`sent_at >= $${paramIndex}`)
    params.push(filters.startDate)
    paramIndex++
  }

  if (filters?.endDate) {
    conditions.push(`sent_at <= $${paramIndex}`)
    params.push(filters.endDate)
    paramIndex++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 总体统计
  const overallResult = await query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'success') as success,
       COUNT(*) FILTER (WHERE status = 'failed') as failed
     FROM email_send_history
     ${whereClause}`,
    params
  )

  const { total, success, failed } = overallResult.rows[0]
  const successRate = total > 0 ? (parseInt(success) / parseInt(total)) * 100 : 0

  // 按场景统计
  const scenarioResult = await query(
    `SELECT
       scenario_key,
       scenario_name,
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'success') as success,
       COUNT(*) FILTER (WHERE status = 'failed') as failed
     FROM email_send_history
     ${whereClause}
     GROUP BY scenario_key, scenario_name
     ORDER BY total DESC`,
    params
  )

  const byScenario: Record<string, any> = {}
  scenarioResult.rows.forEach(row => {
    byScenario[row.scenario_key] = {
      name: row.scenario_name,
      total: parseInt(row.total),
      success: parseInt(row.success),
      failed: parseInt(row.failed)
    }
  })

  // 按服务商统计
  const providerResult = await query(
    `SELECT
       provider,
       COUNT(*) as count
     FROM email_send_history
     ${whereClause}
     GROUP BY provider
     ORDER BY count DESC`,
    params
  )

  const byProvider: Record<string, number> = {}
  providerResult.rows.forEach(row => {
    byProvider[row.provider || 'unknown'] = parseInt(row.count)
  })

  // 最近失败记录
  const failuresResult = await query(
    `SELECT id, scenario_name, recipient_email, error_message, sent_at
     FROM email_send_history
     WHERE status = 'failed' ${conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''}
     ORDER BY sent_at DESC
     LIMIT 10`,
    params
  )

  return {
    total: parseInt(total),
    success: parseInt(success),
    failed: parseInt(failed),
    successRate: Math.round(successRate * 100) / 100,
    byScenario,
    byProvider,
    recentFailures: failuresResult.rows
  }
}

/**
 * 删除历史记录（清理旧数据）
 */
export async function deleteOldHistory(daysToKeep: number = 90): Promise<number> {
  const result = await query(
    `DELETE FROM email_send_history
     WHERE sent_at < NOW() - INTERVAL '${daysToKeep} days'
     RETURNING id`,
    []
  )

  return result.rowCount || 0
}
