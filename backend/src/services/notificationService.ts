import { query } from '../config/database';

export interface Notification {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: number;
  status: 'active' | 'inactive';
  target: string;
  start_date?: Date;
  end_date?: Date;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * 获取所有通知（支持分页和筛选）
 */
export const getAllNotifications = async (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
}) => {
  const whereClauses: string[] = [];
  const queryParams: any[] = [];
  let paramCount = 0;

  if (params?.status && params.status !== 'all') {
    paramCount++;
    whereClauses.push(`status = $${paramCount}`);
    queryParams.push(params.status);
  }

  if (params?.type && params.type !== 'all') {
    paramCount++;
    whereClauses.push(`type = $${paramCount}`);
    queryParams.push(params.type);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) FROM notifications ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // 分页
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const offset = (page - 1) * pageSize;

  // 获取数据
  const dataResult = await query(
    `SELECT * FROM notifications ${whereClause} ORDER BY priority DESC, created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    [...queryParams, pageSize, offset]
  );

  return {
    data: dataResult.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * 获取所有激活的通知（用于前端显示）
 */
export const getActiveNotifications = async (target: string = 'all') => {
  const result = await query(
    `SELECT * FROM notifications
     WHERE status = 'active'
     AND (target = $1 OR target = 'all')
     AND (start_date IS NULL OR start_date <= NOW())
     AND (end_date IS NULL OR end_date >= NOW())
     ORDER BY priority DESC, created_at DESC`,
    [target]
  );
  return result.rows;
};

/**
 * 根据ID获取通知
 */
export const getNotificationById = async (id: number) => {
  const result = await query('SELECT * FROM notifications WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * 创建通知
 */
export const createNotification = async (
  notificationData: Omit<Notification, 'id' | 'created_at' | 'updated_at'>
) => {
  const result = await query(
    `INSERT INTO notifications (title, content, type, priority, status, target, start_date, end_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      notificationData.title,
      notificationData.content,
      notificationData.type || 'info',
      notificationData.priority || 0,
      notificationData.status || 'active',
      notificationData.target || 'all',
      notificationData.start_date || null,
      notificationData.end_date || null,
      notificationData.created_by || null,
    ]
  );
  return result.rows[0];
};

/**
 * 更新通知
 */
export const updateNotification = async (id: number, notificationData: Partial<Notification>) => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  Object.entries(notificationData).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return null;
  }

  paramCount++;
  values.push(id);

  const result = await query(
    `UPDATE notifications SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * 删除通知
 */
export const deleteNotification = async (id: number) => {
  const result = await query('DELETE FROM notifications WHERE id = $1 RETURNING id', [id]);
  return result.rowCount! > 0;
};

/**
 * 批量更新通知状态
 */
export const batchUpdateNotificationStatus = async (ids: number[], status: 'active' | 'inactive') => {
  const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');
  const result = await query(
    `UPDATE notifications SET status = $1 WHERE id IN (${placeholders}) RETURNING id`,
    [status, ...ids]
  );
  return result.rowCount || 0;
};
