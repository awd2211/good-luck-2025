import { Router } from 'express';
import { getStats, getData } from '../controllers/financialController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();
router.get('/stats', authenticate, requirePermission(Resource.FINANCIAL, Action.READ), getStats);
router.get('/data', authenticate, requirePermission(Resource.FINANCIAL, Action.READ), getData);
export default router;
