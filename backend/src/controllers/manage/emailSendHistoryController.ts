/**
 * 邮件发送历史记录控制器
 */

import { Request, Response, NextFunction } from 'express'
import * as emailSendHistoryService from '../../services/emailSendHistoryService'

/**
 * @openapi
 * /api/manage/email-send-history:
 *   get:
 *     tags:
 *       - 邮件发送历史
 *     summary: 获取邮件发送历史列表
 *     description: 支持按场景、状态、收件人、日期范围、服务商筛选
 *     parameters:
 *       - in: query
 *         name: scenarioKey
 *         schema:
 *           type: string
 *         description: 场景标识
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed]
 *         description: 发送状态
 *       - in: query
 *         name: recipientEmail
 *         schema:
 *           type: string
 *         description: 收件人邮箱（支持模糊搜索）
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束日期
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *         description: 邮件服务商
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
 *         description: 每页条数
 *     responses:
 *       200:
 *         description: 成功
 */
export const getHistoryList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      scenarioKey,
      status,
      recipientEmail,
      startDate,
      endDate,
      provider,
      page,
      limit
    } = req.query

    const filters = {
      scenarioKey: scenarioKey as string,
      status: status as 'success' | 'failed',
      recipientEmail: recipientEmail as string,
      startDate: startDate as string,
      endDate: endDate as string,
      provider: provider as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    }

    const result = await emailSendHistoryService.getHistoryList(filters)

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @openapi
 * /api/manage/email-send-history/{id}:
 *   get:
 *     tags:
 *       - 邮件发送历史
 *     summary: 获取单个邮件发送历史详情
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 历史记录ID
 *     responses:
 *       200:
 *         description: 成功
 *       404:
 *         description: 记录不存在
 */
export const getHistoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的ID'
      })
    }

    const history = await emailSendHistoryService.getHistoryById(id)

    if (!history) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      })
    }

    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @openapi
 * /api/manage/email-send-history/stats:
 *   get:
 *     tags:
 *       - 邮件发送历史
 *     summary: 获取邮件发送统计信息
 *     description: 包括总数、成功率、按场景统计、按服务商统计、最近失败记录等
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功
 */
export const getHistoryStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query

    const filters = {
      startDate: startDate as string,
      endDate: endDate as string
    }

    const stats = await emailSendHistoryService.getHistoryStats(filters)

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

/**
 * @openapi
 * /api/manage/email-send-history/cleanup:
 *   post:
 *     tags:
 *       - 邮件发送历史
 *     summary: 清理旧的邮件发送历史
 *     description: 删除指定天数之前的历史记录
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysToKeep:
 *                 type: integer
 *                 description: 保留天数，默认90天
 *                 default: 90
 *     responses:
 *       200:
 *         description: 成功
 */
export const cleanupOldHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { daysToKeep = 90 } = req.body

    const deletedCount = await emailSendHistoryService.deleteOldHistory(daysToKeep)

    res.json({
      success: true,
      message: `已清理 ${deletedCount} 条历史记录`,
      data: {
        deletedCount,
        daysToKeep
      }
    })
  } catch (error) {
    next(error)
  }
}
