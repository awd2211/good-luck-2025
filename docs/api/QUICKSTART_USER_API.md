# 用户端API快速开始指南

## 一键启动

```bash
# 1. 执行数据库迁移
./migrate-user-tables.sh

# 2. 启动后端（新终端窗口）
cd backend && npm run dev

# 3. 运行测试（新终端窗口）
./test-user-api.sh
```

## 验证安装

### 检查数据库
```bash
./db-cli.sh status
```

### 查看已创建的表
```bash
./db-cli.sh connect -c "\dt"
```

### 查看算命服务数据
```bash
./db-cli.sh connect -c "SELECT id, name, category, price FROM fortunes;"
```

## 手动测试

### 1. 发送验证码
```bash
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "13900000001"}'
```

查看后端日志获取验证码。

### 2. 登录获取Token
```bash
curl -X POST http://localhost:3000/api/auth/login/code \
  -H "Content-Type: application/json" \
  -d '{"phone": "13900000001", "code": "你的验证码"}'
```

复制返回的token。

### 3. 获取服务列表
```bash
curl http://localhost:3000/api/fortunes
```

### 4. 添加到购物车
```bash
TOKEN="你的token"
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"fortuneId": 1, "quantity": 1}'
```

### 5. 查看购物车
```bash
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer $TOKEN"
```

## API端点列表

### 公开接口（无需登录）
```
POST   /api/auth/send-code              # 发送验证码
POST   /api/auth/login/code             # 验证码登录
POST   /api/auth/login/password         # 密码登录
POST   /api/auth/register               # 注册
POST   /api/auth/reset-password         # 重置密码

GET    /api/fortunes                    # 服务列表
GET    /api/fortunes/:id                # 服务详情
GET    /api/fortunes/popular            # 热门服务
GET    /api/fortunes/recommended        # 推荐服务
GET    /api/fortunes/categories         # 分类列表
```

### 需要登录的接口
```
# 用户信息
GET    /api/auth/me                     # 获取个人信息
PUT    /api/auth/profile                # 更新个人信息
POST   /api/auth/change-password        # 修改密码

# 购物车
GET    /api/cart                        # 获取购物车
POST   /api/cart                        # 添加到购物车
PUT    /api/cart/:id                    # 更新数量
DELETE /api/cart/:id                    # 删除商品
POST   /api/cart/batch-delete           # 批量删除
DELETE /api/cart                        # 清空购物车

# 收藏
GET    /api/favorites                   # 收藏列表
POST   /api/favorites                   # 添加收藏
DELETE /api/favorites/:fortuneId        # 取消收藏
GET    /api/favorites/check/:fortuneId  # 检查收藏状态
POST   /api/favorites/batch-check       # 批量检查

# 浏览历史
GET    /api/history                     # 浏览历史
POST   /api/history                     # 添加记录
DELETE /api/history/:id                 # 删除单条
POST   /api/history/batch-delete        # 批量删除
DELETE /api/history                     # 清空历史
```

## 常用查询参数

### 分页
```
?page=1&limit=20
```

### 分类筛选
```
?category=bazi          # 八字精批
?category=birth-animal  # 生肖运势
?category=marriage      # 八字合婚
```

### 排序
```
?sort=price_asc         # 价格从低到高
?sort=price_desc        # 价格从高到低
?sort=popular           # 按热度排序
?sort=rating            # 按评分排序
```

### 搜索
```
?keyword=八字
```

### 组合查询
```
?category=bazi&sort=popular&page=1&limit=10
```

## 示例数据

### 算命服务分类
- `birth-animal` - 生肖运势 (¥58)
- `bazi` - 八字精批 (¥88)
- `yearly` - 流年运势 (¥68)
- `name` - 姓名测算 (¥48)
- `marriage` - 八字合婚 (¥128)
- `career` - 事业运势 (¥78)
- `wealth` - 财运分析 (¥88)
- `romance` - 桃花运势 (¥58)

## 故障排查

### 数据库未运行
```bash
docker compose up -d postgres
./db-cli.sh status
```

### 表不存在
```bash
./migrate-user-tables.sh
```

### 后端启动失败
```bash
# 检查端口占用
lsof -i :3000

# 查看日志
cd backend && npm run dev
```

### Token无效
重新登录获取新Token（有效期7天）。

## 下一步

1. 查看完整API文档: `USER_API_README.md`
2. 查看开发总结: `USER_API_SUMMARY.md`
3. 开始前端集成

## 技术支持

- 项目文档: `CLAUDE.md`
- 数据库文档: `DATABASE.md`
- 优化文档: `OPTIMIZATION.md`
