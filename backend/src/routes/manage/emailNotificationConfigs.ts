/**
 * 邮件通知配置管理路由
 */

import { Router } from 'express'
import * as controller from '../../controllers/manage/emailNotificationConfigController'

const router = Router()

/**
 * @route GET /api/manage/email-notification-configs
 * @desc 获取所有邮件通知配置（支持分类筛选）
 */
router.get('/', controller.getAllConfigs)

/**
 * @route GET /api/manage/email-notification-configs/stats
 * @desc 获取配置统计信息
 * 注意：这个路由必须放在 /:scenarioKey 前面，否则会被匹配为scenarioKey='stats'
 */
router.get('/stats', controller.getConfigStats)

/**
 * @route GET /api/manage/email-notification-configs/scheduled
 * @desc 获取所有定时任务配置
 */
router.get('/scheduled', controller.getScheduledTaskConfigs)

/**
 * @route POST /api/manage/email-notification-configs/batch-enable
 * @desc 批量更新启用状态
 */
router.post('/batch-enable', controller.batchUpdateEnabled)

/**
 * @route POST /api/manage/email-notification-configs/reset
 * @desc 重置为默认配置
 */
router.post('/reset', controller.resetToDefaults)

/**
 * @route GET /api/manage/email-notification-configs/:scenarioKey
 * @desc 获取单个配置
 */
router.get('/:scenarioKey', controller.getConfigByKey)

/**
 * @route PUT /api/manage/email-notification-configs/:scenarioKey
 * @desc 更新配置
 */
router.put('/:scenarioKey', controller.updateConfig)

export default router
