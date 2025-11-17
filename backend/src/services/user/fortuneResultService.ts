import { query } from '../../config/database'
import * as emailNotifications from '../emailNotificationService'

/**
 * 算命结果接口
 */
export interface FortuneResult {
  id: string
  result_id: string
  order_id?: string
  user_id: string
  fortune_id: string
  fortune_type: string
  input_data: Record<string, any>
  result_data: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * 生成结果ID
 */
const generateResultId = (): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 9)
  return `FR${timestamp}${random}`.toUpperCase()
}

/**
 * 生成主键ID
 */
const generateId = (): string => {
  return `fortune_result_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 保存算命结果
 */
export const saveFortuneResult = async (
  userId: string,
  fortuneId: string,
  fortuneType: string,
  inputData: Record<string, any>,
  resultData: Record<string, any>,
  orderId?: string
): Promise<FortuneResult> => {
  const id = generateId()
  const resultId = generateResultId()

  console.log('saveFortuneResult 调用参数:')
  console.log('  userId:', userId)
  console.log('  fortuneId:', fortuneId)
  console.log('  fortuneType:', fortuneType)
  console.log('  orderId:', orderId)

  // 验证 fortuneId - 如果是数字字符串，查询 fortune_services 以获取对应的 code
  // 然后映射到 fortunes 表的 ID
  let finalFortuneId = fortuneId
  if (/^\d+$/.test(fortuneId)) {
    console.log(`fortuneId是数字(${fortuneId})，查询fortune_services获取code...`)
    try {
      const serviceResult = await query(
        'SELECT code FROM fortune_services WHERE id = $1',
        [parseInt(fortuneId)]
      )
      if (serviceResult.rows.length > 0) {
        const code = serviceResult.rows[0].code
        console.log(`从 fortune_services 获取code: ${code}`)

        // 映射 fortune_services.code 到 fortunes.id
        const codeToFortuneIdMap: Record<string, string> = {
          'bazi_detail': 'bazi',
          'bazi_year': 'flow-year',
          'zodiac_fortune': 'birth-animal',
          'name_detail': 'name-detail',
          'marriage_fate': 'marriage-analysis',
          'marriage_match': 'marriage',
          'wealth_fortune': 'wealth',
          'bazi_mingge': 'bazi',
          'zodiac_match': 'birth-animal',
          'star_fortune': 'birth-animal',
          'star_match': 'marriage',
          'name_match': 'name-match',
          'number_divination': 'number-divination',
          'purple_star': 'purple-star',
        }

        finalFortuneId = codeToFortuneIdMap[code] || code
        console.log(`映射code ${code} -> fortuneId ${finalFortuneId}`)
      }
    } catch (err) {
      console.error('查询 fortune_services 失败:', err)
    }
  }

  try {
    const result = await query(
      `INSERT INTO fortune_results (
        id, result_id, order_id, user_id, fortune_id, fortune_type,
        input_data, result_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [id, resultId, orderId || null, userId, finalFortuneId, fortuneType, JSON.stringify(inputData), JSON.stringify(resultData)]
    )

    console.log('✅ 数据库插入成功')

    const savedResult = {
      id: result.rows[0].id,
      result_id: result.rows[0].result_id,
      order_id: result.rows[0].order_id,
      user_id: result.rows[0].user_id,
      fortune_id: result.rows[0].fortune_id,
      fortune_type: result.rows[0].fortune_type,
      input_data: result.rows[0].input_data,
      result_data: result.rows[0].result_data,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at,
    }

    // 发送算命结果就绪邮件（异步，不阻塞结果保存）
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId])
    if (userResult.rows.length > 0 && userResult.rows[0].email) {
      const userEmail = userResult.rows[0].email

      // 获取算命服务名称
      const fortuneInfo = await query('SELECT title FROM fortunes WHERE id = $1', [finalFortuneId])
      const serviceName = fortuneInfo.rows.length > 0 ? fortuneInfo.rows[0].title : '算命服务'

      emailNotifications.sendFortuneResultReadyEmail(
        userEmail,
        serviceName,
        resultId
      )
        .then(result => {
          if (result.success) {
            console.log(`✅ 算命结果就绪邮件已发送至: ${userEmail}`)
          } else {
            console.warn(`⚠️  算命结果就绪邮件发送失败: ${result.error}`)
          }
        })
        .catch(err => {
          console.error('❌ 发送算命结果就绪邮件时出错:', err)
        })
    }

    return savedResult
  } catch (error) {
    console.error('❌ 数据库插入失败:', error)
    throw error
  }
}

/**
 * 获取单个算命结果
 */
export const getFortuneResult = async (resultId: string, userId?: string): Promise<FortuneResult | null> => {
  let sql = `SELECT * FROM fortune_results WHERE result_id = $1`
  const params: any[] = [resultId]

  // 如果提供了userId，则验证权限
  if (userId) {
    sql += ` AND user_id = $2`
    params.push(userId)
  }

  const result = await query(sql, params)

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    result_id: row.result_id,
    order_id: row.order_id,
    user_id: row.user_id,
    fortune_id: row.fortune_id,
    fortune_type: row.fortune_type,
    input_data: row.input_data,
    result_data: row.result_data,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

/**
 * 获取用户的算命结果列表
 */
export const getUserFortuneResults = async (
  userId: string,
  options: {
    page?: number
    limit?: number
    fortuneType?: string
  } = {}
) => {
  const page = options.page || 1
  const limit = options.limit || 20
  const offset = (page - 1) * limit

  // 构建查询条件
  let whereClause = 'WHERE fr.user_id = $1'
  const params: any[] = [userId]
  let paramIndex = 2

  if (options.fortuneType) {
    whereClause += ` AND fr.fortune_type = $${paramIndex}`
    params.push(options.fortuneType)
    paramIndex++
  }

  // 查询总数
  const countResult = await query(
    `SELECT COUNT(*) FROM fortune_results fr ${whereClause}`,
    params
  )
  const total = parseInt(countResult.rows[0].count)

  // 查询结果列表（关联算命服务信息）
  const dataParams = [...params, limit, offset]
  const dataResult = await query(
    `SELECT
      fr.*,
      f.title as fortune_title,
      f.subtitle as fortune_subtitle,
      f.icon as fortune_icon,
      f.bg_color as fortune_bg_color,
      f.price as fortune_price
    FROM fortune_results fr
    LEFT JOIN fortunes f ON fr.fortune_id = f.id
    ${whereClause}
    ORDER BY fr.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    dataParams
  )

  const data = dataResult.rows.map((row: any) => ({
    id: row.id,
    result_id: row.result_id,
    order_id: row.order_id,
    user_id: row.user_id,
    fortune_id: row.fortune_id,
    fortune_type: row.fortune_type,
    input_data: row.input_data,
    result_data: row.result_data,
    created_at: row.created_at,
    updated_at: row.updated_at,
    fortune_info: {
      title: row.fortune_title || '未知服务',
      subtitle: row.fortune_subtitle || '',
      icon: row.fortune_icon || '🔮',
      bg_color: row.fortune_bg_color || '#667eea',
      price: row.fortune_price ? parseFloat(row.fortune_price) : 0,
    },
  }))

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  }
}

/**
 * 删除算命结果
 */
export const deleteFortuneResult = async (resultId: string, userId: string): Promise<boolean> => {
  const result = await query(
    `DELETE FROM fortune_results WHERE result_id = $1 AND user_id = $2`,
    [resultId, userId]
  )

  return result.rowCount !== null && result.rowCount > 0
}

/**
 * 根据订单ID获取算命结果
 */
export const getFortuneResultByOrderId = async (orderId: string, userId: string): Promise<FortuneResult[]> => {
  const result = await query(
    `SELECT * FROM fortune_results WHERE order_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
    [orderId, userId]
  )

  return result.rows.map((row: any) => ({
    id: row.id,
    result_id: row.result_id,
    order_id: row.order_id,
    user_id: row.user_id,
    fortune_id: row.fortune_id,
    fortune_type: row.fortune_type,
    input_data: row.input_data,
    result_data: row.result_data,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}
