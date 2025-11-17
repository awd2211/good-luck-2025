# 🚀 管理后台快速开始

## 📍 访问地址（正确端口：50303）

### 主要页面
- **登录页面**: http://localhost:50303/login
- **诊断工具**: http://localhost:50303/diagnostic
- **网络调试**: http://localhost:50303/network-debug.html

### 登录信息
- **用户名**: `admin`
- **密码**: `admin123`

---

## ✅ 系统状态

| 服务 | 地址 | 状态 |
|------|------|------|
| 前端服务 | http://localhost:50303 | ✅ 运行中 |
| 后端API | http://localhost:50301 | ✅ 运行中 |
| 数据库 | localhost:54320 | ✅ 运行中 |

---

## 🔧 快速验证

### 1. 一键测试（推荐）
```bash
/tmp/test-login-api.sh
```

预期输出：
```
✅ 后端服务正常
✅ 登录成功 (HTTP 200)
✅ .env 配置正确
✅ 前端服务运行正常
```

### 2. 浏览器验证

访问: http://localhost:50303/network-debug.html
- 点击"测试正确URL" → 看到 ✅ 200 OK

---

## 🐛 如果登录超时

### 快速诊断
1. 访问: http://localhost:50303/diagnostic
2. 点击"测试登录 API"按钮
3. 查看测试结果

### 检查环境变量
```bash
cat /home/eric/good-luck-2025/admin-frontend/.env
```

应该显示：
```
VITE_API_BASE_URL=http://localhost:50301/api/manage
```

### 重启前端服务
```bash
cd /home/eric/good-luck-2025/admin-frontend
# Ctrl+C 停止服务
npm run dev
```

---

## 📚 完整文档

- **CURRENT_STATUS.md** - 当前状态总览
- **TROUBLESHOOTING.md** - 故障排查指南
- **ENV_CONFIG_GUIDE.md** - 环境配置详解
- **SERVICE_MODULES_GUIDE.md** - 服务模块使用指南

---

**端口号**: 50303 ✅ (已修正)
**更新时间**: 2025-11-15
