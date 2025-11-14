# 客服系统RBAC权限配置文档

## 概述

为客服系统实现了基于角色的访问控制(RBAC)，确保不同角色的用户只能看到和访问其权限范围内的功能。

## 新增角色

在原有的6个角色基础上，新增了2个客服专用角色：

### 1. 客服主管 (CS_MANAGER)
- **角色代码**: `cs_manager`
- **中文名称**: 客服主管
- **职责**: 管理客服团队，查看统计数据
- **权限列表**:
  - `CS_WORKBENCH_VIEW` - 查看客服工作台
  - `CS_AGENT_VIEW` - 查看客服管理
  - `CS_AGENT_CREATE` - 创建客服
  - `CS_AGENT_EDIT` - 编辑客服
  - `CS_AGENT_DELETE` - 删除客服
  - `CS_STATISTICS_VIEW` - 查看客服统计

**可见菜单**:
- 客服系统
  - 客服管理 (完整CRUD权限)
  - 客服工作台 (可以接待用户)

### 2. 客服专员 (CS_AGENT)
- **角色代码**: `cs_agent`
- **中文名称**: 客服专员
- **职责**: 接待用户咨询
- **权限列表**:
  - `CS_WORKBENCH_VIEW` - 查看客服工作台

**可见菜单**:
- 客服系统
  - 客服工作台 (只能使用工作台接待用户)

## 新增权限

在 `Permission` 枚举中新增了6个客服相关权限：

```typescript
// 客服系统
CS_WORKBENCH_VIEW = 'cs_workbench:view',      // 查看客服工作台
CS_AGENT_VIEW = 'cs_agent:view',              // 查看客服管理
CS_AGENT_CREATE = 'cs_agent:create',          // 创建客服
CS_AGENT_EDIT = 'cs_agent:edit',              // 编辑客服
CS_AGENT_DELETE = 'cs_agent:delete',          // 删除客服
CS_STATISTICS_VIEW = 'cs_statistics:view',    // 查看客服统计
```

## 所有角色权限对比表

| 角色 | 数据概览 | 运营管理 | 算命管理 | 财务中心 | 营销管理 | 客户服务 | **客服系统** | 系统管理 |
|------|---------|---------|---------|---------|---------|---------|------------|---------|
| 超级管理员 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| 管理员 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ✅ 全部 | ❌ 无角色管理 |
| 经理 | ✅ 查看 | ✅ 查看/编辑 | ✅ 查看/编辑 | ✅ 查看/编辑 | ❌ 无 | ✅ 查看/处理 | ❌ 无 | ❌ 无 |
| 编辑员 | ✅ 查看 | ✅ 查看/编辑 | ✅ 查看/编辑 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 |
| 操作员 | ✅ 查看 | ✅ 查看 | ✅ 查看 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 |
| 访客 | ✅ 查看 | ✅ 查看 | ✅ 查看 | ✅ 查看 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 |
| **客服主管** | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | **✅ 管理+工作台** | ❌ 无 |
| **客服专员** | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | ❌ 无 | **✅ 工作台** | ❌ 无 |

## 菜单可见性控制

菜单系统通过检查用户权限自动过滤：

```typescript
// MainLayout.tsx 中的菜单配置
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
},
```

### 各角色登录后看到的菜单

**超级管理员/管理员登录后**:
- 数据概览
- 运营管理 (用户/订单/归因)
- 算命管理 (记录/分类/服务/模板/运势/文章)
- 财务中心 (统计/财务/支付/退款)
- 营销管理 (优惠券/轮播图/通知)
- 客户服务 (反馈/评价)
- **客服系统 (客服管理/客服工作台)** ← 可见
- 系统管理 (管理员/角色/AI模型/配置/邮件/日志)

**客服主管登录后**:
- **客服系统**
  - **客服管理** ← 可以创建/编辑/删除客服
  - **客服工作台** ← 可以接待用户

**客服专员登录后**:
- **客服系统**
  - **客服工作台** ← 只能使用工作台

## 实现细节

### 1. 权限定义文件
**文件**: `/admin-frontend/src/config/permissions.ts`

### 2. 权限检查Hook
**文件**: `/admin-frontend/src/hooks/usePermission.ts`

使用方法:
```typescript
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'

const MyComponent = () => {
  const checkPermission = usePermission()

  return (
    <>
      {checkPermission.has(Permission.CS_AGENT_VIEW) && (
        <Button>查看客服列表</Button>
      )}
      {checkPermission.has(Permission.CS_AGENT_DELETE) && (
        <Button danger>删除客服</Button>
      )}
    </>
  )
}
```

### 3. 页面级权限守卫
**文件**: `/admin-frontend/src/components/PermissionGuard.tsx`

使用方法:
```typescript
import PermissionGuard from '../components/PermissionGuard'
import { Permission } from '../config/permissions'

const CustomerServiceManagement = () => {
  return (
    <PermissionGuard permission={Permission.CS_AGENT_VIEW}>
      <div>客服管理页面内容</div>
    </PermissionGuard>
  )
}
```

## 数据库配置

需要在 `admins` 表中为客服人员设置对应的角色：

```sql
-- 创建客服主管账号
INSERT INTO admins (username, password, email, role, status)
VALUES (
  'cs_manager_001',
  '$2a$10$...', -- bcrypt加密的密码
  'cs_manager@fortune.com',
  'cs_manager',  -- 客服主管角色
  'active'
);

-- 创建客服专员账号
INSERT INTO admins (username, password, email, role, status)
VALUES (
  'cs_agent_001',
  '$2a$10$...', -- bcrypt加密的密码
  'cs_agent_001@fortune.com',
  'cs_agent',    -- 客服专员角色
  'active'
);
```

## 后端API权限控制

后端API也需要实现相应的权限检查：

**文件**: `/backend/src/middleware/auth.ts`

```typescript
// 检查用户是否有指定权限
const checkPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role
    const permissions = rolePermissions[userRole] || []

    if (permissions.includes(requiredPermission)) {
      next()
    } else {
      res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }
  }
}

// 使用示例
router.post('/cs/agents',
  authenticate,
  checkPermission('cs_agent:create'),  // 需要创建客服权限
  createAgent
)
```

## 安全建议

1. **最小权限原则**: 客服人员只能访问客服相关功能，无法访问财务、用户等敏感数据
2. **角色分离**: 客服专员和客服主管职责明确分离
3. **审计日志**: 所有客服操作应记录到 `audit_logs` 表
4. **定期审查**: 定期检查客服账号的权限和使用情况

## 测试方法

### 1. 创建测试账号
```bash
# 使用后端API创建客服账号
curl -X POST http://localhost:3000/api/manage/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "username": "test_cs_agent",
    "password": "Test123456",
    "email": "test_cs@example.com",
    "role": "cs_agent"
  }'
```

### 2. 登录测试
1. 使用客服专员账号登录管理后台
2. 验证只能看到"客服系统 → 客服工作台"菜单
3. 尝试访问其他页面应该被权限守卫拦截

### 3. 权限验证
- 客服专员登录后尝试访问 `/customer-service` 应该看到"权限不足"提示
- 客服主管登录后可以访问 `/customer-service` 和 `/cs-workbench`
- 超级管理员和管理员可以访问所有菜单

## 总结

通过RBAC权限系统，成功实现了：

✅ **角色隔离**: 客服人员只能访问客服功能，不能查看其他业务数据
✅ **职责分离**: 客服专员和主管权限明确区分
✅ **灵活管理**: 超级管理员和管理员可以管理客服系统
✅ **安全性**: 基于权限的菜单过滤和页面保护
✅ **可扩展**: 易于添加新的客服相关权限和功能

这套权限系统确保了不同角色的用户登录后只能看到和使用其权限范围内的功能，提高了系统的安全性和可维护性。
