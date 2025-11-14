import express from 'express';
import {
  getDailyHoroscopes,
  getDailyHoroscope,
  createDailyHoroscope,
  updateDailyHoroscope,
  deleteDailyHoroscope,
  getHoroscopeByDateAndType,
  batchGenerateHoroscopes
} from '../controllers/dailyHoroscopes';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = express.Router();

router.get('/', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW), getDailyHoroscopes);
router.get('/by-date/:date/:type', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW), getHoroscopeByDateAndType);
router.post('/batch-generate', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE), batchGenerateHoroscopes);
router.get('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.VIEW), getDailyHoroscope);
router.post('/', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE), createDailyHoroscope);
router.put('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.EDIT), updateDailyHoroscope);
router.delete('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.DELETE), deleteDailyHoroscope);

export default router;
