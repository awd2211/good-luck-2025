/**
 * 客服绩效统计服务层
 * 负责客服绩效数据的聚合、查询、报表生成等业务逻辑
 */

import { query } from '../../config/database';

export interface DailyPerformance {
  id: number;
  agent_id: number;
  stat_date: string;
  total_sessions: number;
  completed_sessions: number;
  transferred_out: number;
  transferred_in: number;
  online_duration: number;
  avg_response_time: number;
  avg_session_duration: number;
  avg_satisfaction_rating: number | null;
  satisfaction_count: number;
  five_star_count: number;
  one_star_count: number;
  avg_quality_score: number | null;
  quality_inspection_count: number;
  total_messages_sent: number;
  total_messages_received: number;
  quick_reply_usage: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * 更新或创建当日绩效数据
 */
export const upsertDailyPerformance = async (
  agentId: number,
  statDate: string,
  data: Partial<DailyPerformance>
): Promise<DailyPerformance> => {
  const fields = Object.keys(data).filter(k => k !== 'agent_id' && k !== 'stat_date');
  const values = fields.map(k => (data as any)[k]);

  const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');

  const result = await query(
    `INSERT INTO cs_performance_daily_stats
     (agent_id, stat_date, ${fields.join(', ')})
     VALUES ($1, $2, ${fields.map((_, i) => `$${i + 3}`).join(', ')})
     ON CONFLICT (agent_id, stat_date)
     DO UPDATE SET ${setClause}, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [agentId, statDate, ...values, ...values]
  );

  return result.rows[0];
};

/**
 * 增量更新绩效数据
 */
export const incrementPerformanceStats = async (
  agentId: number,
  statDate: string,
  increments: {
    totalSessions?: number;
    completedSessions?: number;
    transferredOut?: number;
    transferredIn?: number;
    onlineDuration?: number;
    totalMessagesSent?: number;
    totalMessagesReceived?: number;
    quickReplyUsage?: number;
  }
): Promise<void> => {
  const updates: string[] = [];
  const params: any[] = [agentId, statDate];
  let paramIndex = 3;

  if (increments.totalSessions) {
    updates.push(`total_sessions = total_sessions + $${paramIndex++}`);
    params.push(increments.totalSessions);
  }

  if (increments.completedSessions) {
    updates.push(`completed_sessions = completed_sessions + $${paramIndex++}`);
    params.push(increments.completedSessions);
  }

  if (increments.transferredOut) {
    updates.push(`transferred_out = transferred_out + $${paramIndex++}`);
    params.push(increments.transferredOut);
  }

  if (increments.transferredIn) {
    updates.push(`transferred_in = transferred_in + $${paramIndex++}`);
    params.push(increments.transferredIn);
  }

  if (increments.onlineDuration) {
    updates.push(`online_duration = online_duration + $${paramIndex++}`);
    params.push(increments.onlineDuration);
  }

  if (increments.totalMessagesSent) {
    updates.push(`total_messages_sent = total_messages_sent + $${paramIndex++}`);
    params.push(increments.totalMessagesSent);
  }

  if (increments.totalMessagesReceived) {
    updates.push(`total_messages_received = total_messages_received + $${paramIndex++}`);
    params.push(increments.totalMessagesReceived);
  }

  if (increments.quickReplyUsage) {
    updates.push(`quick_reply_usage = quick_reply_usage + $${paramIndex++}`);
    params.push(increments.quickReplyUsage);
  }

  if (updates.length === 0) return;

  await query(
    `INSERT INTO cs_performance_daily_stats (agent_id, stat_date)
     VALUES ($1, $2)
     ON CONFLICT (agent_id, stat_date)
     DO UPDATE SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP`,
    params
  );
};

/**
 * 聚合计算平均值(响应时间、会话时长等)
 */
export const aggregateAverages = async (
  agentId: number,
  statDate: string
): Promise<void> => {
  // 计算平均响应时间和会话时长
  const avgResult = await query(
    `SELECT
       AVG(EXTRACT(EPOCH FROM (first_response_at - queued_at))) as avg_response_time,
       AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_session_duration
     FROM chat_sessions
     WHERE assigned_agent_id = $1
       AND DATE(created_at) = $2
       AND status = 'closed'`,
    [agentId, statDate]
  );

  const avgResponseTime = avgResult.rows[0]?.avg_response_time || 0;
  const avgSessionDuration = avgResult.rows[0]?.avg_session_duration || 0;

  // 计算满意度相关
  const satisfactionResult = await query(
    `SELECT
       AVG(rating) as avg_rating,
       COUNT(*) as count,
       SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
       SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
     FROM chat_satisfaction_ratings
     WHERE agent_id = $1
       AND DATE(created_at) = $2`,
    [agentId, statDate]
  );

  const satStats = satisfactionResult.rows[0];

  // 计算质检相关
  const qualityResult = await query(
    `SELECT
       AVG(overall_score) as avg_score,
       COUNT(*) as count
     FROM chat_quality_inspections
     WHERE agent_id = $1
       AND DATE(created_at) = $2`,
    [agentId, statDate]
  );

  const qualityStats = qualityResult.rows[0];

  // 更新绩效表
  await query(
    `UPDATE cs_performance_daily_stats
     SET avg_response_time = $3,
         avg_session_duration = $4,
         avg_satisfaction_rating = $5,
         satisfaction_count = $6,
         five_star_count = $7,
         one_star_count = $8,
         avg_quality_score = $9,
         quality_inspection_count = $10,
         updated_at = CURRENT_TIMESTAMP
     WHERE agent_id = $1 AND stat_date = $2`,
    [
      agentId,
      statDate,
      Math.round(avgResponseTime),
      Math.round(avgSessionDuration),
      satStats?.avg_rating || null,
      parseInt(satStats?.count || 0),
      parseInt(satStats?.five_star || 0),
      parseInt(satStats?.one_star || 0),
      qualityStats?.avg_score || null,
      parseInt(qualityStats?.count || 0)
    ]
  );
};

/**
 * 获取客服绩效数据
 */
export const getAgentPerformance = async (
  agentId: number,
  startDate: string,
  endDate: string
): Promise<DailyPerformance[]> => {
  const result = await query(
    `SELECT * FROM cs_performance_daily_stats
     WHERE agent_id = $1
       AND stat_date >= $2
       AND stat_date <= $3
     ORDER BY stat_date ASC`,
    [agentId, startDate, endDate]
  );

  return result.rows;
};

/**
 * 获取所有客服的绩效汇总
 */
export const getAllAgentsPerformance = async (
  startDate: string,
  endDate: string
): Promise<{
  agentId: number;
  displayName: string;
  avatarUrl: string | null;
  totalSessions: number;
  completedSessions: number;
  avgResponseTime: number;
  avgSatisfactionRating: number;
  satisfactionCount: number;
  fiveStarRate: number;
}[]> => {
  const result = await query(
    `SELECT
       csa.id as agent_id,
       csa.display_name,
       csa.avatar_url,
       SUM(cpds.total_sessions) as total_sessions,
       SUM(cpds.completed_sessions) as completed_sessions,
       AVG(cpds.avg_response_time) as avg_response_time,
       AVG(cpds.avg_satisfaction_rating) as avg_satisfaction_rating,
       SUM(cpds.satisfaction_count) as satisfaction_count,
       CASE WHEN SUM(cpds.satisfaction_count) > 0
            THEN SUM(cpds.five_star_count)::FLOAT / SUM(cpds.satisfaction_count) * 100
            ELSE 0
       END as five_star_rate
     FROM customer_service_agents csa
     LEFT JOIN cs_performance_daily_stats cpds
       ON csa.id = cpds.agent_id
       AND cpds.stat_date >= $1
       AND cpds.stat_date <= $2
     WHERE csa.is_active = true
     GROUP BY csa.id, csa.display_name, csa.avatar_url
     ORDER BY total_sessions DESC`,
    [startDate, endDate]
  );

  return result.rows.map(row => ({
    agentId: row.agent_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    totalSessions: parseInt(row.total_sessions || 0),
    completedSessions: parseInt(row.completed_sessions || 0),
    avgResponseTime: parseFloat(row.avg_response_time || 0),
    avgSatisfactionRating: parseFloat(row.avg_satisfaction_rating || 0),
    satisfactionCount: parseInt(row.satisfaction_count || 0),
    fiveStarRate: parseFloat(row.five_star_rate || 0)
  }));
};

/**
 * 获取绩效排行榜
 */
export const getPerformanceRanking = async (
  startDate: string,
  endDate: string,
  rankBy: 'sessions' | 'satisfaction' | 'quality' | 'response_time' = 'sessions'
): Promise<{
  agentId: number;
  displayName: string;
  rank: number;
  value: number;
  totalSessions: number;
}[]> => {
  let orderByClause: string;
  let valueColumn: string;

  switch (rankBy) {
    case 'satisfaction':
      orderByClause = 'avg_satisfaction_rating DESC';
      valueColumn = 'AVG(cpds.avg_satisfaction_rating)';
      break;
    case 'quality':
      orderByClause = 'avg_quality_score DESC';
      valueColumn = 'AVG(cpds.avg_quality_score)';
      break;
    case 'response_time':
      orderByClause = 'avg_response_time ASC';
      valueColumn = 'AVG(cpds.avg_response_time)';
      break;
    default:  // sessions
      orderByClause = 'total_sessions DESC';
      valueColumn = 'SUM(cpds.total_sessions)';
  }

  const result = await query(
    `SELECT
       agent_id,
       display_name,
       value,
       total_sessions,
       ROW_NUMBER() OVER (ORDER BY value ${rankBy === 'response_time' ? 'ASC' : 'DESC'}) as rank
     FROM (
       SELECT
         csa.id as agent_id,
         csa.display_name,
         ${valueColumn} as value,
         SUM(cpds.total_sessions) as total_sessions
       FROM customer_service_agents csa
       LEFT JOIN cs_performance_daily_stats cpds
         ON csa.id = cpds.agent_id
         AND cpds.stat_date >= $1
         AND cpds.stat_date <= $2
       WHERE csa.is_active = true
       GROUP BY csa.id, csa.display_name
       HAVING SUM(cpds.total_sessions) > 0
     ) subquery
     ORDER BY rank
     LIMIT 20`,
    [startDate, endDate]
  );

  return result.rows.map(row => ({
    agentId: row.agent_id,
    displayName: row.display_name,
    rank: parseInt(row.rank),
    value: parseFloat(row.value || 0),
    totalSessions: parseInt(row.total_sessions || 0)
  }));
};

/**
 * 获取团队整体绩效统计
 */
export const getTeamStatistics = async (
  startDate: string,
  endDate: string
): Promise<{
  totalAgents: number;
  activeAgents: number;
  totalSessions: number;
  completedSessions: number;
  avgResponseTime: number;
  avgSessionDuration: number;
  avgSatisfactionRating: number;
  satisfactionRate: number;
  totalOnlineHours: number;
}> => {
  const result = await query(
    `SELECT
       COUNT(DISTINCT csa.id) as total_agents,
       COUNT(DISTINCT CASE WHEN csa.status IN ('online', 'busy') THEN csa.id END) as active_agents,
       COALESCE(SUM(cpds.total_sessions), 0) as total_sessions,
       COALESCE(SUM(cpds.completed_sessions), 0) as completed_sessions,
       COALESCE(AVG(cpds.avg_response_time), 0) as avg_response_time,
       COALESCE(AVG(cpds.avg_session_duration), 0) as avg_session_duration,
       COALESCE(AVG(cpds.avg_satisfaction_rating), 0) as avg_satisfaction_rating,
       CASE WHEN COALESCE(SUM(cpds.satisfaction_count), 0) > 0
            THEN (COALESCE(SUM(cpds.five_star_count), 0) + COALESCE(SUM(CASE WHEN cpds.avg_satisfaction_rating >= 4 THEN cpds.satisfaction_count ELSE 0 END), 0))::FLOAT / SUM(cpds.satisfaction_count) * 100
            ELSE 0
       END as satisfaction_rate,
       COALESCE(SUM(cpds.online_duration), 0) / 3600.0 as total_online_hours
     FROM customer_service_agents csa
     LEFT JOIN cs_performance_daily_stats cpds
       ON csa.id = cpds.agent_id
       AND cpds.stat_date >= $1
       AND cpds.stat_date <= $2
     WHERE csa.is_active = true`,
    [startDate, endDate]
  );

  const stats = result.rows[0];

  return {
    totalAgents: parseInt(stats.total_agents || 0),
    activeAgents: parseInt(stats.active_agents || 0),
    totalSessions: parseInt(stats.total_sessions || 0),
    completedSessions: parseInt(stats.completed_sessions || 0),
    avgResponseTime: parseFloat(stats.avg_response_time || 0),
    avgSessionDuration: parseFloat(stats.avg_session_duration || 0),
    avgSatisfactionRating: parseFloat(stats.avg_satisfaction_rating || 0),
    satisfactionRate: parseFloat(stats.satisfaction_rate || 0),
    totalOnlineHours: parseFloat(stats.total_online_hours || 0)
  };
};

/**
 * 生成客服详细绩效报表
 */
export const generateDetailedReport = async (
  agentId: number,
  startDate: string,
  endDate: string
): Promise<{
  summary: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    transferredOut: number;
    transferredIn: number;
    avgResponseTime: number;
    avgSessionDuration: number;
    totalOnlineHours: number;
  };
  satisfaction: {
    avgRating: number;
    totalCount: number;
    fiveStarCount: number;
    fiveStarRate: number;
    distribution: { rating: number; count: number }[];
  };
  quality: {
    avgScore: number;
    inspectionCount: number;
  };
  efficiency: {
    totalMessagesSent: number;
    totalMessagesReceived: number;
    quickReplyUsageRate: number;
  };
  dailyData: DailyPerformance[];
}> => {
  // 汇总数据
  const summaryResult = await query(
    `SELECT
       SUM(total_sessions) as total_sessions,
       SUM(completed_sessions) as completed_sessions,
       SUM(transferred_out) as transferred_out,
       SUM(transferred_in) as transferred_in,
       AVG(avg_response_time) as avg_response_time,
       AVG(avg_session_duration) as avg_session_duration,
       SUM(online_duration) / 3600.0 as total_online_hours,
       AVG(avg_satisfaction_rating) as avg_satisfaction_rating,
       SUM(satisfaction_count) as satisfaction_count,
       SUM(five_star_count) as five_star_count,
       AVG(avg_quality_score) as avg_quality_score,
       SUM(quality_inspection_count) as inspection_count,
       SUM(total_messages_sent) as total_messages_sent,
       SUM(total_messages_received) as total_messages_received,
       SUM(quick_reply_usage) as quick_reply_usage
     FROM cs_performance_daily_stats
     WHERE agent_id = $1
       AND stat_date >= $2
       AND stat_date <= $3`,
    [agentId, startDate, endDate]
  );

  const summary = summaryResult.rows[0];

  // 满意度分布
  const distResult = await query(
    `SELECT
       rating,
       COUNT(*) as count
     FROM chat_satisfaction_ratings
     WHERE agent_id = $1
       AND created_at >= $2
       AND created_at <= $3
     GROUP BY rating
     ORDER BY rating DESC`,
    [agentId, startDate + ' 00:00:00', endDate + ' 23:59:59']
  );

  // 每日数据
  const dailyData = await getAgentPerformance(agentId, startDate, endDate);

  const totalSessions = parseInt(summary.total_sessions || 0);
  const completedSessions = parseInt(summary.completed_sessions || 0);
  const satisfactionCount = parseInt(summary.satisfaction_count || 0);
  const fiveStarCount = parseInt(summary.five_star_count || 0);
  const totalMessagesSent = parseInt(summary.total_messages_sent || 0);
  const quickReplyUsage = parseInt(summary.quick_reply_usage || 0);

  return {
    summary: {
      totalSessions,
      completedSessions,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      transferredOut: parseInt(summary.transferred_out || 0),
      transferredIn: parseInt(summary.transferred_in || 0),
      avgResponseTime: parseFloat(summary.avg_response_time || 0),
      avgSessionDuration: parseFloat(summary.avg_session_duration || 0),
      totalOnlineHours: parseFloat(summary.total_online_hours || 0)
    },
    satisfaction: {
      avgRating: parseFloat(summary.avg_satisfaction_rating || 0),
      totalCount: satisfactionCount,
      fiveStarCount,
      fiveStarRate: satisfactionCount > 0 ? (fiveStarCount / satisfactionCount) * 100 : 0,
      distribution: distResult.rows.map(row => ({
        rating: row.rating,
        count: parseInt(row.count)
      }))
    },
    quality: {
      avgScore: parseFloat(summary.avg_quality_score || 0),
      inspectionCount: parseInt(summary.inspection_count || 0)
    },
    efficiency: {
      totalMessagesSent,
      totalMessagesReceived: parseInt(summary.total_messages_received || 0),
      quickReplyUsageRate: totalMessagesSent > 0 ? (quickReplyUsage / totalMessagesSent) * 100 : 0
    },
    dailyData
  };
};
