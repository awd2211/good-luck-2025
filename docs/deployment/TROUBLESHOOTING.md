# 🔧 管理后台故障排查指南

## 🚨 常见问题

### 问题1: 登录超时 (timeout of 15000ms exceeded)

**症状**:
- 点击登录按钮后，长时间等待（15秒）
- 浏览器控制台显示: `timeout of 15000ms exceeded`
- 请求一直pending，没有响应

**原因分析**:
1. 前端API地址配置错误
2. 后端服务未运行
3. 网络连接问题
4. CORS跨域问题

**解决步骤**:

#### 步骤1: 检查环境配置

访问诊断页面查看配置:
```
http://localhost:50303/diagnostic
```

诊断页面会显示:
- 当前环境变量配置
- API地址
- 环境模式
- 并提供一键测试功能

#### 步骤2: 验证 .env 文件

```bash
cd /home/eric/good-luck-2025/admin-frontend
cat .env
```

**正确配置**:
```bash
# 后端API地址（需要包含完整的路径前缀）
VITE_API_BASE_URL=http://localhost:50301/api/manage
```

**错误配置**:
```bash
# ❌ 缺少 /api/manage 路径前缀
VITE_API_BASE_URL=http://localhost:50301
```

#### 步骤3: 重启前端服务

修改 `.env` 后**必须**重启前端服务:

```bash
# 停止前端服务 (Ctrl+C)
# 然后重新启动
npm run dev
```

#### 步骤4: 检查后端服务

```bash
# 检查后端是否运行
curl http://localhost:50301/health

# 应该返回类似:
# {"status":"healthy","timestamp":"..."}
```

如果后端未运行:
```bash
cd /home/eric/good-luck-2025/backend
npm run dev
```

#### 步骤5: 查看浏览器控制台

打开浏览器开发者工具 (F12) → Console标签

**正常情况应该看到**:
```
🔧 API配置信息: {
  VITE_API_BASE_URL: "http://localhost:50301/api/manage",
  实际使用的BASE_URL: "http://localhost:50301/api/manage",
  环境: "development"
}
```

点击登录时应该看到:
```
📤 发送请求: {
  method: "POST",
  url: "/auth/login",
  baseURL: "http://localhost:50301/api/manage",
  完整URL: "http://localhost:50301/api/manage/auth/login",
  data: {username: "admin", password: "admin123"}
}
```

#### 步骤6: 检查Network标签

浏览器开发者工具 → Network标签:

**正确的请求**:
- Request URL: `http://localhost:50301/api/manage/auth/login`
- Status: 200 OK
- Response Time: < 1s

**错误的请求**:
- Request URL: `http://localhost:50301/auth/login` (缺少/api/manage)
- Status: 404 Not Found 或 timeout

---

## 📋 快速诊断检查表

使用以下检查表快速定位问题:

- [ ] ✅ `.env` 文件存在于 `admin-frontend/` 目录
- [ ] ✅ `.env` 内容为 `VITE_API_BASE_URL=http://localhost:50301/api/manage`
- [ ] ✅ 修改.env后已重启前端服务
- [ ] ✅ 后端服务运行正常 (`curl http://localhost:50301/health`)
- [ ] ✅ 浏览器控制台显示正确的API配置
- [ ] ✅ Network标签显示请求发送到正确的URL

---

## 🔍 详细调试方法

### 方法1: 使用诊断页面

1. 访问: http://localhost:50303/diagnostic
2. 查看"API配置信息"部分
3. 点击"测试登录 API"按钮
4. 查看测试结果

### 方法2: 手动测试API

```bash
# 测试后端健康检查
curl http://localhost:50301/health

# 测试登录API
curl -X POST http://localhost:50301/api/manage/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 应该返回包含token的JSON
```

### 方法3: 查看日志

```bash
# 查看前端日志
tail -f /tmp/admin-frontend-debug.log

# 查看后端日志
cd /home/eric/good-luck-2025/backend
# 后端控制台会显示请求日志
```

---

## 🛠️ 环境变量原理

### Vite环境变量规则

1. **文件位置**: 必须在项目根目录 (`admin-frontend/.env`)
2. **命名规则**: 必须以 `VITE_` 开头才能暴露给客户端
3. **何时加载**: 只在服务启动时加载（修改后必须重启）
4. **访问方式**: 通过 `import.meta.env.VITE_XXX` 访问

### API地址拼接

```typescript
// api.ts中的配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
// 值: "http://localhost:50301/api/manage"

const api = axios.create({
  baseURL: API_BASE_URL
})

// 服务调用
login({ username, password })
  ↓
api.post('/auth/login', data)
  ↓
// 实际请求URL
"http://localhost:50301/api/manage" + "/auth/login"
= "http://localhost:50301/api/manage/auth/login" ✅
```

**如果缺少 `/api/manage`**:
```typescript
// 错误配置
VITE_API_BASE_URL=http://localhost:50301

// 实际请求URL
"http://localhost:50301" + "/auth/login"
= "http://localhost:50301/auth/login" ❌
// 404 Not Found（后端没有这个路由）
```

---

## 🎯 其他常见问题

### Q1: 修改了.env但没有生效

**A**: Vite只在启动时读取环境变量，必须重启服务:
```bash
# Ctrl+C 停止服务
npm run dev
```

### Q2: 登录后立即跳转回登录页

**A**: Token存储失败或验证失败
1. 检查浏览器 Application → Local Storage
2. 应该有 `admin_token` 和 `admin_user`
3. 如果没有，查看控制台错误信息

### Q3: 403 权限不足

**A**:
1. Token有效但权限不足
2. 检查用户角色 (`admin_user` 中的 `role` 字段)
3. 确认该角色有访问权限

### Q4: 后端返回401

**A**:
1. Token过期（24小时有效期）
2. Token无效
3. 重新登录即可

### Q5: CORS跨域错误

**A**: 后端已配置CORS，如果仍有问题:
1. 检查后端 `src/index.ts` 中的CORS配置
2. 确认 `origin` 设置正确
3. 开发环境通常设置为 `'*'`

---

## 📞 获取帮助

### 查看完整日志

```bash
# 前端日志
tail -f /tmp/admin-frontend-debug.log

# 后端日志 (如果使用PM2)
pm2 logs backend
```

### 重置环境

如果问题仍未解决，尝试完全重置:

```bash
# 1. 停止所有服务
pkill -f "vite"
pkill -f "ts-node"

# 2. 清理
cd /home/eric/good-luck-2025/admin-frontend
rm -rf node_modules/.vite

# 3. 确认.env正确
cat .env
# 应该显示: VITE_API_BASE_URL=http://localhost:50301/api/manage

# 4. 重启服务
npm run dev
```

### 运行自动测试

```bash
/tmp/test-admin-frontend.sh
```

---

## 📚 相关文档

- **ENV_CONFIG_GUIDE.md** - 环境配置完整指南
- **DEPLOYMENT_COMPLETE.md** - 部署完成报告
- **SERVICE_MODULES_GUIDE.md** - 服务模块使用指南
- **QUICK_REFERENCE.md** - 快速参考手册

---

**更新日期**: 2025-11-15
**版本**: 1.0
