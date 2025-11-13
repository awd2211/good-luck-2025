import pool from '../config/database';

export const getAllReviews = async (filters?: any) => {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const offset = (page - 1) * pageSize;
  let query = 'SELECT * FROM reviews WHERE 1=1';
  const params: any[] = [];
  if (filters?.status) { query += ` AND status = $${params.length + 1}`; params.push(filters.status); }
  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(pageSize, offset);
  const countQuery = 'SELECT COUNT(*) FROM reviews WHERE 1=1' + (filters?.status ? ' AND status = $1' : '');
  const [dataResult, countResult] = await Promise.all([pool.query(query, params), pool.query(countQuery, filters?.status ? [filters.status] : [])]);
  return { data: dataResult.rows, total: parseInt(countResult.rows[0].count), page, pageSize, totalPages: Math.ceil(parseInt(countResult.rows[0].count) / pageSize) };
};

export const getReviewById = async (id: number) => {
  const result = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const createReview = async (data: any) => {
  const result = await pool.query(
    'INSERT INTO reviews (order_id, user_id, username, fortune_type, rating, content, tags, is_anonymous, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
    [data.order_id, data.user_id, data.username, data.fortune_type, data.rating, data.content, data.tags, data.is_anonymous || false, data.status || 'published']
  );
  return result.rows[0];
};

export const updateReviewStatus = async (id: number, status: string) => {
  const result = await pool.query('UPDATE reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [status, id]);
  return result.rows[0] || null;
};

export const replyToReview = async (id: number, replyContent: string) => {
  const result = await pool.query('UPDATE reviews SET reply_content = $1, reply_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [replyContent, id]);
  return result.rows[0] || null;
};

export const deleteReview = async (id: number): Promise<boolean> => {
  const result = await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};
