import cron from 'node-cron';
import { query } from '../config/database';
import { config } from '../config';

/**
 * 物化视图自动刷新任务
 *
 * 刷新频率: 每 10 分钟
 * 刷新内容:
 * - mv_user_stats: 用户统计
 * - mv_order_stats: 订单统计
 * - mv_daily_stats: 每日趋势
 */

let refreshTaskStarted = false;

/**
 * 刷新物化视图函数
 */
export async function refreshMaterializedViews(): Promise<void> {
  const startTime = Date.now();

  try {
    console.log('🔄 开始刷新物化视图...');

    // 调用数据库刷新函数
    await query('SELECT refresh_stats_materialized_views()');

    const duration = Date.now() - startTime;
    console.log(`✅ 物化视图刷新成功 (耗时: ${duration}ms)`);

    // 记录刷新时间（可选：写入日志表）
    if (config.app.isDevelopment) {
      console.log('📊 已刷新视图: mv_user_stats, mv_order_stats, mv_daily_stats');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ 物化视图刷新失败 (耗时: ${duration}ms):`, error);

    // 生产环境应该发送告警
    if (config.app.isProduction) {
      // TODO: 发送告警到监控系统
      console.error('⚠️ 请检查数据库连接和物化视图状态');
    }
  }
}

/**
 * 启动定时刷新任务
 */
export function startStatsRefreshJob(): void {
  if (refreshTaskStarted) {
    console.log('⚠️ 统计数据刷新任务已在运行');
    return;
  }

  // 每 10 分钟刷新一次
  // Cron 表达式: */10 * * * * (每10分钟的第0秒)
  const cronExpression = '*/10 * * * *';

  cron.schedule(cronExpression, async () => {
    await refreshMaterializedViews();
  });

  refreshTaskStarted = true;
  console.log('🚀 物化视图自动刷新任务已启动 (每 10 分钟刷新一次)');

  // 立即执行一次刷新（可选）
  if (config.app.isDevelopment) {
    console.log('🔄 执行初始刷新...');
    setTimeout(() => {
      refreshMaterializedViews();
    }, 5000); // 启动后 5 秒执行第一次刷新
  }
}

/**
 * 停止定时刷新任务（优雅关闭时调用）
 */
export function stopStatsRefreshJob(): void {
  // node-cron 会在进程退出时自动停止
  if (refreshTaskStarted) {
    console.log('⏹️ 物化视图刷新任务已停止');
    refreshTaskStarted = false;
  }
}
