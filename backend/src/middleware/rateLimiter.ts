import rateLimit from 'express-rate-limit';
import { config } from '../config';
import configService from '../services/configService';

// 限流器配置已迁移到数据库
// 使用延迟初始化模式，在应用启动后从数据库加载配置

let apiLimiterInstance: any = null;
let strictLimiterInstance: any = null;
let looseLimiterInstance: any = null;

/**
 * 初始化限流器（从数据库加载配置）
 * 应在应用启动时调用一次
 */
export async function initializeRateLimiters() {
  console.log('🔧 初始化限流器配置...');

  try {
    // 从数据库获取配置
    const windowMs = await configService.get<number>('rateLimit.window', config.rateLimit.windowMs);

    // 开发环境使用更宽松的限流配置
    const isDev = process.env.NODE_ENV === 'development';
    const apiMax = await configService.get<number>('rateLimit.api.max', isDev ? 200 : config.rateLimit.max);
    const strictMax = await configService.get<number>('rateLimit.strict.max', isDev ? 100 : 20);
    const looseMax = await configService.get<number>('rateLimit.loose.max', isDev ? 300 : 100);

    console.log(`  - 时间窗口: ${windowMs}ms`);
    console.log(`  - API限流: ${apiMax}次/窗口`);
    console.log(`  - 严格限流: ${strictMax}次/窗口`);
    console.log(`  - 宽松限流: ${looseMax}次/窗口`);

    // API 通用限流器
    apiLimiterInstance = rateLimit({
      windowMs,
      max: apiMax,
      message: {
        error: '请求过于频繁，请稍后再试',
        retryAfter: `${windowMs / 1000}秒`
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    });

    // 严格限流器 - 用于计算密集型接口
    strictLimiterInstance = rateLimit({
      windowMs,
      max: strictMax,
      message: {
        error: '该功能请求过于频繁，请稍后再试',
        retryAfter: `${windowMs / 1000}秒`
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // 宽松限流器 - 用于查询类接口
    looseLimiterInstance = rateLimit({
      windowMs,
      max: looseMax,
      message: {
        error: '请求次数已达上限',
        retryAfter: `${windowMs / 1000}秒`
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    console.log('✅ 限流器初始化成功');
  } catch (error) {
    console.error('❌ 限流器初始化失败，使用默认配置:', error);

    // 使用默认配置作为后备
    apiLimiterInstance = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: { error: '请求过于频繁，请稍后再试' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    strictLimiterInstance = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: 20,
      message: { error: '该功能请求过于频繁，请稍后再试' },
      standardHeaders: true,
      legacyHeaders: false,
    });

    looseLimiterInstance = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: 100,
      message: { error: '请求次数已达上限' },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}

/**
 * 重新加载限流器配置
 * 可通过API调用以实现热更新
 */
export async function reloadRateLimiters() {
  console.log('🔄 重新加载限流器配置...');
  await initializeRateLimiters();
}

// 导出限流器（懒加载模式）
export const apiLimiter = (req: any, res: any, next: any) => {
  if (!apiLimiterInstance) {
    // 如果还未初始化，使用默认配置
    console.warn('⚠️  限流器未初始化，使用默认配置');
    return rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: { error: '请求过于频繁，请稍后再试' },
    })(req, res, next);
  }
  return apiLimiterInstance(req, res, next);
};

export const strictLimiter = (req: any, res: any, next: any) => {
  if (!strictLimiterInstance) {
    console.warn('⚠️  严格限流器未初始化，使用默认配置');
    return rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: 20,
      message: { error: '该功能请求过于频繁，请稍后再试' },
    })(req, res, next);
  }
  return strictLimiterInstance(req, res, next);
};

export const looseLimiter = (req: any, res: any, next: any) => {
  if (!looseLimiterInstance) {
    console.warn('⚠️  宽松限流器未初始化，使用默认配置');
    return rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: 100,
      message: { error: '请求次数已达上限' },
    })(req, res, next);
  }
  return looseLimiterInstance(req, res, next);
};
