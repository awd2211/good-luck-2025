import express from 'express';
import {
  getBirthFortune,
  getBaziAnalysis,
  getFlowYearFortune,
  getNameAnalysis,
  getMarriageAnalysis
} from '../controllers/fortuneController';
import { cacheMiddleware } from '../middleware/cache';
import { validate } from '../middleware/validate';
import {
  birthFortuneSchema,
  baziSchema,
  flowYearSchema,
  nameSchema,
  marriageSchema
} from '../validators/fortuneSchemas';

const router = express.Router();

// 生肖运势 - 验证 + 缓存
router.post('/birth-animal', validate(birthFortuneSchema), cacheMiddleware, getBirthFortune);

// 八字精批 - 验证 + 缓存
router.post('/bazi', validate(baziSchema), cacheMiddleware, getBaziAnalysis);

// 流年运势 - 验证 + 缓存
router.post('/flow-year', validate(flowYearSchema), cacheMiddleware, getFlowYearFortune);

// 姓名详批 - 验证 + 缓存
router.post('/name', validate(nameSchema), cacheMiddleware, getNameAnalysis);

// 婚姻分析 - 验证 + 缓存
router.post('/marriage', validate(marriageSchema), cacheMiddleware, getMarriageAnalysis);

export default router;
