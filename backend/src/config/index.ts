import dotenv from 'dotenv';
import path from 'path';

// 根据NODE_ENV加载对应的环境变量文件
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

/**
 * 检查必需的环境变量
 */
function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`环境变量 ${key} 是必需的，但未设置。请在 .env 文件中配置此变量。`);
  }
  return value;
}

/**
 * 可选的环境变量，带默认值
 */
function optional(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * 统一配置管理
 */
export const config = {
  // 应用配置
  app: {
    port: parseInt(optional('PORT', '3000')),
    nodeEnv: optional('NODE_ENV', 'development'),
    isDevelopment: optional('NODE_ENV', 'development') === 'development',
    isProduction: optional('NODE_ENV', 'development') === 'production',
  },

  // 数据库配置
  database: {
    host: optional('DB_HOST', 'localhost'),
    port: parseInt(optional('DB_PORT', '54320')),
    name: optional('DB_NAME', 'fortune_db'),
    user: optional('DB_USER', 'fortune_user'),
    password: optional('DB_PASSWORD', 'fortune_pass_2025'),
    poolMax: parseInt(optional('DB_POOL_MAX', '20')),        // 增加到20（原10）
    poolMin: parseInt(optional('DB_POOL_MIN', '5')),         // 增加到5（原2）
    idleTimeoutMillis: parseInt(optional('DB_IDLE_TIMEOUT', '10000')),  // 减少到10s（原30s）
    connectionTimeoutMillis: parseInt(optional('DB_CONNECTION_TIMEOUT', '5000')),
    statementTimeout: parseInt(optional('DB_STATEMENT_TIMEOUT', '30000')), // 新增: 30s查询超时
  },

  // JWT配置
  jwt: {
    // 生产环境必须设置JWT_SECRET
    secret: process.env.NODE_ENV === 'production'
      ? required('JWT_SECRET')
      : optional('JWT_SECRET', 'dev-secret-key-change-in-production'),
    expiresIn: optional('JWT_EXPIRES_IN', '24h'),
  },

  // CORS配置
  cors: {
    origin: optional('CORS_ORIGIN', '*'),
  },

  // 缓存配置
  cache: {
    ttl: parseInt(optional('CACHE_TTL', '300000')), // 5分钟
    maxKeys: parseInt(optional('CACHE_MAX_KEYS', '1000')),
  },

  // 限流配置
  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '60000')), // 1分钟
    max: parseInt(optional('RATE_LIMIT_MAX', '60')), // 最多60次请求
  },

  // Redis配置（可选）
  redis: {
    enabled: optional('REDIS_ENABLED', 'false') === 'true',
    host: optional('REDIS_HOST', 'localhost'),
    port: parseInt(optional('REDIS_PORT', '6379')),
    password: process.env.REDIS_PASSWORD,
  },
};

/**
 * 验证配置
 */
export function validateConfig(): void {
  console.log('🔧 验证配置...');

  // 生产环境必须检查
  if (config.app.isProduction) {
    if (config.jwt.secret === 'dev-secret-key-change-in-production') {
      throw new Error('生产环境必须设置 JWT_SECRET 环境变量！');
    }

    if (config.cors.origin === '*') {
      console.warn('⚠️  警告：生产环境建议设置 CORS_ORIGIN 限制访问来源');
    }

    if (config.database.password === 'fortune_pass_2025') {
      console.warn('⚠️  警告：生产环境建议修改默认数据库密码');
    }
  }

  console.log('✅ 配置验证通过');
  console.log(`📝 环境: ${config.app.nodeEnv}`);
  console.log(`🚀 端口: ${config.app.port}`);
  console.log(`🗄️  数据库: ${config.database.host}:${config.database.port}/${config.database.name}`);
}
