# 管理后台环境配置指南

## 🔧 环境变量配置

### `.env` 文件配置

```bash
# 后端API地址（需要包含完整的路径前缀）
VITE_API_BASE_URL=http://localhost:50301/api/manage
```

**重要说明**:
- ✅ **正确**: `http://localhost:50301/api/manage` - 包含完整路径
- ❌ **错误**: `http://localhost:50301` - 缺少 `/api/manage` 前缀

### 为什么需要 `/api/manage` 前缀？

管理后台的API路由结构：

```
后端服务器 (http://localhost:50301)
├── /health                    # 健康检查
├── /api/                      # 用户端API（C端）
│   ├── /auth/*
│   ├── /cart/*
│   └── /orders/*
└── /api/manage/               # 管理端API（B端）⭐
    ├── /auth/*               # 管理员认证
    ├── /stats/*              # 统计数据
    ├── /users/*              # 用户管理
    ├── /orders/*             # 订单管理
    └── ...                   # 其他管理功能
```

### API配置原理

在 `src/services/api.ts` 中：

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/manage'

const api = axios.create({
  baseURL: API_BASE_URL,  // 所有请求的基础URL
  timeout: 15000,
})
```

**请求路径拼接规则**:
```typescript
// 服务方法调用
getUsers({ page: 1, limit: 20 })
  ↓
// 实际发送的请求
api.get('/users', { params: { page: 1, limit: 20 } })
  ↓
// 完整URL
http://localhost:50301/api/manage/users?page=1&limit=20
```

## 🚀 启动流程

### 1. 配置环境变量

```bash
cd /home/eric/good-luck-2025/admin-frontend
cat > .env << 'EOF'
# 后端API地址（需要包含完整的路径前缀）
VITE_API_BASE_URL=http://localhost:50301/api/manage
EOF
```

### 2. 启动后端服务

```bash
cd /home/eric/good-luck-2025/backend
npm run dev
# 后端运行在: http://localhost:50301
```

### 3. 启动管理前端

```bash
cd /home/eric/good-luck-2025/admin-frontend
npm run dev
# 前端运行在: http://localhost:5174（或其他可用端口）
```

### 4. 验证配置

访问 http://localhost:5174 并登录：
- 用户名: `admin`
- 密码: `admin123`

## 🔍 常见问题排查

### 问题1: 所有API返回404

**错误信息**:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
❌ 请求的资源不存在
```

**原因**: `.env` 文件中的 `VITE_API_BASE_URL` 配置错误

**解决**:
```bash
# 检查当前配置
cat admin-frontend/.env

# 应该是（正确）:
VITE_API_BASE_URL=http://localhost:50301/api/manage

# 如果是以下配置（错误）:
VITE_API_BASE_URL=http://localhost:50301

# 修复后重启前端服务
cd admin-frontend
# Ctrl+C 停止服务
npm run dev
```

### 问题2: 401 未授权错误

**错误信息**:
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
❌ 未授权，请重新登录
```

**原因**:
1. 未登录或token过期
2. localStorage中没有 `admin_token`

**解决**:
1. 访问登录页面重新登录
2. 检查浏览器控制台 → Application → Local Storage → admin_token

### 问题3: 后端服务未运行

**错误信息**:
```
Network Error
ERR_CONNECTION_REFUSED
```

**检查**:
```bash
# 检查后端进程
ps aux | grep "ts-node src/index.ts"

# 检查端口监听
lsof -i :50301

# 重启后端
cd backend
npm run dev
```

### 问题4: CORS跨域错误

**错误信息**:
```
Access to XMLHttpRequest at 'http://localhost:50301/api/manage/stats/dashboard'
from origin 'http://localhost:5174' has been blocked by CORS policy
```

**解决**:
后端已配置CORS，如果遇到此错误，检查 `backend/src/index.ts` 中的CORS配置：

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))
```

## 📊 验证API连通性

### 手动测试API

```bash
# 1. 获取管理员token（登录）
curl -X POST http://localhost:50301/api/manage/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. 使用token访问API
TOKEN="your_token_here"
curl http://localhost:50301/api/manage/stats/dashboard \
  -H "Authorization: Bearer $TOKEN"

# 3. 测试用户列表
curl "http://localhost:50301/api/manage/users?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

## 🎯 生产环境配置

### 生产环境 `.env`

```bash
# 生产环境API地址
VITE_API_BASE_URL=https://api.yourdomain.com/api/manage
```

### 生产构建

```bash
cd admin-frontend
npm run build

# 构建输出在 dist/ 目录
# 部署到Nginx/Apache等Web服务器
```

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    root /var/www/admin-frontend/dist;
    index index.html;

    # SPA路由处理
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理（可选）
    location /api/ {
        proxy_pass http://localhost:50301;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 安全建议

1. **生产环境不要使用默认密码**
   - 登录后立即修改 admin 账户密码

2. **HTTPS加密**
   - 生产环境必须使用HTTPS
   - 配置SSL证书

3. **环境变量保护**
   - `.env` 文件不要提交到Git
   - 已在 `.gitignore` 中排除

4. **Token安全**
   - 管理员token有效期: 24小时
   - 定期清理过期token

## 📝 开发调试

### 浏览器控制台

1. **Network标签** - 查看API请求
   - Request URL: 应该是 `http://localhost:50301/api/manage/...`
   - Status: 200 表示成功
   - Response: 查看返回数据

2. **Console标签** - 查看错误信息
   - 红色错误信息会显示具体问题
   - `❌ 请求的资源不存在` = 404错误

3. **Application标签** - 查看存储
   - Local Storage → admin_token
   - Local Storage → admin_user

### VSCode调试

在 `launch.json` 中添加浏览器调试配置：

```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Launch Chrome against localhost",
  "url": "http://localhost:5174",
  "webRoot": "${workspaceFolder}/admin-frontend/src"
}
```

---

**更新日期**: 2025-11-15
**版本**: 1.0
**状态**: ✅ 已验证
