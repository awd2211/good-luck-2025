import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { config, validateConfig } from './config';
import fortuneRoutes from './routes/fortune';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import ordersRoutes from './routes/orders';
import statsRoutes from './routes/stats';
import auditRoutes from './routes/audit';
import bannersRoutes from './routes/banners';
import notificationsRoutes from './routes/notifications';
import refundsRoutes from './routes/refunds';
import feedbacksRoutes from './routes/feedbacks';
import reviewsRoutes from './routes/reviews';
import couponsRoutes from './routes/coupons';
import financialRoutes from './routes/financial';
import adminsRoutes from './routes/admins';
// 算命管理路由
import fortuneCategoriesRoutes from './routes/fortuneCategories';
import fortuneServicesRoutes from './routes/fortuneServices';
import fortuneTemplatesRoutes from './routes/fortuneTemplates';
import systemConfigsRoutes from './routes/systemConfigs';
import dailyHoroscopesRoutes from './routes/dailyHoroscopes';
import articlesRoutes from './routes/articles';
import aiModelsRoutes from './routes/aiModels';
// 公开API路由
import publicBannersRoutes from './routes/public/banners';
import publicNotificationsRoutes from './routes/public/notifications';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { getRedisClient, closeRedis } from './config/redis';

// 验证配置
try {
  validateConfig();
} catch (error) {
  console.error('❌ 配置验证失败:', error);
  process.exit(1);
}

// 初始化Redis连接
getRedisClient();

const app = express();
const PORT = config.app.port;

// 信任代理 (用于获取真实IP)
app.set('trust proxy', 1);

// 安全性中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// 压缩响应数据
app.use(compression());

// JSON 解析
app.use(express.json({ limit: '10mb' }));

// 全局限流 - 已修复IPv6问题
app.use('/api/', apiLimiter);

// 请求日志（开发环境）
if (config.app.isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/fortune', fortuneRoutes);

// 公开API（无需认证）
app.use('/api/public/banners', publicBannersRoutes);
app.use('/api/public/notifications', publicNotificationsRoutes);

// 认证API（需要JWT认证，通过角色控制权限）
app.use('/api/users', usersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/refunds', refundsRoutes);
app.use('/api/feedbacks', feedbacksRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/admins', adminsRoutes);

// 算命管理API
app.use('/api/fortune-categories', fortuneCategoriesRoutes);
app.use('/api/fortune-services', fortuneServicesRoutes);
app.use('/api/fortune-templates', fortuneTemplatesRoutes);
app.use('/api/system-configs', systemConfigsRoutes);
app.use('/api/daily-horoscopes', dailyHoroscopesRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/ai-models', aiModelsRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.app.nodeEnv
  });
});

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
  console.log(`📝 环境: ${config.app.nodeEnv}`);
  console.log(`🔐 JWT配置: ${config.app.isProduction ? '生产模式（必须设置JWT_SECRET）' : '开发模式'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM 信号，正在优雅关闭...');
  server.close(() => {
    console.log('✅ 服务已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 收到 SIGINT 信号，正在优雅关闭...');
  server.close(() => {
    console.log('✅ 服务已关闭');
    process.exit(0);
  });
});
