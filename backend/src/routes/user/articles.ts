import { Router } from 'express'
import * as articleController from '../../controllers/user/articleController'

const router = Router()

/**
 * @route   GET /api/articles
 * @desc    获取文章列表
 * @access  Public
 * @query   page, limit, category
 */
router.get('/', articleController.getArticles)

/**
 * @route   GET /api/articles/:id
 * @desc    获取文章详情
 * @access  Public
 */
router.get('/:id', articleController.getArticleDetail)

export default router
