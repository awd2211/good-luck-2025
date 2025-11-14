import { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';
import * as csAgentStatusService from '../../services/csAgentStatusService';

/**
 * 获取在线客服统计
 */
export const getOnlineStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 获取在线状态统计
    const statusStats = csAgentStatusService.getAgentStatusStats();

    // 查询今日会话统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionStatsQuery = `
      SELECT
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_sessions,
        COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued_sessions,
        AVG(EXTRACT(EPOCH FROM (started_at - created_at))) as avg_wait_time
      FROM chat_sessions
      WHERE created_at >= $1
    `;
    const sessionResult = await pool.query(sessionStatsQuery, [today]);
    const sessionStats = sessionResult.rows[0];

    const stats = {
      onlineAgents: statusStats.onlineAgents,
      busyAgents: statusStats.busyAgents,
      activeSessions: parseInt(sessionStats.active_sessions) || 0,
      queuedSessions: parseInt(sessionStats.queued_sessions) || 0,
      avgWaitTime: Math.round(parseFloat(sessionStats.avg_wait_time) || 0),
      todayTotalSessions: parseInt(sessionStats.total_sessions) || 0,
      todayAvgSatisfaction: 0, // 暂时返回0，需要从评分表计算
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取客服团队统计
 */
export const getTeamStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 获取客服总数
    const agentCountQuery = `
      SELECT COUNT(*) as total
      FROM admins
      WHERE role IN ('cs_manager', 'cs_agent')
    `;
    const agentCountResult = await pool.query(agentCountQuery);
    const totalAgents = parseInt(agentCountResult.rows[0].total);

    // 获取在线状态统计
    const statusStats = csAgentStatusService.getAgentStatusStats();

    // 查询今日会话统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionStatsQuery = `
      SELECT
        COUNT(*) as today_sessions,
        AVG(EXTRACT(EPOCH FROM (first_response_at - started_at))) as avg_response_time
      FROM chat_sessions
      WHERE created_at >= $1 AND first_response_at IS NOT NULL
    `;
    const sessionResult = await pool.query(sessionStatsQuery, [today]);
    const sessionStats = sessionResult.rows[0];

    const stats = {
      totalAgents,
      onlineAgents: statusStats.onlineAgents,
      avgResponseTime: Math.round(parseFloat(sessionStats.avg_response_time) || 0),
      avgSatisfaction: 0, // 暂时返回0，需要从评分表计算
      todaySessions: parseInt(sessionStats.today_sessions) || 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
