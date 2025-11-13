import { Router } from 'express';
import { getFeedbacks, getFeedback, addFeedback, modifyFeedback, removeFeedback } from '../controllers/feedbackController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();

router.get('/', authenticate, requirePermission(Resource.FEEDBACKS, Action.READ), getFeedbacks);
router.get('/:id', authenticate, requirePermission(Resource.FEEDBACKS, Action.READ), getFeedback);
router.post('/', authenticate, requirePermission(Resource.FEEDBACKS, Action.CREATE), addFeedback);
router.put('/:id', authenticate, requirePermission(Resource.FEEDBACKS, Action.UPDATE), modifyFeedback);
router.delete('/:id', authenticate, requirePermission(Resource.FEEDBACKS, Action.DELETE), removeFeedback);

export default router;
