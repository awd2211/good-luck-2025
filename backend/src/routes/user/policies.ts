import { Router } from 'express'
import * as policyController from '../../controllers/user/policyController'

const router = Router()

/**
 * @route   GET /api/policies/user-agreement
 * @desc    获取用户协议
 * @access  Public
 */
router.get('/user-agreement', policyController.getUserAgreement)

/**
 * @route   GET /api/policies/privacy-policy
 * @desc    获取隐私政策
 * @access  Public
 */
router.get('/privacy-policy', policyController.getPrivacyPolicy)

export default router
