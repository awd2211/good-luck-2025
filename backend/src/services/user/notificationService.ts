/**
 * 用户通知服务
 */

import pool from '../../config/database';

/**
 * 获取用户通知列表
 */
export async function getUserNotifications(params: {
  userId: string;
  unreadOnly?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<{
  notifications: any[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let whereConditions = [
    "n.status = 'active'",
    "(n.start_date IS NULL OR n.start_date <= NOW())",
    "(n.end_date IS NULL OR n.end_date >= NOW())",
    "(n.target = 'all' OR n.target = $1)" // 假设将来可能有针对性推送
  ];

  const queryParams: any[] = [params.userId];
  let paramIndex = 2;

  if (params.unreadOnly) {
    whereConditions.push(`(unr.is_read IS NULL OR unr.is_read = FALSE)`);
  }

  if (params.type) {
    whereConditions.push(`n.type = $${paramIndex}`);
    queryParams.push(params.type);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // 查询通知列表
  const listQuery = `
    SELECT
      n.id,
      n.title,
      n.content,
      n.type,
      n.priority,
      n.created_at,
      n.start_date,
      n.end_date,
      COALESCE(unr.is_read, FALSE) as is_read,
      COALESCE(unr.is_clicked, FALSE) as is_clicked,
      unr.read_at,
      unr.clicked_at
    FROM notifications n
    LEFT JOIN user_notification_reads unr ON n.id = unr.notification_id AND unr.user_id = $1
    WHERE ${whereClause}
    ORDER BY n.priority DESC, n.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);

  const listResult = await pool.query(listQuery, queryParams);

  // 查询总数
  const countQuery = `
    SELECT COUNT(*) as total
    FROM notifications n
    LEFT JOIN user_notification_reads unr ON n.id = unr.notification_id AND unr.user_id = $1
    WHERE ${whereClause}
  `;

  const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
  const total = parseInt(countResult.rows[0].total);

  return {
    notifications: listResult.rows,
    total,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 获取用户未读通知数量
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const query = `
    SELECT COUNT(*) as count
    FROM notifications n
    LEFT JOIN user_notification_reads unr ON n.id = unr.notification_id AND unr.user_id = $1
    WHERE n.status = 'active'
      AND (n.start_date IS NULL OR n.start_date <= NOW())
      AND (n.end_date IS NULL OR n.end_date >= NOW())
      AND (n.target = 'all' OR n.target = $1)
      AND (unr.is_read IS NULL OR unr.is_read = FALSE)
  `;

  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].count);
}

/**
 * 标记通知为已读
 */
export async function markAsRead(params: {
  userId: string;
  notificationId: number;
}): Promise<void> {
  const query = `
    INSERT INTO user_notification_reads (user_id, notification_id, is_read, read_at)
    VALUES ($1, $2, TRUE, NOW())
    ON CONFLICT (user_id, notification_id)
    DO UPDATE SET is_read = TRUE, read_at = NOW()
  `;

  await pool.query(query, [params.userId, params.notificationId]);

  // 更新通知的已读计数
  await pool.query(
    `UPDATE notifications SET read_count = read_count + 1 WHERE id = $1`,
    [params.notificationId]
  );
}

/**
 * 标记所有通知为已读
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 获取所有未读通知ID
    const unreadQuery = `
      SELECT n.id
      FROM notifications n
      LEFT JOIN user_notification_reads unr ON n.id = unr.notification_id AND unr.user_id = $1
      WHERE n.status = 'active'
        AND (n.start_date IS NULL OR n.start_date <= NOW())
        AND (n.end_date IS NULL OR n.end_date >= NOW())
        AND (n.target = 'all' OR n.target = $1)
        AND (unr.is_read IS NULL OR unr.is_read = FALSE)
    `;

    const unreadResult = await client.query(unreadQuery, [userId]);
    const notificationIds = unreadResult.rows.map((row: any) => row.id);

    if (notificationIds.length === 0) {
      await client.query('COMMIT');
      return;
    }

    // 批量插入/更新阅读记录
    const values = notificationIds.map((id: number) => `('${userId}', ${id}, TRUE, NOW())`).join(',');
    const insertQuery = `
      INSERT INTO user_notification_reads (user_id, notification_id, is_read, read_at)
      VALUES ${values}
      ON CONFLICT (user_id, notification_id)
      DO UPDATE SET is_read = TRUE, read_at = NOW()
    `;

    await client.query(insertQuery);

    // 更新通知的已读计数
    const updateQuery = `
      UPDATE notifications
      SET read_count = read_count + 1
      WHERE id = ANY($1)
    `;

    await client.query(updateQuery, [notificationIds]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 记录通知点击
 */
export async function recordClick(params: {
  userId: string;
  notificationId: number;
}): Promise<void> {
  const query = `
    INSERT INTO user_notification_reads (user_id, notification_id, is_clicked, clicked_at)
    VALUES ($1, $2, TRUE, NOW())
    ON CONFLICT (user_id, notification_id)
    DO UPDATE SET is_clicked = TRUE, clicked_at = NOW()
  `;

  await pool.query(query, [params.userId, params.notificationId]);

  // 更新通知的点击计数
  await pool.query(
    `UPDATE notifications SET click_count = click_count + 1 WHERE id = $1`,
    [params.notificationId]
  );
}

/**
 * 删除用户通知记录（软删除，实际上只是标记为不再显示）
 */
export async function deleteUserNotification(params: {
  userId: string;
  notificationId: number;
}): Promise<void> {
  // 这里我们不真正删除通知，而是标记为已读且不再显示
  // 可以通过在 user_notification_reads 表中添加 deleted 字段来实现
  // 暂时先标记为已读
  await markAsRead(params);
}

/**
 * 创建通知（用于系统发送通知）
 */
export async function createNotification(params: {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority?: number;
  target?: string;
  startDate?: Date;
  endDate?: Date;
  templateId?: number;
}): Promise<number> {
  const query = `
    INSERT INTO notifications (
      title, content, type, priority, target,
      start_date, end_date, template_id, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
    RETURNING id
  `;

  const result = await pool.query(query, [
    params.title,
    params.content,
    params.type,
    params.priority || 0,
    params.target || 'all',
    params.startDate || null,
    params.endDate || null,
    params.templateId || null,
  ]);

  return result.rows[0].id;
}

/**
 * 根据模板创建通知
 */
export async function createNotificationFromTemplate(params: {
  templateId: number;
  variables: Record<string, string>;
  target?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<number> {
  // 获取模板
  const templateQuery = `SELECT * FROM notification_templates WHERE id = $1`;
  const templateResult = await pool.query(templateQuery, [params.templateId]);

  if (templateResult.rows.length === 0) {
    throw new Error('模板不存在');
  }

  const template = templateResult.rows[0];

  // 替换变量
  let title = template.title;
  let content = template.content;

  for (const [key, value] of Object.entries(params.variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    title = title.replace(regex, value);
    content = content.replace(regex, value);
  }

  // 创建通知
  return createNotification({
    title,
    content,
    type: template.type,
    priority: template.priority,
    target: params.target || template.target,
    startDate: params.startDate,
    endDate: params.endDate,
    templateId: params.templateId,
  });
}
