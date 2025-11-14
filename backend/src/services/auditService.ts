/**
 * 审计日志服务 - 数据库持久化版本
 */

import pool from '../config/database';

export interface AuditLog {
  id?: number;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestUrl?: string;
  requestBody?: string;
  responseStatus?: number;
  responseTime?: number;
  status: 'success' | 'failed' | 'warning';
  level: 'info' | 'warning' | 'error';
  createdAt?: Date;
}

export interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  userId?: string;
  username?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  status?: string;
  level?: string;
  startDate?: string;
  endDate?: string;
  search?: string; // 全文搜索
}

export interface AuditLogStats {
  totalLogs: number;
  successCount: number;
  failedCount: number;
  warningCount: number;
  actionDistribution: Array<{ action: string; count: number }>;
  userActivity: Array<{ username: string; count: number }>;
  avgResponseTime: number;
  todayCount: number;
  weekCount: number;
}

/**
 * 添加审计日志
 */
export const addAuditLog = async (logData: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> => {
  try {
    const query = `
      INSERT INTO audit_logs (
        user_id, username, action, resource, resource_id, details,
        ip_address, user_agent, request_method, request_url, request_body,
        response_status, response_time, status, level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      logData.userId,
      logData.username,
      logData.action,
      logData.resource,
      logData.resourceId || null,
      logData.details || null,
      logData.ipAddress || null,
      logData.userAgent || null,
      logData.requestMethod || null,
      logData.requestUrl || null,
      logData.requestBody || null,
      logData.responseStatus || null,
      logData.responseTime || null,
      logData.status,
      logData.level
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('添加审计日志失败:', error);
    throw error;
  }
};

/**
 * 获取审计日志（支持分页和筛选）
 */
export const getAuditLogs = async (filters?: AuditLogFilters) => {
  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }

    if (filters?.username) {
      conditions.push(`username ILIKE $${paramIndex++}`);
      params.push(`%${filters.username}%`);
    }

    if (filters?.action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(filters.action);
    }

    if (filters?.resource) {
      conditions.push(`resource ILIKE $${paramIndex++}`);
      params.push(`%${filters.resource}%`);
    }

    if (filters?.resourceId) {
      conditions.push(`resource_id = $${paramIndex++}`);
      params.push(filters.resourceId);
    }

    if (filters?.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters?.level) {
      conditions.push(`level = $${paramIndex++}`);
      params.push(filters.level);
    }

    if (filters?.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    // 全文搜索
    if (filters?.search) {
      conditions.push(`(
        username ILIKE $${paramIndex} OR
        action ILIKE $${paramIndex} OR
        resource ILIKE $${paramIndex} OR
        details ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // 查询数据
    const dataQuery = `
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(pageSize, offset);

    const dataResult = await pool.query(dataQuery, params);

    return {
      data: dataResult.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('获取审计日志失败:', error);
    throw error;
  }
};

/**
 * 获取单条日志详情
 */
export const getAuditLogById = async (id: number): Promise<AuditLog | null> => {
  try {
    const query = 'SELECT * FROM audit_logs WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('获取日志详情失败:', error);
    throw error;
  }
};

/**
 * 获取审计日志统计
 */
export const getAuditLogStats = async (): Promise<AuditLogStats> => {
  try {
    // 总数和状态统计
    const statsQuery = `
      SELECT
        COUNT(*) as total_logs,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_count,
        AVG(response_time) as avg_response_time
      FROM audit_logs
    `;
    const statsResult = await pool.query(statsQuery);

    // 操作类型分布
    const actionQuery = `
      SELECT action, COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;
    const actionResult = await pool.query(actionQuery);

    // 用户活跃度
    const userQuery = `
      SELECT username, COUNT(*) as count
      FROM audit_logs
      GROUP BY username
      ORDER BY count DESC
      LIMIT 10
    `;
    const userResult = await pool.query(userQuery);

    // 今日和本周统计
    const todayQuery = `
      SELECT COUNT(*) as today_count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE
    `;
    const todayResult = await pool.query(todayQuery);

    const weekQuery = `
      SELECT COUNT(*) as week_count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `;
    const weekResult = await pool.query(weekQuery);

    return {
      totalLogs: parseInt(statsResult.rows[0].total_logs),
      successCount: parseInt(statsResult.rows[0].success_count),
      failedCount: parseInt(statsResult.rows[0].failed_count),
      warningCount: parseInt(statsResult.rows[0].warning_count),
      actionDistribution: actionResult.rows,
      userActivity: userResult.rows,
      avgResponseTime: parseFloat(statsResult.rows[0].avg_response_time) || 0,
      todayCount: parseInt(todayResult.rows[0].today_count),
      weekCount: parseInt(weekResult.rows[0].week_count)
    };
  } catch (error) {
    console.error('获取日志统计失败:', error);
    throw error;
  }
};

/**
 * 清理审计日志（归档）
 */
export const archiveAuditLogs = async (daysToKeep: number = 90): Promise<number> => {
  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 归档到 audit_logs_archive
      const archiveQuery = `
        INSERT INTO audit_logs_archive
        SELECT * FROM audit_logs
        WHERE created_at < CURRENT_DATE - INTERVAL '${daysToKeep} days'
      `;
      const archiveResult = await client.query(archiveQuery);

      // 删除已归档的记录
      const deleteQuery = `
        DELETE FROM audit_logs
        WHERE created_at < CURRENT_DATE - INTERVAL '${daysToKeep} days'
      `;
      const deleteResult = await client.query(deleteQuery);

      await client.query('COMMIT');

      return deleteResult.rowCount || 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('归档审计日志失败:', error);
    throw error;
  }
};

/**
 * 获取归档日志
 */
export const getArchivedLogs = async (filters?: AuditLogFilters) => {
  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM audit_logs_archive ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const dataQuery = `
      SELECT * FROM audit_logs_archive
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(pageSize, offset);

    const dataResult = await pool.query(dataQuery, params);

    return {
      data: dataResult.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('获取归档日志失败:', error);
    throw error;
  }
};

/**
 * 检测异常日志
 */
export const detectAnomalies = async (): Promise<{
  highFailureRate: boolean;
  slowResponses: number;
  suspiciousActivities: AuditLog[];
}> => {
  try {
    // 检查最近10分钟的失败率
    const failureQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM audit_logs
      WHERE created_at >= NOW() - INTERVAL '10 minutes'
    `;
    const failureResult = await pool.query(failureQuery);
    const total = parseInt(failureResult.rows[0].total);
    const failed = parseInt(failureResult.rows[0].failed);
    const highFailureRate = total > 0 && (failed / total) > 0.3; // 失败率超过30%

    // 检查响应时间过长的请求
    const slowQuery = `
      SELECT COUNT(*) as slow_count
      FROM audit_logs
      WHERE response_time > 5000
      AND created_at >= NOW() - INTERVAL '1 hour'
    `;
    const slowResult = await pool.query(slowQuery);
    const slowResponses = parseInt(slowResult.rows[0].slow_count);

    // 检查可疑活动(短时间内大量失败登录)
    const suspiciousQuery = `
      SELECT *
      FROM audit_logs
      WHERE action = '登录'
      AND status = 'failed'
      AND created_at >= NOW() - INTERVAL '30 minutes'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const suspiciousResult = await pool.query(suspiciousQuery);

    return {
      highFailureRate,
      slowResponses,
      suspiciousActivities: suspiciousResult.rows
    };
  } catch (error) {
    console.error('检测异常失败:', error);
    throw error;
  }
};

/**
 * 获取操作趋势(用于图表)
 */
export const getActionTrend = async (days: number = 7) => {
  try {
    const query = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('获取操作趋势失败:', error);
    throw error;
  }
};
