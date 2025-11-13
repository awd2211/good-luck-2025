import { Router } from 'express'
import { authenticate, requirePermission } from '../middleware/auth'
import { Resource, Action } from '../config/permissions'
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  batchUpdateStatus,
  incrementViewCount,
  getCategories,
  getTags
} from '../controllers/articles'

const router = Router()

// Public routes (for C-end)
router.get('/categories', getCategories)
router.get('/tags', getTags)
router.post('/:id/view', incrementViewCount)

// Protected routes (for admin)
router.get('/', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.READ), getArticles)
router.get('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.READ), getArticleById)
router.post('/', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE), createArticle)
router.put('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.UPDATE), updateArticle)
router.delete('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.DELETE), deleteArticle)
router.patch('/batch/status', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.UPDATE), batchUpdateStatus)

export default router
