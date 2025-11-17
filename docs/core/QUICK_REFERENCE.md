# 管理后台服务模块快速参考

## 📋 21个服务模块总览

| 服务模块 | 主要功能 | API数量 | 常用方法 |
|---------|---------|---------|---------|
| `api.ts` | Axios基础配置 | - | 基础HTTP客户端 |
| `types/index.ts` | 共享类型定义 | - | ApiResponse, PaginatedResponse |
| `userService.ts` | 用户管理 | 8 | getUsers, updateUser, deleteUser |
| `orderService.ts` | 订单管理 | 8 | getOrders, getOrder, updateOrderStatus |
| `statsService.ts` | 统计数据 | 4 | getDashboardStats, getRevenueStats |
| `financialService.ts` | 财务管理 | 2 | getFinancialRecords, exportFinancial |
| `bannerService.ts` | 横幅管理 | 7 | getBanners, createBanner, updateBanner |
| `notificationService.ts` | 通知管理 | 11 | getNotifications, createNotification, sendNotification |
| `articleService.ts` | 文章管理 | 10 | getArticles, createArticle, publishArticle |
| `reviewService.ts` | 评价管理 | 7 | getReviews, replyReview, updateReviewStatus |
| `couponService.ts` | 优惠券管理 | 6 | getCoupons, createCoupon, updateCouponStatus |
| `refundService.ts` | 退款管理 | 6 | getRefunds, reviewRefund, processRefund |
| `feedbackService.ts` | 反馈管理 | 5 | getFeedbacks, updateFeedback, batchUpdateFeedback |
| `adminService.ts` | 管理员管理 | 4 | getAdmins, createAdmin, updateAdmin |
| `emailService.ts` | 邮件模板 | 5 | getEmailTemplates, createTemplate, sendTestEmail |
| `systemService.ts` | 系统配置 | 2 | getSystemConfigs, updateSystemConfig |
| `csService.ts` | 客服系统 | 30+ | getCSAgents, getQuickReplies, getKnowledgeBase |
| `fortuneManageService.ts` | 算命业务管理 | 12+ | getFortuneServices, getFortuneCategories |
| `paymentManageService.ts` | 支付管理 | 14 | getPaymentConfigs, getPaymentMethods, getPaymentTransactions |
| `auditService.ts` | 审计日志 | 3 | getAuditLogs, getAuditStats |
| `authService.ts` | 认证服务 | 4 | login, logout, getCurrentUser |

## 🚀 常用代码模式

### 1. 获取列表数据（带分页）

```typescript
import { getUsers } from '../services/userService'

const fetchData = async () => {
  try {
    setLoading(true)
    const response = await getUsers({
      page: pagination.current,
      limit: pagination.pageSize,
      search: searchText,
      status: filterStatus
    })

    setDataList(response.data.data || [])
    setPagination({
      ...pagination,
      total: response.data.pagination?.total || 0
    })
  } catch (error) {
    message.error('获取数据失败')
  } finally {
    setLoading(false)
  }
}
```

### 2. 创建/更新数据

```typescript
import { createBanner, updateBanner } from '../services/bannerService'

const handleSubmit = async (values: any) => {
  try {
    if (editingId) {
      await updateBanner(editingId, values)
      message.success('更新成功')
    } else {
      await createBanner(values)
      message.success('创建成功')
    }
    fetchData() // 刷新列表
    setModalVisible(false)
  } catch (error) {
    message.error(editingId ? '更新失败' : '创建失败')
  }
}
```

### 3. 删除数据（带确认）

```typescript
import { deleteArticle } from '../services/articleService'
import { Modal } from 'antd'

const handleDelete = (id: number) => {
  Modal.confirm({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除吗？',
    onOk: async () => {
      try {
        await deleteArticle(id)
        message.success('删除成功')
        fetchData()
      } catch (error) {
        message.error('删除失败')
      }
    }
  })
}
```

### 4. 批量操作

```typescript
import { batchUpdateArticleStatus } from '../services/articleService'

const handleBatchUpdate = async () => {
  if (selectedIds.length === 0) {
    message.warning('请先选择要操作的项')
    return
  }

  try {
    await batchUpdateArticleStatus(selectedIds, 'published')
    message.success(`成功更新 ${selectedIds.length} 条记录`)
    setSelectedIds([])
    fetchData()
  } catch (error) {
    message.error('批量操作失败')
  }
}
```

### 5. 状态切换

```typescript
import { togglePaymentMethod } from '../services/paymentManageService'

const handleToggle = async (id: string) => {
  try {
    await togglePaymentMethod(id)
    message.success('状态已切换')
    fetchData()
  } catch (error) {
    message.error('切换失败')
  }
}
```

## 🔍 常见错误及解决方案

### 错误1: 找不到模块导出

```typescript
// ❌ 错误
import { getUser } from '../services/userService'
// Error: Module has no exported member 'getUser'

// ✅ 正确
import { getUsers } from '../services/userService'
```

**解决**: 检查服务文件中的实际导出名称

### 错误2: 类型不匹配

```typescript
// ❌ 错误
setUsers(response.data) // Type 'ApiResponse<User[]>' is not assignable

// ✅ 正确
setUsers(response.data.data || [])
```

**解决**: 使用标准数据访问模式 `response.data.data`

### 错误3: 分页数据访问错误

```typescript
// ❌ 错误
setPagination({ total: response.data.total })

// ✅ 正确
setPagination({ total: response.data.pagination?.total || 0 })
```

**解决**: 分页信息在 `response.data.pagination` 中

### 错误4: 直接使用旧的api调用

```typescript
// ❌ 错误（旧方式）
import api from '../services/apiService'
const response = await api.get('/users')

// ✅ 正确（新方式）
import { getUsers } from '../services/userService'
const response = await getUsers()
```

**解决**: 永远使用模块化服务方法，不要直接调用api

### 错误5: 参数传递错误

```typescript
// ❌ 错误
await replyReview(reviewId, replyContent)

// ✅ 正确
await replyReview(reviewId, { reply_content: replyContent })
```

**解决**: 检查方法签名，某些方法需要对象参数

## 📦 核心类型定义

### ApiResponse

```typescript
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
}
```

**用法**: 单个对象返回
```typescript
const response = await getArticle(id)
const article = response.data.data
```

### PaginatedResponse

```typescript
interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}
```

**用法**: 列表数据返回
```typescript
const response = await getUsers({ page: 1, limit: 10 })
const users = response.data.data || []
const total = response.data.pagination?.total || 0
```

## 🎯 分模块快速查找

### 用户相关
- 用户管理 → `userService.ts`
- 订单管理 → `orderService.ts`
- 评价管理 → `reviewService.ts`
- 反馈管理 → `feedbackService.ts`

### 内容相关
- 文章管理 → `articleService.ts`
- 横幅管理 → `bannerService.ts`
- 通知管理 → `notificationService.ts`

### 业务相关
- 算命服务 → `fortuneManageService.ts`
- 优惠券 → `couponService.ts`
- 退款 → `refundService.ts`
- 支付 → `paymentManageService.ts`

### 客服相关
- 客服系统 → `csService.ts` (包含30+个API)
  - 客服坐席、快捷回复、知识库
  - 会话管理、满意度统计
  - 质检、敏感词、排班等

### 系统相关
- 统计数据 → `statsService.ts`
- 财务管理 → `financialService.ts`
- 管理员 → `adminService.ts`
- 邮件模板 → `emailService.ts`
- 系统配置 → `systemService.ts`
- 审计日志 → `auditService.ts`
- 认证 → `authService.ts`

## ⚡ 性能优化提示

### 1. 避免重复请求

```typescript
// ❌ 不好
useEffect(() => {
  fetchData()
}, []) // 每次组件挂载都请求

// ✅ 更好
const { data, loading } = useSWR('/users', getUsers)
```

### 2. 使用防抖搜索

```typescript
import { debounce } from 'lodash'

const debouncedSearch = debounce((value) => {
  fetchData({ search: value })
}, 500)
```

### 3. 合理设置分页大小

```typescript
// ❌ 一次加载太多
const [pageSize] = useState(100)

// ✅ 合理的分页
const [pageSize] = useState(20)
```

## 🔧 调试技巧

### 1. 查看完整响应

```typescript
const response = await getUsers()
console.log('完整响应:', response)
console.log('数据:', response.data)
console.log('列表:', response.data.data)
console.log('分页:', response.data.pagination)
```

### 2. 错误处理

```typescript
try {
  await updateUser(id, data)
} catch (error: any) {
  console.error('错误详情:', error.response?.data)
  message.error(error.response?.data?.message || '操作失败')
}
```

### 3. 网络请求监控

打开浏览器开发者工具 → Network 标签，查看：
- 请求URL是否正确
- 请求参数是否正确
- 响应状态码
- 响应数据格式

## 📚 相关文档

- **详细使用指南**: `SERVICE_MODULES_GUIDE.md`
- **架构统一报告**: `/tmp/ARCHITECTURE_UNIFICATION_COMPLETE.md`
- **迁移完成报告**: `/tmp/FINAL_MIGRATION_REPORT.md`

---

**最后更新**: 2025年
**版本**: 1.0
**状态**: ✅ 生产就绪
