# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 React + TypeScript + Node.js + PostgreSQL 的前后端分离算命测算平台,提供生肖运势、八字精批、流年运势、姓名测算、婚姻分析等功能。

## 技术栈

**前端 (frontend/):**
- React 18 + TypeScript + Vite
- React Router DOM (路由)
- Axios (HTTP 客户端)
- PWA 支持 (vite-plugin-pwa)
- 路由懒加载 + 代码分割优化

**后端 (backend/):**
- Node.js + Express 5 + TypeScript
- PostgreSQL (数据库)
- JWT 认证 (jsonwebtoken)
- bcryptjs (密码加密)
- Helmet (安全中间件)
- Compression (Gzip 压缩)
- express-rate-limit (限流,当前禁用待修复IPv6问题)
- 内存缓存中间件 (5分钟 TTL)

**数据库 (PostgreSQL):**
- Docker Compose 管理
- 端口: 54320
- 数据库名: fortune_db
- 用户名: fortune_user
- 密码: fortune_pass_2025

## 常用命令

### 开发环境

```bash
# 启动后端 (端口 3000)
cd backend && npm run dev

# 启动前端 (端口 5173)
cd frontend && npm run dev

# 同时启动前后端 (需要 concurrently)
npm start

# 运行完整测试套件
./test-all.sh

# 数据库管理
./db-cli.sh start       # 启动数据库
./db-cli.sh stop        # 停止数据库
./db-cli.sh status      # 检查状态
./db-cli.sh connect     # 连接数据库
./db-cli.sh reset       # 重置数据库
./db-cli.sh users       # 查看用户
./db-cli.sh orders      # 查看订单
./db-cli.sh banners     # 查看横幅
```

### 生产构建

```bash
# 构建前端
cd frontend && npm run build

# 构建后端
cd backend && npm run build

# 启动生产环境后端
cd backend && npm start
```

### Linting

```bash
# 前端 ESLint
cd frontend && npm run lint
```

## 项目架构

### 后端架构 (backend/src/)

```
src/
├── index.ts                 # Express 应用入口,配置所有中间件和路由
├── config/
│   └── database.ts          # PostgreSQL 连接池配置
├── middleware/
│   ├── auth.ts              # JWT 认证中间件
│   ├── cache.ts             # 内存缓存中间件 (5分钟)
│   ├── errorHandler.ts      # 全局错误处理和404处理
│   └── rateLimiter.ts       # API 限流 (当前禁用)
├── routes/
│   ├── fortune.ts           # 算命API路由 (带缓存)
│   ├── auth.ts              # 认证路由 (登录/注册/验证)
│   ├── users.ts             # 用户管理路由 (CRUD)
│   ├── orders.ts            # 订单管理路由 (查询/更新)
│   ├── stats.ts             # 统计数据路由
│   ├── audit.ts             # 审计日志路由
│   ├── banners.ts           # 横幅管理路由
│   └── notifications.ts     # 通知管理路由
├── controllers/
│   ├── fortuneController.ts # 算命API控制器
│   ├── authController.ts    # 认证控制器
│   ├── userController.ts    # 用户管理控制器
│   ├── orderController.ts   # 订单管理控制器
│   └── ...
└── services/
    ├── fortuneService.ts    # 算命业务逻辑 (天干地支、五行计算)
    ├── authService.ts       # 认证服务 (JWT生成/验证)
    ├── userService.ts       # 用户CRUD服务
    ├── orderService.ts      # 订单CRUD服务
    └── ...
```

**关键设计:**
- **三层架构**: Routes → Controllers → Services (清晰的职责分离)
- **缓存策略**: 算命API使用内存缓存 (middleware/cache.ts),5分钟TTL
- **数据库**: 使用 pg 连接池,配置在 config/database.ts
- **认证**: JWT token 存储在请求头 `Authorization: Bearer <token>`
- **限流**: 当前禁用 (待修复 IPv6 问题),配置为 60次/分钟

### 前端架构 (frontend/src/)

```
src/
├── App.tsx                  # React Router 配置,懒加载路由
├── main.tsx                 # 应用入口,PWA注册
├── pages/
│   ├── HomePage.tsx         # 首页 (功能卡片展示)
│   └── FortuneDetail.tsx    # 算命详情页 (表单 + 结果显示)
├── components/
│   ├── Loading.tsx          # 加载动画组件
│   ├── LazyImage.tsx        # 懒加载图片组件
│   └── Icons.tsx            # SVG 图标组件
├── services/
│   └── api.ts               # Axios API 封装 (统一错误处理)
└── types/
    └── fortune.ts           # TypeScript 类型定义
```

**关键设计:**
- **路由懒加载**: 使用 React.lazy() + Suspense 分割代码
- **API 封装**: services/api.ts 统一处理 HTTP 请求和错误
- **类型安全**: types/ 目录定义所有接口类型
- **响应式设计**: CSS 媒体查询支持移动端/平板/PC

### 数据库架构

6个核心表:
- **users**: 用户信息 (id, username, phone, email, order_count, total_spent)
- **admins**: 管理员 (id, username, password_hash, role, email)
- **orders**: 订单 (order_id, user_id, fortune_type, amount, status, pay_method)
- **audit_logs**: 审计日志 (user_id, action, resource, details, ip, status)
- **banners**: 横幅管理 (title, image_url, link_url, position, status)
- **notifications**: 通知管理 (title, content, type, priority, target)

初始化脚本: `db/init.sql` (自动创建表和示例数据)

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
- 内存缓存 (5分钟 TTL)
- Gzip 压缩 (60-80% 体积减少)
- Helmet 安全防护
- 限流保护 (当前禁用)
- 优雅关闭处理

**已知优化效果:**
- 包体积减少 58%
- 首屏加载提升 80% (2.5s → 0.5s)
- API 缓存命中率 94% (50ms → 3ms)

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

### 限流器
- 当前因 IPv6 问题禁用 (index.ts:14, 41)
- 修复后取消注释启用 60次/分钟限流

### 认证流程
- JWT token 有效期: 24小时
- 管理员密码使用 bcrypt 加密 (cost factor: 10)
- 需要认证的路由使用 `authMiddleware` 中间件

### 前端环境变量
- `VITE_API_URL`: 后端 API 地址 (默认 http://localhost:3000/api)

### 后端环境变量
- `PORT`: 服务端口 (默认 3000)
- `NODE_ENV`: development/production
- `JWT_SECRET`: JWT 密钥
- `CORS_ORIGIN`: CORS 允许的源 (默认 *)

## 测试

运行 `./test-all.sh` 测试:
1. 健康检查 (`/health`)
2. 所有算命 API (生肖/八字/流年/姓名/婚姻)
3. 缓存性能 (对比首次请求和缓存请求)
4. 限流功能 (发送10个快速请求)

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

## 重要文件

- **DATABASE.md**: 数据库详细文档
- **OPTIMIZATION.md**: 性能优化详细文档
- **README.md**: 项目使用说明
- **test-all.sh**: 完整测试脚本
- **db-cli.sh**: 数据库管理快捷脚本
- **docker-compose.yml**: PostgreSQL 配置
- **db/init.sql**: 数据库初始化脚本
