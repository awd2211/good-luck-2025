# 后端测试指南

本文档介绍如何在项目中编写和运行单元测试与集成测试。

## 目录

- [测试框架](#测试框架)
- [目录结构](#目录结构)
- [运行测试](#运行测试)
- [编写测试](#编写测试)
- [测试最佳实践](#测试最佳实践)
- [常见问题](#常见问题)

## 测试框架

项目使用以下测试工具：

- **Jest**: 测试框架和断言库
- **ts-jest**: TypeScript 支持
- **supertest**: HTTP 集成测试
- **@types/jest**: Jest 类型定义
- **@types/supertest**: Supertest 类型定义

## 目录结构

```
backend/src/__tests__/
├── setup.ts                    # Jest 全局配置
├── unit/                       # 单元测试
│   ├── services/               # 服务层测试
│   │   └── authService.test.ts
│   └── controllers/            # 控制器测试
│       └── authController.test.ts
├── integration/                # 集成测试
│   └── auth.routes.test.ts     # 路由集成测试
├── mocks/                      # Mock 工具
│   ├── database.ts             # 数据库 mock
│   └── jwt.ts                  # JWT mock
└── helpers/                    # 测试辅助函数
    └── testHelpers.ts          # 通用测试工具
```

## 运行测试

### 基本命令

```bash
# 运行所有测试
npm test

# 监听模式（开发时推荐）
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage

# 只运行单元测试
npm run test:unit

# 只运行集成测试
npm run test:integration

# 详细输出模式
npm run test:verbose
```

### 运行特定测试文件

```bash
# 运行特定文件
npm test -- authService.test.ts

# 运行匹配模式的测试
npm test -- --testNamePattern="登录"
```

## 编写测试

### 1. 服务层单元测试

服务层测试应该 mock 所有外部依赖（数据库、第三方 API 等）。

**示例：** `src/__tests__/unit/services/authService.test.ts`

```typescript
import * as authService from '../../../services/user/authService'
import { mockQuery, mockQueryResponses } from '../../mocks/database'

// Mock 数据库
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

describe('authService - 用户认证服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该成功获取用户信息', async () => {
    // 准备 mock 数据
    query.mockResolvedValueOnce(mockQueryResponses.singleUser)

    // 调用服务
    const result = await authService.getUserProfile('user_123')

    // 断言
    expect(result).toHaveProperty('id')
    expect(query).toHaveBeenCalledWith(expect.any(String), ['user_123'])
  })
})
```

### 2. 控制器单元测试

控制器测试应该 mock 服务层，测试请求处理逻辑。

**示例：** `src/__tests__/unit/controllers/authController.test.ts`

```typescript
import * as authController from '../../../controllers/user/authController'
import * as authService from '../../../services/user/authService'
import { createMockRequest, createMockResponse, createMockNext } from '../../helpers/testHelpers'

// Mock 服务层
jest.mock('../../../services/user/authService')

describe('authController - 认证控制器', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该成功处理登录请求', async () => {
    // 准备 mock 数据
    const mockResult = {
      token: 'test.token',
      user: { id: 'user_123', phone: '13900000001' },
    }

    const req = createMockRequest({
      body: { phone: '13900000001', password: 'password123' },
    })
    const res = createMockResponse()
    const next = createMockNext()

    ;(authService.loginWithPassword as jest.Mock).mockResolvedValue(mockResult)

    // 调用控制器
    await authController.loginWithPassword(req as any, res as any, next)

    // 断言
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: '登录成功',
      data: mockResult,
    })
  })
})
```

### 3. 路由集成测试

集成测试测试完整的 HTTP 请求流程，包括路由、中间件、控制器和服务层。

**示例：** `src/__tests__/integration/auth.routes.test.ts`

```typescript
import request from 'supertest'
import express, { Application } from 'express'
import authRoutes from '../../routes/user/auth'

describe('Auth Routes - 认证路由', () => {
  let app: Application

  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use('/api/auth', authRoutes)
  })

  it('应该成功处理登录请求', async () => {
    const response = await request(app)
      .post('/api/auth/login/password')
      .send({
        phone: '13900000001',
        password: 'password123',
      })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body).toHaveProperty('data')
  })
})
```

### 4. 使用测试辅助工具

项目提供了多个测试辅助工具：

#### Mock Request/Response

```typescript
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/testHelpers'

const req = createMockRequest({
  body: { phone: '13900000001' },
  params: { id: '123' },
  query: { page: '1' },
  headers: { authorization: 'Bearer token' },
  user: { id: 'user_123', role: 'user' },
})

const res = createMockResponse()
const next = createMockNext()
```

#### Mock 数据库响应

```typescript
import { mockQuery, mockQueryResponses } from '../mocks/database'

// 使用预定义的响应
query.mockResolvedValueOnce(mockQueryResponses.singleUser)

// 自定义响应
query.mockResolvedValueOnce({
  rows: [{ id: '123', name: '测试' }],
  rowCount: 1,
})
```

## 测试最佳实践

### 1. 测试命名规范

```typescript
describe('模块名 - 模块描述', () => {
  describe('函数名 - 函数描述', () => {
    it('应该在某种情况下做某事', () => {
      // 测试代码
    })
  })
})
```

### 2. AAA 模式（Arrange-Act-Assert）

```typescript
it('应该成功登录', async () => {
  // Arrange - 准备测试数据和 mock
  const mockUser = { id: 'user_123', phone: '13900000001' }
  query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 })

  // Act - 执行被测试的函数
  const result = await authService.loginWithPassword('13900000001', 'password')

  // Assert - 验证结果
  expect(result).toHaveProperty('token')
  expect(result.user.id).toBe('user_123')
})
```

### 3. 每个测试前清理 Mock

```typescript
beforeEach(() => {
  jest.clearAllMocks()
})
```

### 4. 测试边界条件和错误情况

```typescript
describe('getUserProfile', () => {
  it('应该成功获取用户信息', async () => {
    // 正常情况
  })

  it('应该在用户不存在时抛出异常', async () => {
    // 错误情况
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    await expect(authService.getUserProfile('nonexistent')).rejects.toThrow('用户不存在')
  })
})
```

### 5. 使用有意义的断言

```typescript
// ✅ 好的断言
expect(result.user).toHaveProperty('id')
expect(result.user.phone).toBe('13900000001')

// ❌ 避免模糊的断言
expect(result).toBeTruthy()
```

### 6. 独立的测试

每个测试应该独立运行，不依赖其他测试的结果。

```typescript
// ❌ 不好的做法 - 测试之间有依赖
let userId: string
it('应该创建用户', async () => {
  userId = await createUser()
})
it('应该获取用户', async () => {
  await getUser(userId) // 依赖上一个测试
})

// ✅ 好的做法 - 每个测试独立
it('应该创建用户', async () => {
  const userId = await createUser()
  expect(userId).toBeDefined()
})
it('应该获取用户', async () => {
  const userId = 'test_user_123' // 独立的测试数据
  await getUser(userId)
})
```

## 测试覆盖率

### 查看覆盖率报告

```bash
npm run test:coverage
```

覆盖率报告会在 `coverage/` 目录生成：

- `coverage/lcov-report/index.html` - HTML 格式报告（推荐）
- `coverage/coverage-final.json` - JSON 格式报告

### 覆盖率目标

- **行覆盖率（Line Coverage）**: 目标 > 80%
- **函数覆盖率（Function Coverage）**: 目标 > 80%
- **分支覆盖率（Branch Coverage）**: 目标 > 75%

## Mock 策略

### 1. Mock 外部依赖

```typescript
// Mock 数据库
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))
```

### 2. Mock 部分模块

```typescript
// 只 mock 特定的函数
jest.mock('../../../services/user/authService', () => ({
  ...jest.requireActual('../../../services/user/authService'),
  sendVerificationCode: jest.fn(), // 只 mock 这个函数
}))
```

### 3. Mock 环境变量

在 `setup.ts` 中设置：

```typescript
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'
process.env.REDIS_ENABLED = 'false'
```

## 常见问题

### Q: 如何测试异步函数？

```typescript
// 使用 async/await
it('应该成功登录', async () => {
  const result = await authService.loginWithCode('13900000001', '123456')
  expect(result).toHaveProperty('token')
})

// 或使用 .resolves
it('应该成功登录', () => {
  return expect(authService.loginWithCode('13900000001', '123456')).resolves.toHaveProperty('token')
})
```

### Q: 如何测试错误抛出？

```typescript
// 使用 rejects.toThrow
it('应该在密码错误时抛出异常', async () => {
  await expect(authService.loginWithPassword('13900000001', 'wrong')).rejects.toThrow('密码错误')
})

// 同步函数使用 toThrow
it('应该在参数无效时抛出异常', () => {
  expect(() => validatePhone('123')).toThrow('无效的手机号')
})
```

### Q: 如何跳过某个测试？

```typescript
// 跳过单个测试
it.skip('这个测试暂时跳过', () => {
  // ...
})

// 只运行这个测试
it.only('只运行这个测试', () => {
  // ...
})
```

### Q: 如何在测试中访问私有函数？

私有函数通常不应该直接测试。应该通过公开函数的测试来覆盖私有函数的逻辑。如果确实需要测试私有函数，考虑将其提取到单独的模块。

### Q: 测试运行很慢怎么办？

1. 使用 `--maxWorkers` 限制并发数
2. Mock 耗时的操作（数据库、网络请求等）
3. 避免在 `beforeEach` 中执行耗时操作
4. 使用 `jest --onlyChanged` 只运行改动的测试

```bash
# 限制并发数
npm test -- --maxWorkers=2

# 只运行改动的测试
npm test -- --onlyChanged
```

## 下一步

现在你已经了解了如何编写测试，可以开始为其他模块编写测试：

1. **购物车服务** (`services/user/cartService.ts`)
2. **订单服务** (`services/user/orderService.ts`)
3. **优惠券服务** (`services/user/couponService.ts`)
4. **评价服务** (`services/user/reviewService.ts`)

参考 `authService.test.ts` 的模式，为每个服务创建对应的测试文件。

## 相关资源

- [Jest 官方文档](https://jestjs.io/)
- [Supertest 文档](https://github.com/visionmedia/supertest)
- [TypeScript Jest 配置](https://kulshekhar.github.io/ts-jest/)
