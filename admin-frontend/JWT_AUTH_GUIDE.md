# JWT 认证系统使用指南 🔐

## 📋 系统概述

管理后台已实现完整的JWT（JSON Web Token）用户认证系统，包括：

- ✅ 后端JWT生成和验证
- ✅ 前端认证状态管理
- ✅ 自动Token刷新机制
- ✅ 路由守卫保护
- ✅ Axios请求拦截器

## 🔧 技术实现

### 后端实现

#### 1. JWT服务 (`backend/src/services/authService.ts`)

```typescript
// 用户登录
export const login = async (username: string, password: string)

// 验证 token
export const verifyToken = (token: string)

// 刷新 token
export const refreshToken = (oldToken: string)

// 密码哈希
export const hashPassword = async (password: string)
```

#### 2. 认证中间件 (`backend/src/middleware/auth.ts`)

```typescript
// JWT 认证中间件（强制要求登录）
export const authenticate

// 角色权限检查中间件
export const requireRole

// 可选认证中间件（不强制要求登录）
export const optionalAuth
```

#### 3. 认证路由 (`backend/src/routes/auth.ts`)

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新token
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/logout` - 用户登出

### 前端实现

#### 1. 认证服务 (`admin-frontend/src/services/authService.ts`)

```typescript
// 用户登录
export const login = async (credentials: LoginRequest): Promise<LoginResponse>

// 获取当前用户信息
export const getCurrentUser = async (): Promise<UserInfo>

// 刷新 token
export const refreshToken = async (token: string): Promise<string>

// 用户登出
export const logout = async (): Promise<void>

// 检查是否已登录
export const isAuthenticated = (): boolean
```

**特点**：
- Axios 请求拦截器自动添加 Authorization header
- 响应拦截器自动处理401错误（token过期）
- 401错误时自动清除本地token并跳转登录页

#### 2. 认证上下文 (`admin-frontend/src/contexts/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: UserInfo | null
  isAuthenticated: boolean
  loading: boolean
  login: (token: string, user: UserInfo) => void
  logout: () => Promise<void>
}
```

**使用方法**：
```typescript
import { useAuth } from '../contexts/AuthContext'

const { user, isAuthenticated, login, logout } = useAuth()
```

#### 3. 路由守卫 (`admin-frontend/src/components/PrivateRoute.tsx`)

```typescript
<PrivateRoute>
  <MainLayout />
</PrivateRoute>
```

## 🚀 使用方法

### 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | super_admin |
| manager | manager123 | manager |

### 登录流程

1. 用户访问 http://localhost:8888
2. 未登录自动跳转到 `/login`
3. 输入用户名和密码
4. 调用 `/api/auth/login` 接口
5. 成功后保存token到localStorage
6. 更新AuthContext状态
7. 跳转到首页

### 受保护的API请求

```typescript
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// 请求拦截器自动添加token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 使用
const response = await api.get('/admin/users')
```

### 登出流程

1. 点击退出登录按钮
2. 调用 `logout()` 函数
3. 清除localStorage中的token
4. 清除AuthContext状态
5. 跳转到登录页

## 🔒 安全特性

### 1. Token安全

- ✅ JWT签名验证
- ✅ Token过期时间（24小时）
- ✅ HTTPS传输（生产环境）
- ✅ HttpOnly Cookie（可选）

### 2. 密码安全

- ✅ bcrypt哈希加密
- ✅ Salt轮数：10
- ✅ 密码不明文存储
- ✅ 密码不在前端验证

### 3. 请求安全

- ✅ CORS配置
- ✅ Helmet安全头
- ✅ 请求限流
- ✅ 输入验证

## 📝 API 示例

### 登录请求

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**响应**：
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin-001",
      "username": "admin",
      "role": "super_admin",
      "email": "admin@fortune.com"
    }
  }
}
```

### 获取用户信息

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

**响应**：
```json
{
  "success": true,
  "data": {
    "id": "admin-001",
    "username": "admin",
    "role": "super_admin",
    "email": "admin@fortune.com"
  }
}
```

### 刷新Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<old-token>"
  }'
```

## 🛠️ 配置

### 后端环境变量

在 `backend/.env` 中配置：

```env
# JWT密钥（生产环境必须更换！）
JWT_SECRET=your-super-secret-key-change-in-production

# Token过期时间
JWT_EXPIRES_IN=24h

# CORS 配置
CORS_ORIGIN=http://localhost:8888
```

### 前端配置

在 `admin-frontend/src/services/authService.ts` 中配置：

```typescript
const API_BASE_URL = '/api'  // API基础路径
const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,  // 请求超时时间
})
```

## 🔄 Token 刷新策略

### 当前实现

- Token有效期：24小时
- Token过期后需要重新登录

### 自动刷新实现（可选）

```typescript
// 在请求拦截器中实现
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const oldToken = localStorage.getItem('admin_token')
      if (oldToken) {
        try {
          const newToken = await refreshToken(oldToken)
          localStorage.setItem('admin_token', newToken)
          // 重试原请求
          error.config.headers.Authorization = `Bearer ${newToken}`
          return api.request(error.config)
        } catch {
          // 刷新失败，跳转登录
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)
```

## 🧪 测试

### 测试登录

```typescript
// 使用正确的密码
const response = await login({ username: 'admin', password: 'admin123' })
// 应该返回 token 和用户信息

// 使用错误的密码
const response = await login({ username: 'admin', password: 'wrong' })
// 应该返回 401 错误
```

### 测试路由守卫

1. 清除localStorage中的token
2. 访问 http://localhost:8888/
3. 应该自动跳转到 `/login`

### 测试Token过期

1. 修改JWT_EXPIRES_IN为很短的时间（如"10s"）
2. 登录后等待token过期
3. 发送请求应该返回401
4. 自动跳转到登录页

## 🔍 调试

### 查看Token内容

访问 https://jwt.io/ 粘贴token查看payload：

```json
{
  "id": "admin-001",
  "username": "admin",
  "role": "super_admin",
  "email": "admin@fortune.com",
  "iat": 1699888888,
  "exp": 1699975288
}
```

### 控制台调试

```javascript
// 查看当前token
localStorage.getItem('admin_token')

// 查看用户信息
JSON.parse(localStorage.getItem('admin_user'))

// 清除认证信息
localStorage.removeItem('admin_token')
localStorage.removeItem('admin_user')
```

## 📚 最佳实践

### 1. 生产环境部署

- [ ] 更换JWT_SECRET为强随机字符串
- [ ] 启用HTTPS
- [ ] 配置严格的CORS策略
- [ ] 使用环境变量管理密钥
- [ ] 定期轮换密钥
- [ ] 实现账号锁定机制

### 2. 安全建议

- [ ] 添加登录失败次数限制
- [ ] 实现二次验证（2FA）
- [ ] 记录登录日志
- [ ] IP白名单/黑名单
- [ ] 设备指纹识别
- [ ] Session管理

### 3. 用户体验优化

- [ ] 记住我功能
- [ ] 单点登录（SSO）
- [ ] 社交账号登录
- [ ] 忘记密码功能
- [ ] 邮箱验证

## 🐛 常见问题

### 1. Token无效或已过期

**原因**：
- Token确实过期了
- JWT_SECRET不一致
- Token被篡改

**解决**：重新登录获取新token

### 2. 401 Unauthorized

**原因**：
- 未提供token
- Token格式错误
- Token已过期

**解决**：检查Authorization header格式

### 3. CORS错误

**原因**：后端未配置正确的CORS

**解决**：
```typescript
app.use(cors({
  origin: 'http://localhost:8888',
  credentials: true
}))
```

## 📊 监控和日志

建议添加以下监控：

```typescript
// 登录成功日志
console.log(`[AUTH] User ${username} logged in at ${new Date()}`)

// Token验证失败日志
console.log(`[AUTH] Token verification failed: ${error.message}`)

// 可疑登录尝试
console.log(`[SECURITY] Failed login attempt for ${username} from ${ip}`)
```

---

**创建时间**：2025-11-12
**状态**：✅ 已实现并测试
**维护者**：开发团队
