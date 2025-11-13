import pool from '../config/database';

export interface RefundData {
  refund_no?: string;
  order_id: string;
  user_id: string;
  amount: number;
  reason: string;
  description?: string;
  status?: string;
  refund_method?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  review_comment?: string;
}

/**
 * 获取所有退款记录
 */
export const getAllRefunds = async (filters?: {
  page?: number;
  pageSize?: number;
  status?: string;
  user_id?: string;
}) => {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = 'SELECT * FROM refunds WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    query += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters?.user_id) {
    query += ` AND user_id = $${paramIndex}`;
    params.push(filters.user_id);
    paramIndex++;
  }

  query += ' ORDER BY created_at DESC';
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pageSize, offset);

  const countQuery = query.substring(0, query.indexOf('ORDER BY')).replace('SELECT *', 'SELECT COUNT(*)');
  const countParams = params.slice(0, -2);

  const [dataResult, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, countParams),
  ]);

  const total = parseInt(countResult.rows[0].count);

  return {
    data: dataResult.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * 根据ID获取退款
 */
export const getRefundById = async (id: number) => {
  const result = await pool.query(
    'SELECT * FROM refunds WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * 创建退款
 */
export const createRefund = async (refundData: RefundData) => {
  const {
    refund_no,
    order_id,
    user_id,
    amount,
    reason,
    description,
    status = 'pending',
  } = refundData;

  const result = await pool.query(
    `INSERT INTO refunds
    (refund_no, order_id, user_id, amount, reason, description, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *`,
    [refund_no, order_id, user_id, amount, reason, description, status]
  );

  return result.rows[0];
};

/**
 * 审核退款
 */
export const reviewRefund = async (
  id: number,
  reviewData: {
    action: 'approve' | 'reject';
    reviewer_id: string;
    reviewer_name: string;
    review_comment?: string;
    refund_method?: string;
  }
) => {
  const { action, reviewer_id, reviewer_name, review_comment, refund_method } = reviewData;

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  const result = await pool.query(
    `UPDATE refunds
    SET status = $1,
        reviewer_id = $2,
        reviewer_name = $3,
        review_comment = $4,
        refund_method = $5,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *`,
    [newStatus, reviewer_id, reviewer_name, review_comment, refund_method, id]
  );

  return result.rows[0] || null;
};

/**
 * 更新退款状态
 */
export const updateRefundStatus = async (id: number, status: string) => {
  const result = await pool.query(
    `UPDATE refunds
    SET status = $1,
        updated_at = CURRENT_TIMESTAMP,
        completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
    WHERE id = $2
    RETURNING *`,
    [status, id]
  );

  return result.rows[0] || null;
};

/**
 * 删除退款
 */
export const deleteRefund = async (id: number): Promise<boolean> => {
  const result = await pool.query('DELETE FROM refunds WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};
