# 支付系统完整设计文档

## 📅 创建日期
2025-11-13

## 🎯 系统目标
实现完整的PayPal和Stripe支付集成,支持:
- 管理后台配置支付接口
- 用户选择支付方式
- 支付状态跟踪
- 退款处理
- 支付记录查询

---

## 📊 数据库设计

### ✅ 已完成

#### 1. payment_configs - 支付配置表
```sql
- id: 主键
- provider: 支付提供商 (paypal/stripe)
- config_key: 配置键 (api_key, secret_key等)
- config_value: 配置值 (需加密)
- is_production: 是否生产环境
- is_enabled: 是否启用
- description: 配置说明
```

**默认数据**:
- PayPal (沙盒): client_id, client_secret, mode=sandbox
- PayPal (生产): client_id, client_secret, mode=live
- Stripe (测试): publishable_key, secret_key, webhook_secret
- Stripe (生产): publishable_key, secret_key, webhook_secret

#### 2. payment_methods - 支付方式表
```sql
- id: 主键
- method_code: 方式代码 (paypal/stripe/balance)
- method_name: 显示名称
- provider: 提供商
- icon: 图标
- is_enabled: 是否启用
- sort_order: 排序
- min_amount / max_amount: 金额限制
- fee_type / fee_value: 手续费配置
```

**默认数据**:
- balance: 余额支付 (无手续费)
- paypal: PayPal (2.9%手续费)
- stripe: Stripe (2.9%手续费)

#### 3. payment_transactions - 支付交易记录表
```sql
- id: 主键
- transaction_id: 内部交易ID (唯一)
- order_id: 关联订单
- user_id: 用户ID
- payment_method: 支付方式
- provider: 提供商
- amount / currency / fee_amount: 金额信息
- status: 状态 (pending/completed/failed/refunded)
- provider_transaction_id: 第三方交易ID
- provider_response: 第三方响应 (JSON)
- callback_data: 回调数据 (JSON)
- ip_address / user_agent: 设备信息
- paid_at / refunded_at: 时间戳
```

#### 4. refunds - 退款表 (已存在,已扩展)
```sql
- 已有字段: refund_no, order_id, amount, status等
- 新增字段: payment_transaction_id (关联支付记录)
```

---

## 🔧 后端API设计

### 1. 支付配置管理 (`/api/manage/payment-configs`)

#### GET /api/manage/payment-configs
获取所有支付配置
- **权限**: Permission.SYSTEM_CONFIG_VIEW
- **查询参数**: provider, is_production
- **返回**: 配置列表 (敏感字段脱敏)

#### GET /api/manage/payment-configs/:id
获取单个配置详情
- **权限**: Permission.SYSTEM_CONFIG_VIEW

#### POST /api/manage/payment-configs
创建新配置
- **权限**: Permission.SYSTEM_CONFIG_EDIT
- **请求体**:
  ```json
  {
    "provider": "paypal",
    "config_key": "client_id",
    "config_value": "xxx",
    "is_production": false,
    "is_enabled": true
  }
  ```

#### PUT /api/manage/payment-configs/:id
更新配置
- **权限**: Permission.SYSTEM_CONFIG_EDIT
- **安全**: 敏感字段需加密存储

#### DELETE /api/manage/payment-configs/:id
删除配置
- **权限**: Permission.SYSTEM_CONFIG_DELETE

---

### 2. 支付方式管理 (`/api/manage/payment-methods`)

#### GET /api/manage/payment-methods
获取所有支付方式
- **权限**: Permission.SYSTEM_CONFIG_VIEW
- **查询参数**: is_enabled, provider

#### PUT /api/manage/payment-methods/:id
更新支付方式 (启用/禁用、修改手续费等)
- **权限**: Permission.SYSTEM_CONFIG_EDIT

#### PUT /api/manage/payment-methods/:id/toggle
快速启用/禁用支付方式
- **权限**: Permission.SYSTEM_CONFIG_EDIT

---

### 3. 用户支付API (`/api/payments`)

#### GET /api/payments/methods
获取可用支付方式
- **权限**: 用户登录
- **返回**: 启用的支付方式列表 (根据金额过滤)
- **查询参数**: amount (用于过滤支持该金额的支付方式)

#### POST /api/payments/create
创建支付订单
- **权限**: 用户登录
- **请求体**:
  ```json
  {
    "order_id": "ORD-xxx",
    "payment_method": "paypal",
    "amount": 99.00,
    "currency": "USD",
    "return_url": "https://xxx.com/payment/success",
    "cancel_url": "https://xxx.com/payment/cancel"
  }
  ```
- **返回**:
  ```json
  {
    "transaction_id": "TXN-xxx",
    "payment_url": "https://paypal.com/...", // 需要跳转的支付URL
    "status": "pending"
  }
  ```

#### GET /api/payments/:transaction_id/status
查询支付状态
- **权限**: 用户登录 (仅查询自己的)
- **返回**: 交易状态和详情

#### GET /api/payments/history
获取支付历史
- **权限**: 用户登录
- **查询参数**: page, limit, status, start_date, end_date

---

### 4. 支付回调处理

#### POST /api/payments/callback/paypal
PayPal支付回调 (IPN/Webhook)
- **权限**: 公开 (验证PayPal签名)
- **处理逻辑**:
  1. 验证回调签名
  2. 更新交易状态
  3. 更新订单状态
  4. 记录回调数据

#### POST /api/payments/callback/stripe
Stripe Webhook回调
- **权限**: 公开 (验证Stripe签名)
- **处理逻辑**:
  1. 验证Webhook签名
  2. 处理不同事件 (payment_intent.succeeded等)
  3. 更新交易和订单状态

#### GET /api/payments/return/success
支付成功返回页面
- **权限**: 公开
- **查询参数**: transaction_id
- **返回**: 重定向到前端支付结果页

#### GET /api/payments/return/cancel
支付取消返回页面
- **权限**: 公开
- **返回**: 重定向到前端取消页面

---

### 5. 管理后台 - 支付记录查询 (`/api/manage/payments`)

#### GET /api/manage/payments
获取所有支付记录
- **权限**: Permission.FINANCIAL_VIEW
- **查询参数**:
  - page, limit
  - status (pending/completed/failed)
  - provider (paypal/stripe/balance)
  - user_id
  - order_id
  - start_date, end_date
  - min_amount, max_amount

#### GET /api/manage/payments/:id
获取单笔支付详情
- **权限**: Permission.FINANCIAL_VIEW
- **返回**: 完整交易信息 (包括provider_response)

#### GET /api/manage/payments/statistics
获取支付统计数据
- **权限**: Permission.STATS_VIEW
- **返回**:
  ```json
  {
    "total_transactions": 1234,
    "total_amount": 123456.78,
    "by_provider": {
      "paypal": { "count": 500, "amount": 50000 },
      "stripe": { "count": 600, "amount": 60000 },
      "balance": { "count": 134, "amount": 13456 }
    },
    "by_status": {
      "completed": 1100,
      "pending": 34,
      "failed": 100
    }
  }
  ```

---

### 6. 退款管理API (`/api/manage/refunds`)

#### POST /api/manage/refunds
创建退款申请
- **权限**: Permission.REFUND_CREATE
- **请求体**:
  ```json
  {
    "payment_transaction_id": 123,
    "order_id": "ORD-xxx",
    "amount": 99.00, // 退款金额 (可部分退款)
    "reason": "用户申请退款",
    "description": "详细说明"
  }
  ```

#### PUT /api/manage/refunds/:id/process
处理退款 (调用PayPal/Stripe API)
- **权限**: Permission.REFUND_APPROVE
- **请求体**:
  ```json
  {
    "action": "approve", // approve/reject
    "comment": "审核意见"
  }
  ```
- **处理逻辑**:
  1. 如果approve,调用对应provider的退款API
  2. 更新退款状态
  3. 更新支付记录状态为refunded
  4. 更新订单状态
  5. 如果是余额支付,直接退回余额

---

## 🎨 前端页面设计

### 管理后台页面

#### 1. 支付配置页面 (`/admin/payment-configs`)
**功能**:
- 查看PayPal和Stripe配置
- 编辑API密钥
- 切换沙盒/生产环境
- 启用/禁用支付方式

**组件**:
- 配置表格 (按provider分组)
- 编辑弹窗 (敏感字段显示为 *** )
- 环境切换 (开发/生产)
- 测试连接按钮

#### 2. 支付方式管理页面 (`/admin/payment-methods`)
**功能**:
- 查看所有支付方式
- 启用/禁用开关
- 设置手续费
- 调整排序

**组件**:
- 方式列表 (卡片或表格)
- 快速开关
- 手续费配置表单

#### 3. 支付记录页面 (`/admin/payment-records`)
**功能**:
- 查看所有支付记录
- 筛选 (状态/方式/日期)
- 查看详情 (第三方响应)
- 导出报表

**组件**:
- 数据表格
- 高级筛选器
- 详情抽屉
- 统计卡片 (总金额、成功率等)

---

### 用户前端页面

#### 1. 支付方式选择组件 (`PaymentMethodSelector`)
**位置**: 订单确认页面
**功能**:
- 显示可用支付方式 (余额/PayPal/Stripe)
- 显示余额不足提示
- 显示手续费说明
- 选择后继续支付

**UI设计**:
```
┌─────────────────────────────────────┐
│ 选择支付方式                         │
├─────────────────────────────────────┤
│ ⭕ 余额支付 (余额: ¥100.00)          │
│    无手续费,支付快捷                 │
├─────────────────────────────────────┤
│ ⚪ PayPal                            │
│    安全可靠,支持多币种               │
│    手续费: 2.9%                      │
├─────────────────────────────────────┤
│ ⚪ Stripe (信用卡)                   │
│    Visa, MasterCard, AMEX           │
│    手续费: 2.9%                      │
└─────────────────────────────────────┘
```

#### 2. 支付处理页面 (`/payment/process`)
**功能**:
- 显示支付金额
- 跳转到PayPal/Stripe支付页面
- 显示加载状态
- 处理余额支付

#### 3. 支付结果页面 (`/payment/result`)
**功能**:
- 显示支付成功/失败
- 显示交易详情
- 返回订单或继续购物

**URL参数**:
- `?transaction_id=xxx&status=success`
- `?transaction_id=xxx&status=cancel`
- `?transaction_id=xxx&status=error&message=xxx`

#### 4. 支付历史页面 (`/user/payments`)
**功能**:
- 查看个人支付记录
- 筛选和搜索
- 查看支付详情

---

## 🔌 第三方SDK集成

### PayPal SDK
```bash
npm install @paypal/checkout-server-sdk
```

**初始化**:
```typescript
import paypal from '@paypal/checkout-server-sdk'

const environment = config.is_production
  ? new paypal.core.LiveEnvironment(config.client_id, config.client_secret)
  : new paypal.core.SandboxEnvironment(config.client_id, config.client_secret)

const client = new paypal.core.PayPalHttpClient(environment)
```

**创建订单**:
```typescript
const request = new paypal.orders.OrdersCreateRequest()
request.requestBody({
  intent: 'CAPTURE',
  purchase_units: [{
    amount: {
      currency_code: 'USD',
      value: '100.00'
    }
  }]
})

const response = await client.execute(request)
const approvalUrl = response.result.links.find(link => link.rel === 'approve').href
```

---

### Stripe SDK
```bash
npm install stripe
```

**初始化**:
```typescript
import Stripe from 'stripe'

const stripe = new Stripe(config.secret_key, {
  apiVersion: '2023-10-16'
})
```

**创建支付意图**:
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // 单位:分
  currency: 'usd',
  metadata: {
    order_id: 'ORD-xxx',
    user_id: 'user-xxx'
  }
})
```

**前端集成** (需在前端引入Stripe.js):
```typescript
import { loadStripe } from '@stripe/stripe-js'

const stripe = await loadStripe(publishable_key)
const { error } = await stripe.confirmCardPayment(client_secret)
```

---

## 🔒 安全考虑

### 1. API密钥安全
- ✅ 配置值加密存储
- ✅ 管理后台显示时脱敏 (显示为 ***)
- ✅ 使用环境变量或加密配置
- ✅ 仅SYSTEM_CONFIG权限可查看/编辑

### 2. 支付回调验证
- ✅ PayPal: 验证IPN消息签名
- ✅ Stripe: 验证Webhook签名
- ✅ 幂等性处理 (防止重复回调)
- ✅ 记录所有回调数据

### 3. 金额安全
- ✅ 服务端验证金额 (不信任前端)
- ✅ 使用DECIMAL类型 (避免浮点精度问题)
- ✅ 检查订单金额与支付金额是否一致

### 4. 用户验证
- ✅ 支付时验证订单归属
- ✅ 查询时仅返回用户自己的记录
- ✅ 防止订单号暴力枚举

---

## 📦 NPM依赖

```json
{
  "dependencies": {
    "@paypal/checkout-server-sdk": "^1.0.3",
    "stripe": "^14.0.0"
  }
}
```

---

## 🧪 测试账号

### PayPal沙盒
1. 访问: https://developer.paypal.com/dashboard/
2. 创建沙盒应用获取Client ID和Secret
3. 创建测试买家和卖家账号

### Stripe测试
1. 访问: https://dashboard.stripe.com/test/apikeys
2. 获取Publishable Key和Secret Key
3. 使用测试卡号: `4242 4242 4242 4242`

---

## 📝 实施步骤

### 阶段1: 基础框架 ✅
- [x] 创建数据库表
- [x] 初始化默认数据

### 阶段2: 管理后台API (2-3小时)
- [ ] 支付配置CRUD API
- [ ] 支付方式管理API
- [ ] 支付记录查询API
- [ ] 统计数据API

### 阶段3: 支付接口集成 (4-6小时)
- [ ] 安装PayPal SDK
- [ ] 安装Stripe SDK
- [ ] 实现PayPal支付创建和回调
- [ ] 实现Stripe支付创建和回调
- [ ] 实现余额支付
- [ ] 统一支付接口封装

### 阶段4: 退款功能 (2-3小时)
- [ ] PayPal退款API
- [ ] Stripe退款API
- [ ] 余额退款
- [ ] 退款审核流程

### 阶段5: 管理后台前端 (4-5小时)
- [ ] 支付配置页面
- [ ] 支付方式管理页面
- [ ] 支付记录查询页面
- [ ] 统计图表

### 阶段6: 用户前端 (3-4小时)
- [ ] 支付方式选择组件
- [ ] 支付处理页面
- [ ] 支付结果页面
- [ ] 支付历史页面

### 阶段7: 测试和优化 (2-3小时)
- [ ] 单元测试
- [ ] 集成测试
- [ ] 安全测试
- [ ] 性能优化

**总计预估时间: 20-30小时**

---

## 🎯 下一步行动

由于这是一个庞大的系统,建议采用以下策略之一:

### 选项A: 完整实现 (推荐)
逐步实现所有功能,按阶段完成,每个阶段都可测试验证。

### 选项B: MVP先行
先实现核心功能:
1. 基础支付配置API
2. 一个支付方式集成 (建议Stripe,更易集成)
3. 简单的管理页面
4. 用户支付流程

后续再扩展其他功能。

### 选项C: 分模块渐进
每次完成一个完整模块:
1. 第一周: 配置管理 + 支付方式管理
2. 第二周: PayPal集成
3. 第三周: Stripe集成
4. 第四周: 退款和前端页面

---

**请告诉我你希望采用哪种方案,我将立即开始实施!** 🚀
