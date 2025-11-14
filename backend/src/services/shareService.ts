/**
 * 分享服务 - 核心业务逻辑
 */

import { query } from '../config/database';
import * as crypto from 'crypto';

/**
 * 生成唯一分享码
 */
function generateShareCode(): string {
  return crypto.randomBytes(6).toString('base64url');
}

/**
 * 生成短链接（简化版，实际可使用短链服务）
 */
function generateShortUrl(shareCode: string): string {
  const baseUrl = process.env.FRONTEND_URL || 'https://fortune.example.com';
  return `${baseUrl}/s/${shareCode}`;
}

/**
 * 创建分享链接
 */
export async function createShareLink(data: {
  userId: string;
  shareType: 'result' | 'invite' | 'coupon' | 'service';
  contentId?: string;
  contentType?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  metadata?: any;
  expiresInDays?: number;
}) {
  const shareCode = generateShareCode();
  const shareUrl = generateShortUrl(shareCode);

  // 计算过期时间
  let expiresAt = null;
  if (data.expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
  }

  const result = await query(
    `INSERT INTO share_links
    (share_code, user_id, share_type, content_id, content_type, share_url, short_url,
     title, description, image_url, metadata, expires_at, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      shareCode,
      data.userId,
      data.shareType,
      data.contentId || null,
      data.contentType || null,
      shareUrl,
      shareUrl, // 简化版使用相同URL
      data.title || '',
      data.description || '',
      data.imageUrl || '',
      JSON.stringify(data.metadata || {}),
      expiresAt,
      'active'
    ]
  );

  return result.rows[0];
}

/**
 * 记录分享事件
 */
export async function recordShareEvent(data: {
  shareLinkId: number;
  userId: string;
  platform: string;
  shareChannel?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  ipAddress?: string;
}) {
  const result = await query(
    `INSERT INTO share_events
    (share_link_id, user_id, platform, share_channel, device_type, browser, os, country, city, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      data.shareLinkId,
      data.userId,
      data.platform,
      data.shareChannel || null,
      data.deviceType || null,
      data.browser || null,
      data.os || null,
      data.country || null,
      data.city || null,
      data.ipAddress || null
    ]
  );

  // 更新分享链接的分享计数
  await query(
    `UPDATE share_links SET share_count = share_count + 1 WHERE id = $1`,
    [data.shareLinkId]
  );

  return result.rows[0];
}

/**
 * 记录分享点击
 */
export async function recordShareClick(data: {
  shareCode: string;
  visitorId?: string;
  userId?: string;
  isNewUser?: boolean;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  screenResolution?: string;
  country?: string;
  city?: string;
  ipAddress?: string;
  latitude?: number;
  longitude?: number;
  sessionId?: string;
}) {
  // 获取share_link_id
  const linkResult = await query(
    `SELECT id FROM share_links WHERE share_code = $1`,
    [data.shareCode]
  );

  if (linkResult.rows.length === 0) {
    throw new Error('Share link not found');
  }

  const shareLinkId = linkResult.rows[0].id;

  const result = await query(
    `INSERT INTO share_clicks
    (share_link_id, share_code, visitor_id, user_id, is_new_user, referrer,
     utm_source, utm_medium, utm_campaign, device_type, browser, os, screen_resolution,
     country, city, ip_address, latitude, longitude, session_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *`,
    [
      shareLinkId,
      data.shareCode,
      data.visitorId || null,
      data.userId || null,
      data.isNewUser !== undefined ? data.isNewUser : true,
      data.referrer || null,
      data.utmSource || null,
      data.utmMedium || null,
      data.utmCampaign || null,
      data.deviceType || null,
      data.browser || null,
      data.os || null,
      data.screenResolution || null,
      data.country || null,
      data.city || null,
      data.ipAddress || null,
      data.latitude || null,
      data.longitude || null,
      data.sessionId || null
    ]
  );

  // 更新分享链接的点击计数
  await query(
    `UPDATE share_links SET click_count = click_count + 1 WHERE id = $1`,
    [shareLinkId]
  );

  return result.rows[0];
}

/**
 * 记录转化
 */
export async function recordConversion(data: {
  shareCode: string;
  clickId?: number;
  convertedUserId: string;
  sharerUserId: string;
  conversionType: string;
  conversionValue?: number;
  orderId?: string;
  amount?: number;
  conversionPath?: any;
  timeToConversion?: number;
}) {
  // 获取share_link_id
  const linkResult = await query(
    `SELECT id FROM share_links WHERE share_code = $1`,
    [data.shareCode]
  );

  if (linkResult.rows.length === 0) {
    throw new Error('Share link not found');
  }

  const shareLinkId = linkResult.rows[0].id;

  const result = await query(
    `INSERT INTO share_conversions
    (share_link_id, share_code, click_id, converted_user_id, sharer_user_id,
     conversion_type, conversion_value, order_id, amount, conversion_path, time_to_conversion)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      shareLinkId,
      data.shareCode,
      data.clickId || null,
      data.convertedUserId,
      data.sharerUserId,
      data.conversionType,
      data.conversionValue || null,
      data.orderId || null,
      data.amount || null,
      JSON.stringify(data.conversionPath || {}),
      data.timeToConversion || null
    ]
  );

  // 更新分享链接的转化计数
  await query(
    `UPDATE share_links SET conversion_count = conversion_count + 1 WHERE id = $1`,
    [shareLinkId]
  );

  return result.rows[0];
}

/**
 * 发放分享奖励
 */
export async function issueShareReward(data: {
  userId: string;
  rewardType: 'points' | 'cash' | 'coupon' | 'unlock';
  rewardAmount?: number;
  couponId?: number;
  couponCode?: string;
  unlockContent?: string;
  sourceType: string;
  sourceId: string;
  shareLinkId?: number;
  conversionId?: number;
  expiresInDays?: number;
}) {
  let expiresAt = null;
  if (data.expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
  }

  const result = await query(
    `INSERT INTO share_rewards
    (share_link_id, conversion_id, user_id, reward_type, reward_amount,
     coupon_id, coupon_code, unlock_content, source_type, source_id,
     status, issued_at, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, $12)
    RETURNING *`,
    [
      data.shareLinkId || null,
      data.conversionId || null,
      data.userId,
      data.rewardType,
      data.rewardAmount || null,
      data.couponId || null,
      data.couponCode || null,
      data.unlockContent || null,
      data.sourceType,
      data.sourceId,
      'issued',
      expiresAt
    ]
  );

  // 如果是积分或现金，更新用户余额
  if (data.rewardType === 'points' && data.rewardAmount) {
    await query(
      `UPDATE users SET points = points + $1 WHERE id = $2`,
      [data.rewardAmount, data.userId]
    );
  } else if (data.rewardType === 'cash' && data.rewardAmount) {
    await query(
      `UPDATE users SET balance = balance + $1 WHERE id = $2`,
      [data.rewardAmount, data.userId]
    );
  }

  return result.rows[0];
}

/**
 * 创建邀请记录
 */
export async function createInviteRecord(data: {
  inviterUserId: string;
  inviteCode: string;
  shareLinkId?: number;
}) {
  const result = await query(
    `INSERT INTO invite_records (invite_code, inviter_user_id, share_link_id, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [data.inviteCode, data.inviterUserId, data.shareLinkId || null, 'pending']
  );

  return result.rows[0];
}

/**
 * 更新邀请记录（被邀请人注册）
 */
export async function updateInviteRecordOnRegister(inviteCode: string, inviteeUserId: string) {
  const result = await query(
    `UPDATE invite_records
    SET invitee_user_id = $1, status = $2, registered_at = CURRENT_TIMESTAMP
    WHERE invite_code = $3
    RETURNING *`,
    [inviteeUserId, 'registered', inviteCode]
  );

  return result.rows[0];
}

/**
 * 获取分享统计数据
 */
export async function getShareStats(userId?: string, dateRange?: { start: Date; end: Date }) {
  let whereClause = '1=1';
  const params: any[] = [];

  if (userId) {
    params.push(userId);
    whereClause += ` AND sl.user_id = $${params.length}`;
  }

  if (dateRange) {
    params.push(dateRange.start);
    whereClause += ` AND sl.created_at >= $${params.length}`;
    params.push(dateRange.end);
    whereClause += ` AND sl.created_at <= $${params.length}`;
  }

  const result = await query(
    `SELECT
      COUNT(DISTINCT sl.id) as total_shares,
      SUM(sl.share_count) as total_share_events,
      SUM(sl.click_count) as total_clicks,
      SUM(sl.conversion_count) as total_conversions,
      CASE WHEN SUM(sl.click_count) > 0
        THEN ROUND((SUM(sl.conversion_count)::numeric / SUM(sl.click_count)::numeric) * 100, 2)
        ELSE 0
      END as conversion_rate
    FROM share_links sl
    WHERE ${whereClause}`,
    params
  );

  return result.rows[0];
}

/**
 * 获取渠道分布统计
 */
export async function getChannelDistribution(userId?: string) {
  const params: any[] = [];
  let whereClause = '1=1';

  if (userId) {
    params.push(userId);
    whereClause += ` AND sl.user_id = $${params.length}`;
  }

  const result = await query(
    `SELECT
      se.platform,
      COUNT(*) as share_count,
      COUNT(DISTINCT se.user_id) as unique_sharers
    FROM share_events se
    JOIN share_links sl ON se.share_link_id = sl.id
    WHERE ${whereClause}
    GROUP BY se.platform
    ORDER BY share_count DESC`,
    params
  );

  return result.rows;
}

/**
 * 计算K因子
 */
export async function calculateViralCoefficient(userId: string) {
  // 获取用户发送的邀请数
  const invitesSent = await query(
    `SELECT COUNT(*) as count FROM invite_records WHERE inviter_user_id = $1`,
    [userId]
  );

  // 获取接受的邀请数（已注册）
  const invitesAccepted = await query(
    `SELECT COUNT(*) as count FROM invite_records
     WHERE inviter_user_id = $1 AND status IN ('registered', 'completed')`,
    [userId]
  );

  const sent = parseInt(invitesSent.rows[0].count);
  const accepted = parseInt(invitesAccepted.rows[0].count);
  const kFactor = sent > 0 ? accepted / sent : 0;

  // 保存到数据库
  await query(
    `INSERT INTO viral_coefficients (user_id, invites_sent, invites_accepted, k_factor, period)
     VALUES ($1, $2, $3, $4, 'all_time')
     ON CONFLICT (user_id, period)
     DO UPDATE SET
       invites_sent = $2,
       invites_accepted = $3,
       k_factor = $4,
       calculated_at = CURRENT_TIMESTAMP`,
    [userId, sent, accepted, kFactor]
  );

  return { userId, invitesSent: sent, invitesAccepted: accepted, kFactor };
}

/**
 * 获取分享排行榜
 */
export async function getLeaderboard(period: string = 'all_time', limit: number = 100) {
  const result = await query(
    `SELECT
      sl.user_id,
      u.username,
      COUNT(DISTINCT sl.id) as total_shares,
      SUM(sl.click_count) as total_clicks,
      SUM(sl.conversion_count) as total_conversions,
      ROW_NUMBER() OVER (ORDER BY SUM(sl.conversion_count) DESC) as rank
    FROM share_links sl
    LEFT JOIN users u ON sl.user_id = u.id
    GROUP BY sl.user_id, u.username
    ORDER BY total_conversions DESC
    LIMIT $1`,
    [limit]
  );

  return result.rows;
}

/**
 * 获取地理位置分布
 */
export async function getGeoDistribution(userId?: string) {
  const params: any[] = [];
  let whereClause = '1=1';

  if (userId) {
    params.push(userId);
    whereClause += ` AND sl.user_id = $${params.length}`;
  }

  const result = await query(
    `SELECT
      sc.country,
      sc.city,
      COUNT(*) as click_count,
      COUNT(DISTINCT sc.visitor_id) as unique_visitors,
      AVG(sc.latitude) as avg_lat,
      AVG(sc.longitude) as avg_lng
    FROM share_clicks sc
    JOIN share_links sl ON sc.share_link_id = sl.id
    WHERE ${whereClause} AND sc.country IS NOT NULL
    GROUP BY sc.country, sc.city
    ORDER BY click_count DESC`,
    params
  );

  return result.rows;
}

/**
 * 获取设备和浏览器分布
 */
export async function getDeviceDistribution(userId?: string) {
  const params: any[] = [];
  let whereClause = '1=1';

  if (userId) {
    params.push(userId);
    whereClause += ` AND sl.user_id = $${params.length}`;
  }

  const deviceResult = await query(
    `SELECT
      sc.device_type,
      COUNT(*) as count,
      ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM share_clicks WHERE share_link_id IN (SELECT id FROM share_links WHERE ${whereClause}))::numeric) * 100, 2) as percentage
    FROM share_clicks sc
    JOIN share_links sl ON sc.share_link_id = sl.id
    WHERE ${whereClause} AND sc.device_type IS NOT NULL
    GROUP BY sc.device_type
    ORDER BY count DESC`,
    params
  );

  const browserResult = await query(
    `SELECT
      sc.browser,
      COUNT(*) as count,
      ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM share_clicks WHERE share_link_id IN (SELECT id FROM share_links WHERE ${whereClause}))::numeric) * 100, 2) as percentage
    FROM share_clicks sc
    JOIN share_links sl ON sc.share_link_id = sl.id
    WHERE ${whereClause} AND sc.browser IS NOT NULL
    GROUP BY sc.browser
    ORDER BY count DESC`,
    params
  );

  const osResult = await query(
    `SELECT
      sc.os,
      COUNT(*) as count,
      ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM share_clicks WHERE share_link_id IN (SELECT id FROM share_links WHERE ${whereClause}))::numeric) * 100, 2) as percentage
    FROM share_clicks sc
    JOIN share_links sl ON sc.share_link_id = sl.id
    WHERE ${whereClause} AND sc.os IS NOT NULL
    GROUP BY sc.os
    ORDER BY count DESC`,
    params
  );

  return {
    devices: deviceResult.rows,
    browsers: browserResult.rows,
    os: osResult.rows
  };
}

/**
 * 获取时间趋势数据
 */
export async function getTimeTrends(userId?: string, days: number = 30) {
  const params: any[] = [];
  let whereClause = '1=1';

  if (userId) {
    params.push(userId);
    whereClause += ` AND sl.user_id = $${params.length}`;
  }

  params.push(days);

  const result = await query(
    `SELECT
      DATE(se.created_at) as date,
      COUNT(DISTINCT se.id) as shares,
      COUNT(DISTINCT sc.id) as clicks,
      COUNT(DISTINCT scv.id) as conversions
    FROM generate_series(
      CURRENT_DATE - INTERVAL '${days} days',
      CURRENT_DATE,
      INTERVAL '1 day'
    ) AS date
    LEFT JOIN share_events se ON DATE(se.created_at) = date
    LEFT JOIN share_links sl_se ON se.share_link_id = sl_se.id
    LEFT JOIN share_clicks sc ON DATE(sc.created_at) = date
    LEFT JOIN share_links sl_sc ON sc.share_link_id = sl_sc.id
    LEFT JOIN share_conversions scv ON DATE(scv.created_at) = date
    LEFT JOIN share_links sl_scv ON scv.share_link_id = sl_scv.id
    WHERE ${whereClause}
    GROUP BY date
    ORDER BY date`,
    params
  );

  return result.rows;
}

/**
 * 获取转化漏斗数据
 */
export async function getConversionFunnel(userId?: string, dateRange?: { start: Date; end: Date }) {
  const params: any[] = [];
  let whereClause = '1=1';

  if (userId) {
    params.push(userId);
    whereClause += ` AND sl.user_id = $${params.length}`;
  }

  if (dateRange) {
    params.push(dateRange.start);
    whereClause += ` AND sl.created_at >= $${params.length}`;
    params.push(dateRange.end);
    whereClause += ` AND sl.created_at <= $${params.length}`;
  }

  // 获取每个阶段的数量
  const totalShares = await query(
    `SELECT SUM(share_count) as count FROM share_links sl WHERE ${whereClause}`,
    params
  );

  const totalClicks = await query(
    `SELECT SUM(click_count) as count FROM share_links sl WHERE ${whereClause}`,
    params
  );

  const totalConversions = await query(
    `SELECT SUM(conversion_count) as count FROM share_links sl WHERE ${whereClause}`,
    params
  );

  const shares = parseInt(totalShares.rows[0].count || 0);
  const clicks = parseInt(totalClicks.rows[0].count || 0);
  const conversions = parseInt(totalConversions.rows[0].count || 0);

  return {
    funnel: [
      {
        stage: 'shares',
        label: '分享次数',
        count: shares,
        percentage: 100,
        dropRate: 0
      },
      {
        stage: 'clicks',
        label: '点击次数',
        count: clicks,
        percentage: shares > 0 ? Math.round((clicks / shares) * 100) : 0,
        dropRate: shares > 0 ? Math.round(((shares - clicks) / shares) * 100) : 0
      },
      {
        stage: 'conversions',
        label: '转化次数',
        count: conversions,
        percentage: clicks > 0 ? Math.round((conversions / clicks) * 100) : 0,
        dropRate: clicks > 0 ? Math.round(((clicks - conversions) / clicks) * 100) : 0
      }
    ],
    totalConversionRate: shares > 0 ? ((conversions / shares) * 100).toFixed(2) : 0
  };
}

/**
 * 获取病毒传播树
 */
export async function getViralTree(rootUserId: string, maxDepth: number = 5) {
  const result = await query(
    `WITH RECURSIVE viral_tree AS (
      -- 起始节点
      SELECT
        ir.inviter_user_id as user_id,
        ir.invitee_user_id as child_user_id,
        u.username as child_username,
        1 as generation,
        ir.registered_at
      FROM invite_records ir
      LEFT JOIN users u ON ir.invitee_user_id = u.id
      WHERE ir.inviter_user_id = $1 AND ir.status IN ('registered', 'completed')

      UNION ALL

      -- 递归查询子节点
      SELECT
        ir.inviter_user_id,
        ir.invitee_user_id,
        u.username,
        vt.generation + 1,
        ir.registered_at
      FROM invite_records ir
      JOIN viral_tree vt ON ir.inviter_user_id = vt.child_user_id
      LEFT JOIN users u ON ir.invitee_user_id = u.id
      WHERE vt.generation < $2 AND ir.status IN ('registered', 'completed')
    )
    SELECT * FROM viral_tree ORDER BY generation, registered_at`,
    [rootUserId, maxDepth]
  );

  return result.rows;
}

/**
 * 获取A/B测试结果
 */
export async function getABTestResults(testId: number) {
  const result = await query(
    `SELECT
      variant,
      COUNT(DISTINCT sl.id) as share_links,
      SUM(sl.share_count) as total_shares,
      SUM(sl.click_count) as total_clicks,
      SUM(sl.conversion_count) as total_conversions,
      CASE WHEN SUM(sl.click_count) > 0
        THEN ROUND((SUM(sl.conversion_count)::numeric / SUM(sl.click_count)::numeric) * 100, 2)
        ELSE 0
      END as conversion_rate
    FROM share_links sl
    WHERE ab_test_id = $1
    GROUP BY variant
    ORDER BY variant`,
    [testId]
  );

  return result.rows;
}

/**
 * 获取所有分享链接列表（管理端）
 */
export async function getAllShareLinks(filters?: {
  userId?: string;
  shareType?: string;
  status?: string;
  dateRange?: { start: Date; end: Date };
  page?: number;
  limit?: number;
}) {
  const params: any[] = [];
  const whereClauses: string[] = ['1=1'];

  if (filters?.userId) {
    params.push(filters.userId);
    whereClauses.push(`sl.user_id = $${params.length}`);
  }

  if (filters?.shareType) {
    params.push(filters.shareType);
    whereClauses.push(`sl.share_type = $${params.length}`);
  }

  if (filters?.status) {
    params.push(filters.status);
    whereClauses.push(`sl.status = $${params.length}`);
  }

  if (filters?.dateRange) {
    params.push(filters.dateRange.start);
    whereClauses.push(`sl.created_at >= $${params.length}`);
    params.push(filters.dateRange.end);
    whereClauses.push(`sl.created_at <= $${params.length}`);
  }

  const whereClause = whereClauses.join(' AND ');

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) as total FROM share_links sl WHERE ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].total);

  // 分页
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  params.push(limit, offset);

  const result = await query(
    `SELECT
      sl.*,
      u.username as sharer_username,
      u.phone as sharer_phone
    FROM share_links sl
    LEFT JOIN users u ON sl.user_id = u.id
    WHERE ${whereClause}
    ORDER BY sl.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
