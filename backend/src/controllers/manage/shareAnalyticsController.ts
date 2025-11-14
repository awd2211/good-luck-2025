/**
 * 管理端分享统计分析控制器
 */

import { Request, Response, NextFunction } from 'express';
import * as shareService from '../../services/shareService';

/**
 * 获取分享总览统计
 * GET /api/manage/share-analytics/overview
 */
export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const dateRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    } : undefined;

    const stats = await shareService.getShareStats(userId as string, dateRange);
    const channelDistribution = await shareService.getChannelDistribution(userId as string);

    res.json({
      success: true,
      data: {
        overview: stats,
        channels: channelDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取转化漏斗
 * GET /api/manage/share-analytics/funnel
 */
export const getConversionFunnel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const dateRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    } : undefined;

    const funnel = await shareService.getConversionFunnel(userId as string, dateRange);

    res.json({
      success: true,
      data: funnel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取地理位置分布
 * GET /api/manage/share-analytics/geo
 */
export const getGeoDistribution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    const geoData = await shareService.getGeoDistribution(userId as string);

    res.json({
      success: true,
      data: geoData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取设备和浏览器分布
 * GET /api/manage/share-analytics/devices
 */
export const getDeviceDistribution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    const deviceData = await shareService.getDeviceDistribution(userId as string);

    res.json({
      success: true,
      data: deviceData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取时间趋势
 * GET /api/manage/share-analytics/trends
 */
export const getTimeTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, days } = req.query;
    const daysNum = days ? parseInt(days as string) : 30;
    const trends = await shareService.getTimeTrends(userId as string, daysNum);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取分享排行榜
 * GET /api/manage/share-analytics/leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 100;
    const leaderboard = await shareService.getLeaderboard(period as string, limitNum);

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取病毒传播树
 * GET /api/manage/share-analytics/viral-tree/:userId
 */
export const getViralTree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { maxDepth } = req.query;
    const maxDepthNum = maxDepth ? parseInt(maxDepth as string) : 5;

    const tree = await shareService.getViralTree(userId, maxDepthNum);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取K因子
 * GET /api/manage/share-analytics/k-factor/:userId
 */
export const getKFactor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const kFactor = await shareService.calculateViralCoefficient(userId);

    res.json({
      success: true,
      data: kFactor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取A/B测试结果
 * GET /api/manage/share-analytics/ab-test/:testId
 */
export const getABTestResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testId } = req.params;
    const results = await shareService.getABTestResults(parseInt(testId));

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取所有分享链接列表
 * GET /api/manage/share-analytics/links
 */
export const getShareLinks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, shareType, status, startDate, endDate, page, limit } = req.query;

    const filters = {
      userId: userId as string,
      shareType: shareType as string,
      status: status as string,
      dateRange: startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    };

    const result = await shareService.getAllShareLinks(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};
