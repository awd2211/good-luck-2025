/**
 * 管理后台 - 支付方式管理路由
 */

import { Router } from 'express'
import pool from '../../config/database'

const router = Router()

/**
 * @openapi
 * /api/manage/payment-methods:
 *   get:
 *     summary: 获取支付方式列表
 *     description: 获取所有支付方式,支持按提供商和状态筛选
 *     tags:
 *       - Admin - Payment Methods
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [paypal, stripe, balance]
 *         description: 支付提供商筛选
 *       - in: query
 *         name: is_enabled
 *         schema:
 *           type: boolean
 *         description: 是否启用
 *     responses:
 *       200:
 *         description: 成功获取支付方式列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       methodCode:
 *                         type: string
 *                       methodName:
 *                         type: string
 *                       provider:
 *                         type: string
 *                       isEnabled:
 *                         type: boolean
 *                       sortOrder:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', async (req, res, next) => {
  try {
    const { provider, is_enabled } = req.query

    let query = `
      SELECT
        id,
        method_code,
        method_name,
        provider,
        icon,
        description,
        is_enabled,
        sort_order,
        min_amount,
        max_amount,
        fee_type,
        fee_value,
        config,
        created_at,
        updated_at
      FROM payment_methods
      WHERE 1=1
    `
    const params: any[] = []

    if (provider) {
      params.push(provider)
      query += ` AND provider = $${params.length}`
    }

    if (is_enabled !== undefined) {
      params.push(is_enabled === 'true')
      query += ` AND is_enabled = $${params.length}`
    }

    query += ` ORDER BY sort_order ASC, id ASC`

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @openapi
 * /api/manage/payment-methods/{id}:
 *   get:
 *     summary: 获取单个支付方式
 *     description: 根据ID获取支付方式详细信息
 *     tags:
 *       - Admin - Payment Methods
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 支付方式ID
 *     responses:
 *       200:
 *         description: 成功获取支付方式详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT * FROM payment_methods WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '支付方式不存在',
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @openapi
 * /api/manage/payment-methods:
 *   post:
 *     summary: 创建支付方式
 *     description: 创建新的支付方式
 *     tags:
 *       - Admin - Payment Methods
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method_code
 *               - method_name
 *             properties:
 *               method_code:
 *                 type: string
 *                 description: 支付方式代码(唯一标识)
 *                 example: "paypal_usd"
 *               method_name:
 *                 type: string
 *                 description: 支付方式名称
 *                 example: "PayPal美元支付"
 *               provider:
 *                 type: string
 *                 enum: [paypal, stripe, balance]
 *                 description: 支付提供商
 *               icon:
 *                 type: string
 *                 description: 图标URL
 *               description:
 *                 type: string
 *                 description: 支付方式描述
 *               is_enabled:
 *                 type: boolean
 *                 default: true
 *               sort_order:
 *                 type: integer
 *                 default: 0
 *               min_amount:
 *                 type: number
 *                 default: 0.01
 *               max_amount:
 *                 type: number
 *               fee_type:
 *                 type: string
 *                 enum: [none, fixed, percentage]
 *                 default: none
 *               fee_value:
 *                 type: number
 *                 default: 0
 *               config:
 *                 type: object
 *                 description: 扩展配置JSON
 *     responses:
 *       201:
 *         description: 支付方式创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      method_code,
      method_name,
      provider,
      icon,
      description,
      is_enabled,
      sort_order,
      min_amount,
      max_amount,
      fee_type,
      fee_value,
      config,
    } = req.body

    // 验证必填字段
    if (!method_code || !method_name) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: method_code, method_name',
      })
    }

    // 检查method_code是否已存在
    const existCheck = await pool.query(
      `SELECT id FROM payment_methods WHERE method_code = $1`,
      [method_code]
    )

    if (existCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '支付方式代码已存在',
      })
    }

    const result = await pool.query(
      `INSERT INTO payment_methods
       (method_code, method_name, provider, icon, description, is_enabled, sort_order,
        min_amount, max_amount, fee_type, fee_value, config)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        method_code,
        method_name,
        provider,
        icon,
        description,
        is_enabled ?? true,
        sort_order || 0,
        min_amount || 0.01,
        max_amount,
        fee_type || 'none',
        fee_value || 0,
        config ? JSON.stringify(config) : null,
      ]
    )

    res.status(201).json({
      success: true,
      message: '支付方式创建成功',
      data: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @openapi
 * /api/manage/payment-methods/{id}:
 *   put:
 *     summary: 更新支付方式
 *     description: 更新指定的支付方式信息
 *     tags:
 *       - Admin - Payment Methods
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 支付方式ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method_name:
 *                 type: string
 *               provider:
 *                 type: string
 *               icon:
 *                 type: string
 *               description:
 *                 type: string
 *               is_enabled:
 *                 type: boolean
 *               sort_order:
 *                 type: integer
 *               min_amount:
 *                 type: number
 *               max_amount:
 *                 type: number
 *               fee_type:
 *                 type: string
 *               fee_value:
 *                 type: number
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: 支付方式更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      method_name,
      provider,
      icon,
      description,
      is_enabled,
      sort_order,
      min_amount,
      max_amount,
      fee_type,
      fee_value,
      config,
    } = req.body

    // 检查支付方式是否存在
    const existCheck = await pool.query(
      `SELECT id FROM payment_methods WHERE id = $1`,
      [id]
    )

    if (existCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '支付方式不存在',
      })
    }

    // 构建更新语句
    const updates: string[] = []
    const params: any[] = []

    if (method_name !== undefined) {
      params.push(method_name)
      updates.push(`method_name = $${params.length}`)
    }

    if (provider !== undefined) {
      params.push(provider)
      updates.push(`provider = $${params.length}`)
    }

    if (icon !== undefined) {
      params.push(icon)
      updates.push(`icon = $${params.length}`)
    }

    if (description !== undefined) {
      params.push(description)
      updates.push(`description = $${params.length}`)
    }

    if (is_enabled !== undefined) {
      params.push(is_enabled)
      updates.push(`is_enabled = $${params.length}`)
    }

    if (sort_order !== undefined) {
      params.push(sort_order)
      updates.push(`sort_order = $${params.length}`)
    }

    if (min_amount !== undefined) {
      params.push(min_amount)
      updates.push(`min_amount = $${params.length}`)
    }

    if (max_amount !== undefined) {
      params.push(max_amount)
      updates.push(`max_amount = $${params.length}`)
    }

    if (fee_type !== undefined) {
      params.push(fee_type)
      updates.push(`fee_type = $${params.length}`)
    }

    if (fee_value !== undefined) {
      params.push(fee_value)
      updates.push(`fee_value = $${params.length}`)
    }

    if (config !== undefined) {
      params.push(config ? JSON.stringify(config) : null)
      updates.push(`config = $${params.length}`)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段',
      })
    }

    params.push(id)
    const result = await pool.query(
      `UPDATE payment_methods
       SET ${updates.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params
    )

    res.json({
      success: true,
      message: '支付方式更新成功',
      data: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @openapi
 * /api/manage/payment-methods/batch/sort:
 *   put:
 *     summary: 批量更新排序
 *     description: 批量更新支付方式的排序顺序
 *     tags:
 *       - Admin - Payment Methods
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 description: 排序项数组
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - sort_order
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 支付方式ID
 *                     sort_order:
 *                       type: integer
 *                       description: 排序顺序
 *                 example:
 *                   - id: 1
 *                     sort_order: 0
 *                   - id: 2
 *                     sort_order: 1
 *     responses:
 *       200:
 *         description: 排序更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/batch/sort', async (req, res, next) => {
  const client = await pool.connect()

  try {
    const { items } = req.body

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: items (数组)',
      })
    }

    await client.query('BEGIN')

    for (const item of items) {
      const { id, sort_order } = item

      await client.query(
        `UPDATE payment_methods SET sort_order = $1 WHERE id = $2`,
        [sort_order, id]
      )
    }

    await client.query('COMMIT')

    res.json({
      success: true,
      message: '排序更新成功',
    })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

/**
 * @openapi
 * /api/manage/payment-methods/{id}/toggle:
 *   patch:
 *     summary: 切换启用状态
 *     description: 切换支付方式的启用/禁用状态
 *     tags:
 *       - Admin - Payment Methods
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 支付方式ID
 *     responses:
 *       200:
 *         description: 状态切换成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "已启用"
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `UPDATE payment_methods
       SET is_enabled = NOT is_enabled
       WHERE id = $1
       RETURNING *`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '支付方式不存在',
      })
    }

    res.json({
      success: true,
      message: result.rows[0].is_enabled ? '已启用' : '已禁用',
      data: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @openapi
 * /api/manage/payment-methods/{id}:
 *   delete:
 *     summary: 删除支付方式
 *     description: 删除指定的支付方式(如有交易记录则不能删除)
 *     tags:
 *       - Admin - Payment Methods
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 支付方式ID
 *     responses:
 *       200:
 *         description: 支付方式删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 该支付方式已有交易记录
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "该支付方式已有交易记录，不能删除。建议禁用而不是删除。"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // 检查是否有正在使用的交易
    const transactionCheck = await pool.query(
      `SELECT COUNT(*) as count FROM payment_transactions
       WHERE payment_method = (SELECT method_code FROM payment_methods WHERE id = $1)`,
      [id]
    )

    if (parseInt(transactionCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: '该支付方式已有交易记录，不能删除。建议禁用而不是删除。',
      })
    }

    const result = await pool.query(
      `DELETE FROM payment_methods WHERE id = $1 RETURNING *`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '支付方式不存在',
      })
    }

    res.json({
      success: true,
      message: '支付方式删除成功',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @openapi
 * /api/manage/payment-methods/{id}/stats:
 *   get:
 *     summary: 获取支付方式统计
 *     description: 获取指定支付方式的交易统计信息
 *     tags:
 *       - Admin - Payment Methods
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 支付方式ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 统计开始日期
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 统计结束日期
 *     responses:
 *       200:
 *         description: 成功获取统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     method_code:
 *                       type: string
 *                     method_name:
 *                       type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total_transactions:
 *                           type: integer
 *                           description: 总交易数
 *                         completed_count:
 *                           type: integer
 *                           description: 成功交易数
 *                         pending_count:
 *                           type: integer
 *                           description: 待处理交易数
 *                         failed_count:
 *                           type: integer
 *                           description: 失败交易数
 *                         total_amount:
 *                           type: number
 *                           description: 总交易金额
 *                         avg_amount:
 *                           type: number
 *                           description: 平均交易金额
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params
    const { start_date, end_date } = req.query

    // 获取支付方式信息
    const methodResult = await pool.query(
      `SELECT method_code, method_name FROM payment_methods WHERE id = $1`,
      [id]
    )

    if (methodResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '支付方式不存在',
      })
    }

    const { method_code } = methodResult.rows[0]

    // 构建统计查询
    let statsQuery = `
      SELECT
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_amount,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0) as avg_amount
      FROM payment_transactions
      WHERE payment_method = $1
    `
    const params: any[] = [method_code]

    if (start_date) {
      params.push(start_date)
      statsQuery += ` AND created_at >= $${params.length}`
    }

    if (end_date) {
      params.push(end_date)
      statsQuery += ` AND created_at <= $${params.length}`
    }

    const statsResult = await pool.query(statsQuery, params)

    res.json({
      success: true,
      data: {
        ...methodResult.rows[0],
        stats: statsResult.rows[0],
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
