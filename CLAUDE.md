# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个完整的三端分离算命测算平台（C端用户前端 + B端管理后台 + 统一后端API），提供生肖运势、八字精批、流年运势、姓名测算、婚姻分析等功能。

## 技术栈

**用户前端 (frontend/):**
- React 19 + TypeScript + Vite
- React Router DOM (路由)
- Axios + axios-retry (HTTP 客户端，带重试机制)
- PWA 支持 (vite-plugin-pwa)
- 路由懒加载 + 代码分割优化

**管理后台 (admin-frontend/):**
- React 18 + TypeScript + Vite
- Ant Design 5.28 (UI组件库)
- React Router DOM 7
- ECharts (数据可视化)
- React Quill (富文本编辑器)
- @dnd-kit (拖拽功能)
- RBAC权限系统 (5种角色)

**后端 (backend/):**
- Node.js + Express 5 + TypeScript
- PostgreSQL (数据库，通过Docker管理)
- Redis (缓存，可选启用，通过ioredis)
- JWT 认证 (jsonwebtoken)
- bcryptjs (密码加密)
- Helmet (安全中间件)
- Compression (Gzip 压缩)
- express-rate-limit (限流，已修复IPv6问题)

**数据库 (PostgreSQL):**
- Docker Compose 管理
- 端口: 54320
- 数据库名: fortune_db
- 用户名: fortune_user
- 密码: fortune_pass_2025

## 常用命令

### 开发环境

```bash
# 启动数据库（必须先启动）
docker compose up -d

# 启动后端 (端口 3000)
cd backend && npm run dev

# 启动用户前端 (端口 5173)
cd frontend && npm run dev

# 启动管理后台 (端口 5174)
cd admin-frontend && npm run dev

# 同时启动前后端 (从根目录)
npm start

# 运行完整测试套件
./test-all.sh

# 运行用户端API测试
./test-user-api.sh

# 数据库管理
./db-cli.sh start       # 启动数据库
./db-cli.sh stop        # 停止数据库
./db-cli.sh status      # 检查状态
./db-cli.sh connect     # 连接数据库
./db-cli.sh reset       # 重置数据库
./db-cli.sh users       # 查看用户
./db-cli.sh orders      # 查看订单
./db-cli.sh banners     # 查看横幅

# 数据库迁移
./migrate-user-tables.sh  # 执行用户端表迁移
```

### 生产构建

```bash
# 构建用户前端
cd frontend && npm run build

# 构建管理后台
cd admin-frontend && npm run build

# 构建后端
cd backend && npm run build

# 启动生产环境后端
cd backend && npm start
```

### Linting

```bash
# 用户前端 ESLint
cd frontend && npm run lint

# 后端 TypeScript检查
cd backend && npx tsc --noEmit
```

## 项目架构

### 后端架构 (backend/src/)

**核心目录结构:**
```
src/
├── index.ts                 # Express应用入口，路由注册
├── config/
│   ├── database.ts          # PostgreSQL连接池配置
│   ├── redis.ts             # Redis客户端配置(可选)
│   └── index.ts             # 统一配置管理
├── middleware/
│   ├── auth.ts              # 管理员JWT认证
│   ├── userAuth.ts          # 用户JWT认证
│   ├── cache.ts             # 内存缓存中间件
│   ├── rateLimiter.ts       # API限流(已修复IPv6)
│   └── errorHandler.ts      # 全局错误处理
├── routes/
│   ├── public/              # 公开API（无需认证）
│   │   ├── banners.ts       # 横幅展示
│   │   └── notifications.ts # 通知展示
│   ├── user/                # 用户端API（C端）
│   │   ├── auth.ts          # 用户认证
│   │   ├── cart.ts          # 购物车
│   │   ├── favorite.ts      # 收藏
│   │   ├── history.ts       # 浏览历史
│   │   ├── fortuneList.ts   # 服务列表
│   │   ├── orders.ts        # 用户订单
│   │   ├── coupons.ts       # 用户优惠券
│   │   ├── reviews.ts       # 用户评价
│   │   └── payments.ts      # 支付
│   ├── fortune.ts           # 算命计算API（公开）
│   └── [manage routes]      # 管理端API（B端）
├── controllers/
│   └── user/                # 用户端控制器
│       ├── authController.ts
│       ├── cartController.ts
│       ├── favoriteController.ts
│       └── ...
└── services/
    └── user/                # 用户端服务层
        ├── authService.ts
        ├── cartService.ts
        ├── favoriteService.ts
        └── ...
```

**关键设计:**
- **三层架构**: Routes → Controllers → Services (严格职责分离)
- **双认证系统**:
  - `middleware/auth.ts`: 管理员认证
  - `middleware/userAuth.ts`: 用户认证
- **API路由分离**:
  - `/api/public/*`: 公开接口
  - `/api/*`: 用户端接口 (需用户认证)
  - `/api/manage/*`: 管理端接口 (需管理员认证)
- **缓存策略**: 支持Redis + 内存缓存降级 (config/redis.ts)
- **限流**: 已修复IPv6问题，60次/分钟 (middleware/rateLimiter.ts)

### 用户前端架构 (frontend/src/)

```
src/
├── App.tsx                  # 路由配置
├── main.tsx                 # 入口文件
├── pages/                   # 页面组件
├── components/              # 公共组件
├── contexts/
│   ├── AuthContext.tsx      # 用户认证上下文
│   └── CartContext.tsx      # 购物车上下文
├── hooks/
│   └── useAuth.ts           # 认证Hook
├── services/
│   └── api.ts               # API封装
└── types/                   # 类型定义
```

### 管理后台架构 (admin-frontend/src/)

```
src/
├── App.tsx                  # 路由配置
├── main.tsx                 # 入口文件
├── pages/                   # 管理页面（20+页面）
│   ├── Dashboard.tsx
│   ├── UserManagement.tsx
│   ├── OrderManagement.tsx
│   ├── AttributionAnalytics.tsx
│   └── ...
├── layouts/
│   └── MainLayout.tsx       # 主布局（含权限菜单过滤）
├── components/
│   ├── PermissionGuard.tsx  # 权限守卫组件
│   ├── VirtualList.tsx      # 虚拟列表优化
│   ├── OptimizedImage.tsx   # 图片懒加载
│   └── ...
├── contexts/
│   ├── AuthContext.tsx      # 认证上下文
│   └── ThemeContext.tsx     # 主题上下文
├── config/
│   └── permissions.ts       # 权限和角色配置
├── utils/
│   └── permission.ts        # 权限检查工具
├── hooks/
│   └── usePermission.ts     # 权限Hook
└── services/
    └── apiService.ts        # API封装
```

### 数据库架构

**核心表 (20+ 张):**

**用户相关:**
- `users`: 用户信息 (支持手机/密码登录，包含balance字段)
- `fortunes`: 算命服务表 (8种服务类型)
- `cart_items`: 购物车
- `favorites`: 收藏
- `browse_history`: 浏览历史
- `orders`: 订单
- `user_coupons`: 用户优惠券
- `reviews`: 用户评价

**管理相关:**
- `admins`: 管理员 (5种角色: super_admin, admin, manager, operator, viewer)
- `audit_logs`: 审计日志
- `banners`: 横幅管理
- `notifications`: 通知管理
- `coupons`: 优惠券模板
- `refunds`: 退款记录
- `feedbacks`: 用户反馈
- `financial_records`: 财务记录

**算命业务:**
- `fortune_categories`: 算命分类
- `fortune_services`: 算命服务
- `fortune_templates`: 算命模板
- `daily_horoscopes`: 每日运势
- `articles`: 文章内容
- `ai_models`: AI模型配置
- `system_configs`: 系统配置

**数据库文件:**
- `db/init.sql`: 初始化脚本
- `backend/migrations/`: 迁移脚本目录

## 添加新功能

### 添加新的算命类型

1. **后端服务层** (`backend/src/services/fortuneService.ts`):
   - 添加计算函数,例如 `export function calculateNewFortune(data) { ... }`
   - 使用天干地支、五行等中国传统命理数据

2. **后端控制器** (`backend/src/controllers/fortuneController.ts`):
   - 添加控制器函数,调用服务层并处理响应
   - 例如: `export const getNewFortune = async (req, res, next) => { ... }`

3. **后端路由** (`backend/src/routes/fortune.ts`):
   - 添加路由: `router.post('/new-fortune', cacheMiddleware, getNewFortune);`
   - 注意添加 `cacheMiddleware` 以启用缓存

4. **前端 API** (`frontend/src/services/api.ts`):
   - 添加 API 调用函数: `export const getNewFortune = (data) => api.post('/fortune/new-fortune', data);`

5. **前端类型** (`frontend/src/types/fortune.ts`):
   - 添加 TypeScript 类型定义

6. **前端页面** (`frontend/src/pages/`):
   - 在 HomePage.tsx 添加功能卡片
   - 在 FortuneDetail.tsx 添加对应的表单和结果展示

## 性能优化

项目已实施以下优化 (详见 OPTIMIZATION.md):

**前端:**
- 路由懒加载 (React.lazy)
- 代码分割 (Vendor chunk 分离)
- PWA 支持 + Service Worker
- 性能监控 (FCP, LCP, FID, CLS)
- Tree-shaking + 代码压缩

**后端:**
- Redis/内存缓存 (可配置)
- Gzip 压缩 (60-80% 体积减少)
- Helmet 安全防护
- 限流保护 (已启用)
- 优雅关闭处理
- 连接池优化

**管理后台优化:**
- 虚拟列表渲染 (VirtualList.tsx)
- 图片懒加载 (OptimizedImage.tsx)
- axios-retry 请求重试

**已知优化效果:**
- 包体积减少 58%
- 首屏加载提升 80% (2.5s → 0.5s)
- API 缓存命中率 94% (50ms → 3ms)

## 代码规范和开发工作流

### TypeScript类型定义
- 所有API响应和请求都应有类型定义
- 用户端类型: `backend/src/types/express.d.ts`
- 前端类型: `frontend/src/types/`
- 管理后台类型: 在各组件文件中定义

### 错误处理
- 使用 `next(error)` 传递错误到全局错误处理器
- 错误处理中间件: `backend/src/middleware/errorHandler.ts`
- 统一的错误响应格式: `{ success: false, message: string, error?: any }`

### 数据库操作
- 使用参数化查询防止SQL注入
- 所有写操作应在事务中执行
- 查询应使用索引字段
- 连接池配置: `backend/src/config/database.ts`

### 添加新的用户端API
遵循三层架构模式:
1. **Services**: `backend/src/services/user/` - 业务逻辑
2. **Controllers**: `backend/src/controllers/user/` - 请求处理
3. **Routes**: `backend/src/routes/user/` - 路由定义
4. **注册路由**: 在 `backend/src/index.ts` 中注册

### 添加新的管理端页面
1. 创建页面组件: `admin-frontend/src/pages/`
2. 使用 `<PermissionGuard>` 包裹需要权限的内容
3. 在 `MainLayout.tsx` 中添加菜单项和权限配置
4. 在 `App.tsx` 中添加路由

### 数据库迁移
1. 在 `backend/migrations/` 创建新的SQL文件
2. 命名格式: `NNN_description.sql`
3. 包含 `CREATE TABLE IF NOT EXISTS`
4. 包含必要的索引和约束
5. 使用脚本执行: `./migrate-user-tables.sh` 或手动执行

## 开发注意事项

### 权限系统 (RBAC)

**管理员前端 (admin-frontend/) 实现了完整的 RBAC (Role-Based Access Control) 权限系统:**

**5种角色:**
- `super_admin` (超级管理员): 拥有所有权限，包括角色管理
- `admin` (管理员): 拥有大部分权限，但不能管理角色
- `manager` (经理): 可以查看和编辑，但不能删除
- `operator` (操作员): 只能查看和创建
- `viewer` (访客): 只能查看数据

**权限控制实现:**
1. **菜单项过滤**: `MainLayout.tsx` 根据用户角色自动过滤菜单项
2. **页面级保护**: 所有管理页面使用 `<PermissionGuard>` 组件包裹
3. **按钮级保护**: 操作按钮（编辑、删除等）根据权限动态显示/隐藏

**关键文件:**
- `admin-frontend/src/config/permissions.ts`: 权限和角色定义
- `admin-frontend/src/utils/permission.ts`: 权限检查工具函数
- `admin-frontend/src/hooks/usePermission.ts`: 权限检查 Hook
- `admin-frontend/src/components/PermissionGuard.tsx`: 权限守卫组件

**使用示例:**
```typescript
// 页面级保护
<PermissionGuard permission={Permission.USER_VIEW}>
  <YourPageContent />
</PermissionGuard>

// 按钮级保护
{checkPermission.has(Permission.USER_EDIT) && (
  <Button>编辑</Button>
)}
```

### 算命 API 缓存
- 所有 `/api/fortune/*` 接口都有 5 分钟缓存
- 缓存键基于请求体 (JSON 字符串)
- 修改 `middleware/cache.ts` 中的 `CACHE_TTL` 调整缓存时间

### 数据库连接
- 使用连接池 (config/database.ts)
- 生产环境修改 docker-compose.yml 中的密码
- 不要暴露 54320 端口到公网

### 双认证系统
项目实现了管理员和用户的独立认证系统:

**管理员认证 (middleware/auth.ts):**
- JWT token 有效期: 24小时
- 密码使用 bcrypt 加密 (cost factor: 10)
- 应用于 `/api/manage/*` 路由

**用户认证 (middleware/userAuth.ts):**
- JWT token 有效期: 30天
- 支持验证码登录和密码登录
- 应用于大部分 `/api/*` 路由 (除公开接口)

### 限流器
- 已修复IPv6问题 (middleware/rateLimiter.ts)
- 默认配置: 60次/分钟
- 应用于所有 `/api/*` 路由

### 环境变量

**前端 (frontend/.env):**
- `VITE_API_URL`: 后端API地址 (默认 http://localhost:3000/api)

**管理后台 (admin-frontend/.env):**
- `VITE_API_BASE_URL`: 后端API地址 (默认 http://localhost:3000/api/manage)

**后端 (backend/.env):**
- `PORT`: 服务端口 (默认 3000)
- `NODE_ENV`: development/production
- `JWT_SECRET`: JWT密钥 (生产环境必须设置)
- `CORS_ORIGIN`: CORS允许的源 (默认 *)
- `REDIS_ENABLED`: 是否启用Redis (默认 false)
- `REDIS_HOST`: Redis地址 (默认 localhost)
- `REDIS_PORT`: Redis端口 (默认 6379)

## 测试

### 算命API测试
运行 `./test-all.sh` 测试:
1. 健康检查 (`/health`)
2. 所有算命 API (生肖/八字/流年/姓名/婚姻)
3. 缓存性能 (对比首次请求和缓存请求)
4. 限流功能 (发送10个快速请求)

### 用户端API测试
运行 `./test-user-api.sh` 测试:
1. 用户认证流程 (验证码登录/密码登录)
2. 购物车功能 (添加/更新/删除)
3. 收藏功能 (添加/取消/批量检查)
4. 浏览历史 (记录/查询/删除)
5. 服务列表 (筛选/排序/搜索)
6. 订单管理 (创建/查询/支付)
7. 优惠券功能 (领取/使用)
8. 评价功能 (发布/查询)

**注意:** 测试脚本会提示输入验证码,在后端控制台查看 (开发模式会打印)

## 故障排查

### 后端无法启动
- 检查端口 3000 是否被占用
- 检查数据库是否运行: `./db-cli.sh status`
- 查看日志中的错误信息

### 数据库连接失败
- 确认 Docker 容器运行: `docker compose ps`
- 检查端口 54320 是否被占用
- 查看数据库日志: `docker compose logs postgres`
- 重置数据库: `./db-cli.sh reset`

### 前端无法连接后端
- 检查 `frontend/.env` 中的 `VITE_API_URL`
- 确认后端服务运行在 http://localhost:3000
- 检查浏览器控制台的 CORS 错误

### API 响应缓慢
- 检查缓存是否生效 (运行 test-all.sh)
- 查看数据库连接池状态
- 考虑启用 Redis 替代内存缓存

## 重要文件和脚本

### 文档
- **README.md**: 项目总体介绍和快速开始
- **CLAUDE.md**: 本文件，Claude Code 开发指南
- **DATABASE.md**: 数据库详细文档和SQL命令
- **OPTIMIZATION.md**: 性能优化实施文档
- **USER_API_README.md**: 用户端API完整文档
- **USER_API_SUMMARY.md**: 用户端API开发总结
- **QUICKSTART_USER_API.md**: 用户端API快速开始

### 脚本工具
- **start.sh**: 一键启动脚本 (前后端)
- **test-all.sh**: 算命API测试套件
- **test-user-api.sh**: 用户端API测试套件
- **db-cli.sh**: 数据库管理CLI工具
- **migrate-user-tables.sh**: 用户表迁移脚本

### 配置文件
- **docker-compose.yml**: PostgreSQL容器配置
- **db/init.sql**: 数据库初始化脚本
- **backend/migrations/**: 数据库迁移脚本目录
- **backend/src/config/**: 后端配置文件

## 架构决策记录 (ADR)

### 为什么使用三端分离架构？
- **用户前端**: 轻量级，专注用户体验和PWA功能
- **管理后台**: 功能丰富，使用Ant Design提供完整的管理界面
- **统一后端**: 通过路由前缀区分API，便于维护和权限控制

### 为什么使用双认证系统？
- 管理员和用户有不同的认证需求和安全级别
- 独立的中间件便于维护和扩展
- Token过期时间不同 (管理员24小时，用户30天)

### 为什么支持Redis可选启用？
- 开发环境使用内存缓存降低依赖
- 生产环境使用Redis提升性能和扩展性
- 通过环境变量灵活配置 (REDIS_ENABLED)

### 为什么使用三层架构？
- **职责分离**: Routes处理HTTP，Controllers处理业务流程，Services处理数据操作
- **可测试性**: 每层可以独立测试
- **可维护性**: 修改业务逻辑不影响路由配置
- **可复用性**: Services可以被多个Controllers调用

### 数据库设计原则
- 使用外键约束保证数据完整性
- 为常用查询字段创建索引
- 使用触发器自动更新时间戳
- 软删除 (status字段) 保留历史数据

## 开发最佳实践

### 安全性
1. **永远不要**在代码中硬编码密钥或密码
2. **始终**使用参数化查询防止SQL注入
3. **验证**所有用户输入
4. **使用**bcrypt加密密码 (不要使用MD5或SHA1)
5. **设置**合适的CORS策略 (生产环境不要用 *)

### 性能
1. **使用**索引优化数据库查询
2. **启用**缓存减少数据库压力
3. **实现**分页避免大数据量查询
4. **使用**连接池管理数据库连接
5. **开启**Gzip压缩减少传输体积

### 代码质量
1. **遵循**TypeScript类型安全
2. **使用**async/await而非回调
3. **实现**统一的错误处理
4. **编写**有意义的变量和函数名
5. **添加**必要的注释说明复杂逻辑

### 调试技巧
1. **查看**后端控制台日志了解请求流程
2. **使用**浏览器开发者工具查看网络请求
3. **检查**数据库表结构和数据: `./db-cli.sh connect`
4. **运行**测试脚本验证API功能
5. **启用**开发模式查看详细错误信息

## 快速参考

### 端口分配
- **3000**: 后端API服务
- **5173**: 用户前端 (Vite dev server)
- **5174**: 管理后台 (Vite dev server)
- **54320**: PostgreSQL数据库
- **6379**: Redis (可选)

### 默认账号
**管理员 (已在init.sql中创建):**
- 用户名: admin
- 密码: admin123 (首次登录后请修改)

**测试用户 (通过API创建):**
- 手机号: 13900000001
- 验证码: 开发模式在后端控制台查看

### 常用数据库查询
```sql
-- 查看所有表
\dt

-- 查看用户
SELECT * FROM users LIMIT 10;

-- 查看订单统计
SELECT status, COUNT(*) FROM orders GROUP BY status;

-- 查看算命服务
SELECT id, name, category, price, status FROM fortunes;

-- 清空购物车
TRUNCATE TABLE cart_items;
```

## API端点总览

### 公开API (无需认证)
- `GET /api/public/banners` - 横幅列表
- `GET /api/public/notifications` - 通知列表
- `POST /api/fortune/*` - 算命计算接口

### 用户端API (需用户认证)
```
/api/auth/*          # 认证 (注册/登录/验证码)
/api/cart/*          # 购物车
/api/favorites/*     # 收藏
/api/history/*       # 浏览历史
/api/fortunes/*      # 服务列表
/api/orders/*        # 订单
/api/coupons/*       # 优惠券
/api/reviews/*       # 评价
/api/payments/*      # 支付
```

### 管理端API (需管理员认证)
```
/api/manage/auth/*              # 管理员认证
/api/manage/users/*             # 用户管理
/api/manage/orders/*            # 订单管理
/api/manage/stats/*             # 统计数据
/api/manage/audit/*             # 审计日志
/api/manage/banners/*           # 横幅管理
/api/manage/notifications/*     # 通知管理
/api/manage/refunds/*           # 退款管理
/api/manage/feedbacks/*         # 反馈管理
/api/manage/reviews/*           # 评价管理
/api/manage/coupons/*           # 优惠券管理
/api/manage/financial/*         # 财务管理
/api/manage/admins/*            # 管理员管理
/api/manage/fortune-*           # 算命业务管理
/api/manage/ai-models/*         # AI模型管理
/api/manage/attribution/*       # 归因分析
```
