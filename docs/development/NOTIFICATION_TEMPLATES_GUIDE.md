# 通知模板使用指南

## 📋 模板总览

系统已内置 **30个** 通知模板，覆盖算命平台的主要业务场景。

## 📂 模板分类

### 1️⃣ 订单相关 (5个)

| 模板名称 | 标题 | 类型 | 优先级 | 使用场景 |
|---------|------|------|--------|---------|
| `payment_success` | 支付成功 | success | 1 | 用户完成订单支付后 |
| `order_completed` | 订单已完成 | success | 0 | 订单处理完成后 |
| `order_cancelled` | 订单已取消 | info | 0 | 用户取消订单后 |
| `refund_success` | 退款已到账 | success | 1 | 退款到账后 |
| `order_status` | 订单状态更新 | info | 0 | 订单状态变更时 |

**示例 - 支付成功通知：**
```javascript
{
  template_name: 'payment_success',
  variables: {
    username: '张三',
    order_id: 'ORD20250317001',
    amount: '88.00'
  }
}
// 渲染结果: "亲爱的张三，您的订单ORD20250317001已支付成功，支付金额88.00元..."
```

### 2️⃣ 测算服务相关 (4个)

| 模板名称 | 标题 | 类型 | 优先级 | 使用场景 |
|---------|------|------|--------|---------|
| `fortune_result_ready` | 测算结果已生成 | success | 2 | 测算结果生成完成后 |
| `fortune_shared` | 好友查看了您的分享 | info | 0 | 好友查看分享链接后 |
| `daily_horoscope` | 今日运势播报 | info | 1 | 每日运势更新时 |
| `fortune_recommendation` | 专属测算推荐 | info | 0 | 推荐相关测算服务 |

**示例 - 测算结果生成：**
```javascript
{
  template_name: 'fortune_result_ready',
  variables: {
    username: '李四',
    fortune_type: '八字精批'
  }
}
// 渲染结果: "✨李四，您订购的【八字精批】测算结果已生成！快来查看您的运势详解吧~"
```

### 3️⃣ 优惠券相关 (3个)

| 模板名称 | 标题 | 类型 | 优先级 | 使用场景 |
|---------|------|------|--------|---------|
| `coupon_received` | 优惠券领取成功 | success | 1 | 用户领取优惠券后 |
| `coupon_expiring` | 优惠券即将过期 | warning | 1 | 优惠券过期前3天提醒 |
| `coupon_used` | 优惠券已使用 | success | 0 | 用户使用优惠券后 |

**示例 - 优惠券过期提醒：**
```javascript
{
  template_name: 'coupon_expiring',
  variables: {
    username: '王五',
    coupon_name: '新用户专享券',
    expire_date: '2025-03-20',
    discount: '50'
  }
}
// 渲染结果: "⏰王五，您的【新用户专享券】优惠券将于2025-03-20过期，价值50元，赶快使用吧！"
```

### 4️⃣ 用户关怀 (4个)

| 模板名称 | 标题 | 类型 | 优先级 | 使用场景 |
|---------|------|------|--------|---------|
| `birthday_blessing` | 生日快乐 | success | 2 | 用户生日当天 |
| `member_upgrade` | 会员升级成功 | success | 1 | 会员等级提升后 |
| `checkin_reward` | 签到奖励已发放 | success | 0 | 连续签到奖励发放 |
| `points_credited` | 积分到账通知 | info | 0 | 积分到账后 |

**示例 - 生日祝福：**
```javascript
{
  template_name: 'birthday_blessing',
  variables: {
    username: '赵六',
    gift_description: '88元优惠券+专属运势解析'
  }
}
// 渲染结果: "🎂赵六，祝您生日快乐！平台为您准备了专属生日礼包：88元优惠券+专属运势解析，快来领取吧！"
```

### 5️⃣ 营销活动 (5个)

| 模板名称 | 标题 | 类型 | 优先级 | 使用场景 |
|---------|------|------|--------|---------|
| `flash_sale` | 限时优惠来袭 | warning | 2 | 限时促销活动 |
| `new_service_launch` | 新服务上线 | success | 1 | 新测算服务上线 |
| `festival_activity` | 节日活动 | info | 2 | 节日营销活动 |
| `exclusive_offer` | 专属优惠 | success | 1 | VIP专属优惠 |
| `promotion` | 优惠活动 | info | 1 | 促销活动 |

**示例 - 限时优惠：**
```javascript
{
  template_name: 'flash_sale',
  variables: {
    username: '孙七',
    activity_name: '3月开运季',
    discount_info: '全场8折，满200减50',
    time_limit: '今日24点前'
  }
}
// 渲染结果: "⚡孙七，【3月开运季】限时特惠！全场8折，满200减50，仅限今日24点前，错过等一年！"
```

### 6️⃣ 系统提醒 (6个)

| 模板名称 | 标题 | 类型 | 优先级 | 使用场景 |
|---------|------|------|--------|---------|
| `balance_low` | 账户余额不足 | warning | 1 | 余额低于阈值时 |
| `recharge_success` | 充值成功 | success | 1 | 充值完成后 |
| `review_reminder` | 邀请评价 | info | 0 | 订单完成后3天 |
| `customer_service_reply` | 客服已回复 | info | 1 | 客服回复消息后 |
| `subscription_reminder` | 测算订阅提醒 | info | 0 | 订阅内容更新时 |
| `favorite_service_update` | 收藏的服务有更新 | info | 0 | 收藏的服务更新时 |

### 7️⃣ 系统管理 (3个)

| 模板名称 | 标题 | 类型 | 优先级 | 使用场景 |
|---------|------|------|--------|---------|
| `system_maintenance` | 系统维护通知 | warning | 2 | 系统维护前 |
| `new_feature` | 新功能上线 | success | 1 | 平台新功能发布 |
| `security_alert` | 安全提醒 | error | 2 | 异常登录等安全事件 |

## 📝 模板变量说明

### 通用变量
- `{username}` - 用户昵称
- `{user_id}` - 用户ID

### 订单相关变量
- `{order_id}` - 订单号
- `{amount}` - 金额
- `{status}` - 订单状态

### 测算相关变量
- `{fortune_type}` - 测算类型（如：八字精批、生肖运势）
- `{fortune_score}` - 运势评分
- `{zodiac_name}` - 生肖/星座名称

### 优惠券相关变量
- `{coupon_name}` - 优惠券名称
- `{min_amount}` - 最低使用金额
- `{expire_date}` - 过期日期
- `{discount}` - 优惠额度
- `{saved_amount}` - 节省金额

### 会员相关变量
- `{level}` - 会员等级
- `{benefits}` - 会员权益
- `{points}` - 积分数量
- `{total_points}` - 总积分

### 活动相关变量
- `{activity_name}` - 活动名称
- `{service_name}` - 服务名称
- `{discount_info}` - 优惠信息
- `{time_limit}` - 时间限制
- `{festival_name}` - 节日名称

## 🔧 使用方法

### 在管理后台创建通知

1. **登录管理后台** → 营销管理 → 通知管理
2. **点击"新建通知"按钮**
3. **选择通知模板**：从30个预设模板中选择
4. **填充变量值**：根据模板需要填写变量
5. **设置发送对象**：全部用户 / 指定用户 / 用户分组
6. **设置发送时间**：立即发送 / 定时发送
7. **预览并发送**

### 通过API发送通知

```javascript
// 示例：发送支付成功通知
POST /api/manage/notifications

{
  "template_name": "payment_success",
  "target_users": ["user_123"],
  "variables": {
    "username": "张三",
    "order_id": "ORD20250317001",
    "amount": "88.00"
  },
  "link_url": "/orders/ORD20250317001"
}
```

## 🎯 最佳实践

### 1. 优先级设置建议
- **2（高优先级）**：紧急通知、重要活动、安全提醒
- **1（中优先级）**：订单状态、优惠券、会员升级
- **0（普通优先级）**：日常提醒、推荐信息

### 2. 发送时机建议
- **支付成功**：支付完成后立即发送
- **测算结果**：结果生成后立即发送
- **优惠券过期**：过期前3天、1天各提醒一次
- **生日祝福**：生日当天00:00发送
- **每日运势**：每天早上8:00发送

### 3. 文案优化建议
- 使用Emoji增加视觉吸引力（✨🎁💫🎉等）
- 保持语气友好、亲切
- 突出核心信息（金额、时间、优惠等）
- 添加行动号召（"快来查看"、"立即体验"等）

### 4. 个性化建议
- 根据用户历史行为推荐测算服务
- 根据用户等级发送专属优惠
- 根据用户生肖/星座发送每日运势

## 📊 监控指标

系统会自动统计以下指标：
- **发送量**：通知发送总数
- **阅读率**：已读 / 总发送
- **点击率**：点击 / 已读
- **转化率**：完成目标行为 / 点击

可在"通知管理"页面查看各模板的效果数据。

## 🔄 模板更新

如需添加新模板或修改现有模板：
1. 超级管理员可直接在管理后台编辑系统模板
2. 开发者可创建新的数据库迁移脚本
3. 建议在测试环境先验证模板效果

---

**最后更新**: 2025-03-17
**模板总数**: 30个
**支持业务**: 订单、测算、优惠券、会员、营销、系统提醒
