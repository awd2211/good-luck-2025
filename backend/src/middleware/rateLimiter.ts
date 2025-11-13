import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { config } from '../config';

/**
 * 获取客户端真实IP（支持IPv4和IPv6）
 */
const getClientIp = (req: Request): string => {
  // 优先使用X-Forwarded-For（处理代理/负载均衡）
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For可能包含多个IP，取第一个
    const ip = (forwarded as string).split(',')[0].trim();
    return normalizeIp(ip);
  }

  // 使用req.ip（Express会从socket.remoteAddress获取）
  const ip = req.ip || req.socket.remoteAddress || '';
  return normalizeIp(ip);
};

/**
 * 规范化IP地址
 * - 移除IPv6映射的IPv4前缀（::ffff:）
 * - 处理IPv6地址
 */
const normalizeIp = (ip: string): string => {
  // 移除IPv6映射的IPv4地址前缀
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
};

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
  // 自定义IP获取函数，支持IPv4和IPv6
  keyGenerator: getClientIp,
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
  keyGenerator: getClientIp,
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
  keyGenerator: getClientIp,
});
