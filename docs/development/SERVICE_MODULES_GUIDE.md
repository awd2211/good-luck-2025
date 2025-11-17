# 管理后台服务模块使用指南

## 📚 概述

本指南介绍管理后台的 21 个模块化服务的使用方法，帮助开发者快速上手。

---

## 🏗️ 架构模式

### 标准导入方式

```typescript
// ✅ 推荐：导入具体方法和类型
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService'
import type { User } from '../services/userService'

// ❌ 避免：直接使用 api
import api from '../services/api'  // 不要这样做！
```

### 标准调用方式

```typescript
const MyComponent = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  const loadUsers = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const response = await getUsers({ page, limit: pageSize })
      setUsers(response.data.data || [])
      setPagination({
        current: page,
        pageSize,
        total: response.data.pagination?.total || 0
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])
}
```

---

## 📦 服务模块列表

### 1. 用户与订单模块

#### userService.ts - 用户管理
```typescript
import {
  getUsers,           // 获取用户列表（分页）
  getUser,            // 获取单个用户
  createUser,         // 创建用户
  updateUser,         // 更新用户
  deleteUser,         // 删除用户
  getUserStats,       // 获取用户统计
  updateUserStatus,   // 更新用户状态
  exportUsers         // 导出用户数据
} from '../services/userService'
import type { User, UserStats } from '../services/userService'

// 使用示例
const response = await getUsers({
  page: 1,
  limit: 20,
  search: '关键词',
  status: 'active'
})
```

#### orderService.ts - 订单管理
```typescript
import {
  getOrders,          // 获取订单列表
  getOrder,           // 获取订单详情
  updateOrderStatus,  // 更新订单状态
  deleteOrder,        // 删除订单
  getOrderStats,      // 获取订单统计
  exportOrders        // 导出订单
} from '../services/orderService'
import type { Order, OrderStats } from '../services/orderService'

// 使用示例
const response = await getOrders({
  page: 1,
  limit: 20,
  status: 'completed'
})
```

#### statsService.ts - 统计数据
```typescript
import {
  getDashboardStats,  // 仪表盘统计
  getRevenueStats,    // 收入统计
  getUserGrowth,      // 用户增长
  getOrderTrends      // 订单趋势
} from '../services/statsService'
import type { DashboardStats, RevenueTrend } from '../services/statsService'

// 使用示例
const stats = await getDashboardStats()
```

---

### 2. 财务与支付模块

#### paymentManageService.ts - 支付管理 ⭐ 新增
```typescript
import {
  // 支付配置 (5个)
  getPaymentConfigs,
  createPaymentConfig,
  updatePaymentConfig,
  deletePaymentConfig,
  testPaymentConfig,

  // 支付方式 (6个)
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethod,
  getPaymentMethodStats,

  // 支付交易 (3个)
  getPaymentTransactions,
  getPaymentTransaction,
  getPaymentTransactionStats
} from '../services/paymentManageService'

import type {
  PaymentConfig,
  PaymentMethod,
  PaymentMethodStats,
  PaymentTransaction,
  TransactionStats
} from '../services/paymentManageService'

// 使用示例 - 支付配置
const configs = await getPaymentConfigs({
  provider: 'paypal',
  is_production: false
})

// 使用示例 - 支付方式
const methods = await getPaymentMethods()

// 使用示例 - 交易记录
const transactions = await getPaymentTransactions({
  page: 1,
  limit: 20,
  status: 'completed',
  provider: 'stripe'
})
```

#### financialService.ts - 财务管理
```typescript
import {
  getFinancialRecords,  // 财务记录
  getFinancialStats     // 财务统计
} from '../services/financialService'

// 使用示例
const records = await getFinancialRecords({
  page: 1,
  limit: 20
})
```

#### refundService.ts - 退款管理
```typescript
import {
  getRefunds,         // 获取退款列表
  getRefund,          // 获取退款详情
  approveRefund,      // 批准退款
  rejectRefund,       // 拒绝退款
  processRefund,      // 处理退款
  reviewRefund        // 审核退款 ⭐ 新增
} from '../services/refundService'
import type { Refund } from '../services/refundService'

// 使用示例 - 审核退款
await reviewRefund(refundId, {
  action: 'approve',
  review_comment: '审核通过',
  refund_method: 'original'
})
```

---

### 3. 内容管理模块

#### bannerService.ts - 横幅管理
```typescript
import {
  getBanners,             // 获取横幅列表
  getBanner,              // 获取横幅详情
  createBanner,           // 创建横幅
  updateBanner,           // 更新横幅
  deleteBanner,           // 删除横幅
  updateBannerStatus,     // 更新状态
  updateBannerPosition    // 更新位置
} from '../services/bannerService'

// 使用示例
const banners = await getBanners({ page: 1, limit: 20 })
await updateBannerPosition(bannerId, 'up')
```

#### articleService.ts - 文章管理
```typescript
import {
  getArticles,            // 获取文章列表
  getArticle,             // 获取文章详情
  createArticle,          // 创建文章
  updateArticle,          // 更新文章
  deleteArticle,          // 删除文章
  getArticleCategories,   // 获取分类
  getArticleTags,         // 获取标签
  batchUpdateArticleStatus // 批量更新状态
} from '../services/articleService'
import type { Article } from '../services/articleService'

// 使用示例
const articles = await getArticles({
  page: 1,
  limit: 20,
  category: 'tech',
  status: 'published'
})
```

#### notificationService.ts - 通知管理
```typescript
import {
  getNotifications,           // 获取通知列表
  getNotification,            // 获取通知详情
  createNotification,         // 创建通知
  updateNotification,         // 更新通知
  deleteNotification,         // 删除通知
  batchUpdateNotificationStatus, // 批量更新状态
  getNotificationTemplates,   // 获取模板列表
  // ...更多方法
} from '../services/notificationService'

// 使用示例
const notifications = await getNotifications({ page: 1, limit: 20 })
```

---

### 4. 业务管理模块

#### reviewService.ts - 评价管理
```typescript
import {
  getReviews,           // 获取评价列表
  getReview,            // 获取评价详情
  updateReview,         // 更新评价
  deleteReview,         // 删除评价
  approveReview,        // 批准评价
  rejectReview,         // 拒绝评价
  replyReview,          // 回复评价 ⭐ 已修复
  updateReviewStatus    // 更新状态 ⭐ 新增
} from '../services/reviewService'
import type { Review } from '../services/reviewService'

// 使用示例 - 回复评价
await replyReview(reviewId, {
  reply_content: '感谢您的反馈！'
})

// 使用示例 - 更新状态
await updateReviewStatus(reviewId, 'published')
```

#### couponService.ts - 优惠券管理
```typescript
import {
  getCoupons,           // 获取优惠券列表
  getCoupon,            // 获取优惠券详情
  createCoupon,         // 创建优惠券
  updateCoupon,         // 更新优惠券
  deleteCoupon,         // 删除优惠券
  generateCouponCodes,  // 生成优惠券码
  updateCouponStatus    // 更新状态 ⭐ 新增
} from '../services/couponService'
import type { Coupon } from '../services/couponService'

// 使用示例
await updateCouponStatus(couponId, 'active')
```

#### feedbackService.ts - 反馈管理
```typescript
import {
  getFeedbacks,       // 获取反馈列表
  getFeedback,        // 获取反馈详情
  updateFeedback,     // 更新反馈
  replyFeedback,      // 回复反馈
  closeFeedback       // 关闭反馈
} from '../services/feedbackService'
import type { Feedback } from '../services/feedbackService'

// 使用示例
await updateFeedback(feedbackId, {
  status: 'resolved',
  handler_comment: '问题已解决'
})
```

---

### 5. 客服系统模块

#### csService.ts - 客服系统
```typescript
import {
  // 客服会话
  getCSSessions,
  getCSSession,

  // 客服统计
  getCSStats,

  // 快捷回复
  getQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,

  // 客户标签
  getCustomerTags,
  createCustomerTag,
  updateCustomerTag,
  deleteCustomerTag,

  // AI配置
  getAIBotConfigs,
  updateAIBotConfig,

  // ...更多方法 (30+个)
} from '../services/csService'

// 使用示例
const sessions = await getCSSessions({ page: 1, limit: 20 })
const stats = await getCSStats({
  startDate: '2025-01-01',
  endDate: '2025-01-31'
})
```

---

### 6. 系统管理模块

#### adminService.ts - 管理员管理
```typescript
import {
  getAdmins,          // 获取管理员列表
  getAdmin,           // 获取管理员详情
  createAdmin,        // 创建管理员
  updateAdmin,        // 更新管理员
  deleteAdmin         // 删除管理员
} from '../services/adminService'

// 使用示例
const admins = await getAdmins({ page: 1, limit: 20 })
```

#### systemService.ts - 系统配置
```typescript
import {
  getSystemConfigs,   // 获取系统配置
  updateSystemConfig  // 更新系统配置
} from '../services/systemService'

// 使用示例
const configs = await getSystemConfigs()
```

#### auditService.ts - 审计日志
```typescript
import {
  getAuditLogs        // 获取审计日志
} from '../services/auditService'

// 使用示例
const logs = await getAuditLogs({
  page: 1,
  limit: 20,
  action: 'update'
})
```

---

## 🎯 最佳实践

### 1. 错误处理

```typescript
try {
  const response = await getUsers(params)
  setUsers(response.data.data || [])
} catch (error: any) {
  // 优先使用服务器返回的错误信息
  const errorMessage = error.response?.data?.message || '操作失败'
  message.error(errorMessage)

  // 可选：记录错误日志
  console.error('加载用户失败:', error)
}
```

### 2. 加载状态管理

```typescript
const [loading, setLoading] = useState(false)

const loadData = async () => {
  setLoading(true)
  try {
    const response = await getData()
    // 处理数据
  } catch (error) {
    // 错误处理
  } finally {
    setLoading(false)  // 确保总是关闭加载状态
  }
}
```

### 3. 分页数据处理

```typescript
const [pagination, setPagination] = useState({
  current: 1,
  pageSize: 20,
  total: 0
})

const loadData = async (page = 1, pageSize = 20) => {
  const response = await getData({ page, limit: pageSize })

  // 设置数据
  setData(response.data.data || [])

  // 更新分页信息
  setPagination({
    current: page,
    pageSize,
    total: response.data.pagination?.total || 0
  })
}
```

### 4. 类型安全

```typescript
// ✅ 使用服务提供的类型
import type { User } from '../services/userService'

const [users, setUsers] = useState<User[]>([])

// ✅ 创建/更新时使用 Partial
const createUser = async (values: Partial<User>) => {
  await createUser(values)
}

// ❌ 避免使用 any
const [users, setUsers] = useState<any[]>([])  // 不要这样做
```

### 5. 表单提交

```typescript
const handleSubmit = async () => {
  try {
    const values = await form.validateFields()

    if (editingItem) {
      // 更新
      await updateItem(editingItem.id, values)
      message.success('更新成功')
    } else {
      // 创建
      await createItem(values)
      message.success('创建成功')
    }

    setModalVisible(false)
    loadData()  // 刷新列表
  } catch (error: any) {
    message.error(error.response?.data?.message || '操作失败')
  }
}
```

---

## 🚫 常见错误

### ❌ 错误 1: 直接使用 api
```typescript
// ❌ 不要这样做
import api from '../services/api'
const response = await api.get('/users')
```

### ✅ 正确做法
```typescript
// ✅ 使用服务方法
import { getUsers } from '../services/userService'
const response = await getUsers()
```

---

### ❌ 错误 2: 不正确的数据访问
```typescript
// ❌ 不一致的访问方式
setUsers(response.data)  // 可能出错
setUsers(response.data.list)  // 旧的访问方式
```

### ✅ 正确做法
```typescript
// ✅ 统一的访问方式
setUsers(response.data.data || [])
setPagination({ total: response.data.pagination?.total || 0 })
```

---

### ❌ 错误 3: 缺少类型定义
```typescript
// ❌ 使用 any 类型
const [users, setUsers] = useState<any[]>([])
```

### ✅ 正确做法
```typescript
// ✅ 使用具体类型
import type { User } from '../services/userService'
const [users, setUsers] = useState<User[]>([])
```

---

### ❌ 错误 4: 忘记处理错误
```typescript
// ❌ 没有错误处理
const loadData = async () => {
  const response = await getData()
  setData(response.data.data)
}
```

### ✅ 正确做法
```typescript
// ✅ 完整的错误处理
const loadData = async () => {
  setLoading(true)
  try {
    const response = await getData()
    setData(response.data.data || [])
  } catch (error: any) {
    message.error(error.response?.data?.message || '加载失败')
  } finally {
    setLoading(false)
  }
}
```

---

## 📝 响应格式

### 单个数据响应
```typescript
{
  success: true,
  message: "操作成功",
  data: {
    id: 1,
    name: "张三",
    // ...更多字段
  }
}
```

### 分页数据响应
```typescript
{
  success: true,
  data: [
    { id: 1, name: "张三" },
    { id: 2, name: "李四" }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    total_pages: 5
  }
}
```

### 错误响应
```typescript
{
  success: false,
  message: "操作失败，用户不存在",
  error: {
    code: "USER_NOT_FOUND",
    details: {}
  }
}
```

---

## 🔗 相关文档

- [完整迁移报告](/tmp/ARCHITECTURE_UNIFICATION_COMPLETE.md)
- [TypeScript 类型定义](./src/types/index.ts)
- [Axios 配置](./src/services/api.ts)

---

## 📞 获取帮助

如果遇到问题：
1. 检查本指南的最佳实践部分
2. 查看相应服务文件的类型定义
3. 参考已迁移页面的实现（如 UserManagement.tsx）
4. 检查 TypeScript 编译错误提示

---

**最后更新**: 2025年
**版本**: 1.0
**状态**: ✅ 稳定
