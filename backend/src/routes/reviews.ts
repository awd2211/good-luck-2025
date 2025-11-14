import { Router } from 'express';
import { getReviews, getReview, addReview, modifyReviewStatus, handleReplyReview, removeReview } from '../controllers/reviewController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();
router.get('/', authenticate, requirePermission(Resource.REVIEWS, Action.VIEW), getReviews);
router.get('/:id', authenticate, requirePermission(Resource.REVIEWS, Action.VIEW), getReview);
router.post('/', authenticate, requirePermission(Resource.REVIEWS, Action.CREATE), addReview);
router.patch('/:id/status', authenticate, requirePermission(Resource.REVIEWS, Action.EDIT), modifyReviewStatus);
router.post('/:id/reply', authenticate, requirePermission(Resource.REVIEWS, Action.EDIT), handleReplyReview);
router.delete('/:id', authenticate, requirePermission(Resource.REVIEWS, Action.DELETE), removeReview);
export default router;
