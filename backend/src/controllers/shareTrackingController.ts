/**
 * 分享追踪控制器 - 公开接口（无需认证）
 */

import { Request, Response, NextFunction } from 'express';
import * as shareService from '../services/shareService';
import { query } from '../config/database';
import * as crypto from 'crypto';

/**
 * 记录分享点击（公开接口）
 * GET /api/public/share/:shareCode
 */
export const trackShareClick = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareCode } = req.params;

    // 获取设备和位置信息
    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = parseUserAgent(userAgent);
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || '';

    // 获取UTM参数
    const {
      utm_source,
      utm_medium,
      utm_campaign,
      visitor_id,
      referrer
    } = req.query;

    // 记录点击
    const click = await shareService.recordShareClick({
      shareCode,
      visitorId: visitor_id as string,
      referrer: (referrer as string) || req.headers.referer,
      utmSource: utm_source as string,
      utmMedium: utm_medium as string,
      utmCampaign: utm_campaign as string,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ipAddress,
      sessionId: (req as any).sessionID || crypto.randomUUID()
    });

    // 获取分享链接信息
    const linkResult = await query(
      `SELECT * FROM share_links WHERE share_code = $1`,
      [shareCode]
    );

    if (linkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '分享链接不存在' });
    }

    const shareLink = linkResult.rows[0];

    // 检查是否过期
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return res.status(410).json({ success: false, message: '分享链接已过期' });
    }

    // 根据分享类型重定向
    let redirectUrl = '/';

    switch (shareLink.share_type) {
      case 'result':
        redirectUrl = `/result/${shareLink.content_id}?ref=${shareCode}`;
        break;
      case 'invite':
        redirectUrl = `/register?invite=${shareCode}`;
        break;
      case 'coupon':
        redirectUrl = `/coupon/${shareLink.content_id}?ref=${shareCode}`;
        break;
      case 'service':
        redirectUrl = `/service/${shareLink.content_id}?ref=${shareCode}`;
        break;
    }

    res.json({
      success: true,
      data: {
        clickId: click.id,
        redirectUrl,
        shareInfo: {
          title: shareLink.title,
          description: shareLink.description,
          imageUrl: shareLink.image_url
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取分享链接详情（公开接口）
 * GET /api/public/share/:shareCode/info
 */
export const getShareInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareCode } = req.params;

    const result = await query(
      `SELECT
        sl.share_code,
        sl.share_type,
        sl.title,
        sl.description,
        sl.image_url,
        sl.metadata,
        u.username as sharer_name
      FROM share_links sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE sl.share_code = $1 AND sl.status = 'active'`,
      [shareCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '分享链接不存在' });
    }

    const shareInfo = result.rows[0];

    res.json({
      success: true,
      data: shareInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 解析User-Agent获取设备信息
 */
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();

  // 设备类型
  let deviceType = 'desktop';
  if (/(mobile|android|iphone|ipad|ipod|blackberry|windows phone)/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  }

  // 浏览器
  let browser = 'unknown';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  // 操作系统
  let os = 'unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { deviceType, browser, os };
}
