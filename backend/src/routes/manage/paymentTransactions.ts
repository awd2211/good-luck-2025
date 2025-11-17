/**
 * 支付交易管理路由 (管理端)
 *
 * 文件: manage/paymentTransactions.ts
 * 标签: Admin - Payment Transactions
 * 前缀: /api/manage/payment-transactions
 *
 * 已完成的路由 (3个):
 *   - GET / - 获取支付交易列表
 *   - GET /stats - 获取支付交易统计数据
 *   - GET /:id - 获取单个交易详情
 */

import express from 'express';
import pool from '../../config/database';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

// 所有路由都需要管理员认证
router.use(authenticate);

/**
 * @openapi
 * /api/manage/payment-transactions:
 *   get:
 *     summary: 获取支付交易列表
 *     description: 获取所有支付交易记录,支持分页和多条件筛选
 *     tags:
 *       - Admin - Payment Transactions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: 交易状态筛选
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [alipay, wechat, credit_card, balance]
 *         description: 支付方式筛选
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *         description: 支付提供商筛选
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索交易ID或订单ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取交易列表
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
 *                         type: string
 *                       transactionId:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       orderId:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       feeAmount:
 *                         type: number
 *                       paymentMethod:
 *                         type: string
 *                       provider:
 *                         type: string
 *                       status:
 *                         type: string
 *                       paidAt:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { status, payment_method, provider, search, start_date, end_date } = req.query;

    let query = `
      SELECT
        id,
        transaction_id,
        user_id,
        order_id,
        amount,
        currency,
        fee_amount,
        payment_method,
        provider,
        provider_transaction_id,
        provider_order_id,
        provider_status,
        status,
        error_code,
        error_message,
        ip_address,
        user_agent,
        return_url,
        cancel_url,
        notify_url,
        paid_at,
        created_at,
        updated_at
      FROM payment_transactions
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // 状态筛选
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    // 支付方式筛选
    if (payment_method) {
      query += ` AND payment_method = $${paramIndex++}`;
      params.push(payment_method);
    }

    // 提供商筛选
    if (provider) {
      query += ` AND provider = $${paramIndex++}`;
      params.push(provider);
    }

    // 搜索筛选 (交易ID或订单ID)
    if (search) {
      query += ` AND (transaction_id ILIKE $${paramIndex} OR order_id ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 日期范围筛选
    if (start_date) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(end_date + ' 23:59:59');
    }

    // 获取总数
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params);
    const total = countResult.rows && countResult.rows[0] ? parseInt(countResult.rows[0].count) : 0;

    // 添加排序和分页
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取支付交易列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付交易列表失败',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @openapi
 * /api/manage/payment-transactions/stats:
 *   get:
 *     summary: 获取支付交易统计数据
 *     description: 获取支付交易的汇总统计信息,包括总交易数、金额、各状态数量等
 *     tags:
 *       - Admin - Payment Transactions
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取统计数据
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
 *                     totalCount:
 *                       type: integer
 *                       description: 总交易数
 *                     totalAmount:
 *                       type: number
 *                       description: 总交易金额
 *                     completedCount:
 *                       type: integer
 *                       description: 已完成交易数
 *                     pendingCount:
 *                       type: integer
 *                       description: 待处理交易数
 *                     failedCount:
 *                       type: integer
 *                       description: 失败交易数
 *                     refundedCount:
 *                       type: integer
 *                       description: 已退款交易数
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE status = 'refunded') as refunded_count
      FROM payment_transactions
    `;

    const result = await pool.query(statsQuery);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('获取支付统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付统计失败',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * @openapi
 * /api/manage/payment-transactions/{id}:
 *   get:
 *     summary: 获取单个交易详情
 *     description: 根据ID获取支付交易的详细信息
 *     tags:
 *       - Admin - Payment Transactions
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 交易记录ID
 *     responses:
 *       200:
 *         description: 成功获取交易详情
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
 *                     id:
 *                       type: string
 *                     transactionId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     orderId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     feeAmount:
 *                       type: number
 *                     paymentMethod:
 *                       type: string
 *                     provider:
 *                       type: string
 *                     providerTransactionId:
 *                       type: string
 *                     providerOrderId:
 *                       type: string
 *                     providerStatus:
 *                       type: string
 *                     status:
 *                       type: string
 *                     errorCode:
 *                       type: string
 *                     errorMessage:
 *                       type: string
 *                     ipAddress:
 *                       type: string
 *                     userAgent:
 *                       type: string
 *                     returnUrl:
 *                       type: string
 *                     cancelUrl:
 *                       type: string
 *                     notifyUrl:
 *                       type: string
 *                     paidAt:
 *                       type: string
 *                       format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM payment_transactions WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '交易记录不存在',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('获取交易详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取交易详情失败',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
