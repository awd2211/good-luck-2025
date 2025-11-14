# PM2 部署和管理指南

本项目使用 PM2 来管理后端服务和两个前端应用，提供进程管理、日志管理、监控和自动重启等功能。

## 目录结构

```
├── ecosystem.config.js       # 生产环境 PM2 配置
├── ecosystem.dev.config.js   # 开发环境 PM2 配置
├── build.sh                  # 构建脚本
├── deploy.sh                 # 一键部署脚本
├── pm2.sh                    # PM2 管理脚本
└── logs/                     # 日志目录（自动创建）
    ├── backend-error.log
    ├── backend-out.log
    ├── frontend-error.log
    ├── frontend-out.log
    ├── admin-error.log
    └── admin-out.log
```

## 快速开始

### 1. 一键部署（推荐）

```bash
# 构建并启动所有服务
./deploy.sh
```

这个脚本会自动：
1. 检查数据库状态
2. 构建所有项目（后端 + 两个前端）
3. 启动 PM2 服务

### 2. 分步部署

```bash
# 步骤 1: 构建所有项目
./build.sh

# 步骤 2: 启动服务
./pm2.sh start
```

## PM2 管理命令

### 基本命令

```bash
# 启动所有服务
./pm2.sh start

# 停止所有服务
./pm2.sh stop

# 重启所有服务
./pm2.sh restart

# 零停机重载（推荐用于更新）
./pm2.sh reload

# 查看服务状态
./pm2.sh status

# 删除所有服务
./pm2.sh delete
```

### 日志管理

```bash
# 查看所有服务日志（实时）
./pm2.sh logs

# 查看后端日志
./pm2.sh logs-backend

# 查看用户前端日志
./pm2.sh logs-frontend

# 查看管理后台日志
./pm2.sh logs-admin

# 监控面板（CPU、内存实时监控）
./pm2.sh monit
```

### 高级功能

```bash
# 保存当前进程列表
./pm2.sh save

# 设置开机自启动
./pm2.sh startup
# 然后按照提示执行 sudo 命令
# 最后运行: ./pm2.sh save

# 取消开机自启动
./pm2.sh unstartup

# 更新 PM2
./pm2.sh update
```

## 服务说明

### 生产环境服务（ecosystem.config.js）

| 服务名 | 说明 | 端口 | 实例数 | 模式 |
|--------|------|------|--------|------|
| backend-api | 后端 API 服务 | 50301 | 2 | cluster |
| frontend-user | 用户前端 | 50302 | 1 | fork |
| frontend-admin | 管理后台 | 50303 | 1 | fork |

**特性：**
- 后端使用集群模式（2个实例），充分利用多核 CPU
- 自动重启：内存超过 500MB 自动重启
- 最小运行时间：10秒
- 最大重启次数：10次
- 重启延迟：4秒

### 开发环境服务（ecosystem.dev.config.js）

开发环境直接运行 `npm run dev`，支持热更新：

```bash
# 使用开发配置启动
pm2 start ecosystem.dev.config.js

# 或使用原来的方式
npm start  # 根目录的启动脚本
```

## 更新和部署流程

### 代码更新后重新部署

```bash
# 方式 1: 零停机重载（推荐）
./build.sh && ./pm2.sh reload

# 方式 2: 完整重启
./build.sh && ./pm2.sh restart
```

### 单独重启某个服务

```bash
# 重启后端
pm2 restart backend-api

# 重启用户前端
pm2 restart frontend-user

# 重启管理后台
pm2 restart frontend-admin
```

## 监控和日志

### 实时监控

```bash
# 打开监控面板
./pm2.sh monit
```

监控面板显示：
- CPU 使用率
- 内存使用量
- 实时日志
- 重启次数
- 运行时间

### 日志文件位置

```
logs/
├── backend-error.log       # 后端错误日志
├── backend-out.log         # 后端输出日志
├── frontend-error.log      # 用户前端错误日志
├── frontend-out.log        # 用户前端输出日志
├── admin-error.log         # 管理后台错误日志
└── admin-out.log           # 管理后台输出日志
```

### 日志管理

```bash
# 清空日志
pm2 flush

# 重新加载日志
pm2 reloadLogs
```

## 性能优化建议

### 1. 集群模式优化

后端默认使用 2 个实例，根据服务器 CPU 核心数调整：

```javascript
// ecosystem.config.js
{
  instances: 'max',  // 使用所有 CPU 核心
  // 或
  instances: 4,      // 固定 4 个实例
}
```

### 2. 内存限制

根据实际情况调整内存限制：

```javascript
{
  max_memory_restart: '500M',  // 默认 500MB
  // 或
  max_memory_restart: '1G',    // 增加到 1GB
}
```

### 3. 日志轮转

安装 pm2-logrotate 模块自动轮转日志：

```bash
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## 开机自启动设置

### Linux (systemd)

```bash
# 1. 生成启动脚本
./pm2.sh startup

# 2. 按照输出的提示执行 sudo 命令，例如：
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u eric --hp /home/eric

# 3. 保存当前进程列表
./pm2.sh save

# 4. 验证
sudo systemctl status pm2-eric
```

### 取消自启动

```bash
./pm2.sh unstartup
```

## 故障排查

### 服务无法启动

```bash
# 1. 检查构建是否成功
ls -la backend/dist
ls -la frontend/dist
ls -la admin-frontend/dist

# 2. 重新构建
./build.sh

# 3. 查看详细日志
./pm2.sh logs

# 4. 检查端口占用
lsof -i :50301
lsof -i :50302
lsof -i :50303
```

### 服务频繁重启

```bash
# 查看服务状态（restart 列显示重启次数）
./pm2.sh status

# 查看错误日志
./pm2.sh logs-backend

# 检查内存使用
pm2 monit
```

### 数据库连接失败

```bash
# 检查数据库状态
./db-cli.sh status

# 启动数据库
./db-cli.sh start

# 检查后端环境变量
cat backend/.env
```

## PM2 原生命令参考

如果需要使用 PM2 原生命令：

```bash
# 查看所有进程
pm2 list

# 查看进程详情
pm2 show backend-api

# 停止单个进程
pm2 stop backend-api

# 删除单个进程
pm2 delete backend-api

# 重置重启计数
pm2 reset backend-api

# 查看实时日志（所有服务）
pm2 logs

# 查看实时日志（单个服务）
pm2 logs backend-api --lines 100

# 导出进程配置
pm2 save

# 从保存的配置恢复
pm2 resurrect

# 清空所有进程
pm2 kill
```

## Web 界面（可选）

PM2 提供 Web 监控界面 PM2 Plus：

```bash
# 注册并连接到 PM2 Plus
pm2 plus
```

访问 https://app.pm2.io/ 查看详细监控数据。

## 环境变量管理

### 生产环境变量

在 `ecosystem.config.js` 中配置：

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 50301,
  // 其他环境变量
}
```

### 从 .env 文件加载

```javascript
{
  env_file: '.env',  // 加载 .env 文件
}
```

## 最佳实践

1. **开发环境**: 使用 `npm start` 或 `ecosystem.dev.config.js`
2. **生产环境**: 使用 `./deploy.sh` 一键部署
3. **更新代码**: 使用 `./build.sh && ./pm2.sh reload` 零停机更新
4. **监控**: 定期运行 `./pm2.sh monit` 查看资源使用
5. **备份**: 使用 `./pm2.sh save` 保存进程配置
6. **日志**: 安装 pm2-logrotate 避免日志文件过大

## 常见问题

### Q: 如何查看某个服务的实时日志？

```bash
pm2 logs backend-api --lines 200
```

### Q: 如何增加后端实例数？

编辑 `ecosystem.config.js`，修改 `instances` 值：

```javascript
{
  instances: 4,  // 改为 4 个实例
}
```

然后重启：

```bash
./pm2.sh restart
```

### Q: 如何修改端口？

1. 修改 `ecosystem.config.js` 中的环境变量
2. 修改对应的 `.env` 文件
3. 重新构建并重启：

```bash
./build.sh && ./pm2.sh restart
```

### Q: 如何备份 PM2 配置？

```bash
# 保存当前进程列表
pm2 save

# 配置文件在
~/.pm2/dump.pm2
```

### Q: 如何完全清除 PM2？

```bash
# 停止并删除所有服务
pm2 delete all

# 或者
pm2 kill
```

## 相关资源

- PM2 官方文档: https://pm2.keymetrics.io/docs/usage/quick-start/
- PM2 中文文档: https://pm2.fenxianglu.cn/
- PM2 GitHub: https://github.com/Unitech/pm2

## 总结

使用 PM2 管理服务的优势：

✅ 自动重启（崩溃或内存超限时）
✅ 负载均衡（集群模式）
✅ 零停机重载
✅ 日志管理
✅ 性能监控
✅ 开机自启动
✅ 简单的命令行界面

现在你可以使用 `./deploy.sh` 一键部署所有服务了！
