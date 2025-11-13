import pool from '../config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface AdminData {
  id?: string;
  username: string;
  password?: string;
  role: 'super_admin' | 'manager' | 'editor' | 'viewer';
  email: string;
}

export const getAllAdmins = async (filters?: {
  page?: number;
  pageSize?: number;
  role?: string;
  search?: string;
}) => {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 10;
  const offset = (page - 1) * pageSize;

  let query = 'SELECT id, username, role, email, created_at, updated_at FROM admins WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.role) {
    query += ` AND role = $${paramIndex}`;
    params.push(filters.role);
    paramIndex++;
  }

  if (filters?.search) {
    query += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  // 获取总数
  const countQuery = query.replace('SELECT id, username, role, email, created_at, updated_at', 'SELECT COUNT(*)');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // 分页查询
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pageSize, offset);

  const result = await pool.query(query, params);

  return {
    data: result.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getAdminById = async (id: string) => {
  const result = await pool.query(
    'SELECT id, username, role, email, created_at, updated_at FROM admins WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

export const getAdminByUsername = async (username: string) => {
  const result = await pool.query(
    'SELECT * FROM admins WHERE username = $1',
    [username]
  );
  return result.rows[0] || null;
};

export const createAdmin = async (data: AdminData) => {
  const id = `admin-${uuidv4().slice(0, 8)}`;

  // 检查用户名是否已存在
  const existingAdmin = await getAdminByUsername(data.username);
  if (existingAdmin) {
    throw new Error('用户名已存在');
  }

  // 检查邮箱是否已存在
  const existingEmail = await pool.query('SELECT id FROM admins WHERE email = $1', [data.email]);
  if (existingEmail.rows.length > 0) {
    throw new Error('邮箱已存在');
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

  const result = await pool.query(
    `INSERT INTO admins (id, username, password, role, email, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, username, role, email, created_at, updated_at`,
    [id, data.username, hashedPassword, data.role, data.email]
  );

  return result.rows[0];
};

export const updateAdmin = async (id: string, data: Partial<AdminData>) => {
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.username !== undefined) {
    // 检查用户名是否被其他管理员使用
    const existing = await pool.query(
      'SELECT id FROM admins WHERE username = $1 AND id != $2',
      [data.username, id]
    );
    if (existing.rows.length > 0) {
      throw new Error('用户名已存在');
    }
    updateFields.push(`username = $${paramIndex}`);
    values.push(data.username);
    paramIndex++;
  }

  if (data.email !== undefined) {
    // 检查邮箱是否被其他管理员使用
    const existing = await pool.query(
      'SELECT id FROM admins WHERE email = $1 AND id != $2',
      [data.email, id]
    );
    if (existing.rows.length > 0) {
      throw new Error('邮箱已存在');
    }
    updateFields.push(`email = $${paramIndex}`);
    values.push(data.email);
    paramIndex++;
  }

  if (data.role !== undefined) {
    updateFields.push(`role = $${paramIndex}`);
    values.push(data.role);
    paramIndex++;
  }

  if (data.password) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    updateFields.push(`password = $${paramIndex}`);
    values.push(hashedPassword);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    throw new Error('没有可更新的字段');
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE admins
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, username, role, email, created_at, updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const deleteAdmin = async (id: string) => {
  // 不允许删除超级管理员
  const admin = await getAdminById(id);
  if (admin && admin.role === 'super_admin') {
    throw new Error('不能删除超级管理员');
  }

  const result = await pool.query('DELETE FROM admins WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
};

export const getAdminStats = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admin_count,
      COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_count,
      COUNT(CASE WHEN role = 'editor' THEN 1 END) as editor_count,
      COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewer_count
    FROM admins
  `);
  return result.rows[0];
};
