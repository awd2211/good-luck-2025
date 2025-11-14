import express from 'express'
import { authenticateUser } from '../../middleware/userAuth'
import {
  calculateAndSave,
  getResult,
  getMyResults,
  deleteResult,
  getResultsByOrderId,
} from '../../controllers/user/fortuneResultController'

const router = express.Router()

// 所有路由都需要用户认证（除了获取单个结果可以匿名访问）
router.use(authenticateUser)

/**
 * @route   POST /api/fortune-results
 * @desc    计算并保存算命结果
 * @access  Private (用户)
 * @body    { fortuneId, fortuneType, inputData, orderId? }
 */
router.post('/', calculateAndSave)

/**
 * @route   GET /api/fortune-results
 * @desc    获取我的算命结果列表
 * @access  Private (用户)
 * @query   { page?, limit?, fortuneType? }
 */
router.get('/', getMyResults)

/**
 * @route   GET /api/fortune-results/order/:orderId
 * @desc    根据订单ID获取算命结果
 * @access  Private (用户)
 */
router.get('/order/:orderId', getResultsByOrderId)

/**
 * @route   GET /api/fortune-results/:resultId
 * @desc    获取单个算命结果
 * @access  Public (但如果登录会验证权限)
 */
router.get('/:resultId', getResult)

/**
 * @route   DELETE /api/fortune-results/:resultId
 * @desc    删除算命结果
 * @access  Private (用户)
 */
router.delete('/:resultId', deleteResult)

export default router
