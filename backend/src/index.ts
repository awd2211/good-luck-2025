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
import attributionRoutes from './routes/attribution';
import paymentConfigsRoutes from './routes/manage/paymentConfigs';
import paymentMethodsRoutes from './routes/manage/paymentMethods';
// 公开API路由
import publicBannersRoutes from './routes/public/banners';
import publicNotificationsRoutes from './routes/public/notifications';
// 用户端API路由
import userAuthRoutes from './routes/user/auth';
import userCartRoutes from './routes/user/cart';
import userFavoriteRoutes from './routes/user/favorite';
import userHistoryRoutes from './routes/user/history';
import userFortuneListRoutes from './routes/user/fortuneList';
import userOrdersRoutes from './routes/user/orders';
import userCouponsRoutes from './routes/user/coupons';
import userReviewsRoutes from './routes/user/reviews';
import userPaymentsRoutes from './routes/user/payments';
import userDailyHoroscopesRoutes from './routes/user/dailyHoroscopes';
import userPoliciesRoutes from './routes/user/policies';
import userArticlesRoutes from './routes/user/articles';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { getRedisClient, closeRedis } from './config/redis';
import { metricsCollector } from './middleware/metricsCollector';
import { performHealthCheck } from './services/healthService';

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

// API 性能指标收集
app.use(metricsCollector);

// 全局限流 - 已修复IPv6问题
app.use('/api/', apiLimiter);

// 请求日志（开发环境）
if (config.app.isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// ========== 公开API（无需认证） ==========
app.use('/api/public/banners', publicBannersRoutes);
app.use('/api/public/notifications', publicNotificationsRoutes);

// ========== 用户端API (C端 - 普通用户使用) ==========
app.use('/api/auth', userAuthRoutes);           // 用户认证（注册/登录/验证码）
app.use('/api/cart', userCartRoutes);           // 购物车
app.use('/api/favorites', userFavoriteRoutes);  // 收藏
app.use('/api/history', userHistoryRoutes);     // 浏览历史
app.use('/api/fortunes', userFortuneListRoutes);// 算命服务列表
app.use('/api/orders', userOrdersRoutes);       // 用户订单
app.use('/api/coupons', userCouponsRoutes);     // 用户优惠券
app.use('/api/reviews', userReviewsRoutes);     // 用户评价
app.use('/api/payments', userPaymentsRoutes);   // 支付
app.use('/api/daily-horoscopes', userDailyHoroscopesRoutes);  // 每日运势
app.use('/api/policies', userPoliciesRoutes);   // 用户协议和隐私政策
app.use('/api/articles', userArticlesRoutes);   // 文章

// 算命计算API（公开或用户端使用）
app.use('/api/fortune', fortuneRoutes);

// ========== 管理端API (B端 - 需要管理员权限) ==========
app.use('/api/manage/auth', authRoutes);                    // 管理员认证
app.use('/api/manage/users', usersRoutes);                  // 用户管理
app.use('/api/manage/orders', ordersRoutes);                // 订单管理
app.use('/api/manage/stats', statsRoutes);                  // 统计数据
app.use('/api/manage/audit', auditRoutes);                  // 审计日志
app.use('/api/manage/banners', bannersRoutes);              // 轮播图管理
app.use('/api/manage/notifications', notificationsRoutes);  // 通知管理
app.use('/api/manage/refunds', refundsRoutes);              // 退款管理
app.use('/api/manage/feedbacks', feedbacksRoutes);          // 反馈管理
app.use('/api/manage/reviews', reviewsRoutes);              // 评价管理
app.use('/api/manage/coupons', couponsRoutes);              // 优惠券管理
app.use('/api/manage/financial', financialRoutes);          // 财务管理
app.use('/api/manage/admins', adminsRoutes);                // 管理员管理
app.use('/api/manage/fortune-categories', fortuneCategoriesRoutes);  // 算命分类
app.use('/api/manage/fortune-services', fortuneServicesRoutes);      // 算命服务
app.use('/api/manage/fortune-templates', fortuneTemplatesRoutes);    // 算命模板
app.use('/api/manage/system-configs', systemConfigsRoutes);          // 系统配置
app.use('/api/manage/daily-horoscopes', dailyHoroscopesRoutes);      // 每日运势
app.use('/api/manage/articles', articlesRoutes);                     // 文章管理
app.use('/api/manage/ai-models', aiModelsRoutes);                    // AI模型管理
app.use('/api/manage/attribution', attributionRoutes);               // 归因统计
app.use('/api/manage/payment-configs', paymentConfigsRoutes);        // 支付配置管理
app.use('/api/manage/payment-methods', paymentMethodsRoutes);        // 支付方式管理

// 根路径 - API信息
app.get('/', (_req, res) => {
  res.json({
    name: '算命平台 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      public: {
        banners: '/api/public/banners',
        notifications: '/api/public/notifications'
      },
      user: {
        auth: '/api/auth',
        fortunes: '/api/fortunes',
        cart: '/api/cart',
        favorites: '/api/favorites',
        orders: '/api/orders',
        reviews: '/api/reviews'
      },
      admin: {
        auth: '/api/manage/auth',
        users: '/api/manage/users',
        orders: '/api/manage/orders',
        stats: '/api/manage/stats'
      }
    },
    documentation: 'See README.md for full API documentation'
  });
});

// 健康检查（详细模式）
app.get('/health', async (_req, res) => {
  try {
    const healthStatus = await performHealthCheck(true);

    // 根据健康状态设置HTTP状态码
    const statusCode = healthStatus.status === 'unhealthy' ? 503
                     : healthStatus.status === 'degraded' ? 200
                     : 200;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      message: '健康检查失败',
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    });
  }
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

process.on('unhandledRejection', (reason) => {
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
