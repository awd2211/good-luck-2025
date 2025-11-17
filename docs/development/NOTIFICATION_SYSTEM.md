# 通知系统功能完整说明

## 📋 系统概述

通知系统已完整实现，包含用户端通知中心、Toast实时通知、管理端通知管理、模板系统、定时发送等功能。

## ✅ 已实现功能

### 1. 数据库结构 (backend/migrations/013_enhance_notifications.sql)

#### 新增表
- **notification_templates**: 通知模板表
  - 支持变量占位符 (如 `{username}`, `{service_name}`)
  - 系统模板保护 (`is_system` 标记)
  - 预置5个系统模板

- **user_notification_reads**: 用户通知阅读记录表
  - 记录已读状态 (`is_read`)
  - 记录点击状态 (`is_clicked`)
  - 记录阅读和点击时间

- **notification_send_logs**: 通知发送日志表
  - 记录每次发送的目标类型
  - 记录发送数量
  - 记录错误信息

#### 增强的 notifications 表
- `scheduled_time`: 定时发送时间
- `is_scheduled`: 是否定时发送
- `sent_at`: 实际发送时间
- `read_count`: 已读人数
- `total_sent`: 总发送人数
- `click_count`: 点击人数
- `template_id`: 关联模板ID

#### 视图
- **notification_stats**: 通知统计视图
  - 计算阅读率 (`read_rate`)
  - 计算点击率 (`click_rate`)

### 2. 用户前端功能

#### 通知中心页面 (`frontend/src/pages/NotificationCenterPage.tsx`)
**访问路径**: `/notifications`

**功能**:
- 📌 通知列表展示（支持分页）
- 🔍 筛选功能：
  - 按已读/未读状态筛选
  - 按通知类型筛选 (info/warning/error/success)
- ✓ 标记单个通知为已读
- ✓ 一键标记全部为已读
- 📱 点击通知内容（记录点击）
- 🗑️ 删除通知

**设计**:
- 响应式设计，支持移动端
- 渐变背景
- 动画效果
- 清晰的视觉层次

#### Toast 通知组件 (`frontend/src/components/ToastNotification.tsx`)
**功能**:
- 📤 从右下角弹出
- ⏱️ 自动倒计时关闭（默认5秒）
- 📊 进度条显示剩余时间
- ✕ 手动关闭
- 🎨 根据类型显示不同颜色和图标
- 🎯 点击通知可触发自定义操作

#### Toast 容器 (`frontend/src/components/ToastContainer.tsx`)
**功能**:
- 🧩 全局单例容器
- 📚 最多显示5个Toast
- 🔄 自动管理Toast生命周期
- 🌐 提供全局 `showToast()` 函数

**使用示例**:
```typescript
import { showToast } from '../components/ToastContainer';

// 在任何组件中调用
showToast({
  title: '新通知',
  content: '您有一条新消息',
  type: 'info',
  duration: 5000
});
```

#### 通知铃铛 (`frontend/src/pages/HomePage.tsx`)
**功能**:
- 🔔 显示未读通知数量
- 🎵 数字徽章动画
- 🖱️ 点击跳转到通知中心
- 🔄 实时更新未读数量

### 3. 后端 API

#### 用户端通知 API (`/api/notifications`)

**需要用户认证** (`userAuth` 中间件)

##### GET `/api/notifications/user`
获取当前用户的通知列表

**Query 参数**:
- `unreadOnly`: boolean - 仅显示未读通知
- `type`: string - 按类型筛选
- `page`: number - 页码 (默认1)
- `limit`: number - 每页数量 (默认20)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "系统维护通知",
      "content": "系统将于今晚进行维护",
      "type": "info",
      "priority": 1,
      "is_read": false,
      "is_clicked": false,
      "created_at": "2025-11-14T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

##### GET `/api/notifications/unread-count`
获取未读通知数量

**响应**:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

##### POST `/api/notifications/:id/read`
标记通知为已读

##### POST `/api/notifications/read-all`
标记所有通知为已读

##### POST `/api/notifications/:id/click`
记录通知点击

##### DELETE `/api/notifications/:id/delete`
软删除通知（标记为已读）

#### 管理端通知模板 API (`/api/manage/notification-templates`)

**需要管理员认证** (`auth` 中间件)

##### GET `/api/manage/notification-templates`
获取所有模板

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "register_welcome",
      "title": "欢迎加入{platform}",
      "content": "亲爱的{username}，欢迎注册...",
      "type": "success",
      "priority": 0,
      "target": "all",
      "variables": "[\"username\",\"platform\"]",
      "is_system": true,
      "created_at": "2025-11-14T00:00:00Z"
    }
  ]
}
```

##### POST `/api/manage/notification-templates`
创建新模板

**请求体**:
```json
{
  "name": "custom_template",
  "title": "标题{变量}",
  "content": "内容{变量}",
  "type": "info",
  "priority": 0,
  "target": "all",
  "variables": "[\"变量\"]",
  "description": "模板说明"
}
```

##### PUT `/api/manage/notification-templates/:id`
更新模板（系统模板不可修改）

##### DELETE `/api/manage/notification-templates/:id`
删除模板（系统模板不可删除）

### 4. 管理后台功能

#### 通知模板管理 (`admin-frontend/src/pages/NotificationTemplates.tsx`)
**访问路径**: `/notification-templates`

**功能**:
- ➕ 创建模板
- ✏️ 编辑模板
- 🗑️ 删除模板（系统模板禁止删除）
- 📝 变量管理（逗号分隔）
- 🔒 系统模板保护标识
- 🎨 富文本内容编辑

#### 增强的通知管理 (`admin-frontend/src/pages/NotificationManagement.tsx`)
**访问路径**: `/notifications`

**新增功能**:
- ⏰ 定时发送开关
- 📅 设置发送时间
- 📊 发送状态显示：
  - 待发送（黄色标签，显示定时）
  - 已发送（绿色标签，显示发送时间）
  - 立即生效（灰色标签）
- 📈 发送统计（发送人数、已读人数）

### 5. 定时发送调度器 (`backend/src/services/notificationScheduler.ts`)

**功能**:
- ⏱️ 每分钟检查一次待发送通知
- 📤 自动发送到目标用户群体：
  - `all`: 所有活跃用户
  - `vip`: VIP用户
  - `new`: 7天内注册的新用户
- 📝 记录发送日志
- 🔄 更新通知状态
- ❌ 错误处理和日志记录

**启动**:
在 `backend/src/index.ts` 中自动启动：
```typescript
import { startNotificationScheduler } from './services/notificationScheduler';
startNotificationScheduler();
```

## 🚀 快速使用

### 管理员使用流程

1. **创建通知模板**（可选）:
   - 访问 `/notification-templates`
   - 点击"添加模板"
   - 输入模板信息，使用 `{变量名}` 作为占位符
   - 保存

2. **发送通知**:
   - 访问 `/notifications`
   - 点击"添加通知"
   - 填写标题、内容、类型、优先级
   - 选择目标用户群体
   - **立即发送**: 不勾选"定时发送"
   - **定时发送**: 勾选"定时发送"，选择发送时间
   - 保存

3. **查看发送统计**:
   - 在通知列表中查看"发送状态"列
   - 鼠标悬停查看详细统计（发送人数、已读人数）

### 用户使用流程

1. **查看铃铛提示**:
   - 首页右上角显示未读数量
   - 点击铃铛进入通知中心

2. **浏览通知**:
   - 访问 `/notifications`
   - 使用筛选功能过滤通知
   - 点击通知查看详情

3. **管理通知**:
   - 单个标记为已读
   - 一键全部标记为已读
   - 删除不需要的通知

### 开发者使用 Toast

在任何前端组件中显示Toast通知：

```typescript
import { showToast } from '../components/ToastContainer';

// 成功提示
showToast({
  title: '操作成功',
  content: '您的订单已提交',
  type: 'success'
});

// 警告提示
showToast({
  title: '注意',
  content: '请填写完整信息',
  type: 'warning'
});

// 错误提示
showToast({
  title: '错误',
  content: '网络连接失败',
  type: 'error',
  duration: 8000  // 8秒后关闭
});

// 带点击事件
showToast({
  title: '新消息',
  content: '您收到一条新评价',
  type: 'info',
  onClick: () => {
    navigate('/reviews');
  }
});
```

## 📂 文件清单

### 数据库迁移
- `/backend/migrations/013_enhance_notifications.sql`
- `/backend/run-migration.js` (执行迁移的脚本)

### 后端
- `/backend/src/services/user/notificationService.ts` - 用户通知服务层
- `/backend/src/controllers/user/notificationController.ts` - 用户通知控制器
- `/backend/src/routes/user/notifications.ts` - 用户通知路由
- `/backend/src/services/notificationScheduler.ts` - 定时发送调度器
- `/backend/src/routes/notificationTemplates.ts` - 模板管理路由

### 用户前端
- `/frontend/src/pages/NotificationCenterPage.tsx` - 通知中心页面
- `/frontend/src/pages/NotificationCenterPage.css` - 通知中心样式
- `/frontend/src/components/ToastNotification.tsx` - Toast组件
- `/frontend/src/components/ToastNotification.css` - Toast样式
- `/frontend/src/components/ToastContainer.tsx` - Toast容器
- `/frontend/src/components/ToastContainer.css` - Toast容器样式
- `/frontend/src/pages/HomePage.tsx` - 首页（添加了铃铛）
- `/frontend/src/pages/HomePage.css` - 首页样式（添加了铃铛样式）
- `/frontend/src/App.tsx` - 路由配置（添加了通知中心路由和ToastContainer）

### 管理后台
- `/admin-frontend/src/pages/NotificationTemplates.tsx` - 模板管理页面
- `/admin-frontend/src/pages/NotificationManagement.tsx` - 通知管理页面（已增强）
- `/admin-frontend/src/layouts/MainLayout.tsx` - 主布局（添加了模板菜单项）
- `/admin-frontend/src/App.tsx` - 路由配置（添加了模板路由）

### 主入口修改
- `/backend/src/index.ts` - 注册路由，启动调度器

## 🔧 配置说明

### 调度器配置 (`backend/src/services/notificationScheduler.ts`)

```typescript
const SCHEDULER_INTERVAL = '* * * * *'; // 每分钟执行一次
```

可以修改为其他cron表达式：
- `*/5 * * * *`: 每5分钟
- `0 * * * *`: 每小时
- `0 9 * * *`: 每天9点

### Toast 配置

默认配置在 `ToastContainer.tsx`:
- 最多显示数量: 5个
- 默认持续时间: 5秒

## 📊 数据库表关系

```
notifications (通知主表)
  ├─> notification_templates (模板表) - template_id
  └─> user_notification_reads (阅读记录) - notification_id + user_id

notification_send_logs (发送日志) -> notifications - notification_id
```

## 🔒 权限控制

### 用户端
- 需要登录才能访问通知中心
- 只能查看自己相关的通知

### 管理端
使用RBAC权限系统：
- `Permission.NOTIFICATION_VIEW`: 查看通知
- `Permission.NOTIFICATION_CREATE`: 创建通知
- `Permission.NOTIFICATION_EDIT`: 编辑通知
- `Permission.NOTIFICATION_DELETE`: 删除通知

## 🎯 已实现的优化

### 性能优化
- ✅ 分页加载（默认每页20条）
- ✅ 数据库索引优化
- ✅ 左连接减少查询次数
- ✅ 批量操作支持

### 用户体验优化
- ✅ 实时未读数量更新
- ✅ Toast自动关闭
- ✅ 进度条显示剩余时间
- ✅ 响应式设计
- ✅ 动画效果
- ✅ 清晰的视觉反馈

### 开发体验优化
- ✅ 全局Toast函数
- ✅ TypeScript类型支持
- ✅ 统一的API响应格式
- ✅ 详细的错误处理

## 🚧 未实现功能（可选扩展）

### 实时推送
- WebSocket 实时通知推送
- Server-Sent Events (SSE)

### 高级功能
- 通知声音效果
- 富文本/Markdown 支持
- 图片/附件支持
- 通知分组
- 通知优先级排序

### 多渠道推送
- 邮件通知
- 短信通知
- 微信公众号推送

### 分析功能
- A/B 测试
- 用户行为追踪
- 转化率分析

## ✅ 测试状态

- ✅ 数据库迁移成功
- ✅ 后端API启动成功
- ✅ 健康检查通过
- ✅ Redis连接成功
- ✅ 前端开发服务器运行中

## 🎉 部署完成

系统现已完全运行：
- **后端**: http://localhost:53001
- **用户前端**: http://localhost:5173
- **管理后台**: http://localhost:5174

**管理员账号**:
- 用户名: `admin`
- 密码: `admin123`

立即访问管理后台的通知管理页面开始使用！
