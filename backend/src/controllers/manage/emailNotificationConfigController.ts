/**
 * 邮件通知配置管理控制器
 */

import { Request, Response, NextFunction } from 'express'
import * as emailNotificationConfigService from '../../services/emailNotificationConfigService'

/**
 * 获取所有邮件通知配置
 * @openapi
 * /api/manage/email-notification-configs:
 *   get:
 *     tags: [邮件通知配置]
 *     summary: 获取所有邮件通知配置
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 场景分类筛选
 *     responses:
 *       200:
 *         description: 成功获取配置列表
 */
export const getAllConfigs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query
    const configs = await emailNotificationConfigService.getAllConfigs(
      category as string | undefined
    )

    res.json({
      success: true,
      data: configs
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取单个配置
 * @openapi
 * /api/manage/email-notification-configs/{scenarioKey}:
 *   get:
 *     tags: [邮件通知配置]
 *     summary: 获取单个邮件通知配置
 *     parameters:
 *       - in: path
 *         name: scenarioKey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取配置
 *       404:
 *         description: 配置不存在
 */
export const getConfigByKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioKey } = req.params
    const config = await emailNotificationConfigService.getConfigByKey(scenarioKey)

    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      })
    }

    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 更新配置
 * @openapi
 * /api/manage/email-notification-configs/{scenarioKey}:
 *   put:
 *     tags: [邮件通知配置]
 *     summary: 更新邮件通知配置
 *     parameters:
 *       - in: path
 *         name: scenarioKey
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_enabled:
 *                 type: boolean
 *               config_data:
 *                 type: object
 *               scenario_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 参数错误
 *       404:
 *         description: 配置不存在
 */
export const updateConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioKey } = req.params
    const { is_enabled, config_data, scenario_name, description } = req.body

    const updates: any = {}
    if (is_enabled !== undefined) updates.is_enabled = is_enabled
    if (config_data !== undefined) updates.config_data = config_data
    if (scenario_name !== undefined) updates.scenario_name = scenario_name
    if (description !== undefined) updates.description = description

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      })
    }

    const updatedConfig = await emailNotificationConfigService.updateConfig(scenarioKey, updates)

    res.json({
      success: true,
      message: '配置更新成功',
      data: updatedConfig
    })
  } catch (error) {
    if (error instanceof Error && error.message === '配置不存在') {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }
    next(error)
  }
}

/**
 * 批量更新启用状态
 * @openapi
 * /api/manage/email-notification-configs/batch-enable:
 *   post:
 *     tags: [邮件通知配置]
 *     summary: 批量更新邮件通知启用状态
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scenario_keys
 *               - is_enabled
 *             properties:
 *               scenario_keys:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 批量更新成功
 */
export const batchUpdateEnabled = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenario_keys, is_enabled } = req.body

    if (!Array.isArray(scenario_keys) || scenario_keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'scenario_keys 必须是非空数组'
      })
    }

    if (typeof is_enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_enabled 必须是布尔值'
      })
    }

    const count = await emailNotificationConfigService.batchUpdateEnabled(
      scenario_keys,
      is_enabled
    )

    res.json({
      success: true,
      message: `已更新 ${count} 个配置`,
      data: { updated_count: count }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 重置为默认配置
 * @openapi
 * /api/manage/email-notification-configs/reset:
 *   post:
 *     tags: [邮件通知配置]
 *     summary: 重置所有邮件通知配置为默认值
 *     responses:
 *       200:
 *         description: 重置成功
 */
export const resetToDefaults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await emailNotificationConfigService.resetToDefaults()

    res.json({
      success: true,
      message: '已重置为默认配置'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取配置统计
 * @openapi
 * /api/manage/email-notification-configs/stats:
 *   get:
 *     tags: [邮件通知配置]
 *     summary: 获取邮件通知配置统计信息
 *     responses:
 *       200:
 *         description: 成功获取统计信息
 */
export const getConfigStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await emailNotificationConfigService.getConfigStats()

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取所有定时任务配置
 * @openapi
 * /api/manage/email-notification-configs/scheduled:
 *   get:
 *     tags: [邮件通知配置]
 *     summary: 获取所有定时任务配置
 *     responses:
 *       200:
 *         description: 成功获取定时任务配置
 */
export const getScheduledTaskConfigs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await emailNotificationConfigService.getScheduledTaskConfigs()

    res.json({
      success: true,
      data: configs
    })
  } catch (error) {
    next(error)
  }
}
