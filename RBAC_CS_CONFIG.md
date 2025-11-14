# 客服系统 RBAC 权限配置说明

## 概述

本文档说明客服系统在统一管理后台中的权限配置，实现了基于角色的访问控制（RBAC），使得不同角色的用户登录同一个管理后台时，会看到不同的菜单和拥有不同的功能权限。

## 架构特点

✅ **统一登录入口** - 所有用户（管理员、客服主管、客服专员）从同一个管理后台登录
✅ **角色自动识别** - 系统根据 JWT token 中的角色信息自动加载对应权限
✅ **菜单动态过滤** - 前端根据用户权限自动显示/隐藏菜单项
✅ **API 权限保护** - 后端通过权限中间件验证每个 API 请求的权限

## 角色定义

### 1. 超级管理员 (super_admin)

**权限范围：** 拥有所有权限

**客服系统权限：**
- ✅ 客服管理（查看、创建、编辑、删除客服人员）
- ✅ 客服工作台（处理客户咨询）
- ✅ 客服统计（查看团队统计数据）
- ✅ 会话管理（查看、分配、转接所有会话）

**菜单显示：**
- ✅ 用户管理
- ✅ 订单管理
- ✅ 算命管理
- ✅ 客服系统 → 客服管理
- ✅ 客服系统 → 客服工作台
- ✅ 系统管理
- ✅ 所有其他菜单

---

### 2. 管理员 (admin)

**权限范围：** 大部分权限，除了角色管理

**客服系统权限：**
- ✅ 客服管理（查看、创建、编辑、删除客服人员）
- ✅ 客服工作台（处理客户咨询）
- ✅ 客服统计（查看团队统计数据）
- ✅ 会话管理（查看、分配、转接所有会话）

**菜单显示：** 与超级管理员相同

---

### 3. 客服主管 (cs_manager)

**权限范围：** 仅限客服系统

**客服系统权限：**
- ✅ 客服管理（查看、创建、编辑、删除客服人员）
- ✅ 客服工作台（处理客户咨询）
- ✅ 客服统计（查看团队统计数据）
- ✅ 会话管理（查看、分配、转接所有会话）

**菜单显示：**
- ✅ 客服系统 → 客服管理
- ✅ 客服系统 → 客服工作台
- ❌ 其他所有业务菜单（用户管理、订单管理等）全部隐藏

**使用场景：** 专职客服团队负责人，负责管理客服团队和监控客服质量

---

### 4. 客服专员 (cs_agent)

**权限范围：** 仅限客服工作台

**客服系统权限：**
- ✅ 客服工作台（处理客户咨询）
- ✅ 会话管理（只能查看和处理分配给自己的会话）
- ✅ 消息管理（发送和查看消息）
- ❌ 客服管理（无权查看客服列表和统计）
- ❌ 会话分配（无权分配或转接给其他客服）

**菜单显示：**
- ✅ 客服系统 → 客服工作台
- ❌ 客服系统 → 客服管理（隐藏）
- ❌ 其他所有业务菜单全部隐藏

**使用场景：** 一线客服人员，专注于回复客户咨询

---

### 5. 其他角色 (manager/editor/operator/viewer)

**客服系统权限：** 无

**菜单显示：**
- ❌ 客服系统菜单完全隐藏
- ✅ 各自角色对应的其他业务菜单

---

## 权限配置文件

### 前端权限配置

**文件路径：** `admin-frontend/src/config/permissions.ts`

```typescript
// 客服系统权限枚举
export enum Permission {
  CS_WORKBENCH_VIEW = 'cs_workbench:view',      // 查看客服工作台
  CS_AGENT_VIEW = 'cs_agent:view',              // 查看客服管理
  CS_AGENT_CREATE = 'cs_agent:create',          // 创建客服
  CS_AGENT_EDIT = 'cs_agent:edit',              // 编辑客服
  CS_AGENT_DELETE = 'cs_agent:delete',          // 删除客服
  CS_STATISTICS_VIEW = 'cs_statistics:view',    // 查看客服统计
}

// 客服角色枚举
export enum Role {
  CS_MANAGER = 'cs_manager',       // 客服主管
  CS_AGENT = 'cs_agent',           // 客服专员
}

// 角色权限映射
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.CS_MANAGER]: [
    Permission.CS_WORKBENCH_VIEW,
    Permission.CS_AGENT_VIEW,
    Permission.CS_AGENT_CREATE,
    Permission.CS_AGENT_EDIT,
    Permission.CS_AGENT_DELETE,
    Permission.CS_STATISTICS_VIEW,
  ],

  [Role.CS_AGENT]: [
    Permission.CS_WORKBENCH_VIEW,
  ],
}
```

### 后端权限配置

**文件路径：** `backend/src/config/permissions.ts`

```typescript
// 客服资源定义
export enum Resource {
  CS_AGENTS = 'cs_agents',       // 客服人员管理
  CS_SESSIONS = 'cs_sessions',   // 客服会话管理
  CS_MESSAGES = 'cs_messages',   // 客服消息管理
  CS_STATS = 'cs_stats',         // 客服统计
}

// 操作类型
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',  // 完全管理权限
}

// 权限矩阵
export const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  [Role.CS_MANAGER]: {
    [Resource.CS_AGENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CS_SESSIONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CS_MESSAGES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.CS_STATS]: [Action.READ],
  },

  [Role.CS_AGENT]: {
    [Resource.CS_SESSIONS]: [Action.READ, Action.UPDATE], // 只能处理自己的会话
    [Resource.CS_MESSAGES]: [Action.CREATE, Action.READ], // 只能发送和查看消息
  },
}
```

### 菜单配置

**文件路径：** `admin-frontend/src/layouts/MainLayout.tsx`

```typescript
{
  key: 'customer-service',
  icon: <MessageOutlined />,
  label: '客服系统',
  children: [
    {
      key: '/customer-service',
      icon: <TeamOutlined />,
      label: '客服管理',
      permission: Permission.CS_AGENT_VIEW,  // 需要客服管理权限
    },
    {
      key: '/cs-workbench',
      icon: <MessageOutlined />,
      label: '客服工作台',
      permission: Permission.CS_WORKBENCH_VIEW,  // 需要工作台权限
    },
  ],
}
```

**权限过滤逻辑：**

```typescript
const buildMenuItems = (items: any[]): MenuItem[] => {
  return items
    .map((item) => {
      // 如果是分组菜单
      if (item.children) {
        const children = buildMenuItems(item.children)
        // 如果过滤后没有子菜单，则不显示该分组
        if (children.length === 0) return null
        return { ...item, children }
      }

      // 如果是叶子菜单项，检查权限
      if (item.permission && !checkPermission.has(item.permission)) {
        return null
      }

      return item
    })
    .filter(Boolean)
}
```

---

## API 权限保护

### 后端路由配置

**客服管理 API：** `backend/src/routes/manage/customerService.ts`

```typescript
import { requireRole, requireResource } from '../../middleware/auth'

// 只有客服主管及以上角色可以访问
router.get('/agents',
  auth,
  requireResource(Resource.CS_AGENTS, Action.READ),
  getAgents
)

router.post('/agents',
  auth,
  requireResource(Resource.CS_AGENTS, Action.CREATE),
  createAgent
)
```

**客服会话 API：** `backend/src/routes/manage/chatSessions.ts`

```typescript
// 客服专员可以查看自己的会话，主管可以查看所有会话
router.get('/sessions',
  auth,
  requireResource(Resource.CS_SESSIONS, Action.READ),
  getSessions
)
```

### 权限检查中间件

**文件路径：** `backend/src/middleware/auth.ts`

```typescript
// 检查资源操作权限
export const requireResource = (resource: Resource, action: Action) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role

    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }

    next()
  }
}
```

---

## 前端权限检查

### 使用 PermissionGuard 组件

**文件路径：** `admin-frontend/src/components/PermissionGuard.tsx`

```tsx
import { usePermission } from '../hooks/usePermission'

// 页面级权限保护
<PermissionGuard permission={Permission.CS_AGENT_VIEW}>
  <CustomerServiceManagement />
</PermissionGuard>

// 按钮级权限保护
{checkPermission.has(Permission.CS_AGENT_CREATE) && (
  <Button onClick={handleCreate}>创建客服</Button>
)}
```

### 使用 usePermission Hook

```tsx
import { usePermission } from '../hooks/usePermission'

const CustomerServiceManagement = () => {
  const { checkPermission } = usePermission()

  return (
    <>
      {/* 只有有编辑权限的用户才能看到编辑按钮 */}
      {checkPermission.has(Permission.CS_AGENT_EDIT) && (
        <Button onClick={handleEdit}>编辑</Button>
      )}

      {/* 只有有删除权限的用户才能看到删除按钮 */}
      {checkPermission.has(Permission.CS_AGENT_DELETE) && (
        <Button danger onClick={handleDelete}>删除</Button>
      )}
    </>
  )
}
```

---

## 测试验证

### 运行权限测试

```bash
# 确保后端服务运行在 localhost:3000
cd /home/eric/good-luck-2025/backend
npm run dev

# 在另一个终端运行测试脚本
cd /home/eric/good-luck-2025
./test-rbac-cs.sh
```

### 测试项目

1. ✅ 超级管理员登录并访问客服统计
2. ✅ 超级管理员获取客服列表
3. ✅ 创建客服主管测试账号
4. ✅ 创建客服专员测试账号
5. ✅ 客服主管登录并访问客服统计（应该成功）
6. ✅ 客服主管访问用户管理（应该被拒绝）
7. ✅ 客服专员登录
8. ✅ 客服专员访问客服统计（应该被拒绝）
9. ✅ 客服专员访问客服列表（应该被拒绝）

### 前端测试

1. 使用 `admin` / `admin123` 登录管理后台
2. 应该看到完整菜单，包括"客服系统"分组
3. 使用 `cs_manager_test` / `cs123456` 登录
4. 应该只看到"客服系统"菜单，其他菜单全部隐藏
5. 使用 `cs_agent_test` / `cs123456` 登录
6. 应该只看到"客服工作台"菜单项

---

## 数据库角色配置

### 创建客服账号

```sql
-- 创建客服主管
INSERT INTO admins (id, username, password, email, role, is_active, created_at, updated_at)
VALUES (
  'cs-manager-001',
  'cs_manager',
  '$2a$10$...',  -- bcrypt hash of password
  'cs_manager@fortune.com',
  'cs_manager',
  true,
  NOW(),
  NOW()
);

-- 创建客服专员
INSERT INTO admins (id, username, password, email, role, is_active, created_at, updated_at)
VALUES (
  'cs-agent-001',
  'cs_agent',
  '$2a$10$...',  -- bcrypt hash of password
  'cs_agent@fortune.com',
  'cs_agent',
  true,
  NOW(),
  NOW()
);

-- 在客服表中创建对应记录
INSERT INTO customer_service_agents (
  admin_id,
  display_name,
  role,
  status,
  max_concurrent_chats,
  is_active
)
VALUES
  ('cs-manager-001', '客服主管', 'manager', 'offline', 10, true),
  ('cs-agent-001', '客服专员A', 'agent', 'offline', 5, true);
```

---

## 权限矩阵总结

| 功能 | super_admin | admin | cs_manager | cs_agent | 其他角色 |
|-----|------------|-------|-----------|---------|---------|
| 客服管理页面 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 客服工作台 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 创建客服 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 编辑客服 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 删除客服 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 查看统计 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 分配会话 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 转接会话 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 处理会话 | ✅ | ✅ | ✅ | ✅ (仅自己的) | ❌ |
| 发送消息 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 用户管理 | ✅ | ✅ | ❌ | ❌ | 根据角色 |
| 订单管理 | ✅ | ✅ | ❌ | ❌ | 根据角色 |
| 系统配置 | ✅ | ✅ | ❌ | ❌ | 根据角色 |

---

## 常见问题

### Q1: 如何给现有管理员添加客服权限？

**A:** 直接修改管理员的 role 字段：

```sql
UPDATE admins SET role = 'cs_manager' WHERE username = 'existing_admin';
```

然后在客服表中创建对应记录：

```sql
INSERT INTO customer_service_agents (admin_id, display_name, role, status)
SELECT id, username, 'manager', 'offline'
FROM admins
WHERE username = 'existing_admin';
```

### Q2: 客服专员如何升级为客服主管？

**A:** 修改两个表：

```sql
-- 更新管理员角色
UPDATE admins SET role = 'cs_manager' WHERE username = 'cs_agent';

-- 更新客服角色
UPDATE customer_service_agents
SET role = 'manager', max_concurrent_chats = 10
WHERE admin_id IN (SELECT id FROM admins WHERE username = 'cs_agent');
```

### Q3: 如何临时禁用某个客服账号？

**A:** 修改 is_active 字段：

```sql
-- 禁用管理员账号
UPDATE admins SET is_active = false WHERE username = 'cs_agent';

-- 禁用客服记录
UPDATE customer_service_agents SET is_active = false
WHERE admin_id IN (SELECT id FROM admins WHERE username = 'cs_agent');
```

### Q4: 菜单没有正确显示怎么办？

**A:** 检查以下几点：

1. 确认登录时返回的 role 正确
2. 确认 `admin-frontend/src/config/permissions.ts` 中角色权限配置正确
3. 清除浏览器缓存和 localStorage
4. 重新登录

### Q5: API 返回 403 权限不足怎么办？

**A:** 检查以下几点：

1. 确认 JWT token 中的 role 正确
2. 确认 `backend/src/config/permissions.ts` 中权限矩阵配置正确
3. 确认 API 路由使用了正确的 `requireResource` 中间件
4. 查看后端日志获取详细错误信息

---

## 相关文件索引

### 前端文件
- `admin-frontend/src/config/permissions.ts` - 前端权限配置
- `admin-frontend/src/layouts/MainLayout.tsx` - 菜单配置和过滤逻辑
- `admin-frontend/src/components/PermissionGuard.tsx` - 权限守卫组件
- `admin-frontend/src/hooks/usePermission.ts` - 权限检查 Hook
- `admin-frontend/src/utils/permission.ts` - 权限检查工具函数

### 后端文件
- `backend/src/config/permissions.ts` - 后端权限配置
- `backend/src/middleware/auth.ts` - 认证和权限中间件
- `backend/src/routes/manage/customerService.ts` - 客服管理 API 路由
- `backend/src/routes/manage/chatSessions.ts` - 客服会话 API 路由

### 数据库文件
- `backend/migrations/016_create_webchat_system.sql` - 客服系统数据库迁移

### 测试文件
- `test-rbac-cs.sh` - 客服系统 RBAC 权限测试脚本

---

## 更新日志

**2025-11-14**
- 初始版本
- 完成客服系统 RBAC 权限配置
- 添加 cs_manager 和 cs_agent 两个新角色
- 配置前后端权限系统
- 实现菜单动态过滤
- 创建权限测试脚本
