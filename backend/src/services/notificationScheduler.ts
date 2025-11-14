/**
 * 通知定时发送调度器
 */

import pool from '../config/database';
import * as cron from 'node-cron';

// 每分钟检查一次待发送的定时通知
const SCHEDULER_INTERVAL = '* * * * *'; // 每分钟

/**
 * 获取待发送的定时通知
 */
async function getPendingScheduledNotifications() {
  const query = `
    SELECT id, title, content, type, priority, target,
           start_date, end_date, created_by, template_id
    FROM notifications
    WHERE is_scheduled = TRUE
      AND status = 'active'
      AND scheduled_time <= NOW()
      AND (sent_at IS NULL OR sent_at < scheduled_time)
    ORDER BY scheduled_time ASC
    LIMIT 100
  `;

  const result = await pool.query(query);
  return result.rows;
}

/**
 * 发送通知给目标用户
 */
async function sendNotificationToUsers(notification: any) {
  const { id, target, start_date, end_date } = notification;

  let userQuery = 'SELECT id FROM users WHERE status = $1';
  const queryParams: any[] = ['active'];

  // 根据目标用户类型构建查询
  if (target === 'vip') {
    userQuery += ' AND is_vip = TRUE';
  } else if (target === 'new') {
    userQuery += ' AND created_at > NOW() - INTERVAL \'7 days\'';
  }
  // target = 'all' 则不添加额外条件

  const userResult = await pool.query(userQuery, queryParams);
  const totalSent = userResult.rows.length;

  // 更新通知发送记录
  await pool.query(
    `UPDATE notifications
     SET sent_at = NOW(),
         total_sent = $1,
         is_scheduled = FALSE
     WHERE id = $2`,
    [totalSent, id]
  );

  // 记录发送日志
  await pool.query(
    `INSERT INTO notification_send_logs (
      notification_id, target_type, total_sent, sent_at
    ) VALUES ($1, $2, $3, NOW())`,
    [id, target, totalSent]
  );

  console.log(`✅ 定时通知已发送: ID=${id}, 标题="${notification.title}", 发送数=${totalSent}`);

  return totalSent;
}

/**
 * 处理定时通知
 */
async function processScheduledNotifications() {
  try {
    const notifications = await getPendingScheduledNotifications();

    if (notifications.length === 0) {
      return;
    }

    console.log(`📬 发现 ${notifications.length} 条待发送的定时通知`);

    for (const notification of notifications) {
      try {
        await sendNotificationToUsers(notification);
      } catch (error) {
        console.error(`❌ 发送定时通知失败: ID=${notification.id}`, error);

        // 记录失败日志
        await pool.query(
          `INSERT INTO notification_send_logs (
            notification_id, target_type, total_sent, sent_at, error_message
          ) VALUES ($1, $2, 0, NOW(), $3)`,
          [notification.id, notification.target, error instanceof Error ? error.message : '未知错误']
        );
      }
    }
  } catch (error) {
    console.error('❌ 处理定时通知时出错:', error);
  }
}

/**
 * 启动定时任务调度器
 */
export function startNotificationScheduler() {
  console.log('🕐 启动通知定时发送调度器...');

  // 使用 node-cron 创建定时任务
  const task = cron.schedule(SCHEDULER_INTERVAL, async () => {
    await processScheduledNotifications();
  });

  console.log(`✅ 通知调度器已启动 (间隔: ${SCHEDULER_INTERVAL})`);

  return task;
}

/**
 * 停止调度器
 */
export function stopNotificationScheduler(task: cron.ScheduledTask) {
  task.stop();
  console.log('🛑 通知调度器已停止');
}

/**
 * 立即执行一次调度（用于测试）
 */
export async function runSchedulerOnce() {
  console.log('🔄 手动执行一次通知调度...');
  await processScheduledNotifications();
}
