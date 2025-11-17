import express from 'express'
import { getPublicStats } from '../../controllers/public/statsController'

const router = express.Router()

/**
 * @openapi
 * tags:
 *   name: Public
 *   description: 公开API接口（无需认证）
 */

// 获取平台统计数据
router.get('/stats', getPublicStats)

export default router
