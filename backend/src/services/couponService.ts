import pool from '../config/database';

export const getAllCoupons = async (filters?: any) => {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const offset = (page - 1) * pageSize;
  let query = 'SELECT * FROM coupons WHERE 1=1';
  const params: any[] = [];
  if (filters?.status) { query += ` AND status = $${params.length + 1}`; params.push(filters.status); }
  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(pageSize, offset);
  const [dataResult, countResult] = await Promise.all([pool.query(query, params), pool.query('SELECT COUNT(*) FROM coupons')]);
  return { data: dataResult.rows, total: parseInt(countResult.rows[0].count), page, pageSize, totalPages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize) };
};

export const getCouponById = async (id: number) => {
  const result = await pool.query('SELECT * FROM coupons WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const createCoupon = async (data: any) => {
  const result = await pool.query(
    'INSERT INTO coupons (code, name, type, value, min_amount, max_discount, total_count, valid_from, valid_until, target_users, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
    [data.code, data.name, data.type, data.value, data.min_amount, data.max_discount, data.total_count || 0, data.valid_from, data.valid_until, data.target_users || 'all', data.status || 'active']
  );
  return result.rows[0];
};

export const updateCoupon = async (id: number, data: any) => {
  const result = await pool.query(
    'UPDATE coupons SET name = $1, type = $2, value = $3, min_amount = $4, max_discount = $5, total_count = $6, valid_from = $7, valid_until = $8, target_users = $9, status = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11 RETURNING *',
    [data.name, data.type, data.value, data.min_amount, data.max_discount, data.total_count, data.valid_from, data.valid_until, data.target_users, data.status, id]
  );
  return result.rows[0] || null;
};

export const updateCouponStatus = async (id: number, status: string) => {
  const result = await pool.query('UPDATE coupons SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [status, id]);
  return result.rows[0] || null;
};

export const deleteCoupon = async (id: number): Promise<boolean> => {
  const result = await pool.query('DELETE FROM coupons WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};
