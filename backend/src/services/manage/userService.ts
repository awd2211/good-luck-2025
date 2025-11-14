import pool from '../../config/database';

export interface User {
  id: string;
  username: string;
  phone: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  register_date: string;
  status: string;
  order_count: number;
  total_spent: number;
  balance: number;
  last_login_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 获取用户列表
 */
export async function getUsers(params: GetUsersParams = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    status,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = params;

  const offset = (page - 1) * limit;
  const queryParams: any[] = [];
  let whereConditions: string[] = [];
  let paramIndex = 1;

  // 搜索条件
  if (search) {
    whereConditions.push(`(
      username ILIKE $${paramIndex} OR
      phone ILIKE $${paramIndex} OR
      nickname ILIKE $${paramIndex} OR
      id ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  // 状态筛选
  if (status) {
    whereConditions.push(`status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // 获取总数
  const countQuery = `
    SELECT COUNT(*) as total
    FROM users
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  // 允许的排序字段
  const allowedSortFields = ['created_at', 'order_count', 'total_spent', 'last_login_date', 'register_date'];
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  // 获取用户列表
  const query = `
    SELECT
      id, username, phone, email, nickname, avatar,
      register_date, status, order_count, total_spent, balance,
      last_login_date, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY ${validSortBy} ${validSortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);
  const result = await pool.query(query, queryParams);

  return {
    list: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * 获取单个用户详情
 */
export async function getUserById(id: string) {
  const query = `
    SELECT
      id, username, phone, email, nickname, avatar,
      register_date, status, order_count, total_spent, balance,
      last_login_date, created_at, updated_at
    FROM users
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new Error('用户不存在');
  }

  return result.rows[0];
}

/**
 * 更新用户信息
 */
export async function updateUser(id: string, userData: Partial<User>) {
  const allowedFields = ['username', 'email', 'nickname', 'avatar', 'status', 'balance'];
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.keys(userData).forEach(key => {
    if (allowedFields.includes(key) && userData[key as keyof User] !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(userData[key as keyof User]);
      paramIndex++;
    }
  });

  if (updates.length === 0) {
    throw new Error('没有可更新的字段');
  }

  values.push(id);

  const query = `
    UPDATE users
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING
      id, username, phone, email, nickname, avatar,
      register_date, status, order_count, total_spent, balance,
      last_login_date, created_at, updated_at
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new Error('用户不存在');
  }

  return result.rows[0];
}

/**
 * 批量更新用户状态
 */
export async function batchUpdateUserStatus(ids: string[], status: string) {
  if (!['active', 'inactive', 'banned'].includes(status)) {
    throw new Error('无效的状态值');
  }

  const query = `
    UPDATE users
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ANY($2::varchar[])
    RETURNING id
  `;

  const result = await pool.query(query, [status, ids]);
  return { updated: result.rowCount };
}

/**
 * 删除用户 (软删除 - 设置为已删除状态)
 */
export async function deleteUser(id: string) {
  const query = `
    UPDATE users
    SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new Error('用户不存在');
  }

  return { id: result.rows[0].id };
}

/**
 * 获取用户统计信息
 */
export async function getUserStats() {
  const query = `
    SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE status = 'active') as active_users,
      COUNT(*) FILTER (WHERE status = 'inactive') as inactive_users,
      COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_new_users,
      COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days') as week_new_users,
      COUNT(*) FILTER (WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days') as month_new_users,
      SUM(order_count) as total_orders,
      SUM(total_spent) as total_revenue,
      AVG(order_count) as avg_orders_per_user,
      AVG(total_spent) as avg_spent_per_user
    FROM users
    WHERE status != 'deleted'
  `;

  const result = await pool.query(query);
  return result.rows[0];
}

/**
 * 导出用户数据
 */
export async function exportUsers(params: GetUsersParams = {}) {
  const { search = '', status } = params;
  const queryParams: any[] = [];
  let whereConditions: string[] = [];
  let paramIndex = 1;

  if (search) {
    whereConditions.push(`(
      username ILIKE $${paramIndex} OR
      phone ILIKE $${paramIndex} OR
      nickname ILIKE $${paramIndex} OR
      id ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    whereConditions.push(`status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const query = `
    SELECT
      id, username, phone, email, nickname,
      register_date, status, order_count, total_spent, balance,
      last_login_date, created_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, queryParams);
  return result.rows;
}
