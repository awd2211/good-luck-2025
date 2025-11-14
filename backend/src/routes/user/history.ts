import { Router } from 'express'
import * as historyController from '../../controllers/user/historyController'
import { authenticateUser } from '../../middleware/userAuth'

const router = Router()

// 所有浏览历史接口都需要用户认证
router.use(authenticateUser)

/**
 * @route   GET /api/history
 * @desc    获取浏览历史
 * @access  Private (User)
 */
router.get('/', historyController.getHistory)

/**
 * @route   POST /api/history
 * @desc    添加浏览记录
 * @access  Private (User)
 */
router.post('/', historyController.addHistory)

/**
 * @route   DELETE /api/history/:id
 * @desc    删除单条浏览记录
 * @access  Private (User)
 */
router.delete('/:id', historyController.removeHistory)

/**
 * @route   DELETE /api/history
 * @desc    清空浏览历史
 * @access  Private (User)
 */
router.delete('/', historyController.clearHistory)

/**
 * @route   POST /api/history/batch-delete
 * @desc    批量删除浏览记录
 * @access  Private (User)
 */
router.post('/batch-delete', historyController.batchRemove)

export default router
