/**
 * 管理后台 - 支付配置管理路由
 */

import { Router } from 'express'
import pool from '../../config/database'

const router = Router()

/**
 * 获取所有支付配置
 * GET /api/manage/payment-configs
 */
router.get('/', async (req, res, next) => {
  try {
    const { provider, is_production } = req.query

    let query = `
      SELECT
        id,
        provider,
        config_key,
        config_value,
        is_production,
        is_enabled,
        description,
        created_at,
        updated_at
      FROM payment_configs
      WHERE 1=1
    `
    const params: any[] = []

    if (provider) {
      params.push(provider)
      query += ` AND provider = $${params.length}`
    }

    if (is_production !== undefined) {
      params.push(is_production === 'true')
      query += ` AND is_production = $${params.length}`
    }

    query += ` ORDER BY provider, is_production DESC, config_key`

    const result = await pool.query(query, params)

    // 对敏感信息进行脱敏处理
    const configs = result.rows.map((row: any) => {
      const sensitiveKeys = ['secret', 'client_secret', 'secret_key', 'webhook_secret']
      const isSensitive = sensitiveKeys.some((key) => row.config_key.includes(key))

      return {
        ...row,
        config_value: isSensitive ? maskSensitiveValue(row.config_value) : row.config_value,
        is_masked: isSensitive,
      }
    })

    res.json({
      success: true,
      data: configs,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取单个支付配置
 * GET /api/manage/payment-configs/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT
        id,
        provider,
        config_key,
        config_value,
        is_production,
        is_enabled,
        description,
        created_at,
        updated_at
      FROM payment_configs
      WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '配置不存在',
      })
    }

    const config = result.rows[0]
    const sensitiveKeys = ['secret', 'client_secret', 'secret_key', 'webhook_secret']
    const isSensitive = sensitiveKeys.some((key) => config.config_key.includes(key))

    res.json({
      success: true,
      data: {
        ...config,
        config_value: isSensitive ? maskSensitiveValue(config.config_value) : config.config_value,
        is_masked: isSensitive,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 创建支付配置
 * POST /api/manage/payment-configs
 */
router.post('/', async (req, res, next) => {
  try {
    const { provider, config_key, config_value, is_production, is_enabled, description } =
      req.body

    // 验证必填字段
    if (!provider || !config_key || !config_value) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: provider, config_key, config_value',
      })
    }

    // 检查是否已存在相同配置
    const existCheck = await pool.query(
      `SELECT id FROM payment_configs
       WHERE provider = $1 AND config_key = $2 AND is_production = $3`,
      [provider, config_key, is_production || false]
    )

    if (existCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该配置已存在，请使用更新接口',
      })
    }

    const result = await pool.query(
      `INSERT INTO payment_configs
       (provider, config_key, config_value, is_production, is_enabled, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [provider, config_key, config_value, is_production || false, is_enabled ?? true, description]
    )

    res.status(201).json({
      success: true,
      message: '配置创建成功',
      data: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 更新支付配置
 * PUT /api/manage/payment-configs/:id
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { config_value, is_enabled, description } = req.body

    // 检查配置是否存在
    const existCheck = await pool.query(`SELECT id FROM payment_configs WHERE id = $1`, [id])

    if (existCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '配置不存在',
      })
    }

    // 构建更新语句
    const updates: string[] = []
    const params: any[] = []

    if (config_value !== undefined) {
      params.push(config_value)
      updates.push(`config_value = $${params.length}`)
    }

    if (is_enabled !== undefined) {
      params.push(is_enabled)
      updates.push(`is_enabled = $${params.length}`)
    }

    if (description !== undefined) {
      params.push(description)
      updates.push(`description = $${params.length}`)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段',
      })
    }

    params.push(id)
    const result = await pool.query(
      `UPDATE payment_configs
       SET ${updates.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params
    )

    res.json({
      success: true,
      message: '配置更新成功',
      data: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 批量更新支付配置（用于保存整个提供商的配置）
 * PUT /api/manage/payment-configs/batch
 */
router.put('/batch/update', async (req, res, next) => {
  const client = await pool.connect()

  try {
    const { provider, is_production, configs } = req.body

    if (!provider || !Array.isArray(configs)) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: provider, configs (数组)',
      })
    }

    await client.query('BEGIN')

    const updatedConfigs = []

    for (const config of configs) {
      const { config_key, config_value, is_enabled } = config

      const result = await client.query(
        `INSERT INTO payment_configs
         (provider, config_key, config_value, is_production, is_enabled)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (provider, config_key, is_production)
         DO UPDATE SET
           config_value = EXCLUDED.config_value,
           is_enabled = EXCLUDED.is_enabled
         RETURNING *`,
        [provider, config_key, config_value, is_production || false, is_enabled ?? true]
      )

      updatedConfigs.push(result.rows[0])
    }

    await client.query('COMMIT')

    res.json({
      success: true,
      message: '批量更新成功',
      data: updatedConfigs,
    })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

/**
 * 删除支付配置
 * DELETE /api/manage/payment-configs/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query(`DELETE FROM payment_configs WHERE id = $1 RETURNING *`, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '配置不存在',
      })
    }

    res.json({
      success: true,
      message: '配置删除成功',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 测试支付配置是否有效
 * POST /api/manage/payment-configs/test
 */
router.post('/test', async (req, res, next) => {
  try {
    const { provider, is_production } = req.body

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: provider',
      })
    }

    let testResult: any = {
      success: false,
      message: '',
    }

    if (provider === 'paypal') {
      try {
        // 验证PayPal配置是否完整
        const configCheck = await pool.query(
          `SELECT COUNT(*) as count FROM payment_configs
           WHERE provider = 'paypal' AND is_production = $1 AND is_enabled = TRUE
           AND config_key IN ('client_id', 'client_secret')`,
          [is_production || false]
        )

        if (parseInt(configCheck.rows[0].count) >= 2) {
          testResult = {
            success: true,
            message: 'PayPal配置完整',
            data: {
              environment: is_production ? 'production' : 'sandbox',
            },
          }
        } else {
          testResult = {
            success: false,
            message: 'PayPal配置不完整，请配置client_id和client_secret',
          }
        }
      } catch (error: any) {
        testResult = {
          success: false,
          message: `PayPal配置测试失败: ${error.message}`,
        }
      }
    } else if (provider === 'stripe') {
      try {
        // 验证Stripe配置是否完整
        const configCheck = await pool.query(
          `SELECT COUNT(*) as count FROM payment_configs
           WHERE provider = 'stripe' AND is_production = $1 AND is_enabled = TRUE
           AND config_key IN ('publishable_key', 'secret_key')`,
          [is_production || false]
        )

        if (parseInt(configCheck.rows[0].count) >= 2) {
          testResult = {
            success: true,
            message: 'Stripe配置完整',
            data: {
              environment: is_production ? 'production' : 'test',
            },
          }
        } else {
          testResult = {
            success: false,
            message: 'Stripe配置不完整，请配置publishable_key和secret_key',
          }
        }
      } catch (error: any) {
        testResult = {
          success: false,
          message: `Stripe配置测试失败: ${error.message}`,
        }
      }
    } else {
      testResult = {
        success: false,
        message: '不支持的支付提供商',
      }
    }

    res.json(testResult)
  } catch (error) {
    next(error)
  }
})

/**
 * 工具函数：脱敏敏感信息
 */
function maskSensitiveValue(value: string): string {
  if (!value || value.length < 8) {
    return '****'
  }

  // 保留前4位和后4位，中间用*替换
  const start = value.slice(0, 4)
  const end = value.slice(-4)
  const middle = '*'.repeat(Math.min(value.length - 8, 20))

  return `${start}${middle}${end}`
}

export default router
