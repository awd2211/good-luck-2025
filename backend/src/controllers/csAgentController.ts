/**
 * 客服管理控制器 - 基于admins表的统一用户体系
 * 客服人员使用 cs_manager 和 cs_agent 角色
 */

import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { Role } from '../config/permissions';
import * as csAgentStatusService from '../services/csAgentStatusService';

/**
 * 获取客服列表
 * 查询 admins 表中 role 为 cs_manager 或 cs_agent 的用户
 */
export const getAgents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, role, status, isActive } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    const conditions: string[] = ["(role = 'cs_manager' OR role = 'cs_agent')"];
    const params: any[] = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`role = $${paramIndex++}`);
      params.push(role);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM admins
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // 查询列表
    const listQuery = `
      SELECT
        id,
        username as display_name,
        email,
        role,
        created_at,
        updated_at
      FROM admins
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    params.push(Number(limit), offset);

    const result = await pool.query(listQuery, params);

    // 转换为前端期望的格式
    const agents = result.rows.map(admin => {
      const statusInfo = csAgentStatusService.getAgentStatus(admin.id)
      return {
        id: admin.id,
        admin_id: admin.id,
        display_name: admin.display_name,
        avatar_url: null, // admins表没有头像字段
        role: admin.role === 'cs_manager' ? 'manager' : 'agent', // 转换为客服系统的role格式
        status: statusInfo?.status || 'offline',
        max_concurrent_chats: 5, // 默认值
        current_chat_count: statusInfo?.currentChatCount || 0,
        specialty_tags: [], // admins表没有此字段
        manager_id: null, // admins表没有此字段
        is_active: true, // admins表没有此字段，默认为true
        last_online_at: statusInfo?.lastOnlineAt || null,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
        email: admin.email
      }
    });

    res.json({
      success: true,
      data: agents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 创建客服账号
 * 在 admins 表中创建 cs_manager 或 cs_agent 角色的用户
 */
export const createAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminId, display_name, role, avatar_url, max_concurrent_chats, specialty_tags, manager_id, is_active } = req.body;

    // 验证必填字段
    if (!adminId || !display_name || !role) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：adminId, display_name, role'
      });
    }

    // 验证role必须是 manager 或 agent
    if (role !== 'manager' && role !== 'agent') {
      return res.status(400).json({
        success: false,
        message: 'role 必须是 manager 或 agent'
      });
    }

    // 检查 adminId 是否已存在
    const checkQuery = 'SELECT id FROM admins WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [adminId]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该管理员ID已存在'
      });
    }

    // 转换为 admins 表的 role 格式
    const adminRole = role === 'manager' ? Role.CS_MANAGER : Role.CS_AGENT;

    // 创建管理员账号（需要实现完整的管理员创建逻辑）
    res.json({
      success: false,
      message: '请使用"管理员管理"页面创建客服账号，并分配 cs_manager 或 cs_agent 角色'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新客服信息
 */
export const updateAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { display_name, role, avatar_url, max_concurrent_chats, specialty_tags, manager_id, is_active } = req.body;

    // 验证该用户是客服角色
    const checkQuery = "SELECT role FROM admins WHERE id = $1 AND (role = 'cs_manager' OR role = 'cs_agent')";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该客服人员'
      });
    }

    // 准备更新字段
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (display_name !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      params.push(display_name);
    }

    if (role !== undefined) {
      const adminRole = role === 'manager' ? Role.CS_MANAGER : Role.CS_AGENT;
      updates.push(`role = $${paramIndex++}`);
      params.push(adminRole);
    }

    // 注意: is_active 字段在 admins 表中不存在，忽略此参数

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的字段'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const updateQuery = `
      UPDATE admins
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, role, email, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, params);

    res.json({
      success: true,
      message: '客服信息更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除客服账号
 */
export const deleteAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // 验证该用户是客服角色
    const checkQuery = "SELECT role FROM admins WHERE id = $1 AND (role = 'cs_manager' OR role = 'cs_agent')";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该客服人员'
      });
    }

    // 删除管理员账号
    const deleteQuery = 'DELETE FROM admins WHERE id = $1';
    await pool.query(deleteQuery, [id]);

    res.json({
      success: true,
      message: '客服账号删除成功'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取客服统计数据
 */
export const getAgentStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 统计客服人数
    const statsQuery = `
      SELECT
        COUNT(*) as total_agents,
        COUNT(CASE WHEN role = 'cs_manager' THEN 1 END) as managers,
        COUNT(CASE WHEN role = 'cs_agent' THEN 1 END) as agents
      FROM admins
      WHERE role IN ('cs_manager', 'cs_agent')
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    // 获取在线状态统计
    const statusStats = csAgentStatusService.getAgentStatusStats()

    res.json({
      success: true,
      data: {
        onlineAgents: statusStats.onlineAgents,
        busyAgents: statusStats.busyAgents,
        totalAgents: parseInt(stats.total_agents),
        managers: parseInt(stats.managers),
        agents: parseInt(stats.agents),
        activeAgents: parseInt(stats.total_agents), // admins表没有is_active，全部视为active
        avgWaitTime: 0 // TODO: 从会话表计算平均等待时间
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取单个客服详情
 */
export const getAgentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        id,
        username as display_name,
        email,
        role,
        created_at,
        updated_at
      FROM admins
      WHERE id = $1 AND (role = 'cs_manager' OR role = 'cs_agent')
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该客服人员'
      });
    }

    const admin = result.rows[0];
    const statusInfo = csAgentStatusService.getAgentStatus(admin.id)
    const agent = {
      id: admin.id,
      admin_id: admin.id,
      display_name: admin.display_name,
      avatar_url: null,
      role: admin.role === 'cs_manager' ? 'manager' : 'agent',
      status: statusInfo?.status || 'offline',
      max_concurrent_chats: 5,
      current_chat_count: statusInfo?.currentChatCount || 0,
      specialty_tags: [],
      manager_id: null,
      is_active: true, // admins表没有此字段，默认为true
      last_online_at: statusInfo?.lastOnlineAt || null,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
      email: admin.email
    };

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新客服状态
 */
export const updateAgentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证status值
    if (!['online', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status 必须是 online, busy 或 offline'
      });
    }

    // 验证该用户是客服角色
    const checkQuery = "SELECT id FROM admins WHERE id = $1 AND (role = 'cs_manager' OR role = 'cs_agent')";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到该客服人员'
      });
    }

    // 更新客服在线状态
    const agentStatus = csAgentStatusService.setAgentStatus(id, status)

    res.json({
      success: true,
      message: '客服状态更新成功',
      data: {
        agentId: agentStatus.agentId,
        status: agentStatus.status,
        currentChatCount: agentStatus.currentChatCount,
        lastOnlineAt: agentStatus.lastOnlineAt,
        lastActivityAt: agentStatus.lastActivityAt
      }
    });
  } catch (error) {
    next(error);
  }
};
