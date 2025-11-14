/**
 * 用户端分享路由
 */

import { Router } from 'express';
import {
  createShare,
  recordShare,
  getMyShareLinks,
  getMyShareStats,
  getLeaderboard,
  getMyRewards,
  claimReward
} from '../../controllers/shareController';

const router = Router();

// 创建分享链接
router.post('/create', createShare);

// 记录分享事件
router.post('/event', recordShare);

// 获取我的分享链接
router.get('/my-links', getMyShareLinks);

// 获取我的分享统计
router.get('/stats', getMyShareStats);

// 获取排行榜
router.get('/leaderboard', getLeaderboard);

// 获取我的奖励
router.get('/rewards', getMyRewards);

// 领取奖励
router.post('/rewards/:id/claim', claimReward);

export default router;
