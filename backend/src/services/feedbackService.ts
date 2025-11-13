import pool from '../config/database';

export interface FeedbackData {
  user_id: string;
  username: string;
  type: string;
  category?: string;
  title: string;
  content: string;
  contact?: string;
  images?: string;
  priority?: string;
  status?: string;
}

export const getAllFeedbacks = async (filters?: {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  priority?: string;
}) => {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = 'SELECT * FROM feedbacks WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    query += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters?.type) {
    query += ` AND type = $${paramIndex}`;
    params.push(filters.type);
    paramIndex++;
  }

  if (filters?.priority) {
    query += ` AND priority = $${paramIndex}`;
    params.push(filters.priority);
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

export const getFeedbackById = async (id: number) => {
  const result = await pool.query('SELECT * FROM feedbacks WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const createFeedback = async (feedbackData: FeedbackData) => {
  const {
    user_id,
    username,
    type,
    category,
    title,
    content,
    contact,
    images,
    priority = 'normal',
    status = 'pending',
  } = feedbackData;

  const result = await pool.query(
    `INSERT INTO feedbacks
    (user_id, username, type, category, title, content, contact, images, priority, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *`,
    [user_id, username, type, category, title, content, contact, images, priority, status]
  );

  return result.rows[0];
};

export const updateFeedback = async (
  id: number,
  updateData: {
    status: string;
    handler_id?: string;
    handler_name?: string;
    handler_comment?: string;
  }
) => {
  const { status, handler_id, handler_name, handler_comment } = updateData;

  const result = await pool.query(
    `UPDATE feedbacks
    SET status = $1,
        handler_id = $2,
        handler_name = $3,
        handler_comment = $4,
        updated_at = CURRENT_TIMESTAMP,
        resolved_at = CASE WHEN $1 IN ('resolved', 'closed') THEN CURRENT_TIMESTAMP ELSE resolved_at END
    WHERE id = $5
    RETURNING *`,
    [status, handler_id, handler_name, handler_comment, id]
  );

  return result.rows[0] || null;
};

export const deleteFeedback = async (id: number): Promise<boolean> => {
  const result = await pool.query('DELETE FROM feedbacks WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};
