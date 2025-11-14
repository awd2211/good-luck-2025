# PM2 快速参考

## 🚀 快速部署

```bash
./deploy.sh        # 一键部署（构建+启动）
./build.sh         # 仅构建所有项目
./pm2.sh start     # 仅启动服务
```

## 📊 服务管理

```bash
./pm2.sh start     # 启动所有服务
./pm2.sh stop      # 停止所有服务
./pm2.sh restart   # 重启所有服务
./pm2.sh reload    # 零停机重载
./pm2.sh status    # 查看状态
./pm2.sh delete    # 删除所有服务
```

## 📝 日志查看

```bash
./pm2.sh logs              # 所有服务日志（实时）
./pm2.sh logs-backend      # 后端日志
./pm2.sh logs-frontend     # 用户前端日志
./pm2.sh logs-admin        # 管理后台日志
./pm2.sh monit             # 监控面板（CPU/内存）
```

## 🔄 更新部署

```bash
# 代码更新后
git pull
./build.sh && ./pm2.sh reload
```

## 🔧 单独管理

```bash
pm2 restart backend-api        # 重启后端
pm2 restart frontend-user      # 重启用户前端
pm2 restart frontend-admin     # 重启管理后台
pm2 logs backend-api --lines 100  # 查看后端日志（最后100行）
```

## ⚙️ 高级功能

```bash
./pm2.sh save         # 保存进程列表
./pm2.sh startup      # 设置开机自启
./pm2.sh unstartup    # 取消开机自启
./pm2.sh update       # 更新PM2
```

## 📍 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| backend-api | 50301 | 后端API（2个实例） |
| frontend-user | 50302 | 用户前端 |
| frontend-admin | 50303 | 管理后台 |

## 📂 日志位置

```
logs/
├── backend-error.log
├── backend-out.log
├── frontend-error.log
├── frontend-out.log
├── admin-error.log
└── admin-out.log
```

## 🆘 故障排查

```bash
# 服务无法启动
./pm2.sh logs          # 查看错误日志

# 检查端口占用
lsof -i :50301
lsof -i :50302

# 重新构建
./build.sh

# 完全重启
./pm2.sh delete
./deploy.sh

# 数据库问题
./db-cli.sh status
```

## 💡 常用场景

### 场景1: 首次部署
```bash
./deploy.sh
./pm2.sh save
./pm2.sh startup    # 按提示执行 sudo 命令
```

### 场景2: 日常更新
```bash
git pull
./build.sh && ./pm2.sh reload
```

### 场景3: 查看问题
```bash
./pm2.sh status
./pm2.sh logs-backend
./pm2.sh monit
```

### 场景4: 完全重启
```bash
./pm2.sh restart
```

---

详细文档: [PM2_GUIDE.md](PM2_GUIDE.md)
