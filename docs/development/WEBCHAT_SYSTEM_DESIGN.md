# WebChat客服系统设计方案
## 2025年1月14日

## 一、需求分析

### 核心需求
1. **用户端功能**:
   - C端用户可以在网站发起在线咨询
   - 实时消息发送和接收
   - 查看历史聊天记录
   - 评价客服服务

2. **客服端功能**:
   - 客服人员接待用户咨询
   - 实时消息收发
   - 查看用户信息和历史
   - 快捷回复模板

3. **管理端功能**:
   - 管理员分配客服人员
   - 客服经理管理客服团队
   - 查看客服工作统计
   - 设置分配规则

### 角色体系
- **Super Admin (超级管理员)**: 系统最高权限,管理所有
- **Customer Service Manager (客服经理)**: 管理客服团队,查看统计,分配客服
- **Customer Service (客服)**: 接待用户咨询
- **User (C端用户)**: 发起咨询

---

## 二、数据库表设计

### 2.1 客服人员表 (customer_service_agents)

```sql
CREATE TABLE customer_service_agents (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(50) NOT NULL REFERENCES admins(id) ON DELETE CASCADE, -- 关联到admins表
    display_name VARCHAR(100) NOT NULL, -- 客服显示名称
    avatar_url TEXT, -- 客服头像URL
    role VARCHAR(20) NOT NULL DEFAULT 'agent', -- 'manager'(经理) | 'agent'(普通客服)
    status VARCHAR(20) NOT NULL DEFAULT 'offline', -- 'online'(在线) | 'busy'(忙碌) | 'offline'(离线)
    max_concurrent_chats INTEGER DEFAULT 5, -- 最大同时接待数量
    current_chat_count INTEGER DEFAULT 0, -- 当前接待数量
    specialty_tags TEXT[], -- 专长标签 ['技术支持', '售后', '销售']
    manager_id INTEGER REFERENCES customer_service_agents(id), -- 所属经理(NULL表示是经理)
    is_active BOOLEAN DEFAULT true,
    last_online_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(admin_id)
);

CREATE INDEX idx_cs_agents_status ON customer_service_agents(status);
CREATE INDEX idx_cs_agents_manager ON customer_service_agents(manager_id);
```

### 2.2 聊天会话表 (chat_sessions)

```sql
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE, -- C端用户
    agent_id INTEGER REFERENCES customer_service_agents(id), -- 分配的客服
    session_key VARCHAR(100) UNIQUE NOT NULL, -- 会话唯一标识
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending'(等待) | 'active'(进行中) | 'closed'(已结束) | 'transferred'(已转接)
    channel VARCHAR(20) DEFAULT 'web', -- 'web' | 'mobile' | 'app'
    priority INTEGER DEFAULT 0, -- 优先级 (VIP用户可以设置更高)
    queued_at TIMESTAMP, -- 进入队列时间
    assigned_at TIMESTAMP, -- 分配客服时间
    started_at TIMESTAMP, -- 开始对话时间
    closed_at TIMESTAMP, -- 结束时间
    close_reason VARCHAR(50), -- 'user_left' | 'agent_closed' | 'timeout' | 'resolved'
    user_satisfaction_rating INTEGER, -- 用户评分 1-5
    user_feedback TEXT, -- 用户反馈
    tags TEXT[], -- 会话标签
    metadata JSONB, -- 扩展元数据(浏览器信息、来源页面等)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_agent ON chat_sessions(agent_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_queued ON chat_sessions(queued_at);
```

### 2.3 聊天消息表 (chat_messages)

```sql
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'user' | 'agent' | 'system'
    sender_id VARCHAR(50), -- user_id 或 agent_id
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text' | 'image' | 'file' | 'link' | 'quick_reply'
    attachments JSONB, -- 附件信息 [{url, name, size, type}]
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    metadata JSONB, -- 扩展元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_type, sender_id);
```

### 2.4 快捷回复模板表 (quick_reply_templates)

```sql
CREATE TABLE quick_reply_templates (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES customer_service_agents(id) ON DELETE CASCADE, -- NULL表示全局模板
    category VARCHAR(50) NOT NULL, -- '问候语' | '常见问题' | '结束语'
    title VARCHAR(100) NOT NULL, -- 模板标题
    content TEXT NOT NULL, -- 模板内容
    shortcut_key VARCHAR(20), -- 快捷键 如 '/hello'
    usage_count INTEGER DEFAULT 0, -- 使用次数
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quick_reply_agent ON quick_reply_templates(agent_id);
CREATE INDEX idx_quick_reply_category ON quick_reply_templates(category);
```

### 2.5 客服工作统计表 (cs_agent_statistics)

```sql
CREATE TABLE cs_agent_statistics (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL REFERENCES customer_service_agents(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL, -- 统计日期
    total_sessions INTEGER DEFAULT 0, -- 总会话数
    avg_response_time_seconds INTEGER, -- 平均响应时间(秒)
    avg_session_duration_seconds INTEGER, -- 平均会话时长(秒)
    avg_satisfaction_rating DECIMAL(3,2), -- 平均满意度
    total_messages_sent INTEGER DEFAULT 0, -- 发送消息数
    online_duration_seconds INTEGER DEFAULT 0, -- 在线时长(秒)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(agent_id, stat_date)
);

CREATE INDEX idx_cs_stats_agent ON cs_agent_statistics(agent_id);
CREATE INDEX idx_cs_stats_date ON cs_agent_statistics(stat_date);
```

### 2.6 会话转接记录表 (chat_transfer_logs)

```sql
CREATE TABLE chat_transfer_logs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    from_agent_id INTEGER REFERENCES customer_service_agents(id),
    to_agent_id INTEGER REFERENCES customer_service_agents(id),
    transfer_reason TEXT,
    transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfer_logs_session ON chat_transfer_logs(session_id);
```

---

## 三、技术方案对比

### 方案一: 轻量级方案 (HTTP轮询)

**技术栈:**
- **实时通信**: HTTP短轮询 (每3-5秒请求一次)
- **后端**: Express REST API
- **前端**: React + setInterval轮询
- **存储**: PostgreSQL

**优点:**
- ✅ 实现简单,无需额外依赖
- ✅ 兼容性好,支持所有浏览器
- ✅ 易于调试和维护
- ✅ 部署简单,无需额外配置

**缺点:**
- ❌ 实时性差(3-5秒延迟)
- ❌ 服务器负载高(频繁请求)
- ❌ 流量消耗大
- ❌ 用户体验一般

**适用场景:**
- 并发量小(< 50人同时在线)
- 对实时性要求不高
- 快速原型验证

**核心代码:**
```typescript
// 前端轮询
useEffect(() => {
  const interval = setInterval(() => {
    fetchNewMessages(sessionId)
  }, 3000) // 每3秒轮询
  return () => clearInterval(interval)
}, [sessionId])

// 后端API
app.get('/api/chat/messages/:sessionId', async (req, res) => {
  const { lastMessageId } = req.query
  const messages = await getMessagesAfter(sessionId, lastMessageId)
  res.json({ messages })
})
```

**成本评估:**
- 开发时间: 1-2周
- 维护成本: 低
- 服务器成本: 中等(流量消耗)

---

### 方案二: WebSocket方案 (推荐)

**技术栈:**
- **实时通信**: Socket.IO (WebSocket + 降级方案)
- **后端**: Express + Socket.IO
- **前端**: React + Socket.IO Client
- **存储**: PostgreSQL + Redis (消息队列)

**优点:**
- ✅ 真正实时(毫秒级延迟)
- ✅ 服务器负载低(长连接)
- ✅ 支持双向通信
- ✅ Socket.IO自动降级(支持旧浏览器)
- ✅ 用户体验好

**缺点:**
- ⚠️ 需要额外配置WebSocket
- ⚠️ 负载均衡需要sticky session
- ⚠️ 需要Redis做分布式支持

**适用场景:**
- 并发量中等(50-1000人)
- 需要实时通信
- 生产环境推荐

**核心架构:**
```
用户浏览器 <--> Socket.IO Client
      ↓
   WebSocket
      ↓
Express + Socket.IO Server
      ↓
   PostgreSQL + Redis
```

**核心代码:**
```typescript
// 后端 Socket.IO Server
import { Server } from 'socket.io'

io.on('connection', (socket) => {
  // 客服上线
  socket.on('agent:online', async (agentId) => {
    await updateAgentStatus(agentId, 'online')
    socket.join(`agent:${agentId}`)
  })

  // 发送消息
  socket.on('message:send', async (data) => {
    const message = await saveMessage(data)
    // 广播给对方
    if (data.senderType === 'user') {
      io.to(`agent:${session.agentId}`).emit('message:new', message)
    } else {
      io.to(`user:${session.userId}`).emit('message:new', message)
    }
  })
})

// 前端 React Hook
const useWebChat = (sessionId) => {
  const [socket, setSocket] = useState(null)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const newSocket = io('http://localhost:3000')
    newSocket.on('message:new', (msg) => {
      setMessages(prev => [...prev, msg])
    })
    setSocket(newSocket)
    return () => newSocket.close()
  }, [])

  const sendMessage = (content) => {
    socket.emit('message:send', { sessionId, content })
  }

  return { messages, sendMessage }
}
```

**成本评估:**
- 开发时间: 2-3周
- 维护成本: 中等
- 服务器成本: 低(长连接高效)

**依赖安装:**
```bash
# 后端
npm install socket.io redis ioredis

# 前端
npm install socket.io-client
```

---

### 方案三: 企业级方案 (Socket.IO + Redis + 消息队列)

**技术栈:**
- **实时通信**: Socket.IO Cluster (多进程)
- **消息队列**: Redis Pub/Sub + Bull Queue
- **缓存**: Redis (在线状态、会话缓存)
- **存储**: PostgreSQL (主存储) + Redis (缓存)
- **监控**: PM2 + 日志系统

**优点:**
- ✅ 支持水平扩展(多服务器)
- ✅ 高可用性(故障转移)
- ✅ 性能优异(万级并发)
- ✅ 完整的监控和日志
- ✅ 支持离线消息推送

**缺点:**
- ❌ 架构复杂
- ❌ 运维成本高
- ❌ 需要Redis集群

**适用场景:**
- 大规模并发(1000+人)
- 多服务器部署
- 企业级应用

**核心架构:**
```
                    Nginx (负载均衡)
                         |
        +----------------+----------------+
        |                                 |
  Node Server 1                    Node Server 2
  (Socket.IO)                      (Socket.IO)
        |                                 |
        +----------------+----------------+
                         |
                    Redis Cluster
                 (Pub/Sub + 缓存)
                         |
                    PostgreSQL
```

**核心代码:**
```typescript
// Redis适配器 (支持多服务器)
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

const pubClient = createClient({ url: 'redis://localhost:6379' })
const subClient = pubClient.duplicate()

await Promise.all([pubClient.connect(), subClient.connect()])

io.adapter(createAdapter(pubClient, subClient))

// 消息队列处理
import Queue from 'bull'

const messageQueue = new Queue('chat-messages', {
  redis: { host: 'localhost', port: 6379 }
})

messageQueue.process(async (job) => {
  const { sessionId, message } = job.data
  await saveMessageToDB(message)
  await sendNotificationIfOffline(sessionId)
})

// 添加消息到队列
socket.on('message:send', async (data) => {
  await messageQueue.add(data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  })
})
```

**成本评估:**
- 开发时间: 4-6周
- 维护成本: 高
- 服务器成本: 中-高(需Redis集群)

**依赖安装:**
```bash
npm install @socket.io/redis-adapter bull ioredis pm2
```

---

### 方案四: SaaS集成方案 (第三方服务)

**技术栈:**
- **第三方服务**:
  - Intercom (海外)
  - 美洽 (国内)
  - 环信 (国内)
  - Crisp Chat
- **集成方式**: JavaScript SDK + Webhook
- **存储**: 第三方云存储 + 本地数据库同步

**优点:**
- ✅ 开发快(1-3天集成)
- ✅ 功能完善(自带AI、自动回复、多渠道)
- ✅ 无需维护服务器
- ✅ 提供移动端SDK
- ✅ 自带客服工作台

**缺点:**
- ❌ 按月付费(成本高)
- ❌ 数据隐私风险
- ❌ 定制化受限
- ❌ 依赖第三方稳定性

**适用场景:**
- 快速上线需求
- 预算充足
- 不想维护服务器

**集成示例 (美洽):**
```html
<!-- 前端集成 -->
<script>
(function(m, ei, q, i, a, j, s) {
  m[i] = m[i] || function() {
    (m[i].a = m[i].a || []).push(arguments)
  };
  j = ei.createElement(q);
  s = ei.getElementsByTagName(q)[0];
  j.async = true;
  j.charset = 'UTF-8';
  j.src = 'https://static.meiqia.com/widget/loader.js';
  s.parentNode.insertBefore(j, s);
})(window, document, 'script', '_MEIQIA');

_MEIQIA('entId', '你的企业ID');
</script>
```

**价格参考 (美洽):**
- 基础版: ¥299/月 (3个客服席位)
- 专业版: ¥699/月 (10个客服席位)
- 企业版: ¥1999/月 (无限席位)

**成本评估:**
- 开发时间: 1-3天
- 维护成本: 极低
- 服务器成本: 无
- 订阅成本: ¥299-1999/月

---

## 四、方案对比总结

| 对比维度 | 方案一(HTTP轮询) | 方案二(WebSocket)⭐ | 方案三(企业级) | 方案四(SaaS) |
|---------|----------------|-------------------|---------------|-------------|
| **实时性** | ⭐⭐ (3-5秒延迟) | ⭐⭐⭐⭐⭐ (毫秒级) | ⭐⭐⭐⭐⭐ (毫秒级) | ⭐⭐⭐⭐⭐ (毫秒级) |
| **并发支持** | < 50人 | 50-1000人 | 1000+人 | 无限制 |
| **开发时间** | 1-2周 | 2-3周 | 4-6周 | 1-3天 |
| **开发难度** | ⭐⭐ 简单 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 复杂 | ⭐ 极简 |
| **维护成本** | 低 | 中等 | 高 | 极低 |
| **服务器成本** | 中(流量) | 低 | 中-高 | 无 |
| **订阅成本** | 无 | 无 | 无 | ¥299-1999/月 |
| **扩展性** | ⭐⭐ 差 | ⭐⭐⭐⭐ 好 | ⭐⭐⭐⭐⭐ 优秀 | ⭐⭐⭐⭐ 好 |
| **数据控制** | ⭐⭐⭐⭐⭐ 完全 | ⭐⭐⭐⭐⭐ 完全 | ⭐⭐⭐⭐⭐ 完全 | ⭐⭐ 受限 |
| **定制化** | ⭐⭐⭐⭐⭐ 完全 | ⭐⭐⭐⭐⭐ 完全 | ⭐⭐⭐⭐⭐ 完全 | ⭐⭐ 受限 |
| **推荐场景** | 快速原型 | 生产环境 | 大规模企业 | 快速上线 |

---

## 五、推荐方案 (方案二: WebSocket)

### 为什么推荐方案二?

1. **平衡性好**: 在实时性、成本、复杂度之间取得最佳平衡
2. **技术成熟**: Socket.IO经过大规模生产验证
3. **用户体验优**: 真正的实时通信
4. **可扩展**: 支持后续升级到方案三
5. **成本可控**: 无订阅费用,服务器成本低

### 实施路线图

**阶段一 (Week 1): 基础框架**
- ✅ 数据库表创建
- ✅ Socket.IO Server搭建
- ✅ 基础消息收发功能

**阶段二 (Week 2): 客服工作台**
- ✅ 客服登录和状态管理
- ✅ 会话列表和分配逻辑
- ✅ 快捷回复功能

**阶段三 (Week 3): 管理功能**
- ✅ 客服人员管理
- ✅ 客服经理权限
- ✅ 统计报表

**阶段四 (Week 4): 优化和测试**
- ✅ 性能优化
- ✅ 压力测试
- ✅ Bug修复

---

## 六、角色权限设计

### 6.1 扩展现有角色系统

在现有的`admins`表基础上,新增客服相关角色:

```sql
-- 更新admins表的role字段,支持新角色
-- 现有: super_admin, admin, manager, operator, viewer
-- 新增: cs_manager (客服经理), cs_agent (客服)

ALTER TABLE admins ALTER COLUMN role TYPE VARCHAR(50);

-- 或者保持admins表不变,通过customer_service_agents表关联
```

### 6.2 权限矩阵

| 功能 | Super Admin | CS Manager | CS Agent | User |
|-----|------------|------------|----------|------|
| 查看所有会话 | ✅ | ✅ | ❌(仅自己) | ❌(仅自己) |
| 分配客服 | ✅ | ✅ | ❌ | ❌ |
| 管理客服人员 | ✅ | ✅(仅下属) | ❌ | ❌ |
| 接待用户 | ✅ | ✅ | ✅ | ❌ |
| 转接会话 | ✅ | ✅ | ✅ | ❌ |
| 查看统计报表 | ✅ | ✅(仅团队) | ✅(仅自己) | ❌ |
| 设置快捷回复 | ✅ | ✅ | ✅ | ❌ |
| 评价客服 | ❌ | ❌ | ❌ | ✅ |

### 6.3 权限检查中间件

```typescript
// backend/src/middleware/csAuth.ts
export const requireCSPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const admin = req.admin // 来自authenticate中间件

    // 超级管理员拥有所有权限
    if (admin.role === 'super_admin') {
      return next()
    }

    // 客服经理权限检查
    if (admin.role === 'cs_manager') {
      const allowedPermissions = [
        'view_team_sessions',
        'assign_agent',
        'manage_team_agents',
        'view_team_stats'
      ]
      if (allowedPermissions.includes(permission)) {
        return next()
      }
    }

    // 客服权限检查
    if (admin.role === 'cs_agent') {
      const allowedPermissions = [
        'view_own_sessions',
        'send_message',
        'transfer_session'
      ]
      if (allowedPermissions.includes(permission)) {
        return next()
      }
    }

    return res.status(403).json({
      success: false,
      message: '权限不足'
    })
  }
}
```

---

## 七、API设计示例 (方案二)

### 7.1 客服管理API

```typescript
// 管理员创建客服人员
POST /api/manage/customer-service/agents
Body: {
  adminId: string,      // 关联的admin账号ID
  displayName: string,
  role: 'manager' | 'agent',
  managerId?: number,   // 所属经理ID
  maxConcurrentChats: number,
  specialtyTags: string[]
}

// 客服经理查看团队成员
GET /api/manage/customer-service/team
Query: { managerId: number }

// 更新客服状态
PUT /api/manage/customer-service/agents/:id/status
Body: { status: 'online' | 'busy' | 'offline' }
```

### 7.2 会话管理API

```typescript
// 用户发起咨询
POST /api/chat/sessions
Body: {
  userId: string,
  initialMessage?: string
}
Response: {
  sessionId: number,
  sessionKey: string,
  queuePosition?: number
}

// 分配客服
POST /api/manage/customer-service/sessions/:id/assign
Body: { agentId: number }

// 转接会话
POST /api/manage/customer-service/sessions/:id/transfer
Body: {
  toAgentId: number,
  reason: string
}
```

### 7.3 消息API

```typescript
// 发送消息 (通过Socket.IO)
socket.emit('message:send', {
  sessionId: number,
  content: string,
  messageType: 'text' | 'image' | 'file'
})

// 接收消息 (通过Socket.IO)
socket.on('message:new', (message) => {
  // 处理新消息
})
```

---

## 八、前端组件设计

### 8.1 用户端组件

```
ChatWidget (聊天窗口组件)
├── ChatButton (触发按钮)
├── ChatWindow (聊天窗口)
│   ├── ChatHeader (标题栏)
│   ├── MessageList (消息列表)
│   │   └── Message (单条消息)
│   ├── InputArea (输入区)
│   │   ├── TextInput
│   │   ├── FileUpload
│   │   └── SendButton
│   └── RatingDialog (评价弹窗)
```

### 8.2 客服端组件

```
CSWorkbench (客服工作台)
├── SessionList (会话列表)
│   ├── SessionFilter (筛选器)
│   └── SessionCard (会话卡片)
├── ChatPanel (聊天面板)
│   ├── UserInfo (用户信息)
│   ├── MessageHistory (历史消息)
│   ├── QuickReply (快捷回复)
│   └── InputArea (输入区)
└── Statistics (统计面板)
```

### 8.3 管理端组件

```
CSManagement (客服管理)
├── AgentList (客服列表)
│   ├── AgentCard (客服卡片)
│   └── AssignDialog (分配弹窗)
├── TeamStatistics (团队统计)
│   ├── OverviewCharts (概览图表)
│   └── AgentRanking (客服排行)
└── SessionMonitor (会话监控)
```

---

## 九、下一步行动

### 请您选择一个方案:

1. **方案一 (HTTP轮询)** - 快速原型,1-2周完成
2. **方案二 (WebSocket)** ⭐推荐 - 生产级,2-3周完成
3. **方案三 (企业级)** - 大规模,4-6周完成
4. **方案四 (SaaS)** - 第三方服务,1-3天集成

### 确认后,我将为您:

1. ✅ 创建数据库迁移脚本
2. ✅ 搭建后端Socket.IO服务
3. ✅ 实现前端聊天组件
4. ✅ 开发客服工作台
5. ✅ 实现管理功能

---

**创建时间:** 2025年1月14日
**文档状态:** 待用户选择方案
**预计开发周期:** 2-6周 (根据方案而定)
