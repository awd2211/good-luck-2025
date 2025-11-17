# 环境配置指南

## 📋 端口分配表

| 服务 | 开发环境 | 生产环境 | 说明 |
|------|---------|---------|------|
| **后端 API** | 50301 | 60301 | Express + TypeScript |
| **用户前端** | 50302 | 60302 | React + Vite (C端) |
| **管理后台** | 50303 | 60303 | React + Vite + Ant Design (B端) |
| **PostgreSQL** | 54320 | 54320 | Docker容器 |
| **Redis** | 6380 | 6380 | Docker容器 |

---

## 🔧 环境配置文件

### 后端 (backend/)

#### 开发环境 `.env.development`
```env
NODE_ENV=development
PORT=50301
JWT_SECRET=dev-secret-key-for-development-only
DB_HOST=localhost
DB_PORT=54320
REDIS_ENABLED=false  # 开发环境可选
CORS_ORIGIN=*
```

#### 生产环境 `.env.production`
```env
NODE_ENV=production
PORT=60301
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2025
DB_HOST=localhost
DB_PORT=54320
REDIS_ENABLED=true  # 生产环境建议启用
CORS_ORIGIN=http://localhost:60302,http://localhost:60303
```

### 用户前端 (frontend/)

#### 开发环境 `.env.development`
```env
VITE_API_URL=http://localhost:50301/api
```

#### 生产环境 `.env.production`
```env
VITE_API_URL=http://localhost:60301/api
```

### 管理后台 (admin-frontend/)

#### 开发环境 `.env.development`
```env
VITE_API_BASE_URL=http://localhost:50301/api/manage
```

#### 生产环境 `.env.production`
```env
VITE_API_BASE_URL=http://localhost:60301/api/manage
```

---

## 🚀 启动方式

### 方式一：使用快捷脚本（推荐）

#### 开发环境
```bash
./start-dev.sh
```

#### 生产环境
```bash
./start-prod.sh
```

### 方式二：手动启动

#### 开发环境

**1. 启动数据库和Redis**
```bash
docker compose up -d
```

**2. 启动后端（终端1）**
```bash
cd backend
npm run dev
# 监听端口: 50301
```

**3. 启动用户前端（终端2）**
```bash
cd frontend
npm run dev
# 访问地址: http://localhost:50302
```

**4. 启动管理后台（终端3）**
```bash
cd admin-frontend
npm run dev
# 访问地址: http://localhost:50303
```

#### 生产环境

**1. 构建所有项目**
```bash
# 构建后端
cd backend && npm run build:prod

# 构建用户前端
cd ../frontend && npm run build

# 构建管理后台
cd ../admin-frontend && npm run build
```

**2. 启动后端（使用PM2）**
```bash
cd backend
pm2 start ecosystem.config.js
# 监听端口: 60301
```

**3. 启动前端（使用PM2或npx serve）**

**选项A：使用 Vite Preview**
```bash
# 用户前端
cd frontend
npm run preview  # 端口 60302

# 管理后台
cd admin-frontend
npm run preview  # 端口 60303
```

**选项B：使用 PM2**
```bash
# 用户前端
pm2 start npm --name "fortune-frontend-prod" -- run preview

# 管理后台
pm2 start npm --name "fortune-admin-prod" -- run preview
```

**选项C：使用 npx serve**
```bash
# 用户前端
npx serve -s frontend/dist -l 60302

# 管理后台
npx serve -s admin-frontend/dist -l 60303
```

---

## 📦 NPM 脚本说明

### 后端 (backend/package.json)

| 命令 | 环境 | 说明 |
|------|------|------|
| `npm run dev` | 开发 | 使用 nodemon 和 ts-node，端口 50301 |
| `npm run build` | - | TypeScript 编译 |
| `npm run build:prod` | 生产 | 生产环境编译 |
| `npm start` | - | 运行编译后的代码 |
| `npm run start:prod` | 生产 | 生产环境运行，端口 60301 |

### 前端 (frontend/package.json & admin-frontend/package.json)

| 命令 | 环境 | 说明 |
|------|------|------|
| `npm run dev` | 开发 | Vite 开发服务器，端口 50302/50303 |
| `npm run build` | 生产 | 构建生产版本，使用 .env.production |
| `npm run preview` | 生产 | 预览生产构建，端口 60302/60303 |

---

## 🔄 环境切换机制

### 后端
后端通过 `NODE_ENV` 环境变量自动加载对应的配置文件：

```javascript
// backend/src/config/index.ts
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
```

### 前端
Vite 自动根据命令加载对应的环境变量文件：
- `npm run dev` → 加载 `.env.development`
- `npm run build` → 加载 `.env.production`
- `npm run preview` → 使用构建时的环境变量

---

## 🛠️ PM2 配置

### 后端 PM2 配置 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'fortune-backend-prod',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 60301
    },
    max_memory_restart: '1G',
    autorestart: true
  }]
};
```

### PM2 常用命令
```bash
# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart fortune-backend-prod

# 停止服务
pm2 stop fortune-backend-prod

# 删除服务
pm2 delete fortune-backend-prod

# 保存当前配置
pm2 save
```

---

## ✅ 验证环境

### 检查端口占用
```bash
# Linux/Mac
netstat -tlnp | grep -E "50301|50302|50303|60301|60302|60303"

# 或者使用 ss
ss -tlnp | grep -E "50301|50302|50303|60301|60302|60303"
```

### 检查服务状态
```bash
# 检查数据库
docker ps | grep fortune-postgres

# 检查Redis
docker ps | grep fortune-redis

# 检查PM2进程
pm2 status
```

### 测试API连接
```bash
# 开发环境
curl http://localhost:50301/health

# 生产环境
curl http://localhost:60301/health
```

---

## 🚨 常见问题

### 1. 端口被占用
```bash
# 查找占用端口的进程
lsof -i :50301
# 或
netstat -tlnp | grep 50301

# 杀死进程
kill -9 <PID>
```

### 2. 环境变量未生效
- 确保 `.env.*` 文件存在
- 检查文件名是否正确（`.env.development` 或 `.env.production`）
- 重启服务以加载新的环境变量

### 3. 前端无法连接后端
- 检查后端是否运行在正确的端口
- 检查 `.env.*` 文件中的 API 地址是否正确
- 开发环境检查 CORS 配置

### 4. 数据库连接失败
```bash
# 检查数据库容器状态
docker ps | grep postgres

# 重启数据库
docker compose restart postgres

# 查看数据库日志
docker compose logs postgres
```

---

## 📝 最佳实践

1. **开发环境**
   - 使用 `npm run dev` 启动，支持热重载
   - CORS 设置为 `*` 方便调试
   - Redis 可选，减少依赖

2. **生产环境**
   - 使用 PM2 管理进程，自动重启
   - 启用 Redis 提升性能
   - 限制 CORS 来源，增强安全性
   - 修改默认的 JWT_SECRET

3. **环境隔离**
   - 永远不要在开发环境使用生产数据库
   - 生产环境使用强密码和密钥
   - 定期备份生产数据

---

## 🔗 相关文档

- [README.md](./README.md) - 项目总览
- [CLAUDE.md](./CLAUDE.md) - 开发指南
- [DATABASE.md](./DATABASE.md) - 数据库文档
- [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) - API 文档
