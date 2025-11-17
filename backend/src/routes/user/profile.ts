/**
 * 用户端 - 个人资料和标签路由
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';
import { authenticateUser } from '../../middleware/userAuth';

const router = Router();

/**
 * @openapi
 * /api/profile/tags:
 *   get:
 *     summary: 获取我的标签
 *     description: 获取当前用户被分配的所有标签
 *     tags:
 *       - User - Profile
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tag_name:
 *                         type: string
 *                       tag_color:
 *                         type: string
 *                       description:
 *                         type: string
 *                       assigned_at:
 *                         type: string
 *                         format: date-time
 */
router.get('/tags', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    const result = await pool.query(
      `SELECT
        ct.id,
        ct.tag_name,
        ct.tag_color,
        ct.description,
        ut.assigned_at
       FROM user_tags ut
       JOIN customer_tags ct ON ut.tag_id = ct.id
       WHERE ut.user_id = $1 AND ct.is_active = true
       ORDER BY ut.assigned_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/profile/portrait:
 *   get:
 *     summary: 获取我的用户画像
 *     description: 获取当前用户的画像数据，包括VIP等级、会话统计、满意度等
 *     tags:
 *       - User - Profile
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       type: object
 *                       properties:
 *                         vipLevel:
 *                           type: integer
 *                           description: VIP等级 (0-5)
 *                         vipLabel:
 *                           type: string
 *                           description: VIP标签
 *                         totalSessions:
 *                           type: integer
 *                           description: 总会话数
 *                         totalMessages:
 *                           type: integer
 *                           description: 总消息数
 *                         avgSatisfactionRating:
 *                           type: string
 *                           description: 平均满意度 (1-5)
 *                         lastContactAt:
 *                           type: string
 *                           format: date-time
 *                         lifetimeValue:
 *                           type: number
 *                           description: 生命周期价值
 *                         memberSince:
 *                           type: string
 *                           format: date-time
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: object
 *                     sessionStats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         active:
 *                           type: integer
 */
router.get('/portrait', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    // 获取或创建用户画像
    let profileResult = await pool.query(
      `SELECT
        user_id,
        total_sessions,
        total_messages,
        avg_satisfaction_rating,
        last_contact_at,
        vip_level,
        lifetime_value,
        created_at,
        updated_at
       FROM customer_profiles
       WHERE user_id = $1`,
      [userId]
    );

    let profile = profileResult.rows[0];

    // 如果画像不存在，创建一个默认画像
    if (!profile) {
      const createResult = await pool.query(
        `INSERT INTO customer_profiles (user_id)
        VALUES ($1)
        RETURNING user_id, total_sessions, total_messages, avg_satisfaction_rating,
                  last_contact_at, vip_level, lifetime_value, created_at, updated_at`,
        [userId]
      );
      profile = createResult.rows[0];
    }

    // 获取用户标签
    const tagsResult = await pool.query(
      `SELECT ct.tag_name, ct.tag_color, ct.description, ut.assigned_at
       FROM user_tags ut
       JOIN customer_tags ct ON ut.tag_id = ct.id
       WHERE ut.user_id = $1 AND ct.is_active = true
       ORDER BY ut.assigned_at DESC`,
      [userId]
    );

    // 获取最近会话统计
    const sessionsResult = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'active') as active
       FROM chat_sessions
       WHERE user_id = $1`,
      [userId]
    );

    const sessionStats = sessionsResult.rows[0];

    // 计算VIP等级标签
    const vipLabels = ['普通用户', '铜牌会员', '银牌会员', '金牌会员', '铂金会员', '钻石会员'];
    const vipLabel = vipLabels[profile.vip_level] || vipLabels[0];

    res.json({
      success: true,
      data: {
        profile: {
          vipLevel: profile.vip_level,
          vipLabel,
          totalSessions: profile.total_sessions,
          totalMessages: profile.total_messages,
          avgSatisfactionRating: profile.avg_satisfaction_rating
            ? parseFloat(profile.avg_satisfaction_rating).toFixed(1)
            : null,
          lastContactAt: profile.last_contact_at,
          lifetimeValue: profile.lifetime_value,
          memberSince: profile.created_at
        },
        tags: tagsResult.rows,
        sessionStats: {
          total: parseInt(sessionStats.total),
          completed: parseInt(sessionStats.completed),
          active: parseInt(sessionStats.active)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
