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

/**
 * @openapi
 * /api/share/create:
 *   post:
 *     summary: 创建分享链接
 *     description: 用户创建新的分享链接,用于分享到社交平台
 *     tags:
 *       - User - Share
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shareType
 *               - targetId
 *             properties:
 *               shareType:
 *                 type: string
 *                 enum: [fortune, article, service]
 *                 description: 分享类型
 *                 example: "fortune"
 *               targetId:
 *                 type: string
 *                 description: 目标资源ID
 *                 example: "123"
 *               platform:
 *                 type: string
 *                 enum: [wechat, qq, weibo, link]
 *                 description: 分享平台
 *                 example: "wechat"
 *     responses:
 *       201:
 *         description: 分享链接创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     shareId:
 *                       type: string
 *                       description: 分享ID
 *                     shareUrl:
 *                       type: string
 *                       description: 分享链接
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/create', createShare);

/**
 * @openapi
 * /api/share/event:
 *   post:
 *     summary: 记录分享事件
 *     description: 记录用户的分享行为和分享效果统计
 *     tags:
 *       - User - Share
 *     security:
 *       - UserBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shareId
 *               - eventType
 *             properties:
 *               shareId:
 *                 type: string
 *                 description: 分享ID
 *                 example: "abc123"
 *               eventType:
 *                 type: string
 *                 enum: [share, view, click, register]
 *                 description: 事件类型(分享/查看/点击/注册)
 *                 example: "view"
 *               referrer:
 *                 type: string
 *                 description: 来源页面
 *     responses:
 *       200:
 *         description: 事件记录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/event', recordShare);

/**
 * @openapi
 * /api/share/my-links:
 *   get:
 *     summary: 获取我的分享链接
 *     description: 获取当前用户创建的所有分享链接列表
 *     tags:
 *       - User - Share
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: shareType
 *         schema:
 *           type: string
 *           enum: [fortune, article, service]
 *         description: 分享类型筛选
 *     responses:
 *       200:
 *         description: 成功获取分享链接列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       shareId:
 *                         type: string
 *                       shareUrl:
 *                         type: string
 *                       shareType:
 *                         type: string
 *                       viewCount:
 *                         type: integer
 *                       clickCount:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-links', getMyShareLinks);

/**
 * @openapi
 * /api/share/my-stats:
 *   get:
 *     summary: 获取我的分享统计
 *     description: 获取当前用户的分享数据统计,包括总分享次数、浏览量、转化率等
 *     tags:
 *       - User - Share
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取分享统计
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalShares:
 *                       type: integer
 *                       description: 总分享次数
 *                     totalViews:
 *                       type: integer
 *                       description: 总浏览量
 *                     totalClicks:
 *                       type: integer
 *                       description: 总点击量
 *                     totalRewards:
 *                       type: number
 *                       description: 总奖励金额
 *                     conversionRate:
 *                       type: number
 *                       description: 转化率
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-stats', getMyShareStats);

/**
 * @openapi
 * /api/share/leaderboard:
 *   get:
 *     summary: 获取分享排行榜
 *     description: 获取分享活动的排行榜数据,展示分享达人
 *     tags:
 *       - User - Share
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, all]
 *           default: weekly
 *         description: 排行榜类型
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 榜单数量
 *     responses:
 *       200:
 *         description: 成功获取排行榜
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     myRank:
 *                       type: integer
 *                       description: 我的排名
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           shareCount:
 *                             type: integer
 *                           rewardAmount:
 *                             type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @openapi
 * /api/share/my-rewards:
 *   get:
 *     summary: 获取我的分享奖励
 *     description: 获取当前用户通过分享获得的奖励记录
 *     tags:
 *       - User - Share
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, claimed, expired]
 *         description: 奖励状态
 *     responses:
 *       200:
 *         description: 成功获取奖励列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRewards:
 *                       type: number
 *                       description: 总奖励金额
 *                     claimedRewards:
 *                       type: number
 *                       description: 已领取金额
 *                     pendingRewards:
 *                       type: number
 *                       description: 待领取金额
 *                     rewards:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           reason:
 *                             type: string
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-rewards', getMyRewards);

/**
 * @openapi
 * /api/share/rewards/{id}/claim:
 *   post:
 *     summary: 领取分享奖励
 *     description: 领取指定的分享奖励到账户余额
 *     tags:
 *       - User - Share
 *     security:
 *       - UserBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 奖励ID
 *     responses:
 *       200:
 *         description: 奖励领取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "奖励领取成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                       description: 领取金额
 *                     newBalance:
 *                       type: number
 *                       description: 新的账户余额
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/rewards/:id/claim', claimReward);

export default router;
