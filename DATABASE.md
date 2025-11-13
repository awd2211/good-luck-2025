# PostgreSQL 数据库使用说明

## 🚀 快速启动

### 启动数据库
```bash
docker compose up -d
```

### 停止数据库
```bash
docker compose down
```

### 停止并删除数据
```bash
docker compose down -v
```

## 📊 数据库信息

- **主机**: localhost
- **端口**: 54320
- **数据库名**: fortune_db
- **用户名**: fortune_user
- **密码**: fortune_pass_2025

## 🗄️ 数据表结构

### 1. users - 用户表
存储平台用户信息
- id, username, phone, email
- register_date, status, order_count, total_spent
- last_login_date

### 2. admins - 管理员表
存储管理员账号信息
- id, username, password (bcrypt哈希)
- role (super_admin/manager), email

### 3. orders - 订单表
存储用户订单信息
- id, order_id, user_id, username
- fortune_type, fortune_name, amount
- status, pay_method, create_time, update_time

### 4. audit_logs - 审计日志表
存储系统操作日志
- id, user_id, username, action, resource
- details, ip, user_agent, status, timestamp

### 5. banners - 横幅管理表
存储首页横幅信息
- id, title, subtitle, image_url, link_url
- bg_color, text_color, position, status
- start_date, end_date

### 6. notifications - 通知管理表
存储系统通知信息
- id, title, content, type, priority
- status, target, start_date, end_date
- created_by

## 🔧 常用命令

### 连接数据库
```bash
docker compose exec postgres psql -U fortune_user -d fortune_db
```

### 查看所有表
```bash
docker compose exec postgres psql -U fortune_user -d fortune_db -c "\dt"
```

### 查看表结构
```bash
docker compose exec postgres psql -U fortune_user -d fortune_db -c "\d+ users"
```

### 查询数据
```bash
docker compose exec postgres psql -U fortune_user -d fortune_db -c "SELECT * FROM users;"
```

### 备份数据库
```bash
docker compose exec postgres pg_dump -U fortune_user fortune_db > backup.sql
```

### 恢复数据库
```bash
docker compose exec -T postgres psql -U fortune_user -d fortune_db < backup.sql
```

### 查看数据库日志
```bash
docker compose logs postgres
```

### 实时查看日志
```bash
docker compose logs -f postgres
```

## 📦 初始数据

数据库在首次启动时会自动执行 `db/init.sql` 脚本，包含：

- ✅ 2个管理员账号 (admin/admin123, manager/manager123)
- ✅ 3个示例用户
- ✅ 3个示例订单
- ✅ 3条示例横幅
- ✅ 2条示例通知
- ✅ 3条审计日志

## 🔐 安全建议

⚠️ **生产环境请务必修改默认密码！**

在生产环境中：
1. 修改 docker-compose.yml 中的 POSTGRES_PASSWORD
2. 使用强密码
3. 不要暴露数据库端口到公网
4. 定期备份数据

## 🛠️ 故障排查

### 数据库无法启动
```bash
# 查看日志
docker compose logs postgres

# 检查容器状态
docker compose ps

# 检查健康状态
docker inspect fortune-postgres --format='{{.State.Health.Status}}'
```

### 重置数据库
```bash
# 停止并删除容器和数据卷
docker compose down -v

# 重新启动（会重新初始化）
docker compose up -d
```

### 端口被占用
如果54320端口被占用，可以修改 docker-compose.yml 中的端口映射：
```yaml
ports:
  - "您的端口:5432"
```

## 🔗 连接字符串

### Node.js (pg)
```javascript
const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 54320,
  database: 'fortune_db',
  user: 'fortune_user',
  password: 'fortune_pass_2025',
})
```

### 环境变量格式
```
DATABASE_URL=postgresql://fortune_user:fortune_pass_2025@localhost:54320/fortune_db
```

## 📈 性能监控

### 查看活动连接
```bash
docker compose exec postgres psql -U fortune_user -d fortune_db -c "SELECT * FROM pg_stat_activity;"
```

### 查看数据库大小
```bash
docker compose exec postgres psql -U fortune_user -d fortune_db -c "SELECT pg_size_pretty(pg_database_size('fortune_db'));"
```

### 查看表大小
```bash
docker compose exec postgres psql -U fortune_user -d fortune_db -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```
