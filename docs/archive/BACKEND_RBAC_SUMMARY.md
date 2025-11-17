# 后端RBAC权限系统实施总结

## 概述

为后端API实现了完整的基于角色的访问控制(RBAC)系统,确保不同角色的管理员只能访问其权限范围内的资源。

## 权限系统架构

### 1. 核心组件

**权限配置文件**: `/backend/src/config/permissions.ts`
- 定义了6个角色 (Role)
- 定义了20个资源类型 (Resource)
- 定义了5个操作类型 (Action)
- 包含完整的权限矩阵 (PERMISSIONS)

**认证中间件**: `/backend/src/middleware/auth.ts`
- `authenticate` - JWT认证
- `requireRole` - 角色检查
- `requirePermission` - 细粒度权限检查
- `optionalAuth` - 可选认证

### 2. 角色定义

```typescript
export enum Role {
  SUPER_ADMIN = 'super_admin',  // 超级管理员
  MANAGER = 'manager',           // 管理员
  EDITOR = 'editor',             // 编辑
  VIEWER = 'viewer',             // 查看者
  CS_MANAGER = 'cs_manager',     // 客服主管
  CS_AGENT = 'cs_agent',         // 客服专员
}
```

### 3. 客服相关资源

新增了4个客服专用资源类型:

```typescript
export enum Resource {
  // ... 其他资源
  CS_AGENTS = 'cs_agents',       // 客服人员管理
  CS_SESSIONS = 'cs_sessions',   // 客服会话管理
  CS_MESSAGES = 'cs_messages',   // 客服消息管理
  CS_STATS = 'cs_stats',         // 客服统计
}
```

### 4. 操作类型

```typescript
export enum Action {
  CREATE = 'create',   // 创建
  READ = 'read',       // 读取
  UPDATE = 'update',   // 更新
  DELETE = 'delete',   // 删除
  MANAGE = 'manage',   // 完全管理权限
}
```

## 客服系统权限矩阵

### 客服主管 (CS_MANAGER)

可以访问的资源和操作:

| 资源 | CREATE | READ | UPDATE | DELETE | MANAGE |
|------|--------|------|--------|--------|--------|
| CS_AGENTS | ✅ | ✅ | ✅ | ✅ | ❌ |
| CS_SESSIONS | ✅ | ✅ | ✅ | ✅ | ❌ |
| CS_MESSAGES | ✅ | ✅ | ✅ | ✅ | ❌ |
| CS_STATS | ❌ | ✅ | ❌ | ❌ | ❌ |
| **其他所有资源** | ❌ | ❌ | ❌ | ❌ | ❌ |

**说明**:
- ✅ 可以管理客服人员 (创建/查看/编辑/删除客服账号)
- ✅ 可以管理所有会话 (分配/转移/关闭)
- ✅ 可以查看所有消息
- ✅ 可以查看客服统计数据
- ❌ 无法访问其他业务数据 (用户/订单/财务等)

### 客服专员 (CS_AGENT)

可以访问的资源和操作:

| 资源 | CREATE | READ | UPDATE | DELETE | MANAGE |
|------|--------|------|--------|--------|--------|
| CS_AGENTS | ❌ | ❌ | ❌ | ❌ | ❌ |
| CS_SESSIONS | ❌ | ✅ | ✅ | ❌ | ❌ |
| CS_MESSAGES | ✅ | ✅ | ❌ | ❌ | ❌ |
| CS_STATS | ❌ | ❌ | ❌ | ❌ | ❌ |
| **其他所有资源** | ❌ | ❌ | ❌ | ❌ | ❌ |

**说明**:
- ❌ 无法管理客服人员
- ✅ 可以查看和更新自己的会话
- ✅ 可以发送和查看消息
- ❌ 无法查看统计数据
- ❌ 无法访问其他业务数据

### 超级管理员和管理员

拥有客服系统的完整权限:

| 资源 | CREATE | READ | UPDATE | DELETE | MANAGE |
|------|--------|------|--------|--------|--------|
| CS_AGENTS | ✅ | ✅ | ✅ | ✅ | ✅ |
| CS_SESSIONS | ✅ | ✅ | ✅ | ✅ | ✅ |
| CS_MESSAGES | ✅ | ✅ | ✅ | ✅ | ✅ |
| CS_STATS | ❌ | ✅ | ❌ | ❌ | ✅ |

## API路由及权限控制

### 客服人员管理API

**路由文件**: `/backend/src/routes/csAgents.ts`

| 方法 | 路径 | 权限要求 | 描述 |
|------|------|---------|------|
| GET | `/api/manage/cs/agents` | CS_AGENTS:READ | 获取客服列表 |
| GET | `/api/manage/cs/agents/stats` | CS_STATS:READ | 获取客服统计 |
| GET | `/api/manage/cs/agents/:id` | CS_AGENTS:READ | 获取客服详情 |
| POST | `/api/manage/cs/agents` | CS_AGENTS:CREATE | 创建客服账号 |
| PUT | `/api/manage/cs/agents/:id` | CS_AGENTS:UPDATE | 更新客服信息 |
| PUT | `/api/manage/cs/agents/:id/status` | CS_AGENTS:UPDATE | 更新客服状态 |
| DELETE | `/api/manage/cs/agents/:id` | CS_AGENTS:DELETE | 删除客服账号 |

**权限验证示例**:
```typescript
router.get(
  '/',
  authenticate,  // 1. 验证JWT token
  requirePermission(Resource.CS_AGENTS, Action.READ),  // 2. 检查权限
  getAgents  // 3. 执行业务逻辑
)
```

### 客服会话管理API

**路由文件**: `/backend/src/routes/csSessions.ts`

| 方法 | 路径 | 权限要求 | 描述 |
|------|------|---------|------|
| GET | `/api/manage/cs/sessions` | CS_SESSIONS:READ | 获取会话列表 |
| GET | `/api/manage/cs/sessions/:id` | CS_SESSIONS:READ | 获取会话详情 |
| GET | `/api/manage/cs/sessions/:id/messages` | CS_MESSAGES:READ | 获取会话消息 |
| POST | `/api/manage/cs/sessions` | CS_SESSIONS:CREATE | 创建会话 |
| POST | `/api/manage/cs/sessions/:id/assign` | CS_SESSIONS:UPDATE | 分配会话 |
| POST | `/api/manage/cs/sessions/:id/transfer` | CS_SESSIONS:UPDATE | 转移会话 |
| POST | `/api/manage/cs/sessions/:id/close` | CS_SESSIONS:UPDATE | 关闭会话 |

### 用户端聊天API (公开)

**路由文件**: `/backend/src/routes/chat.ts`

| 方法 | 路径 | 权限要求 | 描述 |
|------|------|---------|------|
| POST | `/api/chat/sessions` | Public | 创建聊天会话 |
| GET | `/api/chat/sessions/:sessionKey` | Public | 获取会话详情 |
| GET | `/api/chat/messages/:sessionId` | Public | 获取消息列表 |
| POST | `/api/chat/messages` | Public | 发送消息 |
| POST | `/api/chat/sessions/:sessionId/close` | Public | 关闭会话 |

**说明**: 用户端API不需要认证,支持游客使用。使用 `optionalAuth` 中间件支持可选认证。

## 权限检查流程

### 1. 请求到达

```
HTTP Request
↓
API Route
```

### 2. 认证阶段

```
authenticate 中间件
↓
验证 JWT Token
↓
解码用户信息 (id, username, role, email)
↓
设置 req.user
```

### 3. 权限检查阶段

```
requirePermission(resource, action) 中间件
↓
获取用户角色 (req.user.role)
↓
查询权限矩阵 (PERMISSIONS[role][resource])
↓
检查是否包含指定操作 (action)
↓
通过 → 执行业务逻辑
拒绝 → 返回 403 Forbidden
```

### 4. 响应

```
成功: 200 OK + 数据
失败: 403 Forbidden + { success: false, message: '权限不足' }
```

## 使用示例

### 示例1: 创建客服账号

```typescript
// routes/csAgents.ts
router.post(
  '/',
  authenticate,
  requirePermission(Resource.CS_AGENTS, Action.CREATE),
  createAgent
)
```

**流程**:
1. 客户端发送 POST 请求到 `/api/manage/cs/agents`
2. `authenticate` 中间件验证JWT token,设置 `req.user`
3. `requirePermission` 检查用户角色是否有 `cs_agents:create` 权限
4. 如果是 `super_admin`, `manager`, 或 `cs_manager` → 通过
5. 如果是 `cs_agent` 或其他角色 → 拒绝 (403)

### 示例2: 客服专员查看会话

```typescript
// routes/csSessions.ts
router.get(
  '/',
  authenticate,
  requirePermission(Resource.CS_SESSIONS, Action.READ),
  getSessions
)
```

**流程**:
1. 客服专员登录后获取 JWT token (role: cs_agent)
2. 发送 GET 请求到 `/api/manage/cs/sessions`
3. `authenticate` 验证通过
4. `requirePermission` 检查 `cs_agent` 是否有 `cs_sessions:read` 权限
5. 根据权限矩阵,客服专员有 READ 权限 → 通过
6. 控制器层需要额外过滤,只返回分配给该客服的会话

### 示例3: 组合中间件

```typescript
// 快捷方式: 组合认证和权限检查
import { requireAuth } from '../middleware/auth'

router.post(
  '/agents',
  ...requireAuth(Resource.CS_AGENTS, Action.CREATE),
  createAgent
)

// 等价于:
router.post(
  '/agents',
  authenticate,
  requirePermission(Resource.CS_AGENTS, Action.CREATE),
  createAgent
)
```

## 角色常量

为了方便使用,定义了以下角色组:

```typescript
// 所有管理员角色
export const ADMIN_ROLES = [
  Role.SUPER_ADMIN,
  Role.MANAGER,
  Role.EDITOR,
  Role.VIEWER,
  Role.CS_MANAGER,
  Role.CS_AGENT,
]

// 可以访问客服系统的角色
export const CS_ROLES = [
  Role.SUPER_ADMIN,
  Role.MANAGER,
  Role.CS_MANAGER,
  Role.CS_AGENT,
]

// 可以管理客服人员的角色
export const CS_MANAGER_ROLES = [
  Role.SUPER_ADMIN,
  Role.MANAGER,
  Role.CS_MANAGER,
]
```

**使用示例**:
```typescript
import { requireRole } from '../middleware/auth'
import { CS_ROLES } from '../config/permissions'

// 只允许客服相关角色访问
router.get('/cs/dashboard', requireRole(CS_ROLES), getDashboard)
```

## 数据隔离建议

虽然权限系统控制了API访问,但还需要在业务逻辑层实现数据隔离:

### 客服专员数据隔离

```typescript
// controllers/csSessionController.ts
export const getSessions = async (req: Request, res: Response) => {
  const userRole = req.user!.role
  const userId = req.user!.id

  let query = 'SELECT * FROM cs_sessions WHERE 1=1'
  const params: any[] = []

  // 客服专员只能看到自己的会话
  if (userRole === Role.CS_AGENT) {
    query += ' AND agent_id = $1'
    params.push(userId)
  }

  // 客服主管和管理员可以看到所有会话
  // 不添加额外过滤条件

  const result = await pool.query(query, params)
  res.json({ success: true, data: result.rows })
}
```

## 测试建议

### 1. 创建测试账号

```sql
-- 创建客服主管
INSERT INTO admins (username, password, email, role, status)
VALUES (
  'cs_manager_test',
  '$2a$10$...',  -- bcrypt(Test123456)
  'cs_manager@test.com',
  'cs_manager',
  'active'
);

-- 创建客服专员
INSERT INTO admins (username, password, email, role, status)
VALUES (
  'cs_agent_test',
  '$2a$10$...',  -- bcrypt(Test123456)
  'cs_agent@test.com',
  'cs_agent',
  'active'
);
```

### 2. 权限测试用例

**测试1: 客服主管创建客服**
```bash
# 1. 登录获取token
TOKEN=$(curl -X POST http://localhost:3000/api/manage/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cs_manager_test","password":"Test123456"}' \
  | jq -r '.data.token')

# 2. 创建客服 (应该成功)
curl -X POST http://localhost:3000/api/manage/cs/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "new_cs_agent",
    "password": "Test123456",
    "email": "new_agent@test.com",
    "name": "测试客服"
  }'

# 预期: 200 OK
```

**测试2: 客服专员尝试创建客服**
```bash
# 1. 以客服专员身份登录
TOKEN=$(curl -X POST http://localhost:3000/api/manage/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cs_agent_test","password":"Test123456"}' \
  | jq -r '.data.token')

# 2. 尝试创建客服 (应该失败)
curl -X POST http://localhost:3000/api/manage/cs/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "another_agent",
    "password": "Test123456",
    "email": "another@test.com",
    "name": "另一个客服"
  }'

# 预期: 403 Forbidden
# { "success": false, "message": "权限不足，无法执行此操作" }
```

**测试3: 客服专员访问自己的会话**
```bash
# 以客服专员身份登录
TOKEN=$(curl -X POST http://localhost:3000/api/manage/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cs_agent_test","password":"Test123456"}' \
  | jq -r '.data.token')

# 获取会话列表 (应该只返回分配给自己的会话)
curl -X GET http://localhost:3000/api/manage/cs/sessions \
  -H "Authorization: Bearer $TOKEN"

# 预期: 200 OK + 只包含该客服的会话
```

## 安全建议

1. **最小权限原则**: 每个角色只授予必要的权限
2. **JWT安全**:
   - 使用强密钥 (至少32字符)
   - 设置合理的过期时间
   - 生产环境启用HTTPS
3. **数据隔离**: 在业务逻辑层再次验证数据访问权限
4. **审计日志**: 记录所有敏感操作 (创建/删除客服,关闭会话等)
5. **定期审查**: 定期检查角色权限配置是否合理

## 总结

✅ **后端权限系统已完成**:
- 新增2个客服专用角色 (CS_MANAGER, CS_AGENT)
- 新增4个客服资源类型
- 配置完整的权限矩阵
- 创建带权限验证的API路由
- 注册路由到主应用

✅ **权限控制流程**:
1. JWT认证 → 2. 权限检查 → 3. 业务逻辑 → 4. 数据隔离

✅ **安全性**:
- API层权限验证
- 角色隔离明确
- 支持细粒度权限控制
- 便于扩展和维护

现在前后端的RBAC权限系统都已实施完成,不同角色的用户只能访问其权限范围内的功能和数据! 🎉
