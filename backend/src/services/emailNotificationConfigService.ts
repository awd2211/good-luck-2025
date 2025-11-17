/**
 * 邮件通知配置服务
 * 管理邮件通知的启用/禁用和配置参数
 */

import { query } from '../config/database'

export interface EmailNotificationConfig {
  id: number
  scenario_key: string
  scenario_name: string
  scenario_category: string
  is_enabled: boolean
  config_data: Record<string, any>
  description?: string
  created_at: string
  updated_at: string
}

/**
 * 获取所有邮件通知配置
 */
export async function getAllConfigs(category?: string): Promise<EmailNotificationConfig[]> {
  let sql = `
    SELECT * FROM email_notification_configs
  `
  const params: any[] = []

  if (category) {
    sql += ` WHERE scenario_category = $1`
    params.push(category)
  }

  sql += ` ORDER BY scenario_category, id`

  const result = await query(sql, params)
  return result.rows
}

/**
 * 获取单个配置
 */
export async function getConfigByKey(scenarioKey: string): Promise<EmailNotificationConfig | null> {
  const result = await query(
    `SELECT * FROM email_notification_configs WHERE scenario_key = $1`,
    [scenarioKey]
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}

/**
 * 检查场景是否启用
 */
export async function isScenarioEnabled(scenarioKey: string): Promise<boolean> {
  const result = await query(
    `SELECT is_enabled FROM email_notification_configs WHERE scenario_key = $1`,
    [scenarioKey]
  )

  if (result.rows.length === 0) {
    // 如果配置不存在，默认启用
    return true
  }

  return result.rows[0].is_enabled
}

/**
 * 更新配置
 */
export async function updateConfig(
  scenarioKey: string,
  updates: {
    is_enabled?: boolean
    config_data?: Record<string, any>
    scenario_name?: string
    description?: string
  }
): Promise<EmailNotificationConfig> {
  const fields: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.is_enabled !== undefined) {
    fields.push(`is_enabled = $${paramIndex}`)
    values.push(updates.is_enabled)
    paramIndex++
  }

  if (updates.config_data !== undefined) {
    fields.push(`config_data = $${paramIndex}`)
    values.push(JSON.stringify(updates.config_data))
    paramIndex++
  }

  if (updates.scenario_name !== undefined) {
    fields.push(`scenario_name = $${paramIndex}`)
    values.push(updates.scenario_name)
    paramIndex++
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex}`)
    values.push(updates.description)
    paramIndex++
  }

  if (fields.length === 0) {
    throw new Error('没有要更新的字段')
  }

  values.push(scenarioKey)

  const sql = `
    UPDATE email_notification_configs
    SET ${fields.join(', ')}
    WHERE scenario_key = $${paramIndex}
    RETURNING *
  `

  const result = await query(sql, values)

  if (result.rows.length === 0) {
    throw new Error('配置不存在')
  }

  return result.rows[0]
}

/**
 * 批量更新启用状态
 */
export async function batchUpdateEnabled(
  scenarioKeys: string[],
  isEnabled: boolean
): Promise<number> {
  const result = await query(
    `UPDATE email_notification_configs
     SET is_enabled = $1
     WHERE scenario_key = ANY($2::varchar[])`,
    [isEnabled, scenarioKeys]
  )

  return result.rowCount || 0
}

/**
 * 获取所有定时任务配置
 */
export async function getScheduledTaskConfigs(): Promise<EmailNotificationConfig[]> {
  const result = await query(
    `SELECT * FROM email_notification_configs
     WHERE scenario_category = 'scheduled' AND is_enabled = true
     ORDER BY id`,
    []
  )

  return result.rows
}

/**
 * 获取配置统计
 */
export async function getConfigStats() {
  const result = await query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE is_enabled = true) as enabled,
       COUNT(*) FILTER (WHERE is_enabled = false) as disabled,
       COUNT(*) FILTER (WHERE scenario_category = 'authentication') as auth_count,
       COUNT(*) FILTER (WHERE scenario_category = 'order') as order_count,
       COUNT(*) FILTER (WHERE scenario_category = 'fortune') as fortune_count,
       COUNT(*) FILTER (WHERE scenario_category = 'coupon') as coupon_count,
       COUNT(*) FILTER (WHERE scenario_category = 'scheduled') as scheduled_count
     FROM email_notification_configs`,
    []
  )

  return result.rows[0]
}

/**
 * 重置为默认配置
 */
export async function resetToDefaults(): Promise<void> {
  await query(
    `UPDATE email_notification_configs
     SET is_enabled = true,
         config_data = CASE scenario_key
           WHEN 'daily_horoscope' THEN '{"cron": "0 8 * * *", "description": "每天早上8点"}'::jsonb
           WHEN 'service_expiry_reminder' THEN '{"cron": "0 1 * * *", "days_before": 3, "description": "每天凌晨1点检查"}'::jsonb
           WHEN 'coupon_expiry_reminder' THEN '{"cron": "0 2 * * *", "days_before": 3, "description": "每天凌晨2点检查"}'::jsonb
           WHEN 'birthday_greeting' THEN '{"cron": "0 0 * * *", "description": "每天凌晨0点检查"}'::jsonb
           WHEN 'weekly_report' THEN '{"cron": "0 9 * * 1", "description": "每周一早上9点"}'::jsonb
           WHEN 'monthly_report' THEN '{"cron": "0 9 1 * *", "description": "每月1号早上9点"}'::jsonb
           ELSE '{}'::jsonb
         END`,
    []
  )
}
