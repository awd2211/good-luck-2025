# API 文档说明

## Swagger/OpenAPI 文档已集成

本项目已经集成了 Swagger/OpenAPI 3.0 文档系统,提供完整的 API 交互式文档。

## 访问文档

启动后端服务后,可以通过以下URL访问API文档:

### 开发环境
- **Swagger UI 界面**: http://localhost:50301/api-docs
- **OpenAPI JSON**: http://localhost:50301/api-docs.json

### 生产环境
- **Swagger UI 界面**: https://api.fortune-platform.com/api-docs
- **OpenAPI JSON**: https://api.fortune-platform.com/api-docs.json

## 功能特点

### 1. 完整的API分类
文档按照业务模块组织,包括:

**公开API (无需认证)**
- Public - Banners: 横幅展示
- Public - Notifications: 通知展示
- Public - Share: 分享追踪

**用户端API (需用户JWT认证)**
- User - Auth: 用户认证 (注册/登录/验证码)
- User - Fortune: 算命计算
- User - Cart: 购物车
- User - Favorites: 收藏
- User - Orders: 订单
- User - Reviews: 评价
- User - Coupons: 优惠券
- User - Daily Horoscopes: 每日运势
- User - Articles: 文章
- User - Notifications: 用户通知
- User - Chat: WebChat聊天

**管理端API (需管理员JWT认证)**
- Admin - Auth: 管理员认证
- Admin - Users: 用户管理
- Admin - Orders: 订单管理
- Admin - Stats: 统计数据
- Admin - Audit: 审计日志
- Admin - Banners: 横幅管理
- Admin - Reviews: 评价管理
- Admin - Coupons: 优惠券管理
- Admin - Financial: 财务管理
- Admin - Fortune Management: 算命业务管理
- Admin - AI Models: AI模型管理
- Admin - Attribution: 归因分析
- Admin - Payment: 支付配置
- Admin - Customer Service: 客服管理

### 2. 认证说明
文档中明确标注了两种认证方式:

- **UserBearerAuth**: 用户端JWT认证 (通过 `/api/auth/login` 获取)
- **AdminBearerAuth**: 管理端JWT认证 (通过 `/api/manage/auth/login` 获取)

在 Swagger UI 中可以点击右上角的 "Authorize" 按钮输入 token 进行测试。

### 3. 请求/响应示例
每个API端点都包含:
- 请求参数说明和示例
- 响应格式和示例
- 错误码说明
- 数据模型定义

### 4. 交互式测试
在 Swagger UI 中可以直接:
- 查看所有API端点
- 填写参数并发送测试请求
- 查看实时响应结果
- 复制 curl 命令

## 使用流程

### 1. 启动后端服务
```bash
cd backend
npm run dev
```

### 2. 访问文档
在浏览器中打开: http://localhost:3000/api-docs

### 3. 认证测试
对于需要认证的接口:

#### 用户端认证
1. 在 Swagger UI 中找到 `User - Auth` 分组
2. 执行 `POST /api/auth/send-code` 发送验证码
3. 执行 `POST /api/auth/login/code` 登录获取 token
4. 点击右上角 "Authorize" 按钮
5. 在 `UserBearerAuth` 中输入 token (格式: `Bearer your_token`)
6. 现在可以测试需要用户认证的接口了

#### 管理端认证
1. 执行 `POST /api/manage/auth/login`
   - username: admin
   - password: admin123
2. 复制返回的 token
3. 点击 "Authorize" 按钮
4. 在 `AdminBearerAuth` 中输入 token
5. 测试管理端接口

### 4. 测试接口
1. 展开想要测试的API端点
2. 点击 "Try it out" 按钮
3. 填写必需的参数
4. 点击 "Execute" 按钮
5. 查看响应结果

## 数据模型

文档中定义了以下核心数据模型:

- **User**: 用户信息
- **Order**: 订单信息
- **Fortune**: 算命服务
- **Admin**: 管理员信息
- **Banner**: 横幅信息
- **SuccessResponse**: 成功响应格式
- **ErrorResponse**: 错误响应格式
- **PaginatedResponse**: 分页响应格式

所有模型都可以在 Swagger UI 的 "Schemas" 部分查看详细定义。

## 导出和集成

### 导出 OpenAPI JSON
```bash
curl http://localhost:50301/api-docs.json > openapi.json
```

### 生成客户端SDK
可以使用 OpenAPI Generator 生成各种语言的客户端SDK:

```bash
# 安装 OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# 生成 TypeScript 客户端
openapi-generator-cli generate \
  -i http://localhost:50301/api-docs.json \
  -g typescript-axios \
  -o ./generated-client

# 生成 Python 客户端
openapi-generator-cli generate \
  -i http://localhost:50301/api-docs.json \
  -g python \
  -o ./generated-client-python
```

### 导入到 Postman
1. 在 Postman 中点击 "Import"
2. 选择 "Link" 标签
3. 输入: `http://localhost:50301/api-docs.json`
4. 点击 "Continue" 导入所有API

### 导入到 Insomnia
1. 在 Insomnia 中点击 "Create" → "Import"
2. 选择 "From URL"
3. 输入: `http://localhost:50301/api-docs.json`
4. 所有API将自动导入

## 为新接口添加文档

### 示例: 为路由添加Swagger注解

```typescript
/**
 * @openapi
 * /api/your-endpoint:
 *   post:
 *     summary: 接口简介
 *     description: 接口详细说明
 *     tags:
 *       - Your Category
 *     security:
 *       - UserBearerAuth: []  # 如果需要认证
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *             properties:
 *               field1:
 *                 type: string
 *                 example: "示例值"
 *               field2:
 *                 type: number
 *                 example: 123
 *     responses:
 *       200:
 *         description: 成功响应
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 请求错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/your-endpoint', yourController.yourMethod);
```

### 注解语法说明

- `@openapi`: 标记这是一个OpenAPI文档注解
- `tags`: API分组标签,应该使用配置文件中定义的标签
- `security`: 认证要求,使用 `UserBearerAuth` 或 `AdminBearerAuth`
- `requestBody`: 请求体定义
- `responses`: 各种HTTP状态码的响应定义
- `$ref`: 引用已定义的数据模型

### 添加新的数据模型

在 `backend/src/config/swagger.ts` 的 `components.schemas` 中添加:

```typescript
YourModel: {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: 'model-001'
    },
    name: {
      type: 'string',
      example: '示例名称'
    },
    // ... 其他字段
  }
}
```

## 配置文件

主要配置文件位于:
- `backend/src/config/swagger.ts`: Swagger配置和数据模型定义
- `backend/src/index.ts`: Swagger UI中间件集成

## 注意事项

1. **安全性**: Swagger UI 已禁用 CSP (Content Security Policy) 以允许加载必要资源
2. **性能**: 文档生成在服务启动时完成,不影响运行时性能
3. **更新**: 修改路由注解后需要重启服务才能看到文档更新
4. **生产环境**: 建议在生产环境中限制 `/api-docs` 的访问权限

## 扩展功能

### 添加API版本控制
可以为不同版本的API创建不同的Swagger配置:

```typescript
// swagger-v1.ts
export const swaggerSpecV1 = swaggerJSDoc({
  swaggerDefinition: {
    // ... v1 配置
  },
  apis: ['./src/routes/v1/**/*.ts']
});

// swagger-v2.ts
export const swaggerSpecV2 = swaggerJSDoc({
  swaggerDefinition: {
    // ... v2 配置
  },
  apis: ['./src/routes/v2/**/*.ts']
});
```

### 添加更多文档细节
- API限流说明
- 请求示例和响应示例
- 错误码参考
- 业务逻辑说明
- 最佳实践建议

## 相关资源

- [OpenAPI 3.0 规范](https://swagger.io/specification/)
- [Swagger UI 文档](https://swagger.io/tools/swagger-ui/)
- [swagger-jsdoc 使用指南](https://github.com/Surnet/swagger-jsdoc)
- [OpenAPI Generator](https://openapi-generator.tech/)

## 问题排查

### 文档不显示
1. 检查服务是否正常启动
2. 检查 `/api-docs` 路由是否正确注册
3. 查看控制台是否有错误信息

### 某些接口不显示
1. 检查路由文件是否在 swagger.ts 的 `apis` 配置中
2. 检查注解格式是否正确
3. 验证 YAML 缩进是否正确

### 认证不工作
1. 确认 token 格式为 `Bearer your_token`
2. 检查 token 是否过期
3. 验证 security 配置是否正确

## 贡献指南

为新的API添加文档时,请:
1. 使用清晰的中文描述
2. 提供实际可用的示例值
3. 说明所有必需和可选参数
4. 列出所有可能的响应状态码
5. 引用已定义的数据模型 (使用 $ref)
