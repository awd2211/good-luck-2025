# RBAC权限系统实施指南

## 快速开始

### 1. 系统已完成的工作

✅ **前端权限系统** (admin-frontend)
- 新增2个客服角色: `cs_manager`, `cs_agent`
- 新增6个客服权限
- 菜单自动过滤
- 页面权限守卫

✅ **后端权限系统** (backend)
- 新增2个客服角色
- 新增4个客服资源
- API权限验证中间件
- 3个客服相关路由文件

✅ **文档**
- 前端权限文档: `RBAC_CUSTOMER_SERVICE.md`
- 后端权限文档: `BACKEND_RBAC_SUMMARY.md`
- 集成总结文档: `RBAC_INTEGRATION_COMPLETE.md`
- 测试脚本: `test-rbac.sh`

### 2. 快速测试

#### 启动服务

```bash
# 终端1: 启动数据库
docker compose up -d

# 终端2: 启动后端
cd backend && npm run dev

# 终端3: 启动管理前端
cd admin-frontend && npm run dev
```

#### 运行权限测试

```bash
# 运行自动化测试脚本
./test-rbac.sh
```

测试脚本会自动:
1. 创建测试账号 (客服主管和客服专员)
2. 测试各角色的登录
3. 验证客服主管权限 (6个测试)
4. 验证客服专员权限 (6个测试)
5. 测试用户端聊天API (2个测试)
6. 显示测试结果统计

#### 手动测试

**测试1: 客服专员登录**

1. 访问管理后台: `http://localhost:5174`
2. 使用客服专员账号登录:
   ```
   用户名: test_cs_agent
   密码: Test123456
   ```
3. 验证:
   - ✅ 只能看到"客服系统 → 客服工作台"菜单
   - ✅ 可以访问 `/cs-workbench` 页面
   - ❌ 看不到其他业务菜单
   - ❌ 无法访问 `/customer-service` 页面

**测试2: 客服主管登录**

1. 访问管理后台: `http://localhost:5174`
2. 使用客服主管账号登录:
   ```
   用户名: test_cs_manager
   密码: Test123456
   ```
3. 验证:
   - ✅ 可以看到"客服系统 → 客服管理"和"客服工作台"
   - ✅ 可以访问 `/customer-service` 页面
   - ✅ 可以创建/编辑/删除客服账号
   - ✅ 可以查看客服统计数据
   - ❌ 看不到其他业务菜单

**测试3: 超级管理员登录**

1. 使用超级管理员账号登录:
   ```
   用户名: admin
   密码: admin123
   ```
2. 验证:
   - ✅ 可以看到所有菜单
   - ✅ 可以访问客服系统
   - ✅ 可以管理客服人员

### 3. 文件清单

#### 前端修改的文件

```
admin-frontend/
├── src/
│   ├── config/
│   │   └── permissions.ts          ← 已更新 (新增客服角色和权限)
│   ├── layouts/
│   │   └── MainLayout.tsx          ← 已更新 (客服菜单权限)
│   ├── pages/
│   │   ├── CustomerServiceManagement.tsx  ← 新增 (客服管理页面)
│   │   └── CSWorkbench.tsx                ← 新增 (客服工作台)
│   └── App.tsx                     ← 已更新 (新增路由)
```

#### 后端修改的文件

```
backend/
├── src/
│   ├── config/
│   │   └── permissions.ts          ← 已更新 (新增客服角色和资源)
│   ├── routes/
│   │   ├── csAgents.ts             ← 新增 (客服人员管理API)
│   │   ├── csSessions.ts           ← 新增 (客服会话管理API)
│   │   └── chat.ts                 ← 新增 (用户端聊天API)
│   └── index.ts                    ← 已更新 (注册客服路由)
```

#### 文档文件

```
/
├── RBAC_CUSTOMER_SERVICE.md           ← 前端权限文档
├── BACKEND_RBAC_SUMMARY.md            ← 后端权限文档
├── RBAC_INTEGRATION_COMPLETE.md       ← 集成总结文档
├── RBAC_IMPLEMENTATION_GUIDE.md       ← 本文件
└── test-rbac.sh                       ← 自动化测试脚本
```

### 4. 数据库设置

#### 创建客服角色账号

```sql
-- 方式1: 使用管理后台UI创建 (推荐)
-- 登录管理后台 → 系统管理 → 管理员管理 → 新建管理员
-- 选择角色: "客服主管" 或 "客服专员"

-- 方式2: 直接SQL插入
-- 注意: 密码需要使用bcrypt加密
INSERT INTO admins (username, password, email, role, status, created_at)
VALUES (
  'cs_manager_001',
  '$2a$10$...',  -- 使用 bcrypt.hash('your_password', 10)
  'cs_manager@fortune.com',
  'cs_manager',
  'active',
  NOW()
);

-- 方式3: 使用API创建
curl -X POST http://localhost:3000/api/manage/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "username": "cs_manager_001",
    "password": "SecurePassword123",
    "email": "cs_manager@fortune.com",
    "role": "cs_manager"
  }'
```

### 5. 权限配置参考

#### 前端权限枚举

```typescript
// admin-frontend/src/config/permissions.ts

export enum Permission {
  // 客服系统
  CS_WORKBENCH_VIEW = 'cs_workbench:view',      // 查看客服工作台
  CS_AGENT_VIEW = 'cs_agent:view',              // 查看客服管理
  CS_AGENT_CREATE = 'cs_agent:create',          // 创建客服
  CS_AGENT_EDIT = 'cs_agent:edit',              // 编辑客服
  CS_AGENT_DELETE = 'cs_agent:delete',          // 删除客服
  CS_STATISTICS_VIEW = 'cs_statistics:view',    // 查看客服统计
}

export enum Role {
  CS_MANAGER = 'cs_manager',     // 客服主管
  CS_AGENT = 'cs_agent',         // 客服专员
}
```

#### 后端资源和操作

```typescript
// backend/src/config/permissions.ts

export enum Resource {
  CS_AGENTS = 'cs_agents',       // 客服人员管理
  CS_SESSIONS = 'cs_sessions',   // 客服会话管理
  CS_MESSAGES = 'cs_messages',   // 客服消息管理
  CS_STATS = 'cs_stats',         // 客服统计
}

export enum Action {
  CREATE = 'create',   // 创建
  READ = 'read',       // 读取
  UPDATE = 'update',   // 更新
  DELETE = 'delete',   // 删除
  MANAGE = 'manage',   // 完全管理权限
}
```

### 6. API端点清单

#### 客服人员管理API

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/manage/cs/agents` | CS_AGENTS:READ | 获取客服列表 |
| GET | `/api/manage/cs/agents/stats` | CS_STATS:READ | 获取客服统计 |
| GET | `/api/manage/cs/agents/:id` | CS_AGENTS:READ | 获取客服详情 |
| POST | `/api/manage/cs/agents` | CS_AGENTS:CREATE | 创建客服账号 |
| PUT | `/api/manage/cs/agents/:id` | CS_AGENTS:UPDATE | 更新客服信息 |
| PUT | `/api/manage/cs/agents/:id/status` | CS_AGENTS:UPDATE | 更新客服状态 |
| DELETE | `/api/manage/cs/agents/:id` | CS_AGENTS:DELETE | 删除客服账号 |

#### 客服会话管理API

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/manage/cs/sessions` | CS_SESSIONS:READ | 获取会话列表 |
| GET | `/api/manage/cs/sessions/:id` | CS_SESSIONS:READ | 获取会话详情 |
| GET | `/api/manage/cs/sessions/:id/messages` | CS_MESSAGES:READ | 获取会话消息 |
| POST | `/api/manage/cs/sessions` | CS_SESSIONS:CREATE | 创建会话 |
| POST | `/api/manage/cs/sessions/:id/assign` | CS_SESSIONS:UPDATE | 分配会话 |
| POST | `/api/manage/cs/sessions/:id/transfer` | CS_SESSIONS:UPDATE | 转移会话 |
| POST | `/api/manage/cs/sessions/:id/close` | CS_SESSIONS:UPDATE | 关闭会话 |

#### 用户端聊天API (公开)

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/api/chat/sessions` | Public | 创建聊天会话 |
| GET | `/api/chat/sessions/:sessionKey` | Public | 获取会话详情 |
| GET | `/api/chat/messages/:sessionId` | Public | 获取消息列表 |
| POST | `/api/chat/messages` | Public | 发送消息 |
| POST | `/api/chat/sessions/:sessionId/close` | Public | 关闭会话 |

### 7. 常见问题

#### Q1: 客服专员登录后看不到菜单?

**检查项**:
1. 确认账号role为 `cs_agent`
2. 检查 `MainLayout.tsx` 中客服菜单的权限配置
3. 检查 `permissions.ts` 中 `CS_AGENT` 角色是否有 `CS_WORKBENCH_VIEW` 权限

**解决方案**:
```typescript
// permissions.ts
[Role.CS_AGENT]: [
  Permission.CS_WORKBENCH_VIEW,  // 确保有这个权限
]
```

#### Q2: API返回403 Forbidden?

**原因**: 角色没有对应的资源和操作权限

**检查项**:
1. 确认JWT token有效
2. 检查用户角色
3. 检查后端权限矩阵配置
4. 确认路由使用了 `requirePermission` 中间件

**解决方案**:
```typescript
// backend/src/config/permissions.ts
[Role.CS_MANAGER]: {
  [Resource.CS_AGENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
}
```

#### Q3: 如何添加新的客服权限?

**步骤**:

1. **前端添加权限**:
```typescript
// admin-frontend/src/config/permissions.ts
export enum Permission {
  CS_NEW_FEATURE = 'cs_new_feature:view',
}
```

2. **前端分配权限给角色**:
```typescript
[Role.CS_MANAGER]: [
  // ... 现有权限
  Permission.CS_NEW_FEATURE,
]
```

3. **后端添加资源**:
```typescript
// backend/src/config/permissions.ts
export enum Resource {
  CS_NEW_RESOURCE = 'cs_new_resource',
}
```

4. **后端配置权限矩阵**:
```typescript
[Role.CS_MANAGER]: {
  [Resource.CS_NEW_RESOURCE]: [Action.READ, Action.CREATE],
}
```

5. **API路由使用权限**:
```typescript
router.get('/',
  authenticate,
  requirePermission(Resource.CS_NEW_RESOURCE, Action.READ),
  getNewResource
)
```

#### Q4: 如何让客服专员只能看到自己的数据?

**在控制器层实现数据隔离**:

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

  const result = await pool.query(query, params)
  res.json({ success: true, data: result.rows })
}
```

### 8. 扩展建议

#### 添加审计日志

```typescript
// 在敏感操作后记录日志
import { createAuditLog } from '../services/auditService'

export const deleteAgent = async (req: Request, res: Response) => {
  const agentId = req.params.id

  // 删除客服
  await pool.query('DELETE FROM cs_agents WHERE id = $1', [agentId])

  // 记录审计日志
  await createAuditLog({
    userId: req.user!.id,
    action: 'delete',
    resource: 'cs_agents',
    resourceId: agentId,
    details: { agentId }
  })

  res.json({ success: true })
}
```

#### 实现权限缓存

```typescript
// 缓存用户权限,避免频繁查询
const permissionCache = new Map<string, Permission[]>()

export const getUserPermissions = (userId: string, role: Role) => {
  const cacheKey = `${userId}:${role}`

  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey)!
  }

  const permissions = rolePermissions[role]
  permissionCache.set(cacheKey, permissions)

  return permissions
}
```

### 9. 部署检查清单

部署前确认:

- [ ] 前端权限配置正确
- [ ] 后端权限配置正确
- [ ] 所有API路由已添加权限验证
- [ ] 测试脚本全部通过
- [ ] 创建了生产环境的客服账号
- [ ] 数据库中存在客服相关表
- [ ] Socket.IO服务正常运行
- [ ] JWT密钥已更新为生产密钥
- [ ] CORS配置正确
- [ ] 审计日志功能正常 (如已实现)

### 10. 技术支持

如遇问题,请检查:

1. **日志**: 查看后端控制台日志
2. **浏览器**: 查看浏览器开发者工具的Network和Console
3. **数据库**: 确认admins表中的role字段值正确
4. **文档**: 参考本目录下的详细文档

## 总结

✅ **RBAC权限系统已完全实施**

- 前端菜单自动过滤
- 后端API权限验证
- 双重安全机制
- 完整的测试脚本
- 详细的使用文档

客服人员现在可以使用独立的账号登录管理后台,根据角色只能看到和操作其权限范围内的功能! 🎉
