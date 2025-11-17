# Swagger/OpenAPI 文档集成指南

## 📖 概述

本指南说明如何为管理后台API生成和集成Swagger/OpenAPI文档，提供交互式API文档界面。

---

## 🎯 目标

1. **自动生成API文档** - 基于后端路由和注释
2. **交互式测试** - 直接在浏览器中测试API
3. **类型安全** - 前端可导入OpenAPI规范生成类型
4. **统一文档** - 所有API端点的完整说明

---

## 🔧 后端集成 (Express + TypeScript)

### 1. 安装依赖

```bash
cd /home/eric/good-luck-2025/backend
npm install --save swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

### 2. 创建Swagger配置

**文件**: `backend/src/config/swagger.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '算命测算平台 - 管理端API',
      version: '1.0.0',
      description: '管理后台RESTful API文档',
      contact: {
        name: 'API支持',
        email: 'admin@fortune.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:50301/api/manage',
        description: '开发环境'
      },
      {
        url: 'https://api.yourdomain.com/api/manage',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '使用JWT token进行认证'
        }
      },
      schemas: {
        // 通用响应格式
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '请求是否成功'
            },
            message: {
              type: 'string',
              description: '响应消息'
            },
            data: {
              type: 'object',
              description: '响应数据'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            data: {
              type: 'array',
              items: {}
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                total_pages: { type: 'number' }
              }
            }
          }
        },
        // 用户模型
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '用户ID' },
            username: { type: 'string', description: '用户名' },
            phone: { type: 'string', description: '手机号' },
            email: { type: 'string', description: '邮箱', nullable: true },
            nickname: { type: 'string', description: '昵称', nullable: true },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'banned'],
              description: '账户状态'
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        // 订单模型
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            order_no: { type: 'string', description: '订单号' },
            user_id: { type: 'string' },
            fortune_type: { type: 'string', description: '服务类型' },
            amount: { type: 'number', format: 'decimal' },
            status: {
              type: 'string',
              enum: ['pending', 'paid', 'completed', 'cancelled', 'refunded']
            },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/**/*.ts',  // 扫描所有路由文件
    './src/controllers/**/*.ts'  // 扫描控制器文件
  ]
}

export const swaggerSpec = swaggerJsdoc(options)
```

### 3. 集成到Express应用

**文件**: `backend/src/index.ts`

```typescript
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'

// ... 其他导入和配置 ...

// Swagger UI 路由（公开访问，无需认证）
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '算命平台API文档'
}))

// OpenAPI JSON 端点
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// ... 其他路由 ...
```

### 4. 添加JSDoc注释到路由

**示例**: `backend/src/routes/manage/users.ts`

```typescript
/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - 用户管理
 *     summary: 获取用户列表
 *     description: 分页获取用户列表，支持搜索和状态筛选
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（用户名/手机号/邮箱）
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, banned]
 *         description: 用户状态筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', getUsers)

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags:
 *       - 用户管理
 *     summary: 获取用户详情
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         description: 用户不存在
 */
router.get('/users/:id', getUser)

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags:
 *       - 用户管理
 *     summary: 更新用户信息
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 参数错误
 *       404:
 *         description: 用户不存在
 */
router.put('/users/:id', updateUser)
```

---

## 🎨 前端集成

### 方案1: 内嵌Swagger UI（推荐）

在管理后台中添加一个"API文档"菜单项，iframe嵌入Swagger UI。

**文件**: `admin-frontend/src/pages/APIDocumentation.tsx`

```typescript
import React from 'react'
import { Card } from 'antd'

const APIDocumentation: React.FC = () => {
  return (
    <Card title="API文档" bordered={false}>
      <iframe
        src="http://localhost:50301/api-docs"
        style={{
          width: '100%',
          height: 'calc(100vh - 200px)',
          border: 'none'
        }}
        title="API Documentation"
      />
    </Card>
  )
}

export default APIDocumentation
```

**路由配置**: `admin-frontend/src/App.tsx`

```typescript
import APIDocumentation from './pages/APIDocumentation'

// 在路由中添加
<Route path="/api-docs" element={<APIDocumentation />} />
```

**菜单配置**: `admin-frontend/src/layouts/MainLayout.tsx`

```typescript
{
  key: 'api-docs',
  icon: <FileTextOutlined />,
  label: <Link to="/api-docs">API文档</Link>,
}
```

### 方案2: 使用OpenAPI生成器生成TypeScript类型

```bash
cd admin-frontend
npm install --save-dev openapi-typescript
```

**生成类型**:
```bash
npx openapi-typescript http://localhost:50301/api-docs.json --output src/types/api-schema.d.ts
```

**使用生成的类型**:
```typescript
import type { paths, components } from '../types/api-schema'

type User = components['schemas']['User']
type GetUsersResponse = paths['/users']['get']['responses']['200']['content']['application/json']
```

### 方案3: 使用 React OpenAPI Client Generator

```bash
npm install --save-dev @rtk-query/codegen-openapi
```

自动生成完整的API客户端代码。

---

## 📋 最佳实践

### 1. 文档注释规范

**必须包含**:
- `tags`: API分组
- `summary`: 简短描述
- `description`: 详细说明（可选）
- `parameters`: 请求参数
- `requestBody`: 请求体（POST/PUT）
- `responses`: 响应格式

**示例模板**:
```typescript
/**
 * @openapi
 * /path:
 *   method:
 *     tags:
 *       - 分组名称
 *     summary: 简短描述
 *     description: 详细描述
 *     parameters: []
 *     requestBody: {}
 *     responses:
 *       200:
 *         description: 成功
 *       400:
 *         description: 失败
 */
```

### 2. 复用Schema定义

在 `swagger.ts` 中定义通用Schema，然后用 `$ref` 引用：

```yaml
$ref: '#/components/schemas/User'
$ref: '#/components/schemas/ApiResponse'
$ref: '#/components/schemas/PaginatedResponse'
```

### 3. 认证配置

所有需要认证的API都应该添加：

```yaml
security:
  - bearerAuth: []
```

### 4. 错误响应统一

为所有API定义标准错误响应：

```typescript
responses: {
  400: {
    description: '请求参数错误',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  401: { description: '未授权' },
  403: { description: '权限不足' },
  404: { description: '资源不存在' },
  500: { description: '服务器错误' }
}
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /home/eric/good-luck-2025/backend
npm install --save swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

### 2. 创建配置文件

```bash
# 创建 backend/src/config/swagger.ts
# 复制上面的配置代码
```

### 3. 修改 index.ts

```typescript
// 添加Swagger路由
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})
```

### 4. 添加注释到现有路由

从核心路由开始，逐步添加JSDoc注释。

### 5. 访问文档

启动后端后访问：
- **Swagger UI**: http://localhost:50301/api-docs
- **OpenAPI JSON**: http://localhost:50301/api-docs.json

---

## 🔍 验证文档

### 1. 检查生成的文档

```bash
curl http://localhost:50301/api-docs.json | jq . | head -50
```

### 2. 验证Swagger UI

在浏览器中打开 http://localhost:50301/api-docs，应该看到：
- API分组列表
- 每个端点的详细信息
- "Try it out" 测试按钮

### 3. 测试API调用

在Swagger UI中：
1. 点击端点展开详情
2. 点击 "Try it out"
3. 填写参数
4. 点击 "Execute"
5. 查看响应结果

---

## 📦 导出文档

### 生成静态HTML

```bash
npm install --save-dev redoc-cli

# 生成HTML文档
npx redoc-cli bundle http://localhost:50301/api-docs.json -o api-docs.html
```

### 生成Markdown

```bash
npm install --save-dev widdershins

# 生成Markdown
npx widdershins http://localhost:50301/api-docs.json -o API.md
```

---

## 🎯 下一步

1. **添加所有API注释** - 为现有120+ API端点添加文档
2. **完善Schema定义** - 定义所有数据模型
3. **前端集成** - 在管理后台添加API文档页面
4. **自动化** - CI/CD中自动生成和部署文档

---

## 📚 参考资源

- [Swagger官方文档](https://swagger.io/docs/)
- [OpenAPI 3.0规范](https://swagger.io/specification/)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)

---

**更新日期**: 2025-11-15
**版本**: 1.0
**状态**: 📋 待实施
