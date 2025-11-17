# 用户端API文档

## 概述

本文档描述了算命平台用户端（C端）的所有API接口。用户端API包括：购物车、收藏、浏览历史、算命服务列表等功能。

## 快速开始

### 1. 执行数据库迁移

```bash
# 方法1: 使用迁移脚本（推荐）
./migrate-user-tables.sh

# 方法2: 手动执行SQL
./db-cli.sh connect -c "\i backend/migrations/015_create_user_tables.sql"
```

### 2. 启动后端服务

```bash
cd backend
npm run dev
```

### 3. 运行API测试

```bash
./test-user-api.sh
```

## API接口列表

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **Token位置**: HTTP Header `Authorization: Bearer <token>`

### 1. 用户认证 `/api/auth/*`

#### 1.1 发送验证码
```
POST /api/auth/send-code
```

**请求体:**
```json
{
  "phone": "13900000001"
}
```

**响应:**
```json
{
  "success": true,
  "message": "验证码已发送"
}
```

#### 1.2 验证码登录
```
POST /api/auth/login/code
```

**请求体:**
```json
{
  "phone": "13900000001",
  "code": "123456"
}
```

**响应:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_1234567890_abc123",
      "phone": "13900000001",
      "nickname": "用户0001",
      "avatar": null,
      "balance": 0
    }
  }
}
```

#### 1.3 密码登录
```
POST /api/auth/login/password
```

**请求体:**
```json
{
  "phone": "13900000001",
  "password": "your_password"
}
```

#### 1.4 用户注册
```
POST /api/auth/register
```

**请求体:**
```json
{
  "phone": "13900000001",
  "code": "123456",
  "password": "your_password",
  "nickname": "昵称（可选）"
}
```

#### 1.5 获取当前用户信息
```
GET /api/auth/me
需要认证
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "user_1234567890_abc123",
    "phone": "13900000001",
    "nickname": "测试用户",
    "avatar": "https://example.com/avatar.jpg",
    "balance": 0,
    "created_at": "2025-01-13T10:30:00.000Z"
  }
}
```

#### 1.6 更新个人信息
```
PUT /api/auth/profile
需要认证
```

**请求体:**
```json
{
  "nickname": "新昵称",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

#### 1.7 修改密码
```
POST /api/auth/change-password
需要认证
```

**请求体:**
```json
{
  "oldPassword": "old_password",
  "newPassword": "new_password"
}
```

#### 1.8 重置密码
```
POST /api/auth/reset-password
```

**请求体:**
```json
{
  "phone": "13900000001",
  "code": "123456",
  "newPassword": "new_password"
}
```

---

### 2. 算命服务 `/api/fortunes/*`

#### 2.1 获取服务列表
```
GET /api/fortunes
支持分页、筛选、排序、搜索
```

**查询参数:**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `category`: 分类筛选（birth-animal, bazi, yearly, name, marriage, career, wealth, romance）
- `sort`: 排序方式（price_asc, price_desc, popular, rating）
- `keyword`: 关键词搜索

**示例:**
```
GET /api/fortunes?category=bazi&sort=popular&page=1&limit=10
GET /api/fortunes?keyword=八字&page=1
```

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "生肖运势",
        "category": "birth-animal",
        "description": "根据您的生肖，为您详细解读今年的运势走向",
        "price": "58.00",
        "original_price": "88.00",
        "image_url": null,
        "icon": "🐉",
        "is_popular": true,
        "is_recommended": true,
        "view_count": 1234,
        "order_count": 567,
        "rating": "5.00",
        "sort_order": 1
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

#### 2.2 获取服务详情
```
GET /api/fortunes/:id
可选认证（登录后返回收藏状态）
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "生肖运势",
    "category": "birth-animal",
    "description": "根据您的生肖，为您详细解读今年的运势走向",
    "price": "58.00",
    "original_price": "88.00",
    "image_url": null,
    "icon": "🐉",
    "is_popular": true,
    "is_recommended": true,
    "view_count": 1235,
    "order_count": 567,
    "rating": "5.00",
    "created_at": "2025-01-13T10:30:00.000Z",
    "updated_at": "2025-01-13T10:30:00.000Z",
    "isFavorited": false
  }
}
```

#### 2.3 获取热门服务
```
GET /api/fortunes/popular?limit=10
```

#### 2.4 获取推荐服务
```
GET /api/fortunes/recommended?limit=10
```

#### 2.5 获取分类列表
```
GET /api/fortunes/categories
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "category": "bazi",
      "name": "八字精批",
      "count": 1,
      "minPrice": 88,
      "maxPrice": 88
    },
    {
      "category": "birth-animal",
      "name": "生肖运势",
      "count": 1,
      "minPrice": 58,
      "maxPrice": 58
    }
  ]
}
```

---

### 3. 购物车 `/api/cart/*`

所有购物车接口都需要用户认证。

#### 3.1 获取购物车
```
GET /api/cart
需要认证
```

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "fortune_id": 1,
        "quantity": 2,
        "created_at": "2025-01-13T10:30:00.000Z",
        "name": "生肖运势",
        "category": "birth-animal",
        "description": "...",
        "price": "58.00",
        "original_price": "88.00",
        "image_url": null,
        "icon": "🐉"
      }
    ],
    "count": 1,
    "total": "116.00"
  }
}
```

#### 3.2 添加到购物车
```
POST /api/cart
需要认证
```

**请求体:**
```json
{
  "fortuneId": 1,
  "quantity": 2
}
```

**响应:**
```json
{
  "success": true,
  "message": "添加成功",
  "data": {
    "id": 1,
    "user_id": "user_xxx",
    "fortune_id": 1,
    "quantity": 2,
    "created_at": "2025-01-13T10:30:00.000Z",
    "updated_at": "2025-01-13T10:30:00.000Z"
  }
}
```

#### 3.3 更新商品数量
```
PUT /api/cart/:id
需要认证
```

**请求体:**
```json
{
  "quantity": 5
}
```

#### 3.4 删除购物车商品
```
DELETE /api/cart/:id
需要认证
```

#### 3.5 批量删除
```
POST /api/cart/batch-delete
需要认证
```

**请求体:**
```json
{
  "ids": [1, 2, 3]
}
```

#### 3.6 清空购物车
```
DELETE /api/cart
需要认证
```

---

### 4. 收藏 `/api/favorites/*`

所有收藏接口都需要用户认证。

#### 4.1 获取收藏列表
```
GET /api/favorites?page=1&limit=20
需要认证
```

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "fortune_id": 1,
        "created_at": "2025-01-13T10:30:00.000Z",
        "name": "生肖运势",
        "category": "birth-animal",
        "description": "...",
        "price": "58.00",
        "original_price": "88.00",
        "image_url": null,
        "icon": "🐉",
        "rating": "5.00",
        "order_count": 567
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

#### 4.2 添加收藏
```
POST /api/favorites
需要认证
```

**请求体:**
```json
{
  "fortuneId": 1
}
```

#### 4.3 取消收藏
```
DELETE /api/favorites/:fortuneId
需要认证
```

#### 4.4 检查是否收藏
```
GET /api/favorites/check/:fortuneId
需要认证
```

**响应:**
```json
{
  "success": true,
  "data": {
    "isFavorited": true
  }
}
```

#### 4.5 批量检查收藏状态
```
POST /api/favorites/batch-check
需要认证
```

**请求体:**
```json
{
  "fortuneIds": [1, 2, 3, 4, 5]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "1": true,
    "2": false,
    "3": true,
    "4": false,
    "5": false
  }
}
```

---

### 5. 浏览历史 `/api/history/*`

所有浏览历史接口都需要用户认证。

#### 5.1 获取浏览历史
```
GET /api/history?page=1&limit=20
需要认证
```

**响应:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "fortune_id": 1,
        "created_at": "2025-01-13T10:30:00.000Z",
        "updated_at": "2025-01-13T11:00:00.000Z",
        "name": "生肖运势",
        "category": "birth-animal",
        "description": "...",
        "price": "58.00",
        "original_price": "88.00",
        "image_url": null,
        "icon": "🐉",
        "rating": "5.00",
        "order_count": 567
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

#### 5.2 添加浏览记录
```
POST /api/history
需要认证
```

**请求体:**
```json
{
  "fortuneId": 1
}
```

**说明:** 如果已有该商品的浏览记录，会更新时间而不是创建新记录。

#### 5.3 删除单条浏览记录
```
DELETE /api/history/:id
需要认证
```

#### 5.4 批量删除浏览记录
```
POST /api/history/batch-delete
需要认证
```

**请求体:**
```json
{
  "ids": [1, 2, 3]
}
```

#### 5.5 清空浏览历史
```
DELETE /api/history
需要认证
```

---

## 错误响应格式

所有API错误都遵循以下格式：

```json
{
  "success": false,
  "message": "错误描述信息"
}
```

### 常见HTTP状态码

- `200`: 成功
- `400`: 请求参数错误
- `401`: 未认证或Token无效
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

### 常见错误示例

**未登录:**
```json
{
  "success": false,
  "message": "未提供认证token"
}
```

**Token过期:**
```json
{
  "success": false,
  "message": "Token已过期"
}
```

**商品不存在:**
```json
{
  "success": false,
  "message": "商品不存在或已下架"
}
```

**重复操作:**
```json
{
  "success": false,
  "message": "已收藏该商品"
}
```

---

## 数据库表结构

### fortunes (算命服务表)
- `id`: 服务ID (自增主键)
- `name`: 服务名称
- `category`: 分类
- `description`: 描述
- `price`: 价格
- `original_price`: 原价
- `image_url`: 图片URL
- `icon`: 图标
- `is_popular`: 是否热门
- `is_recommended`: 是否推荐
- `view_count`: 浏览次数
- `order_count`: 订单数量
- `rating`: 评分
- `status`: 状态 (active/inactive)
- `sort_order`: 排序
- `created_at`: 创建时间
- `updated_at`: 更新时间

### cart_items (购物车表)
- `id`: 购物车项ID (自增主键)
- `user_id`: 用户ID (外键)
- `fortune_id`: 服务ID (外键)
- `quantity`: 数量
- `created_at`: 创建时间
- `updated_at`: 更新时间
- 唯一约束: (user_id, fortune_id)

### favorites (收藏表)
- `id`: 收藏ID (自增主键)
- `user_id`: 用户ID (外键)
- `fortune_id`: 服务ID (外键)
- `created_at`: 创建时间
- 唯一约束: (user_id, fortune_id)

### browse_history (浏览历史表)
- `id`: 历史记录ID (自增主键)
- `user_id`: 用户ID (外键)
- `fortune_id`: 服务ID (外键)
- `created_at`: 创建时间
- `updated_at`: 更新时间（最后浏览时间）

---

## 注意事项

1. **验证码开发模式**: 当前验证码会打印在后端控制台，生产环境需要接入真实的短信服务。

2. **Token有效期**: JWT Token有效期为7天，过期后需要重新登录。

3. **浏览记录去重**: 添加浏览记录时，如果已存在该商品的记录，会更新时间而不是创建新记录。

4. **购物车数量限制**: 单个商品数量限制在1-99之间。

5. **分页默认值**: 默认每页20条，最大支持100条。

6. **价格格式**: 所有价格字段都是字符串格式，保留两位小数。

7. **软删除**: 商品删除采用软删除（status='inactive'），购物车/收藏中不会显示已下架商品。

8. **性能优化**:
   - 所有列表接口都有索引优化
   - 查询时会自动过滤已下架商品
   - 浏览历史按最新浏览时间排序

---

## 开发规范

### 代码结构
```
backend/src/
├── controllers/user/          # 用户端控制器
│   ├── authController.ts
│   ├── cartController.ts
│   ├── favoriteController.ts
│   ├── historyController.ts
│   └── fortuneListController.ts
├── services/user/             # 用户端服务层
│   ├── authService.ts
│   ├── cartService.ts
│   ├── favoriteService.ts
│   ├── historyService.ts
│   └── fortuneListService.ts
├── routes/user/               # 用户端路由
│   ├── auth.ts
│   ├── cart.ts
│   ├── favorite.ts
│   ├── history.ts
│   └── fortuneList.ts
└── middleware/
    └── userAuth.ts            # 用户认证中间件
```

### 命名约定
- 控制器函数: 动词开头 (getCart, addToCart, updateCartItem)
- 服务函数: 动词开头 (getUserCart, addToCart)
- 路由: RESTful风格
- 变量: 驼峰命名法

### 错误处理
- 使用 try-catch 捕获异常
- 通过 next(error) 传递给全局错误处理中间件
- 返回清晰的错误信息

---

## 测试指南

### 手动测试

使用 curl 测试API：

```bash
# 1. 发送验证码
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "13900000001"}'

# 2. 登录获取Token
curl -X POST http://localhost:3000/api/auth/login/code \
  -H "Content-Type: application/json" \
  -d '{"phone": "13900000001", "code": "123456"}'

# 3. 获取服务列表
curl http://localhost:3000/api/fortunes

# 4. 添加到购物车（需要Token）
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"fortuneId": 1, "quantity": 1}'
```

### 自动化测试

```bash
# 运行完整测试套件
./test-user-api.sh

# 自定义API URL
API_URL=http://your-server.com/api ./test-user-api.sh
```

---

## 故障排查

### 数据库连接失败
```bash
# 检查数据库状态
./db-cli.sh status

# 重启数据库
docker compose restart postgres
```

### 表不存在
```bash
# 重新执行迁移
./migrate-user-tables.sh
```

### Token无效
- 检查Token是否过期（有效期7天）
- 确认Token格式正确：`Bearer <token>`
- 重新登录获取新Token

### 接口返回500错误
- 查看后端日志：`cd backend && npm run dev`
- 检查数据库连接
- 确认迁移已执行

---

## 更新日志

### v1.0.0 (2025-01-13)
- 初始版本发布
- 实现购物车、收藏、浏览历史、算命服务列表功能
- 支持用户注册、登录、个人信息管理
- 完整的测试脚本和文档

---

## 联系方式

如有问题，请查看：
- 项目主文档: `README.md`
- 数据库文档: `DATABASE.md`
- 优化文档: `OPTIMIZATION.md`
- 项目指南: `CLAUDE.md`
