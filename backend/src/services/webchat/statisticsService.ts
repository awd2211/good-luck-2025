/**
 * 客服统计服务层
 * 负责客服工作量、满意度、响应时间等统计数据的计算和存储
 */

import { query } from '../../config/database';
import type { CSAgentStatistics } from '../../types/webchat';

/**
 * 生成并保存客服的每日统计数据
 */
export const generateDailyStatistics = async (
  agentId: number,
  statDate: Date
): Promise<CSAgentStatistics> => {
  // 设置日期范围(当天00:00 - 23:59)
  const startOfDay = new Date(statDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(statDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 查询统计数据
  const statsResult = await query(
    `SELECT
       COUNT(DISTINCT cs.id) as total_sessions,
       COALESCE(AVG(user_satisfaction_rating), 0) as avg_satisfaction_rating,
       COUNT(cm.id) as total_messages_sent
     FROM chat_sessions cs
     LEFT JOIN chat_messages cm ON cs.id = cm.session_id AND cm.sender_type = 'agent'
     WHERE cs.agent_id = $1
       AND cs.started_at >= $2
       AND cs.started_at <= $3`,
    [agentId, startOfDay, endOfDay]
  );

  const stats = statsResult.rows[0];

  // 计算平均响应时间(首次回复时间)
  const responseTimeResult = await query(
    `WITH first_user_msg AS (
       SELECT cs.id as session_id, MIN(cm.created_at) as user_time
       FROM chat_sessions cs
       JOIN chat_messages cm ON cs.id = cm.session_id
       WHERE cs.agent_id = $1
         AND cs.started_at >= $2
         AND cs.started_at <= $3
         AND cm.sender_type = 'user'
       GROUP BY cs.id
     ),
     first_agent_response AS (
       SELECT fum.session_id, fum.user_time, MIN(cm.created_at) as agent_time
       FROM first_user_msg fum
       JOIN chat_messages cm ON fum.session_id = cm.session_id
       WHERE cm.sender_type = 'agent' AND cm.created_at > fum.user_time
       GROUP BY fum.session_id, fum.user_time
     )
     SELECT AVG(EXTRACT(EPOCH FROM (agent_time - user_time))) as avg_response_time
     FROM first_agent_response
     WHERE agent_time IS NOT NULL`,
    [agentId, startOfDay, endOfDay]
  );

  const avgResponseTime = responseTimeResult.rows[0]?.avg_response_time
    ? parseFloat(responseTimeResult.rows[0].avg_response_time)
    : null;

  // 计算平均会话时长
  const durationResult = await query(
    `SELECT AVG(EXTRACT(EPOCH FROM (closed_at - started_at))) as avg_duration
     FROM chat_sessions
     WHERE agent_id = $1
       AND started_at >= $2
       AND started_at <= $3
       AND closed_at IS NOT NULL`,
    [agentId, startOfDay, endOfDay]
  );

  const avgDuration = durationResult.rows[0]?.avg_duration
    ? parseFloat(durationResult.rows[0].avg_duration)
    : null;

  // 计算在线时长(从online_sessions表或状态变更日志)
  // 这里简化处理,假设客服当天在线时长为会话总时长
  const onlineDuration = avgDuration ? avgDuration * parseInt(stats.total_sessions) : 0;

  // 插入或更新统计数据
  const result = await query(
    `INSERT INTO cs_agent_statistics
     (agent_id, stat_date, total_sessions, avg_response_time_seconds,
      avg_session_duration_seconds, avg_satisfaction_rating,
      total_messages_sent, online_duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (agent_id, stat_date)
     DO UPDATE SET
       total_sessions = EXCLUDED.total_sessions,
       avg_response_time_seconds = EXCLUDED.avg_response_time_seconds,
       avg_session_duration_seconds = EXCLUDED.avg_session_duration_seconds,
       avg_satisfaction_rating = EXCLUDED.avg_satisfaction_rating,
       total_messages_sent = EXCLUDED.total_messages_sent,
       online_duration_seconds = EXCLUDED.online_duration_seconds,
       updated_at = NOW()
     RETURNING *`,
    [
      agentId,
      statDate,
      parseInt(stats.total_sessions),
      avgResponseTime,
      avgDuration,
      parseFloat(stats.avg_satisfaction_rating),
      parseInt(stats.total_messages_sent),
      onlineDuration
    ]
  );

  return result.rows[0];
};

/**
 * 批量生成所有客服的每日统计
 */
export const generateAllDailyStatistics = async (
  statDate: Date
): Promise<CSAgentStatistics[]> => {
  // 获取所有活跃客服
  const agentsResult = await query(
    'SELECT id FROM customer_service_agents WHERE is_active = true'
  );

  const statistics: CSAgentStatistics[] = [];

  for (const agent of agentsResult.rows) {
    const stat = await generateDailyStatistics(agent.id, statDate);
    statistics.push(stat);
  }

  return statistics;
};

/**
 * 获取客服的统计数据
 */
export const getAgentStatistics = async (
  agentId: number,
  startDate?: Date,
  endDate?: Date
): Promise<CSAgentStatistics[]> => {
  let whereClause = 'WHERE agent_id = $1';
  const params: any[] = [agentId];
  let paramIndex = 2;

  if (startDate) {
    whereClause += ` AND stat_date >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ` AND stat_date <= $${paramIndex++}`;
    params.push(endDate);
  }

  const result = await query(
    `SELECT * FROM cs_agent_statistics
     ${whereClause}
     ORDER BY stat_date DESC`,
    params
  );

  return result.rows;
};

/**
 * 获取客服的统计汇总
 */
export const getAgentSummary = async (
  agentId: number,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalSessions: number;
  avgResponseTime: number;
  avgSessionDuration: number;
  avgSatisfaction: number;
  totalMessages: number;
  totalOnlineHours: number;
}> => {
  let whereClause = 'WHERE agent_id = $1';
  const params: any[] = [agentId];
  let paramIndex = 2;

  if (startDate) {
    whereClause += ` AND stat_date >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ` AND stat_date <= $${paramIndex++}`;
    params.push(endDate);
  }

  const result = await query(
    `SELECT
       SUM(total_sessions) as total_sessions,
       AVG(avg_response_time_seconds) as avg_response_time,
       AVG(avg_session_duration_seconds) as avg_session_duration,
       AVG(avg_satisfaction_rating) as avg_satisfaction,
       SUM(total_messages_sent) as total_messages,
       SUM(online_duration_seconds) / 3600.0 as total_online_hours
     FROM cs_agent_statistics
     ${whereClause}`,
    params
  );

  const row = result.rows[0];

  return {
    totalSessions: parseInt(row.total_sessions || '0'),
    avgResponseTime: parseFloat(row.avg_response_time || '0'),
    avgSessionDuration: parseFloat(row.avg_session_duration || '0'),
    avgSatisfaction: parseFloat(row.avg_satisfaction || '0'),
    totalMessages: parseInt(row.total_messages || '0'),
    totalOnlineHours: parseFloat(row.total_online_hours || '0')
  };
};

/**
 * 获取团队统计排行榜
 */
export const getTeamLeaderboard = async (
  managerId?: number,
  startDate?: Date,
  endDate?: Date,
  orderBy: 'sessions' | 'satisfaction' | 'response_time' = 'sessions'
): Promise<Array<{
  agentId: number;
  agentName: string;
  totalSessions: number;
  avgSatisfaction: number;
  avgResponseTime: number;
  rank: number;
}>> => {
  let whereConditions: string[] = ['csa.is_active = true'];
  const params: any[] = [];
  let paramIndex = 1;

  if (managerId !== undefined) {
    whereConditions.push(`csa.manager_id = $${paramIndex++}`);
    params.push(managerId);
  }

  if (startDate) {
    whereConditions.push(`stats.stat_date >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`stats.stat_date <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  // 确定排序字段
  let orderByClause = '';
  switch (orderBy) {
    case 'satisfaction':
      orderByClause = 'ORDER BY avg_satisfaction DESC';
      break;
    case 'response_time':
      orderByClause = 'ORDER BY avg_response_time ASC';
      break;
    default:
      orderByClause = 'ORDER BY total_sessions DESC';
  }

  const result = await query(
    `SELECT
       csa.id as agent_id,
       csa.display_name as agent_name,
       SUM(stats.total_sessions) as total_sessions,
       AVG(stats.avg_satisfaction_rating) as avg_satisfaction,
       AVG(stats.avg_response_time_seconds) as avg_response_time,
       ROW_NUMBER() OVER (${orderByClause}) as rank
     FROM customer_service_agents csa
     LEFT JOIN cs_agent_statistics stats ON csa.id = stats.agent_id
     ${whereClause}
     GROUP BY csa.id, csa.display_name
     ${orderByClause}
     LIMIT 50`,
    params
  );

  return result.rows.map(row => ({
    agentId: row.agent_id,
    agentName: row.agent_name,
    totalSessions: parseInt(row.total_sessions || '0'),
    avgSatisfaction: parseFloat(row.avg_satisfaction || '0'),
    avgResponseTime: parseFloat(row.avg_response_time || '0'),
    rank: parseInt(row.rank)
  }));
};

/**
 * 获取实时统计概览
 */
export const getRealtimeOverview = async (): Promise<{
  onlineAgents: number;
  busyAgents: number;
  activeSessions: number;
  queuedSessions: number;
  avgWaitTime: number;
  todayTotalSessions: number;
  todayAvgSatisfaction: number;
}> => {
  // 客服状态统计
  const agentStatsResult = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'online') as online_agents,
       COUNT(*) FILTER (WHERE status = 'busy') as busy_agents
     FROM customer_service_agents
     WHERE is_active = true`
  );

  // 会话统计
  const sessionStatsResult = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'active') as active_sessions,
       COUNT(*) FILTER (WHERE status = 'queued') as queued_sessions,
       COALESCE(AVG(EXTRACT(EPOCH FROM (assigned_at - queued_at))) FILTER (WHERE assigned_at IS NOT NULL), 0) as avg_wait_time
     FROM chat_sessions`
  );

  // 今日统计
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStatsResult = await query(
    `SELECT
       COUNT(*) as total_sessions,
       COALESCE(AVG(user_satisfaction_rating), 0) as avg_satisfaction
     FROM chat_sessions
     WHERE created_at >= $1`,
    [today]
  );

  const agentStats = agentStatsResult.rows[0];
  const sessionStats = sessionStatsResult.rows[0];
  const todayStats = todayStatsResult.rows[0];

  return {
    onlineAgents: parseInt(agentStats.online_agents),
    busyAgents: parseInt(agentStats.busy_agents),
    activeSessions: parseInt(sessionStats.active_sessions),
    queuedSessions: parseInt(sessionStats.queued_sessions),
    avgWaitTime: parseFloat(sessionStats.avg_wait_time),
    todayTotalSessions: parseInt(todayStats.total_sessions),
    todayAvgSatisfaction: parseFloat(todayStats.avg_satisfaction)
  };
};

/**
 * 获取时段分布统计
 */
export const getHourlyDistribution = async (
  startDate?: Date,
  endDate?: Date
): Promise<Array<{ hour: number; sessionCount: number; avgSatisfaction: number }>> => {
  let whereConditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const result = await query(
    `SELECT
       EXTRACT(HOUR FROM created_at) as hour,
       COUNT(*) as session_count,
       COALESCE(AVG(user_satisfaction_rating), 0) as avg_satisfaction
     FROM chat_sessions
     ${whereClause}
     GROUP BY hour
     ORDER BY hour`,
    params
  );

  return result.rows.map(row => ({
    hour: parseInt(row.hour),
    sessionCount: parseInt(row.session_count),
    avgSatisfaction: parseFloat(row.avg_satisfaction)
  }));
};

/**
 * 获取满意度分布
 */
export const getSatisfactionDistribution = async (
  agentId?: number,
  startDate?: Date,
  endDate?: Date
): Promise<Array<{ rating: number; count: number; percentage: number }>> => {
  let whereConditions: string[] = ['user_satisfaction_rating IS NOT NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  if (agentId !== undefined) {
    whereConditions.push(`agent_id = $${paramIndex++}`);
    params.push(agentId);
  }

  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const result = await query(
    `SELECT
       user_satisfaction_rating as rating,
       COUNT(*) as count,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
     FROM chat_sessions
     ${whereClause}
     GROUP BY rating
     ORDER BY rating DESC`,
    params
  );

  return result.rows.map(row => ({
    rating: parseInt(row.rating),
    count: parseInt(row.count),
    percentage: parseFloat(row.percentage)
  }));
};

/**
 * 获取趋势数据(按日期)
 */
export const getTrendData = async (
  agentId?: number,
  startDate?: Date,
  endDate?: Date
): Promise<Array<{
  date: Date;
  sessions: number;
  avgSatisfaction: number;
  avgResponseTime: number;
}>> => {
  let whereConditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (agentId !== undefined) {
    whereConditions.push(`agent_id = $${paramIndex++}`);
    params.push(agentId);
  }

  if (startDate) {
    whereConditions.push(`stat_date >= $${paramIndex++}`);
    params.push(startDate);
  }

  if (endDate) {
    whereConditions.push(`stat_date <= $${paramIndex++}`);
    params.push(endDate);
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const result = await query(
    `SELECT
       stat_date as date,
       SUM(total_sessions) as sessions,
       AVG(avg_satisfaction_rating) as avg_satisfaction,
       AVG(avg_response_time_seconds) as avg_response_time
     FROM cs_agent_statistics
     ${whereClause}
     GROUP BY stat_date
     ORDER BY stat_date`,
    params
  );

  return result.rows.map(row => ({
    date: row.date,
    sessions: parseInt(row.sessions),
    avgSatisfaction: parseFloat(row.avg_satisfaction || '0'),
    avgResponseTime: parseFloat(row.avg_response_time || '0')
  }));
};

/**
 * 获取客服工作负载对比
 */
export const getWorkloadComparison = async (
  managerId?: number
): Promise<Array<{
  agentId: number;
  agentName: string;
  currentLoad: number;
  maxCapacity: number;
  utilizationRate: number;
  status: string;
}>> => {
  let whereClause = 'WHERE csa.is_active = true';
  const params: any[] = [];

  if (managerId !== undefined) {
    whereClause += ' AND csa.manager_id = $1';
    params.push(managerId);
  }

  const result = await query(
    `SELECT
       csa.id as agent_id,
       csa.display_name as agent_name,
       csa.current_chat_count as current_load,
       csa.max_concurrent_chats as max_capacity,
       CASE
         WHEN csa.max_concurrent_chats > 0 THEN ROUND(csa.current_chat_count * 100.0 / csa.max_concurrent_chats, 2)
         ELSE 0
       END as utilization_rate,
       csa.status
     FROM customer_service_agents csa
     ${whereClause}
     ORDER BY utilization_rate DESC`,
    params
  );

  return result.rows.map(row => ({
    agentId: row.agent_id,
    agentName: row.agent_name,
    currentLoad: parseInt(row.current_load),
    maxCapacity: parseInt(row.max_capacity),
    utilizationRate: parseFloat(row.utilization_rate),
    status: row.status
  }));
};

/**
 * 导出统计数据为CSV格式
 */
export const exportStatisticsCSV = async (
  agentId?: number,
  startDate?: Date,
  endDate?: Date
): Promise<string> => {
  const statistics = agentId
    ? await getAgentStatistics(agentId, startDate, endDate)
    : await query(
        `SELECT * FROM cs_agent_statistics
         WHERE stat_date >= COALESCE($1, '1970-01-01'::date)
           AND stat_date <= COALESCE($2, NOW()::date)
         ORDER BY agent_id, stat_date`,
        [startDate, endDate]
      ).then(res => res.rows);

  // 生成CSV头
  const headers = [
    'Agent ID',
    'Date',
    'Total Sessions',
    'Avg Response Time (s)',
    'Avg Session Duration (s)',
    'Avg Satisfaction',
    'Total Messages',
    'Online Duration (s)'
  ];

  // 生成CSV行
  const rows = statistics.map((stat: any) => [
    stat.agent_id,
    stat.stat_date.toISOString().split('T')[0],
    stat.total_sessions,
    stat.avg_response_time_seconds || '',
    stat.avg_session_duration_seconds || '',
    stat.avg_satisfaction_rating || '',
    stat.total_messages_sent,
    stat.online_duration_seconds
  ]);

  // 合并为CSV
  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  return csv;
};
