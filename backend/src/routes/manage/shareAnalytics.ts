/**
 * 管理端分享统计分析路由
 */

import { Router } from 'express';
import {
  getOverview,
  getConversionFunnel,
  getGeoDistribution,
  getDeviceDistribution,
  getTimeTrends,
  getLeaderboard,
  getViralTree,
  getKFactor,
  getABTestResults,
  getShareLinks
} from '../../controllers/manage/shareAnalyticsController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// 所有路由都需要管理员认证
router.use(authenticate);

// 总览统计
router.get('/overview', getOverview);

// 转化漏斗
router.get('/funnel', getConversionFunnel);

// 地理位置分布
router.get('/geo', getGeoDistribution);

// 设备和浏览器分布
router.get('/devices', getDeviceDistribution);

// 时间趋势
router.get('/trends', getTimeTrends);

// 分享排行榜
router.get('/leaderboard', getLeaderboard);

// 病毒传播树
router.get('/viral-tree/:userId', getViralTree);

// K因子
router.get('/k-factor/:userId', getKFactor);

// A/B测试结果
router.get('/ab-test/:testId', getABTestResults);

// 分享链接列表
router.get('/links', getShareLinks);

export default router;
