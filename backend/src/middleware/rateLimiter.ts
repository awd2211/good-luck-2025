import rateLimit from 'express-rate-limit';
import { config } from '../config';

// API 通用限流器 - 每分钟60次请求
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: `${config.rateLimit.windowMs / 1000}秒`
  },
  standardHeaders: true, // 返回标准的限流头信息
  legacyHeaders: false,
  // 跳过成功的请求计数（可选，取决于需求）
  skipSuccessfulRequests: false,
  // 跳过失败的请求计数
  skipFailedRequests: false,
});

// 严格限流器 - 用于计算密集型接口
export const strictLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 20, // 每分钟最多20次
  message: {
    error: '该功能请求过于频繁，请稍后再试',
    retryAfter: `${config.rateLimit.windowMs / 1000}秒`
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 宽松限流器 - 用于查询类接口
export const looseLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 100,
  message: {
    error: '请求次数已达上限',
    retryAfter: `${config.rateLimit.windowMs / 1000}秒`
  },
  standardHeaders: true,
  legacyHeaders: false,
});
