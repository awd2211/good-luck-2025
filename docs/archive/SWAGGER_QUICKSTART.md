# Swagger API 文档快速开始

## 🎉 已集成完成

本项目已成功集成 Swagger/OpenAPI 3.0 文档系统!

## 📍 访问文档

启动后端服务后访问:

```bash
# 启动后端服务
cd backend
npm run dev

# 访问 Swagger UI (推荐)
http://localhost:50301/api-docs

# 下载 OpenAPI JSON
http://localhost:50301/api-docs.json
```

## 🚀 快速测试

### 1. 测试公开API (无需认证)

在 Swagger UI 中:
1. 找到 `Public - Banners` 标签
2. 展开 `GET /api/public/banners`
3. 点击 "Try it out"
4. 点击 "Execute"
5. 查看返回结果

### 2. 测试用户端API (需认证)

#### 步骤 1: 获取验证码
1. 找到 `User - Auth` → `POST /api/auth/send-code`
2. 点击 "Try it out"
3. 输入手机号 (例如: 13900000001)
4. 点击 "Execute"
5. 在后端控制台查看验证码

#### 步骤 2: 登录获取 Token
1. 找到 `POST /api/auth/login/code`
2. 点击 "Try it out"
3. 输入手机号和验证码
4. 点击 "Execute"
5. 复制返回的 token

#### 步骤 3: 设置认证
1. 点击页面右上角 "Authorize" 按钮
2. 在 `UserBearerAuth` 输入框中输入 token
3. 点击 "Authorize"
4. 点击 "Close"

#### 步骤 4: 测试需要认证的接口
1. 找到 `User - Auth` → `GET /api/auth/me`
2. 点击 "Try it out"
3. 点击 "Execute"
4. 成功返回当前用户信息

### 3. 测试管理端API (需管理员认证)

#### 步骤 1: 管理员登录
1. 找到 `Admin - Auth` → `POST /api/manage/auth/login`
2. 点击 "Try it out"
3. 输入:
   - username: `admin`
   - password: `admin123`
4. 点击 "Execute"
5. 复制返回的 token

#### 步骤 2: 设置管理员认证
1. 点击 "Authorize" 按钮
2. 在 `AdminBearerAuth` 输入框中输入 token
3. 点击 "Authorize"

#### 步骤 3: 测试管理端接口
现在可以测试所有 `Admin - *` 分组下的接口了

## 📊 已添加注解的接口

### 用户端 API (User)
- ✅ **User - Auth**: 完整的认证接口 (8个端点)
  - 发送验证码
  - 验证码登录
  - 密码登录
  - 用户注册
  - 获取用户信息
  - 更新个人资料
  - 修改密码
  - 重置密码

### 公开 API (Public)
- ✅ **Public - Banners**: 横幅展示接口

### 通用接口
- ✅ **General**: API信息和健康检查

## 🔧 为其他接口添加文档

项目中还有大量接口未添加 Swagger 注解,可以参考已添加的示例继续完善:

### 待添加文档的接口分组

**用户端:**
- User - Cart (购物车)
- User - Favorites (收藏)
- User - Orders (订单)
- User - Reviews (评价)
- User - Coupons (优惠券)
- User - Fortune (算命计算)
- User - Daily Horoscopes (每日运势)

**管理端:**
- Admin - Users (用户管理)
- Admin - Orders (订单管理)
- Admin - Stats (统计数据)
- Admin - Banners (横幅管理)
- Admin - Coupons (优惠券管理)
- Admin - Financial (财务管理)
- Admin - Fortune Management (算命业务管理)

### 添加注解的模板

参考 `backend/src/routes/user/auth.ts` 或 `backend/src/routes/public/banners.ts` 中的注解格式:

```typescript
/**
 * @openapi
 * /api/your-endpoint:
 *   method:
 *     summary: 接口简介
 *     description: 详细说明
 *     tags:
 *       - Category Name
 *     security:
 *       - UserBearerAuth: []  # 如果需要认证
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field1:
 *                 type: string
 *                 example: "示例"
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.method('/your-endpoint', controller.handler);
```

## 📦 导出和集成

### 导出到 Postman
```bash
# 在 Postman 中:
# Import → Link → http://localhost:50301/api-docs.json
```

### 导出到 Insomnia
```bash
# 在 Insomnia 中:
# Create → Import → From URL → http://localhost:50301/api-docs.json
```

### 生成客户端 SDK
```bash
# 安装 OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# 生成 TypeScript SDK
openapi-generator-cli generate \
  -i http://localhost:50301/api-docs.json \
  -g typescript-axios \
  -o ./sdk/typescript

# 生成 Python SDK
openapi-generator-cli generate \
  -i http://localhost:50301/api-docs.json \
  -g python \
  -o ./sdk/python
```

## 📝 配置文件

- **Swagger 配置**: `backend/src/config/swagger.ts`
- **路由注解**: `backend/src/routes/**/*.ts`
- **主入口**: `backend/src/index.ts`

## 🎯 主要特性

✅ 三端API分离展示 (公开/用户端/管理端)
✅ 双认证系统支持 (UserBearerAuth/AdminBearerAuth)
✅ 完整的请求/响应模型定义
✅ 交互式API测试
✅ 支持导出OpenAPI JSON
✅ 可集成到Postman/Insomnia
✅ 可生成多语言SDK

## 📖 详细文档

查看完整文档: `backend/API_DOCUMENTATION.md`

## 🔗 相关资源

- OpenAPI 3.0 规范: https://swagger.io/specification/
- Swagger UI 文档: https://swagger.io/tools/swagger-ui/
- swagger-jsdoc: https://github.com/Surnet/swagger-jsdoc
