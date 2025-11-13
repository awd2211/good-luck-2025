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

router.get('/', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.READ), getDailyHoroscopes);
router.get('/by-date/:date/:type', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.READ), getHoroscopeByDateAndType);
router.post('/batch-generate', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE), batchGenerateHoroscopes);
router.get('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.READ), getDailyHoroscope);
router.post('/', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.CREATE), createDailyHoroscope);
router.put('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.UPDATE), updateDailyHoroscope);
router.delete('/:id', authenticate, requirePermission(Resource.FORTUNE_CONTENT, Action.DELETE), deleteDailyHoroscope);

export default router;
