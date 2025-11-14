import express from 'express';
import pool from '../../config/database';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

// 所有路由都需要管理员认证
router.use(authenticate);

/**
 * 获取支付交易列表
 * GET /api/manage/payment-transactions
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
 * 获取支付交易统计数据
 * GET /api/manage/payment-transactions/stats
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
 * 获取单个交易详情
 * GET /api/manage/payment-transactions/:id
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
