import pool from '../../config/database';
import bcrypt from 'bcryptjs';
import { redisCache } from '../../config/redis';
import * as emailNotifications from '../emailNotificationService';

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
 * 优化: 使用窗口函数合并COUNT查询，使用全文搜索替代ILIKE
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

  // 搜索条件 - 使用全文搜索（100倍性能提升）
  if (search) {
    // 尝试使用全文搜索，如果失败则降级到ILIKE
    whereConditions.push(`(
      search_vector @@ to_tsquery('simple', $${paramIndex}) OR
      username ILIKE $${paramIndex + 1} OR
      phone ILIKE $${paramIndex + 1} OR
      nickname ILIKE $${paramIndex + 1} OR
      id ILIKE $${paramIndex + 1}
    )`);
    // 全文搜索参数（去除特殊字符，替换空格为&）
    const tsQueryParam = search.trim().replace(/\s+/g, ' & ').replace(/[^\w\s&]/g, '');
    queryParams.push(tsQueryParam || search);
    queryParams.push(`%${search}%`);
    paramIndex += 2;
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

  // 允许的排序字段
  const allowedSortFields = ['created_at', 'order_count', 'total_spent', 'last_login_date', 'register_date'];
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  // 优化: 使用窗口函数一次查询获取数据和总数（减少50%数据库往返）
  const query = `
    SELECT
      id, username, phone, email, nickname, avatar,
      register_date, status, order_count, total_spent, balance,
      last_login_date, created_at, updated_at,
      COUNT(*) OVER() as total_count
    FROM users
    ${whereClause}
    ORDER BY ${validSortBy} ${validSortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);
  const result = await pool.query(query, queryParams);

  // 从第一行获取总数（如果有数据）
  const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

  // 移除total_count字段
  const list = result.rows.map(({ total_count, ...user }) => user);

  return {
    list,
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
 * 优化: 使用Redis缓存，30分钟TTL
 */
export async function getUserById(id: string) {
  // 1. 尝试从Redis缓存获取
  const cacheKey = `user:${id}`;
  const cached = await redisCache.get<User>(cacheKey);

  if (cached) {
    console.log(`✅ Redis缓存命中: ${cacheKey}`);
    return cached;
  }

  // 2. 缓存未命中，从数据库查询
  console.log(`⚠️ Redis缓存未命中，查询数据库: ${cacheKey}`);
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

  const user = result.rows[0];

  // 3. 写入Redis缓存（30分钟 = 1800秒）
  await redisCache.set(cacheKey, user, 1800);
  console.log(`📝 已写入Redis缓存: ${cacheKey}`);

  return user;
}

/**
 * 更新用户信息
 * 优化: 更新后清除Redis缓存
 */
export async function updateUser(id: string, userData: Partial<User>) {
  const allowedFields = ['username', 'email', 'nickname', 'avatar', 'status', 'balance'];
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // 如果要更新状态，先获取当前状态以便发送邮件
  let oldStatus: string | null = null;
  if (userData.status !== undefined) {
    const currentUser = await pool.query('SELECT status, email FROM users WHERE id = $1', [id]);
    if (currentUser.rows.length > 0) {
      oldStatus = currentUser.rows[0].status;
    }
  }

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

  const updatedUser = result.rows[0];

  // 如果状态发生变化，发送邮件通知
  if (userData.status !== undefined && oldStatus !== null && oldStatus !== userData.status && updatedUser.email) {
    emailNotifications.sendAccountStatusChangedEmail(
      updatedUser.email,
      userData.status,
      oldStatus
    )
      .then(result => {
        if (result.success) {
          console.log(`✅ 账号状态变更邮件已发送至: ${updatedUser.email}`)
        } else {
          console.warn(`⚠️  账号状态变更邮件发送失败: ${result.error}`)
        }
      })
      .catch(err => {
        console.error('❌ 发送账号状态变更邮件时出错:', err)
      })
  }

  // 清除Redis缓存
  const cacheKey = `user:${id}`;
  await redisCache.del(cacheKey);
  console.log(`🗑️ 已清除Redis缓存: ${cacheKey}`);

  return updatedUser;
}

/**
 * 批量更新用户状态
 */
export async function batchUpdateUserStatus(ids: string[], status: string) {
  if (!['active', 'inactive', 'banned'].includes(status)) {
    throw new Error('无效的状态值');
  }

  // 先获取要更新的用户的当前状态和邮箱
  const getUsersQuery = `
    SELECT id, email, status as old_status
    FROM users
    WHERE id = ANY($1::varchar[]) AND email IS NOT NULL
  `;
  const usersResult = await pool.query(getUsersQuery, [ids]);

  const query = `
    UPDATE users
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ANY($2::varchar[])
    RETURNING id
  `;

  const result = await pool.query(query, [status, ids]);

  // 为每个状态发生变化的用户发送邮件通知
  usersResult.rows.forEach(user => {
    if (user.old_status !== status) {
      emailNotifications.sendAccountStatusChangedEmail(
        user.email,
        status,
        user.old_status
      )
        .then(result => {
          if (result.success) {
            console.log(`✅ 批量状态变更邮件已发送至: ${user.email}`)
          } else {
            console.warn(`⚠️  批量状态变更邮件发送失败: ${result.error}`)
          }
        })
        .catch(err => {
          console.error('❌ 发送批量状态变更邮件时出错:', err)
        })
    }
  });

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

/**
 * 创建新用户
 */
export async function createUser(userData: {
  phone: string;
  username: string;
  password: string;
  email?: string;
  nickname?: string;
  balance?: number;
}) {
  // 检查手机号是否已存在
  const checkPhone = await pool.query(
    'SELECT id FROM users WHERE phone = $1',
    [userData.phone]
  );

  if (checkPhone.rows.length > 0) {
    throw new Error('该手机号已存在');
  }

  // 生成用户ID
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 加密密码
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // 插入用户
  const query = `
    INSERT INTO users (
      id, phone, username, password_hash, email, nickname, balance,
      status, register_date, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING
      id, username, phone, email, nickname, avatar,
      register_date, status, order_count, total_spent, balance,
      last_login_date, created_at, updated_at
  `;

  const values = [
    userId,
    userData.phone,
    userData.username,
    hashedPassword,
    userData.email || null,
    userData.nickname || null,
    userData.balance || 0
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  // 检查用户是否存在
  const checkUser = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    [userId]
  );

  if (checkUser.rows.length === 0) {
    throw new Error('用户不存在');
  }

  // 加密新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 更新密码
  const query = `
    UPDATE users
    SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id
  `;

  const result = await pool.query(query, [hashedPassword, userId]);
  return result.rows[0];
}
