/**
 * 分享控制器 - 用户端
 */

import type { Request, Response, NextFunction } from 'express';
import * as shareService from '../services/shareService';

/**
 * 创建分享链接
 * POST /api/share/create
 */
export const createShare = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const { shareType, contentId, contentType, title, description, imageUrl, metadata, expiresInDays } = req.body;

    if (!shareType) {
      return res.status(400).json({ success: false, message: '缺少分享类型' });
    }

    const shareLink = await shareService.createShareLink({
      userId,
      shareType,
      contentId,
      contentType,
      title,
      description,
      imageUrl,
      metadata,
      expiresInDays: expiresInDays || 365 // 默认1年有效期
    });

    res.json({
      success: true,
      data: shareLink
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 记录分享事件
 * POST /api/share/event
 */
export const recordShare = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const {
      shareLinkId,
      platform,
      shareChannel,
      deviceType,
      browser,
      os,
      country,
      city,
      ipAddress
    } = req.body;

    if (!shareLinkId || !platform) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const event = await shareService.recordShareEvent({
      shareLinkId,
      userId,
      platform,
      shareChannel,
      deviceType,
      browser,
      os,
      country,
      city,
      ipAddress: ipAddress || req.ip
    });

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取我的分享链接列表
 * GET /api/share/my-links
 */
export const getMyShareLinks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const { page = 1, limit = 20, shareType } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'user_id = $1';
    const params: any[] = [userId];

    if (shareType) {
      params.push(shareType);
      whereClause += ` AND share_type = $${params.length}`;
    }

    const { query } = await import('../config/database');

    const result = await query(
      `SELECT * FROM share_links
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, Number(limit), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM share_links WHERE ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].total)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取分享统计
 * GET /api/share/stats
 */
export const getMyShareStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const stats = await shareService.getShareStats(userId);
    const channelDistribution = await shareService.getChannelDistribution(userId);

    res.json({
      success: true,
      data: {
        overall: stats,
        channels: channelDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取排行榜
 * GET /api/share/leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'all_time', limit = 100 } = req.query;

    const leaderboard = await shareService.getLeaderboard(
      period as string,
      Number(limit)
    );

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取我的奖励
 * GET /api/share/rewards
 */
export const getMyRewards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { query } = await import('../config/database');

    let whereClause = 'user_id = $1';
    const params: any[] = [userId];

    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const result = await query(
      `SELECT * FROM share_rewards
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, Number(limit), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM share_rewards WHERE ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].total)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 领取奖励
 * POST /api/share/rewards/:id/claim
 */
export const claimReward = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const { id } = req.params;

    const { query } = await import('../config/database');

    // 检查奖励是否存在且属于该用户
    const rewardResult = await query(
      `SELECT * FROM share_rewards WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (rewardResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '奖励不存在' });
    }

    const reward = rewardResult.rows[0];

    if (reward.status !== 'issued') {
      return res.status(400).json({ success: false, message: '奖励状态不正确' });
    }

    // 检查是否过期
    if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
      await query(
        `UPDATE share_rewards SET status = $1 WHERE id = $2`,
        ['expired', id]
      );
      return res.status(400).json({ success: false, message: '奖励已过期' });
    }

    // 更新状态为已领取
    await query(
      `UPDATE share_rewards SET status = $1, claimed_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['claimed', id]
    );

    res.json({
      success: true,
      message: '奖励领取成功',
      data: reward
    });
  } catch (error) {
    next(error);
  }
};
