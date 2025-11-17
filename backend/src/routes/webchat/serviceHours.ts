/**
 * 客服服务时间路由（公开API）
 */

import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * @openapi
 * /api/chat/service-hours:
 *   get:
 *     summary: 获取客服服务时间
 *     description: 获取客服在线服务时间段（公开接口，无需认证）
 *     tags:
 *       - WebChat - Service
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
 *                     serviceHours:
 *                       type: array
 *                       description: 服务时间段列表
 *                       items:
 *                         type: object
 *                         properties:
 *                           day:
 *                             type: string
 *                             description: 日期类型
 *                             enum: [weekday, weekend, all]
 *                             example: all
 *                           dayLabel:
 *                             type: string
 *                             description: 日期显示文本
 *                             example: 每天
 *                           startTime:
 *                             type: string
 *                             description: 开始时间
 *                             example: "09:00"
 *                           endTime:
 *                             type: string
 *                             description: 结束时间
 *                             example: "21:00"
 *                           available:
 *                             type: boolean
 *                             description: 当前是否在服务时间内
 *                             example: true
 *                     currentTime:
 *                       type: string
 *                       description: 服务器当前时间
 *                       example: "14:30"
 *                     isAvailable:
 *                       type: boolean
 *                       description: 当前是否有客服在线
 *                       example: true
 *                     nextAvailableTime:
 *                       type: string
 *                       description: 下次服务时间（如果当前不在服务时间）
 *                       example: "明天 09:00"
 */
router.get('/service-hours', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 获取当前时间
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // 定义服务时间（可以从数据库配置表读取）
    const SERVICE_START_HOUR = 9;
    const SERVICE_END_HOUR = 21;

    // 判断当前是否在服务时间内
    const isAvailable = currentHour >= SERVICE_START_HOUR && currentHour < SERVICE_END_HOUR;

    // 计算下次服务时间
    let nextAvailableTime = '';
    if (!isAvailable) {
      if (currentHour < SERVICE_START_HOUR) {
        nextAvailableTime = `今天 ${SERVICE_START_HOUR.toString().padStart(2, '0')}:00`;
      } else {
        nextAvailableTime = `明天 ${SERVICE_START_HOUR.toString().padStart(2, '0')}:00`;
      }
    }

    res.json({
      success: true,
      data: {
        serviceHours: [
          {
            day: 'all',
            dayLabel: '每天',
            startTime: `${SERVICE_START_HOUR.toString().padStart(2, '0')}:00`,
            endTime: `${SERVICE_END_HOUR.toString().padStart(2, '0')}:00`,
            available: isAvailable
          }
        ],
        currentTime: currentTimeStr,
        isAvailable,
        nextAvailableTime: nextAvailableTime || undefined
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
