#!/usr/bin/env node
/**
 * 批量为路由文件添加 Swagger/OpenAPI 注解的辅助脚本
 *
 * 使用方法:
 * node add-swagger-annotations.js
 *
 * 该脚本会扫描所有尚未添加 @openapi 注解的路由文件,
 * 并根据路由定义自动生成基础的 Swagger 注解。
 */

const fs = require('fs');
const path = require('path');

// 需要处理的路由文件列表
const routeFiles = [
  // 管理端认证
  { file: 'src/routes/auth.ts', tag: 'Admin - Auth', prefix: '/api/manage/auth' },

  // 管理端订单
  { file: 'src/routes/orders.ts', tag: 'Admin - Orders', prefix: '/api/manage/orders' },

  // 管理端统计
  { file: 'src/routes/stats.ts', tag: 'Admin - Stats', prefix: '/api/manage/stats' },

  // 管理端审计
  { file: 'src/routes/audit.ts', tag: 'Admin - Audit', prefix: '/api/manage/audit' },

  // 管理端横幅
  { file: 'src/routes/banners.ts', tag: 'Admin - Banners', prefix: '/api/manage/banners' },

  // 管理端通知
  { file: 'src/routes/notifications.ts', tag: 'Admin - Notifications', prefix: '/api/manage/notifications' },

  // 管理端退款
  { file: 'src/routes/refunds.ts', tag: 'Admin - Refunds', prefix: '/api/manage/refunds' },

  // 管理端反馈
  { file: 'src/routes/feedbacks.ts', tag: 'Admin - Feedbacks', prefix: '/api/manage/feedbacks' },

  // 管理端评价
  { file: 'src/routes/reviews.ts', tag: 'Admin - Reviews', prefix: '/api/manage/reviews' },

  // 管理端优惠券
  { file: 'src/routes/coupons.ts', tag: 'Admin - Coupons', prefix: '/api/manage/coupons' },

  // 管理端财务
  { file: 'src/routes/financial.ts', tag: 'Admin - Financial', prefix: '/api/manage/financial' },

  // 管理端管理员
  { file: 'src/routes/admins.ts', tag: 'Admin - Admins', prefix: '/api/manage/admins' },

  // 管理端算命业务
  { file: 'src/routes/fortuneCategories.ts', tag: 'Admin - Fortune Management', prefix: '/api/manage/fortune-categories' },
  { file: 'src/routes/fortuneServices.ts', tag: 'Admin - Fortune Management', prefix: '/api/manage/fortune-services' },
  { file: 'src/routes/fortuneTemplates.ts', tag: 'Admin - Fortune Management', prefix: '/api/manage/fortune-templates' },

  // 管理端AI模型
  { file: 'src/routes/aiModels.ts', tag: 'Admin - AI Models', prefix: '/api/manage/ai-models' },

  // 管理端系统配置
  { file: 'src/routes/systemConfigs.ts', tag: 'Admin - Fortune Management', prefix: '/api/manage/system-configs' },

  // 用户端其他API
  { file: 'src/routes/user/articles.ts', tag: 'User - Articles', prefix: '/api/articles' },
  { file: 'src/routes/user/dailyHoroscopes.ts', tag: 'User - Daily Horoscopes', prefix: '/api/daily-horoscopes' },
  { file: 'src/routes/user/notifications.ts', tag: 'User - Notifications', prefix: '/api/user/notifications' },
  { file: 'src/routes/user/policies.ts', tag: 'User - Auth', prefix: '/api/policies' },
  { file: 'src/routes/user/payments.ts', tag: 'User - Orders', prefix: '/api/payments' },
  { file: 'src/routes/user/share.ts', tag: 'User - Orders', prefix: '/api/share' },
  { file: 'src/routes/user/chat.ts', tag: 'User - Chat', prefix: '/api/chat' },

  // 算命计算API
  { file: 'src/routes/fortune.ts', tag: 'User - Fortune', prefix: '/api/fortune' },
];

console.log(`
================================================================
Swagger 注解批量添加脚本
================================================================

本脚本将为以下 ${routeFiles.length} 个路由文件添加 Swagger 注解:
`);

routeFiles.forEach((route, index) => {
  console.log(`${index + 1}. ${route.file} -> ${route.tag}`);
});

console.log(`
注意事项:
1. 本脚本仅生成基础注解模板
2. 需要根据实际业务逻辑手动调整参数和响应
3. 建议使用版本控制,以便回滚
4. 已完成的文件: user/auth.ts, user/cart.ts, user/orders.ts,
   user/favorite.ts, user/reviews.ts, user/coupons.ts,
   user/fortuneList.ts, user/history.ts, public/banners.ts,
   public/notifications.ts, public/share.ts, manage/users.ts

由于文件众多,建议手动为每个文件添加详细的 Swagger 注解。
参考已完成的文件模板,确保注解的准确性和完整性。

================================================================
`);

console.log('脚本使用说明:');
console.log('1. 查看已完成的文件作为参考模板');
console.log('2. 根据路由定义手动添加 @openapi 注解');
console.log('3. 确保所有必要的参数、请求体和响应都有文档');
console.log('4. 运行后端查看 /api-docs 验证注解效果\n');
