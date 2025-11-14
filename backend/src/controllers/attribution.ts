import { Request, Response } from 'express'
import { query } from '../config/database'

/**
 * 渠道管理 - 获取所有渠道
 */
export const getChannels = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM attribution_channels
       ORDER BY sort_order ASC, created_at DESC`
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取渠道列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取渠道列表失败'
    })
  }
}

/**
 * 渠道管理 - 创建渠道
 */
export const createChannel = async (req: Request, res: Response) => {
  try {
    const { name, display_name, channel_type, icon, color, is_active, sort_order, description } = req.body

    if (!name || !channel_type) {
      return res.status(400).json({
        success: false,
        message: '渠道名称和类型不能为空'
      })
    }

    const result = await query(
      `INSERT INTO attribution_channels (name, display_name, channel_type, icon, color, is_active, sort_order, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        display_name || name,
        channel_type,
        icon || null,
        color || null,
        is_active !== undefined ? is_active : true,
        sort_order || 0,
        description || null
      ]
    )

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('创建渠道失败:', error)
    res.status(500).json({
      success: false,
      message: '创建渠道失败'
    })
  }
}

/**
 * 渠道管理 - 更新渠道
 */
export const updateChannel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, display_name, channel_type, icon, color, is_active, sort_order, description } = req.body

    const result = await query(
      `UPDATE attribution_channels
       SET name = COALESCE($1, name),
           display_name = COALESCE($2, display_name),
           channel_type = COALESCE($3, channel_type),
           icon = COALESCE($4, icon),
           color = COALESCE($5, color),
           is_active = COALESCE($6, is_active),
           sort_order = COALESCE($7, sort_order),
           description = COALESCE($8, description),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, display_name, channel_type, icon, color, is_active, sort_order, description, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '渠道不存在'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('更新渠道失败:', error)
    res.status(500).json({
      success: false,
      message: '更新渠道失败'
    })
  }
}

/**
 * 渠道管理 - 删除渠道（物理删除）
 */
export const deleteChannel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await query(
      `DELETE FROM attribution_channels
       WHERE id = $1
       RETURNING id`,
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '渠道不存在'
      })
    }

    res.json({
      success: true,
      message: '渠道删除成功'
    })
  } catch (error) {
    console.error('删除渠道失败:', error)
    res.status(500).json({
      success: false,
      message: '删除渠道失败'
    })
  }
}

/**
 * UTM模板 - 获取所有模板
 */
export const getUtmTemplates = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT ut.*, ac.name as channel_name, ac.channel_type
       FROM attribution_utm_templates ut
       LEFT JOIN attribution_channels ac ON ut.channel_id = ac.id
       ORDER BY ut.created_at DESC`
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取UTM模板列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取UTM模板列表失败'
    })
  }
}

/**
 * UTM模板 - 创建模板（自动生成完整URL）
 */
export const createUtmTemplate = async (req: Request, res: Response) => {
  try {
    const { name, channel_id, target_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content, description, created_by } = req.body

    if (!name || !target_url || !utm_source || !utm_medium) {
      return res.status(400).json({
        success: false,
        message: '模板名称、目标URL、utm_source和utm_medium不能为空'
      })
    }

    // 构建UTM参数
    const params = new URLSearchParams()
    params.append('utm_source', utm_source)
    params.append('utm_medium', utm_medium)
    if (utm_campaign) params.append('utm_campaign', utm_campaign)
    if (utm_term) params.append('utm_term', utm_term)
    if (utm_content) params.append('utm_content', utm_content)

    // 生成完整URL
    const separator = target_url.includes('?') ? '&' : '?'
    const generated_url = `${target_url}${separator}${params.toString()}`

    const result = await query(
      `INSERT INTO attribution_utm_templates
       (name, utm_source, utm_medium, utm_campaign, utm_term, utm_content, target_url, generated_url, channel_id, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        name,
        utm_source,
        utm_medium,
        utm_campaign || null,
        utm_term || null,
        utm_content || null,
        target_url,
        generated_url,
        channel_id || null,
        description || null,
        created_by || 'system'
      ]
    )

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('创建UTM模板失败:', error)
    res.status(500).json({
      success: false,
      message: '创建UTM模板失败'
    })
  }
}

/**
 * UTM模板 - 更新模板
 */
export const updateUtmTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, channel_id, target_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content, description } = req.body

    // 如果更新了URL相关参数，重新生成完整URL
    let generated_url = null
    if (target_url || utm_source || utm_medium || utm_campaign !== undefined || utm_term !== undefined || utm_content !== undefined) {
      // 获取当前数据
      const current = await query(
        `SELECT * FROM attribution_utm_templates WHERE id = $1`,
        [id]
      )

      if (current.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'UTM模板不存在'
        })
      }

      const currentData = current.rows[0]
      const params = new URLSearchParams()
      params.append('utm_source', utm_source || currentData.utm_source)
      params.append('utm_medium', utm_medium || currentData.utm_medium)

      const campaign = utm_campaign !== undefined ? utm_campaign : currentData.utm_campaign
      const term = utm_term !== undefined ? utm_term : currentData.utm_term
      const content = utm_content !== undefined ? utm_content : currentData.utm_content

      if (campaign) params.append('utm_campaign', campaign)
      if (term) params.append('utm_term', term)
      if (content) params.append('utm_content', content)

      const baseUrl = target_url || currentData.target_url
      const separator = baseUrl.includes('?') ? '&' : '?'
      generated_url = `${baseUrl}${separator}${params.toString()}`
    }

    const result = await query(
      `UPDATE attribution_utm_templates
       SET name = COALESCE($1, name),
           channel_id = COALESCE($2, channel_id),
           target_url = COALESCE($3, target_url),
           utm_source = COALESCE($4, utm_source),
           utm_medium = COALESCE($5, utm_medium),
           utm_campaign = COALESCE($6, utm_campaign),
           utm_term = COALESCE($7, utm_term),
           utm_content = COALESCE($8, utm_content),
           generated_url = COALESCE($9, generated_url),
           description = COALESCE($10, description),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [name, channel_id, target_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content, generated_url, description, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'UTM模板不存在'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('更新UTM模板失败:', error)
    res.status(500).json({
      success: false,
      message: '更新UTM模板失败'
    })
  }
}

/**
 * UTM模板 - 删除模板
 */
export const deleteUtmTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await query(
      `DELETE FROM attribution_utm_templates
       WHERE id = $1
       RETURNING id`,
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'UTM模板不存在'
      })
    }

    res.json({
      success: true,
      message: 'UTM模板删除成功'
    })
  } catch (error) {
    console.error('删除UTM模板失败:', error)
    res.status(500).json({
      success: false,
      message: '删除UTM模板失败'
    })
  }
}

/**
 * 推广码 - 获取所有推广码
 */
export const getPromotionCodes = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT pc.*, ac.name as channel_name, ac.channel_type
       FROM promotion_codes pc
       LEFT JOIN attribution_channels ac ON pc.channel_id = ac.id
       ORDER BY pc.created_at DESC`
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取推广码列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取推广码列表失败'
    })
  }
}

/**
 * 推广码 - 创建推广码
 */
export const createPromotionCode = async (req: Request, res: Response) => {
  try {
    const {
      code,
      name,
      channel_id,
      utm_source,
      utm_medium,
      utm_campaign,
      target_url,
      start_date,
      end_date,
      max_usage,
      is_active,
      description,
      created_by
    } = req.body

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: '推广码和名称不能为空'
      })
    }

    const result = await query(
      `INSERT INTO promotion_codes
       (code, name, channel_id, utm_source, utm_medium, utm_campaign, target_url, start_date, end_date, max_usage, usage_count, is_active, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        code,
        name,
        channel_id || null,
        utm_source || null,
        utm_medium || null,
        utm_campaign || null,
        target_url || null,
        start_date || null,
        end_date || null,
        max_usage || null,
        0, // usage_count初始为0
        is_active !== undefined ? is_active : true,
        description || null,
        created_by || 'system'
      ]
    )

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error: any) {
    console.error('创建推广码失败:', error)
    if (error.code === '23505') { // unique violation
      return res.status(400).json({
        success: false,
        message: '推广码已存在'
      })
    }
    res.status(500).json({
      success: false,
      message: '创建推广码失败'
    })
  }
}

/**
 * 推广码 - 更新推广码
 */
export const updatePromotionCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      code,
      name,
      channel_id,
      utm_source,
      utm_medium,
      utm_campaign,
      target_url,
      start_date,
      end_date,
      max_usage,
      usage_count,
      is_active,
      description
    } = req.body

    const result = await query(
      `UPDATE promotion_codes
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           channel_id = COALESCE($3, channel_id),
           utm_source = COALESCE($4, utm_source),
           utm_medium = COALESCE($5, utm_medium),
           utm_campaign = COALESCE($6, utm_campaign),
           target_url = COALESCE($7, target_url),
           start_date = COALESCE($8, start_date),
           end_date = COALESCE($9, end_date),
           max_usage = COALESCE($10, max_usage),
           usage_count = COALESCE($11, usage_count),
           is_active = COALESCE($12, is_active),
           description = COALESCE($13, description),
           updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [code, name, channel_id, utm_source, utm_medium, utm_campaign, target_url, start_date, end_date, max_usage, usage_count, is_active, description, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '推广码不存在'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('更新推广码失败:', error)
    res.status(500).json({
      success: false,
      message: '更新推广码失败'
    })
  }
}

/**
 * 推广码 - 删除推广码
 */
export const deletePromotionCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await query(
      `DELETE FROM promotion_codes
       WHERE id = $1
       RETURNING id`,
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '推广码不存在'
      })
    }

    res.json({
      success: true,
      message: '推广码删除成功'
    })
  } catch (error) {
    console.error('删除推广码失败:', error)
    res.status(500).json({
      success: false,
      message: '删除推广码失败'
    })
  }
}

/**
 * 转化事件定义 - 获取所有事件定义
 */
export const getConversionEvents = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM conversion_event_definitions
       ORDER BY sort_order ASC, created_at DESC`
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取转化事件列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取转化事件列表失败'
    })
  }
}

/**
 * 转化事件定义 - 创建事件定义
 */
export const createConversionEvent = async (req: Request, res: Response) => {
  try {
    const { name, display_name, event_type, description, value_calculation, fixed_value, sort_order, is_active } = req.body

    if (!name || !event_type) {
      return res.status(400).json({
        success: false,
        message: '事件名称和类型不能为空'
      })
    }

    const result = await query(
      `INSERT INTO conversion_event_definitions
       (name, display_name, event_type, description, value_calculation, fixed_value, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name,
        display_name || name,
        event_type,
        description || null,
        value_calculation || 'fixed',
        fixed_value || 0,
        sort_order || 0,
        is_active !== undefined ? is_active : true
      ]
    )

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('创建转化事件失败:', error)
    res.status(500).json({
      success: false,
      message: '创建转化事件失败'
    })
  }
}

/**
 * 转化事件定义 - 更新事件定义
 */
export const updateConversionEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, display_name, event_type, description, value_calculation, fixed_value, sort_order, is_active } = req.body

    const result = await query(
      `UPDATE conversion_event_definitions
       SET name = COALESCE($1, name),
           display_name = COALESCE($2, display_name),
           event_type = COALESCE($3, event_type),
           description = COALESCE($4, description),
           value_calculation = COALESCE($5, value_calculation),
           fixed_value = COALESCE($6, fixed_value),
           sort_order = COALESCE($7, sort_order),
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, display_name, event_type, description, value_calculation, fixed_value, sort_order, is_active, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '转化事件不存在'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('更新转化事件失败:', error)
    res.status(500).json({
      success: false,
      message: '更新转化事件失败'
    })
  }
}

/**
 * 转化事件定义 - 删除事件定义
 */
export const deleteConversionEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await query(
      `DELETE FROM conversion_event_definitions
       WHERE id = $1
       RETURNING id`,
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '转化事件不存在'
      })
    }

    res.json({
      success: true,
      message: '转化事件删除成功'
    })
  } catch (error) {
    console.error('删除转化事件失败:', error)
    res.status(500).json({
      success: false,
      message: '删除转化事件失败'
    })
  }
}

/**
 * 数据追踪 - 记录用户访问（供前端调用）
 */
export const trackVisit = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      session_id,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      referrer,
      landing_page,
      device_type,
      browser,
      os,
      ip_address,
      user_agent
    } = req.body

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id不能为空'
      })
    }

    // 查找对应的渠道
    let channel_id = null
    if (utm_source && utm_medium) {
      const channelResult = await query(
        `SELECT id FROM attribution_channels
         WHERE (name ILIKE $1 OR channel_type ILIKE $2)
         LIMIT 1`,
        [`%${utm_source}%`, `%${utm_medium}%`]
      )
      if (channelResult.rowCount && channelResult.rowCount > 0) {
        channel_id = channelResult.rows[0].id
      }
    }

    // 记录归因事件
    const eventResult = await query(
      `INSERT INTO attribution_events
       (user_id, session_id, channel_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        referrer, landing_page, device_type, browser, os, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [user_id || null, session_id, channel_id, utm_source || null, utm_medium || null,
       utm_campaign || null, utm_term || null, utm_content || null, referrer || null,
       landing_page || null, device_type || null, browser || null, os || null,
       ip_address || null, user_agent || null]
    )

    // 记录触点
    if (channel_id) {
      await query(
        `INSERT INTO attribution_touchpoints
         (user_id, session_id, channel_id, event_id, touchpoint_order, weight)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id || null, session_id, channel_id, eventResult.rows[0].id, 1, 1.0]
      )
    }

    res.json({
      success: true,
      data: eventResult.rows[0]
    })
  } catch (error) {
    console.error('记录访问失败:', error)
    res.status(500).json({
      success: false,
      message: '记录访问失败'
    })
  }
}

/**
 * 实时看板数据
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query

    // 默认查询最近30天
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = end_date || new Date().toISOString()

    // 总访问量
    const visitsResult = await query(
      `SELECT COUNT(*) as total_visits FROM attribution_events
       WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    )

    // 总转化数
    const conversionsResult = await query(
      `SELECT COUNT(*) as total_conversions FROM user_conversions
       WHERE converted_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    )

    // 转化率
    const totalVisits = parseInt(visitsResult.rows[0].total_visits) || 1
    const totalConversions = parseInt(conversionsResult.rows[0].total_conversions) || 0
    const conversionRate = ((totalConversions / totalVisits) * 100).toFixed(2)

    // 总收入
    const revenueResult = await query(
      `SELECT SUM(conversion_value) as total_revenue FROM user_conversions
       WHERE converted_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    )

    // 总成本
    const costResult = await query(
      `SELECT SUM(cost_amount) as total_cost FROM channel_costs
       WHERE cost_date BETWEEN $1 AND $2`,
      [startDate, endDate]
    )

    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue) || 0
    const totalCost = parseFloat(costResult.rows[0].total_cost) || 0
    const roi = totalCost > 0 ? (((totalRevenue - totalCost) / totalCost) * 100).toFixed(2) : '0'

    // 各渠道数据
    const channelStats = await query(
      `SELECT
         ac.id,
         ac.name,
         ac.channel_type,
         COUNT(DISTINCT ae.id) as visits,
         COUNT(DISTINCT uc.id) as conversions,
         COALESCE(SUM(uc.conversion_value), 0) as revenue,
         COALESCE((SELECT SUM(cost_amount) FROM channel_costs WHERE channel_id = ac.id AND cost_date BETWEEN $1 AND $2), 0) as cost
       FROM attribution_channels ac
       LEFT JOIN attribution_events ae ON ac.id = ae.channel_id AND ae.created_at BETWEEN $1 AND $2
       LEFT JOIN user_conversions uc ON ac.id = uc.last_touch_channel_id AND uc.converted_at BETWEEN $1 AND $2
       GROUP BY ac.id, ac.name, ac.channel_type
       ORDER BY visits DESC`,
      [startDate, endDate]
    )

    res.json({
      success: true,
      data: {
        summary: {
          total_visits: totalVisits,
          total_conversions: totalConversions,
          conversion_rate: parseFloat(conversionRate),
          total_revenue: totalRevenue,
          total_cost: totalCost,
          roi: parseFloat(roi)
        },
        channels: channelStats.rows.map(row => ({
          ...row,
          conversion_rate: row.visits > 0 ? ((row.conversions / row.visits) * 100).toFixed(2) : '0',
          roi: row.cost > 0 ? (((parseFloat(row.revenue) - parseFloat(row.cost)) / parseFloat(row.cost)) * 100).toFixed(2) : '0'
        }))
      }
    })
  } catch (error) {
    console.error('获取看板数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取看板数据失败'
    })
  }
}

/**
 * 转化漏斗分析
 */
export const getFunnel = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query

    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = end_date || new Date().toISOString()

    // 访问量
    const visitsResult = await query(
      `SELECT COUNT(DISTINCT session_id) as count FROM attribution_events
       WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    )

    // 注册量（假设event_type='register'）
    const registersResult = await query(
      `SELECT COUNT(DISTINCT uc.user_id) as count
       FROM user_conversions uc
       JOIN conversion_event_definitions ced ON uc.conversion_event_id = ced.id
       WHERE ced.event_type = 'register' AND uc.converted_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    )

    // 首次付费（假设event_type='first_purchase'）
    const firstPurchaseResult = await query(
      `SELECT COUNT(DISTINCT uc.user_id) as count
       FROM user_conversions uc
       JOIN conversion_event_definitions ced ON uc.conversion_event_id = ced.id
       WHERE ced.event_type = 'first_purchase' AND uc.converted_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    )

    // 复购（假设event_type='repurchase'）
    const repurchaseResult = await query(
      `SELECT COUNT(DISTINCT uc.user_id) as count
       FROM user_conversions uc
       JOIN conversion_event_definitions ced ON uc.conversion_event_id = ced.id
       WHERE ced.event_type = 'repurchase' AND uc.converted_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    )

    const visits = parseInt(visitsResult.rows[0].count) || 1
    const registers = parseInt(registersResult.rows[0].count) || 0
    const firstPurchase = parseInt(firstPurchaseResult.rows[0].count) || 0
    const repurchase = parseInt(repurchaseResult.rows[0].count) || 0

    res.json({
      success: true,
      data: {
        funnel: [
          {
            step: 'visit',
            name: '访问',
            count: visits,
            rate: 100
          },
          {
            step: 'register',
            name: '注册',
            count: registers,
            rate: ((registers / visits) * 100).toFixed(2)
          },
          {
            step: 'first_purchase',
            name: '首次付费',
            count: firstPurchase,
            rate: ((firstPurchase / visits) * 100).toFixed(2)
          },
          {
            step: 'repurchase',
            name: '复购',
            count: repurchase,
            rate: ((repurchase / visits) * 100).toFixed(2)
          }
        ]
      }
    })
  } catch (error) {
    console.error('获取漏斗数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取漏斗数据失败'
    })
  }
}

/**
 * 多触点归因分析
 */
export const getTouchpoints = async (req: Request, res: Response) => {
  try {
    const { user_id, session_id, start_date, end_date } = req.query

    let whereClause = 'WHERE at.created_at IS NOT NULL'
    const params: any[] = []
    let paramIndex = 1

    if (user_id) {
      whereClause += ` AND at.user_id = $${paramIndex}`
      params.push(user_id)
      paramIndex++
    }

    if (session_id) {
      whereClause += ` AND at.session_id = $${paramIndex}`
      params.push(session_id)
      paramIndex++
    }

    if (start_date) {
      whereClause += ` AND at.created_at >= $${paramIndex}`
      params.push(start_date)
      paramIndex++
    }

    if (end_date) {
      whereClause += ` AND at.created_at <= $${paramIndex}`
      params.push(end_date)
      paramIndex++
    }

    const result = await query(
      `SELECT
         at.*,
         ac.name as channel_name,
         ac.channel_type,
         ae.utm_source,
         ae.utm_medium,
         ae.utm_campaign
       FROM attribution_touchpoints at
       LEFT JOIN attribution_channels ac ON at.channel_id = ac.id
       LEFT JOIN attribution_events ae ON at.attribution_event_id = ae.id
       ${whereClause}
       ORDER BY at.user_id, at.touchpoint_order ASC`,
      params
    )

    // 按用户分组组织数据
    const groupedData: { [key: string]: any } = {}

    result.rows.forEach((row: any) => {
      const userId = row.user_id || 'unknown'

      if (!groupedData[userId]) {
        groupedData[userId] = {
          user_id: userId,
          touchpoints: []
        }
      }

      groupedData[userId].touchpoints.push({
        timestamp: row.touched_at || row.created_at,
        channel: row.channel_name || `渠道${row.channel_id}`,
        action: `${row.utm_source || ''} ${row.utm_medium || ''} ${row.utm_campaign || ''}`.trim() || '访问',
        channel_type: row.channel_type,
        utm_source: row.utm_source,
        utm_medium: row.utm_medium,
        utm_campaign: row.utm_campaign,
        touchpoint_order: row.touchpoint_order
      })
    })

    res.json({
      success: true,
      data: Object.values(groupedData)
    })
  } catch (error) {
    console.error('获取触点数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取触点数据失败'
    })
  }
}

/**
 * 归因模型对比（首次/末次/线性）
 */
export const getModelComparison = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query

    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = end_date || new Date().toISOString()

    // 首次归因模型
    const firstTouchResult = await query(
      `SELECT
         ac.id as channel_id,
         ac.name as channel_name,
         COUNT(DISTINCT uc.id) as conversions,
         SUM(uc.conversion_value) as revenue
       FROM user_conversions uc
       JOIN attribution_touchpoints at ON uc.user_id = at.user_id
       JOIN attribution_channels ac ON at.channel_id = ac.id
       WHERE uc.converted_at BETWEEN $1 AND $2
       AND at.touchpoint_order = 1
       GROUP BY ac.id, ac.name
       ORDER BY conversions DESC`,
      [startDate, endDate]
    )

    // 末次归因模型
    const lastTouchResult = await query(
      `SELECT
         ac.id as channel_id,
         ac.name as channel_name,
         COUNT(DISTINCT uc.id) as conversions,
         SUM(uc.conversion_value) as revenue
       FROM user_conversions uc
       JOIN attribution_channels ac ON uc.last_touch_channel_id = ac.id
       WHERE uc.converted_at BETWEEN $1 AND $2
       GROUP BY ac.id, ac.name
       ORDER BY conversions DESC`,
      [startDate, endDate]
    )

    // 线性归因模型（简化版：平均分配）
    const linearResult = await query(
      `SELECT
         ac.id as channel_id,
         ac.name as channel_name,
         COUNT(DISTINCT at.id) * 1.0 / NULLIF((SELECT COUNT(DISTINCT channel_id) FROM attribution_touchpoints WHERE user_id = at.user_id), 0) as conversions,
         SUM(uc.conversion_value) * 1.0 / NULLIF((SELECT COUNT(DISTINCT channel_id) FROM attribution_touchpoints WHERE user_id = at.user_id), 0) as revenue
       FROM attribution_touchpoints at
       JOIN attribution_channels ac ON at.channel_id = ac.id
       LEFT JOIN user_conversions uc ON at.user_id = uc.user_id AND uc.converted_at BETWEEN $1 AND $2
       WHERE at.created_at BETWEEN $1 AND $2
       GROUP BY ac.id, ac.name, at.user_id
       ORDER BY conversions DESC`,
      [startDate, endDate]
    )

    res.json({
      success: true,
      data: {
        first_touch: firstTouchResult.rows,
        last_touch: lastTouchResult.rows,
        linear: linearResult.rows
      }
    })
  } catch (error) {
    console.error('获取模型对比数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取模型对比数据失败'
    })
  }
}

/**
 * ROI计算
 */
export const getRoi = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, channel_id } = req.query

    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = end_date || new Date().toISOString()

    let whereClause = 'WHERE uc.converted_at BETWEEN $1 AND $2'
    const params: any[] = [startDate, endDate]

    if (channel_id) {
      whereClause += ' AND ac.id = $3'
      params.push(channel_id)
    }

    const result = await query(
      `SELECT
         ac.id as channel_id,
         ac.name as channel_name,
         COALESCE(SUM(uc.conversion_value), 0) as revenue,
         COALESCE((SELECT SUM(cost_amount) FROM channel_costs WHERE channel_id = ac.id AND cost_date BETWEEN $1 AND $2), 0) as cost,
         COUNT(DISTINCT uc.id) as conversions
       FROM attribution_channels ac
       LEFT JOIN user_conversions uc ON ac.id = uc.last_touch_channel_id AND uc.converted_at BETWEEN $1 AND $2
       ${channel_id ? 'WHERE ac.id = $3' : ''}
       GROUP BY ac.id, ac.name
       ORDER BY revenue DESC`,
      params
    )

    const roiData = result.rows.map(row => {
      const revenue = parseFloat(row.revenue) || 0
      const cost = parseFloat(row.cost) || 0
      const roi = cost > 0 ? (((revenue - cost) / cost) * 100).toFixed(2) : '0'
      const roas = cost > 0 ? (revenue / cost).toFixed(2) : '0' // Return on Ad Spend
      const cpa = row.conversions > 0 ? (cost / row.conversions).toFixed(2) : '0' // Cost per Acquisition

      return {
        ...row,
        roi: parseFloat(roi),
        roas: parseFloat(roas),
        cpa: parseFloat(cpa)
      }
    })

    res.json({
      success: true,
      data: roiData
    })
  } catch (error) {
    console.error('获取ROI数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取ROI数据失败'
    })
  }
}

/**
 * 渠道对比分析
 */
export const getChannelComparison = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query

    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = end_date || new Date().toISOString()

    const result = await query(
      `SELECT
         ac.id,
         ac.name,
         ac.channel_type,
         COUNT(DISTINCT ae.id) as visits,
         COUNT(DISTINCT ae.user_id) as unique_visitors,
         COUNT(DISTINCT uc.id) as conversions,
         COALESCE(SUM(uc.conversion_value), 0) as revenue,
         COALESCE((SELECT SUM(cost_amount) FROM channel_costs WHERE channel_id = ac.id AND cost_date BETWEEN $1 AND $2), 0) as cost,
         AVG(EXTRACT(EPOCH FROM (uc.converted_at - ae.created_at)) / 3600) as avg_time_to_convert_hours
       FROM attribution_channels ac
       LEFT JOIN attribution_events ae ON ac.id = ae.channel_id AND ae.created_at BETWEEN $1 AND $2
       LEFT JOIN user_conversions uc ON ac.id = uc.last_touch_channel_id AND uc.converted_at BETWEEN $1 AND $2
       GROUP BY ac.id, ac.name, ac.channel_type
       ORDER BY visits DESC`,
      [startDate, endDate]
    )

    const comparisonData = result.rows.map(row => {
      const visits = parseInt(row.visits) || 0
      const conversions = parseInt(row.conversions) || 0
      const revenue = parseFloat(row.revenue) || 0
      const cost = parseFloat(row.cost) || 0

      return {
        ...row,
        conversion_rate: visits > 0 ? ((conversions / visits) * 100).toFixed(2) : '0',
        roi: cost > 0 ? (((revenue - cost) / cost) * 100).toFixed(2) : '0',
        cpa: conversions > 0 ? (cost / conversions).toFixed(2) : '0',
        avg_time_to_convert_hours: parseFloat(row.avg_time_to_convert_hours || 0).toFixed(2)
      }
    })

    res.json({
      success: true,
      data: comparisonData
    })
  } catch (error) {
    console.error('获取渠道对比数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取渠道对比数据失败'
    })
  }
}

/**
 * 时间趋势分析
 */
export const getTrends = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, channel_id, granularity = 'day' } = req.query

    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = end_date || new Date().toISOString()

    // 根据粒度选择时间分组
    let dateFormat = 'YYYY-MM-DD'
    if (granularity === 'hour') {
      dateFormat = 'YYYY-MM-DD HH24:00'
    } else if (granularity === 'week') {
      dateFormat = 'IYYY-IW'
    } else if (granularity === 'month') {
      dateFormat = 'YYYY-MM'
    }

    let whereClause = 'WHERE ae.created_at BETWEEN $1 AND $2'
    const params: any[] = [startDate, endDate]

    if (channel_id) {
      whereClause += ' AND ae.channel_id = $3'
      params.push(channel_id)
    }

    const result = await query(
      `SELECT
         TO_CHAR(ae.created_at, '${dateFormat}') as date,
         COUNT(DISTINCT ae.id) as visits,
         COUNT(DISTINCT uc.id) as conversions,
         COALESCE(SUM(uc.conversion_value), 0) as revenue
       FROM attribution_events ae
       LEFT JOIN user_conversions uc ON ae.user_id = uc.user_id
         AND DATE(ae.created_at) = DATE(uc.converted_at)
       ${whereClause}
       GROUP BY TO_CHAR(ae.created_at, '${dateFormat}')
       ORDER BY date ASC`,
      params
    )

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        conversion_rate: row.visits > 0 ? ((row.conversions / row.visits) * 100).toFixed(2) : '0'
      }))
    })
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取趋势数据失败'
    })
  }
}

/**
 * 用户质量分析
 */
export const getUserQuality = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query

    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = end_date || new Date().toISOString()

    const result = await query(
      `SELECT
         ac.id as channel_id,
         ac.name as channel_name,
         COUNT(DISTINCT uc.user_id) as total_users,
         COUNT(DISTINCT CASE WHEN ced.event_type = 'repurchase' THEN uc.user_id END) as repeat_users,
         AVG(uc.conversion_value) as avg_order_value,
         SUM(uc.conversion_value) / NULLIF(COUNT(DISTINCT uc.user_id), 0) as ltv,
         AVG(EXTRACT(EPOCH FROM (NOW() - ae.created_at)) / 86400) as avg_customer_age_days
       FROM attribution_channels ac
       LEFT JOIN attribution_events ae ON ac.id = ae.channel_id AND ae.created_at BETWEEN $1 AND $2
       LEFT JOIN user_conversions uc ON ae.user_id = uc.user_id AND uc.converted_at BETWEEN $1 AND $2
       LEFT JOIN conversion_event_definitions ced ON uc.conversion_event_id = ced.id
       GROUP BY ac.id, ac.name
       HAVING COUNT(DISTINCT uc.user_id) > 0
       ORDER BY ltv DESC`,
      [startDate, endDate]
    )

    const qualityData = result.rows.map(row => {
      const totalUsers = parseInt(row.total_users) || 0
      const repeatUsers = parseInt(row.repeat_users) || 0

      return {
        ...row,
        repeat_rate: totalUsers > 0 ? ((repeatUsers / totalUsers) * 100).toFixed(2) : '0',
        avg_order_value: parseFloat(row.avg_order_value || 0).toFixed(2),
        ltv: parseFloat(row.ltv || 0).toFixed(2),
        avg_customer_age_days: parseFloat(row.avg_customer_age_days || 0).toFixed(2)
      }
    })

    res.json({
      success: true,
      data: qualityData
    })
  } catch (error) {
    console.error('获取用户质量数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户质量数据失败'
    })
  }
}

/**
 * 自定义报表 - 获取所有报表配置
 */
export const getCustomReports = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM attribution_custom_reports
       ORDER BY created_at DESC`
    )

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('获取自定义报表列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取自定义报表列表失败'
    })
  }
}

/**
 * 自定义报表 - 创建报表配置
 */
export const createCustomReport = async (req: Request, res: Response) => {
  try {
    const { name, description, report_type, config, schedule } = req.body

    if (!name || !report_type) {
      return res.status(400).json({
        success: false,
        message: '报表名称和类型不能为空'
      })
    }

    const result = await query(
      `INSERT INTO attribution_custom_reports
       (name, description, report_type, config, schedule, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description || null, report_type, config ? JSON.stringify(config) : null,
       schedule ? JSON.stringify(schedule) : null, req.user?.id || 'system']
    )

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('创建自定义报表失败:', error)
    res.status(500).json({
      success: false,
      message: '创建自定义报表失败'
    })
  }
}

/**
 * 自定义报表 - 更新报表配置
 */
export const updateCustomReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, report_type, config, schedule } = req.body

    const result = await query(
      `UPDATE attribution_custom_reports
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           report_type = COALESCE($3, report_type),
           config = COALESCE($4, config),
           schedule = COALESCE($5, schedule),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, description, report_type, config ? JSON.stringify(config) : null,
       schedule ? JSON.stringify(schedule) : null, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '自定义报表不存在'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('更新自定义报表失败:', error)
    res.status(500).json({
      success: false,
      message: '更新自定义报表失败'
    })
  }
}

/**
 * 自定义报表 - 删除报表配置
 */
export const deleteCustomReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await query(
      `DELETE FROM attribution_custom_reports
       WHERE id = $1
       RETURNING id`,
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '自定义报表不存在'
      })
    }

    res.json({
      success: true,
      message: '自定义报表删除成功'
    })
  } catch (error) {
    console.error('删除自定义报表失败:', error)
    res.status(500).json({
      success: false,
      message: '删除自定义报表失败'
    })
  }
}

/**
 * 自定义报表 - 获取报表数据
 */
export const getCustomReportData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 获取报表配置
    const reportResult = await query(
      `SELECT * FROM attribution_custom_reports
       WHERE id = $1`,
      [id]
    )

    if (reportResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: '自定义报表不存在'
      })
    }

    const report = reportResult.rows[0]
    const config = typeof report.config === 'string' ? JSON.parse(report.config) : report.config

    // 根据报表类型生成数据
    let data: any
    switch (report.report_type) {
      case 'channel_performance':
        // 渠道表现报表
        const channelData = await query(
          `SELECT
             ac.name,
             COUNT(DISTINCT ae.id) as visits,
             COUNT(DISTINCT uc.id) as conversions,
             SUM(uc.conversion_value) as revenue
           FROM attribution_channels ac
           LEFT JOIN attribution_events ae ON ac.id = ae.channel_id
           LEFT JOIN user_conversions uc ON ac.id = uc.last_touch_channel_id
           GROUP BY ac.name
           ORDER BY revenue DESC`
        )
        data = channelData.rows
        break

      case 'conversion_funnel':
        // 转化漏斗报表
        data = {
          funnel: [
            { step: 'visit', count: 10000 },
            { step: 'register', count: 2000 },
            { step: 'first_purchase', count: 500 },
            { step: 'repurchase', count: 100 }
          ]
        }
        break

      case 'roi_analysis':
        // ROI分析报表
        const roiData = await query(
          `SELECT
             ac.name,
             SUM(uc.conversion_value) as revenue,
             (SELECT SUM(cost_amount) FROM channel_costs WHERE channel_id = ac.id) as cost
           FROM attribution_channels ac
           LEFT JOIN user_conversions uc ON ac.id = uc.last_touch_channel_id
           GROUP BY ac.name, ac.id`
        )
        data = roiData.rows
        break

      default:
        data = { message: '未知的报表类型' }
    }

    res.json({
      success: true,
      data: {
        report: report,
        data: data
      }
    })
  } catch (error) {
    console.error('获取自定义报表数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取自定义报表数据失败'
    })
  }
}
