# RBAC权限管理、操作日志和通知系统 📋

## 🎯 已实现功能

### 1. RBAC权限管理系统 ✅

#### 权限配置 (`src/config/permissions.ts`)

**角色定义**：
- `SUPER_ADMIN` - 超级管理员（所有权限）
- `ADMIN` - 管理员（大部分权限）
- `MANAGER` - 经理（查看和编辑）
- `OPERATOR` - 操作员（查看和创建）
- `VIEWER` - 访客（仅查看）

**权限类型**（25+ 权限）：
```typescript
// 用户管理
USER_VIEW, USER_CREATE, USER_EDIT, USER_DELETE, USER_EXPORT

// 订单管理
ORDER_VIEW, ORDER_CREATE, ORDER_EDIT, ORDER_DELETE, ORDER_EXPORT, ORDER_REFUND

// 算命管理
FORTUNE_VIEW, FORTUNE_CREATE, FORTUNE_EDIT, FORTUNE_DELETE

// 统计分析
STATS_VIEW, STATS_EXPORT

// 系统设置
SETTINGS_VIEW, SETTINGS_EDIT

// 日志管理
LOG_VIEW, LOG_DELETE

// 角色管理
ROLE_VIEW, ROLE_CREATE, ROLE_EDIT, ROLE_DELETE
```

#### 权限工具 (`src/utils/permission.ts`)

```typescript
hasPermission(userRole, permission)       // 检查单个权限
hasAnyPermission(userRole, permissions)   // 检查任意权限
hasAllPermissions(userRole, permissions)  // 检查所有权限
getUserPermissions(userRole)              // 获取用户所有权限
isSuperAdmin(userRole)                    // 是否超管
isAdmin(userRole)                         // 是否管理员
```

#### 权限Hook (`src/hooks/usePermission.ts`)

```typescript
const permission = usePermission()

permission.has(Permission.USER_CREATE)          // 检查权限
permission.hasAny([Permission.USER_VIEW, ...])  // 任意权限
permission.hasAll([Permission.USER_EDIT, ...])  // 所有权限
permission.isSuperAdmin()                       // 是否超管
permission.isAdmin()                            // 是否管理员
```

#### 权限守卫组件 (`src/components/PermissionGuard.tsx`)

**用法示例**：

```tsx
// 单个权限
<PermissionGuard permission={Permission.USER_CREATE}>
  <Button>创建用户</Button>
</PermissionGuard>

// 多个权限（任意一个）
<PermissionGuard permissions={[Permission.USER_EDIT, Permission.USER_DELETE]}>
  <Button>操作</Button>
</PermissionGuard>

// 多个权限（全部）
<PermissionGuard
  permissions={[Permission.USER_EDIT, Permission.USER_DELETE]}
  requireAll={true}
>
  <Button>高级操作</Button>
</PermissionGuard>

// 无权限时不显示（而不是显示提示）
<PermissionGuard permission={Permission.LOG_DELETE} noFallback>
  <Button danger>删除</Button>
</PermissionGuard>

// 自定义无权限提示
<PermissionGuard
  permission={Permission.SETTINGS_EDIT}
  fallback={<div>您没有编辑权限</div>}
>
  <SettingsForm />
</PermissionGuard>
```

### 2. 操作日志系统 ✅

#### 日志工具 (`src/utils/auditLog.ts`)

**日志级别**：
- `INFO` - 信息
- `WARN` - 警告
- `ERROR` - 错误
- `SUCCESS` - 成功

**日志操作类型**（16+ 操作）：
```typescript
// 用户操作
USER_CREATE, USER_UPDATE, USER_DELETE, USER_EXPORT

// 订单操作
ORDER_CREATE, ORDER_UPDATE, ORDER_DELETE, ORDER_REFUND, ORDER_EXPORT

// 算命操作
FORTUNE_CREATE, FORTUNE_UPDATE, FORTUNE_DELETE

// 系统操作
SETTINGS_UPDATE, LOGIN, LOGOUT, PASSWORD_CHANGE
```

**使用方法**：

```typescript
import { createAuditLog, LogAction, LogLevel } from '../utils/auditLog'

// 记录操作
createAuditLog(
  LogAction.USER_CREATE,
  '创建用户：张三',
  { userId: '123', username: '张三' },
  LogLevel.SUCCESS
)

// 获取日志
const logs = getLogsFromStorage()

// 导出日志
exportLogsAsJSON()

// 清空日志
clearLogsFromStorage()
```

**日志结构**：
```typescript
interface AuditLog {
  id: string              // 日志ID
  userId: string          // 操作用户ID
  username: string        // 操作用户名
  action: LogAction       // 操作类型
  level: LogLevel         // 日志级别
  module: string          // 模块名称
  description: string     // 操作描述
  details?: any           // 详细信息
  ip?: string             // IP地址
  userAgent?: string      // 浏览器信息
  timestamp: string       // 时间戳
}
```

#### 日志页面 (`src/pages/AuditLog.tsx`)

**功能**：
- ✅ 查看所有操作日志
- ✅ 按级别筛选（信息/警告/错误/成功）
- ✅ 按模块筛选
- ✅ 刷新日志
- ✅ 导出日志（JSON格式）
- ✅ 清空日志（需要权限）
- ✅ 查看日志详情（展开行）
- ✅ 分页显示

### 3. 实时通知系统 📋

**建议实现方案**（待实现）：

#### 方案一：WebSocket通知

```typescript
// src/services/notification.ts
import io from 'socket.io-client'

class NotificationService {
  private socket: any

  connect() {
    this.socket = io('http://localhost:3000')

    this.socket.on('notification', (data) => {
      // 显示通知
      message.info(data.message)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }
}
```

#### 方案二：轮询通知

```typescript
// src/hooks/useNotifications.ts
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const interval = setInterval(async () => {
      const newNotifications = await fetchNotifications()
      setNotifications(newNotifications)
    }, 30000) // 30秒轮询一次

    return () => clearInterval(interval)
  }, [])

  return notifications
}
```

#### 方案三：Server-Sent Events (SSE)

```typescript
// src/services/sse.ts
export const subscribeToNotifications = (callback: (data: any) => void) => {
  const eventSource = new EventSource('/api/notifications/stream')

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    callback(data)
  }

  return () => eventSource.close()
}
```

## 📝 使用示例

### 示例1：用户管理页面添加权限控制

```tsx
import { usePermission } from '../hooks/usePermission'
import PermissionGuard from '../components/PermissionGuard'
import { Permission } from '../config/permissions'
import { createAuditLog, LogAction, LogLevel } from '../utils/auditLog'

const UserManagement = () => {
  const permission = usePermission()

  const handleCreateUser = (data) => {
    // 业务逻辑
    createUser(data)

    // 记录日志
    createAuditLog(
      LogAction.USER_CREATE,
      `创建用户：${data.username}`,
      data,
      LogLevel.SUCCESS
    )
  }

  const handleDeleteUser = (userId) => {
    // 业务逻辑
    deleteUser(userId)

    // 记录日志
    createAuditLog(
      LogAction.USER_DELETE,
      `删除用户：${userId}`,
      { userId },
      LogLevel.WARN
    )
  }

  return (
    <div>
      <PermissionGuard permission={Permission.USER_CREATE} noFallback>
        <Button onClick={handleCreateUser}>创建用户</Button>
      </PermissionGuard>

      <Table
        columns={[
          ...columns,
          {
            title: '操作',
            render: (record) => (
              <Space>
                {permission.has(Permission.USER_EDIT) && (
                  <Button onClick={() => handleEdit(record)}>编辑</Button>
                )}
                <PermissionGuard permission={Permission.USER_DELETE} noFallback>
                  <Button danger onClick={() => handleDeleteUser(record.id)}>
                    删除
                  </Button>
                </PermissionGuard>
              </Space>
            ),
          },
        ]}
      />
    </div>
  )
}
```

### 示例2：登录时记录日志

```tsx
// src/pages/Login.tsx
import { createAuditLog, LogAction, LogLevel } from '../utils/auditLog'

const Login = () => {
  const onFinish = async (values) => {
    try {
      const response = await login(values)

      if (response.success) {
        // 记录登录成功日志
        createAuditLog(
          LogAction.LOGIN,
          '登录成功',
          { username: values.username },
          LogLevel.SUCCESS
        )

        navigate('/')
      }
    } catch (error) {
      // 记录登录失败日志
      createAuditLog(
        LogAction.LOGIN,
        `登录失败：${error.message}`,
        { username: values.username, error: error.message },
        LogLevel.ERROR
      )
    }
  }
}
```

### 示例3：设置页面权限保护

```tsx
// src/pages/Settings.tsx
import PermissionGuard from '../components/PermissionGuard'
import { Permission } from '../config/permissions'
import { createAuditLog, LogAction, LogLevel } from '../utils/auditLog'

const Settings = () => {
  const handleSaveSettings = (values) => {
    // 保存设置
    saveSettings(values)

    // 记录日志
    createAuditLog(
      LogAction.SETTINGS_UPDATE,
      '更新系统设置',
      values,
      LogLevel.INFO
    )

    message.success('设置已保存')
  }

  return (
    <PermissionGuard permission={Permission.SETTINGS_VIEW}>
      <Card title="系统设置">
        <Form onFinish={handleSaveSettings}>
          {/* 表单字段 */}

          <PermissionGuard permission={Permission.SETTINGS_EDIT}>
            <Button type="primary" htmlType="submit">
              保存设置
            </Button>
          </PermissionGuard>
        </Form>
      </Card>
    </PermissionGuard>
  )
}
```

## 🔧 配置和集成

### 1. 添加日志页面到路由

```tsx
// src/App.tsx
import AuditLog from './pages/AuditLog'

<Route path="audit-log" element={<AuditLog />} />
```

### 2. 添加日志菜单

```tsx
// src/layouts/MainLayout.tsx
const menuItems = [
  // ... 其他菜单
  {
    key: '/audit-log',
    icon: <FileTextOutlined />,
    label: '操作日志'
  },
]
```

### 3. 自动记录所有操作

可以创建一个全局的axios拦截器：

```typescript
// src/services/api.ts
import { createAuditLog, LogAction, LogLevel } from '../utils/auditLog'

api.interceptors.response.use(
  (response) => {
    // 根据请求自动记录日志
    const { method, url } = response.config

    if (method === 'post' && url?.includes('/users')) {
      createAuditLog(
        LogAction.USER_CREATE,
        '创建用户',
        response.data,
        LogLevel.SUCCESS
      )
    }

    return response
  }
)
```

## 📊 角色权限对照表

| 功能 | 超管 | 管理员 | 经理 | 操作员 | 访客 |
|------|------|--------|------|--------|------|
| 查看用户 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 创建用户 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 编辑用户 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 删除用户 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 查看订单 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 创建订单 | ✅ | ✅ | ❌ | ✅ | ❌ |
| 订单退款 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 查看统计 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 导出数据 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 系统设置 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 查看日志 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 删除日志 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 角色管理 | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🚀 快速开始

### 1. 在组件中使用权限

```tsx
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'

const MyComponent = () => {
  const permission = usePermission()

  if (!permission.has(Permission.USER_VIEW)) {
    return <div>无权限</div>
  }

  return <div>有权限的内容</div>
}
```

### 2. 记录操作日志

```tsx
import { createAuditLog, LogAction, LogLevel } from '../utils/auditLog'

// 在任何操作后调用
createAuditLog(
  LogAction.USER_UPDATE,
  '更新用户信息',
  { userId: '123', changes: {...} },
  LogLevel.SUCCESS
)
```

### 3. 查看日志

访问管理后台的"操作日志"页面即可查看所有操作记录。

## 📚 最佳实践

1. **权限检查**
   - 在组件渲染前检查权限
   - 在API调用前检查权限
   - 使用PermissionGuard包裹敏感组件

2. **日志记录**
   - 所有增删改操作都应记录日志
   - 重要查询操作也应记录
   - 包含足够的上下文信息

3. **性能优化**
   - 权限检查使用useMemo缓存
   - 日志批量发送到服务器
   - 本地日志定期清理

---

**创建时间**：2025-11-12
**状态**：✅ RBAC和日志已实现，通知系统待实现
