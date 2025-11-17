# 配置系统迁移指南

## 概述

本项目已实施配置系统升级，将原本硬编码在代码和环境变量中的业务配置迁移到数据库中，实现动态配置管理。

## 架构说明

### 配置分类

1. **基础设施配置**（保留在环境变量）
   - 数据库连接信息
   - Redis连接信息
   - JWT密钥
   - 服务端口

2. **业务配置**（存储在数据库）
   - 缓存配置
   - 限流配置
   - 客服系统配置
   - WebSocket配置
   - 安全配置
   - 业务规则

## 使用指南

### 1. 执行数据库迁移

```bash
# 连接到数据库
./db-cli.sh connect

# 执行迁移脚本
\i backend/migrations/014_app_configurations.sql

# 验证表创建成功
\dt app_configs
\dt customer_service_configs
\dt app_config_history
```

### 2. 在代码中使用配置服务

#### 示例1：获取简单配置值

**旧代码**（硬编码）:
```typescript
// backend/src/controllers/articles.ts
const CACHE_TTL = 300; // 5分钟
```

**新代码**（使用configService）:
```typescript
import configService from '../services/configService';

// 在async函数中
const cacheTTL = await configService.get<number>('cache.articles.ttl', 300);
```

#### 示例2：获取客服配置

**旧代码**:
```typescript
// backend/src/services/csAgentStatusService.ts
const MAX_CONCURRENT_CHATS = 5; // 硬编码
```

**新代码**:
```typescript
import configService from '../services/configService';

export async function incrementChatCount(agentId: string): Promise<number> {
  const csConfig = await configService.getCSConfig();
  const maxChats = csConfig?.max_concurrent_chats || 5;

  if (agent.currentChatCount >= maxChats) {
    agent.status = 'busy';
  }
  // ...
}
```

#### 示例3：修改缓存中间件

**旧代码**:
```typescript
// backend/src/middleware/cache.ts
const cache = new LRUCache(config.cache.ttl, config.cache.maxKeys);
```

**新代码**:
```typescript
import configService from '../services/configService';

// 在中间件初始化时
async function initializeCache() {
  const ttl = await configService.get<number>('cache.global.ttl', 300000);
  const maxKeys = await configService.get<number>('cache.global.maxKeys', 1000);
  return new LRUCache(ttl, maxKeys);
}
```

#### 示例4：修改限流器

**旧代码**:
```typescript
// backend/src/middleware/rateLimiter.ts
export const strictLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 20, // 硬编码
});
```

**新代码**:
```typescript
import configService from '../services/configService';

export async function createStrictLimiter() {
  const windowMs = await configService.get<number>('rateLimit.window', 60000);
  const max = await configService.get<number>('rateLimit.strict.max', 20);

  return rateLimit({ windowMs, max });
}
```

### 3. 管理配置（通过API）

#### 获取所有配置统计
```bash
TOKEN="your_admin_token"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:50301/api/manage/configs
```

#### 获取特定分类的配置
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:50301/api/manage/configs?category=cache
```

#### 更新单个配置
```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "600"}' \
  http://localhost:50301/api/manage/configs/cache.articles.ttl
```

#### 批量更新配置
```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cache.articles.ttl": 600,
    "cache.horoscopes.ttl": 3600,
    "rateLimit.api.max": 100
  }' \
  http://localhost:50301/api/manage/configs/batch
```

#### 重新加载配置（热更新）
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:50301/api/manage/configs/reload
```

#### 查看配置变更历史
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:50301/api/manage/configs/history?limit=20
```

#### 更新客服配置
```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "max_concurrent_chats": 10,
    "session_timeout_minutes": 45
  }' \
  http://localhost:50301/api/manage/configs/cs
```

### 4. 使用SQL函数

```sql
-- 获取配置值
SELECT get_config('cache.articles.ttl', '300');

-- 设置配置值
SELECT set_config('cache.articles.ttl', '600', 'admin');

-- 查看配置统计
SELECT * FROM v_configs_by_category;

-- 查看最近配置变更
SELECT * FROM v_recent_config_changes LIMIT 10;
```

## 迁移步骤

### 阶段1：准备阶段（已完成）
- [x] 创建数据库表结构
- [x] 开发ConfigService服务层
- [x] 创建管理API和路由
- [x] 添加配置管理文档

### 阶段2：逐步迁移（进行中）

需要修改的文件清单：

#### 高优先级（影响性能和功能）
1. **缓存控制器** (6个文件)
   - `backend/src/controllers/articles.ts`
   - `backend/src/controllers/dailyHoroscopes.ts`
   - `backend/src/controllers/systemConfigs.ts`
   - `backend/src/controllers/fortuneTemplates.ts`
   - `backend/src/controllers/fortuneServices.ts`
   - `backend/src/controllers/fortuneCategories.ts`

2. **限流中间件**
   - `backend/src/middleware/rateLimiter.ts`

3. **客服系统**
   - `backend/src/services/csAgentStatusService.ts`
   - `backend/src/socket/chatServer.ts`
   - `backend/src/services/webchat/chatSessionService.ts`

#### 中优先级
4. **安全配置**
   - `backend/src/services/authService.ts` (bcrypt salt rounds)
   - `backend/src/middleware/auditLogger.ts` (日志截断长度)

#### 低优先级
5. **其他配置**
   - 数据库连接池配置（已在config/index.ts中，可选迁移）

### 阶段3：测试验证
- [ ] 单元测试配置服务
- [ ] 集成测试API端点
- [ ] 性能测试（缓存命中率、查询性能）
- [ ] 压力测试（并发配置更新）

### 阶段4：生产部署
- [ ] 备份现有配置
- [ ] 执行数据库迁移
- [ ] 验证配置加载
- [ ] 监控应用性能
- [ ] 回滚计划（如需要）

## 最佳实践

### 1. 配置命名规范
使用点分隔的命名空间：
- `category.module.key`
- 示例：`cache.articles.ttl`, `rateLimit.api.max`

### 2. 默认值处理
始终提供默认值作为后备：
```typescript
const ttl = await configService.get<number>('cache.articles.ttl', 300);
```

### 3. 类型安全
使用TypeScript泛型指定配置类型：
```typescript
const enabled = await configService.get<boolean>('cache.enabled', true);
const maxKeys = await configService.get<number>('cache.maxKeys', 1000);
```

### 4. 配置缓存
ConfigService内部已实现缓存（1分钟TTL），无需在业务代码中额外缓存。

### 5. 热更新
修改配置后调用reload端点：
```typescript
await configService.reload();
```

### 6. 审计追踪
所有配置变更自动记录到`app_config_history`表，包括：
- 变更时间
- 变更人
- 旧值/新值
- 变更原因

## 配置项索引

### 缓存配置 (category: cache)
| Key | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| cache.global.ttl | number | 300000 | 全局缓存TTL（毫秒） |
| cache.global.maxKeys | number | 1000 | 最大缓存条目数 |
| cache.articles.ttl | number | 300 | 文章缓存TTL（秒） |
| cache.horoscopes.ttl | number | 1800 | 运势缓存TTL（秒） |
| cache.systemConfigs.ttl | number | 7200 | 系统配置缓存TTL（秒） |
| cache.fortuneTemplates.ttl | number | 3600 | 算命模板缓存TTL（秒） |
| cache.fortuneServices.ttl | number | 3600 | 算命服务缓存TTL（秒） |
| cache.fortuneCategories.ttl | number | 3600 | 算命分类缓存TTL（秒） |

### 限流配置 (category: rateLimit)
| Key | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| rateLimit.window | number | 60000 | 时间窗口（毫秒） |
| rateLimit.api.max | number | 60 | API通用限流次数 |
| rateLimit.strict.max | number | 20 | 严格限流次数 |
| rateLimit.loose.max | number | 100 | 宽松限流次数 |

### JWT配置 (category: jwt)
| Key | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| jwt.admin.expiresIn | string | 24h | 管理员Token过期时间 |
| jwt.user.expiresIn | string | 30d | 用户Token过期时间 |

### WebSocket配置 (category: websocket)
| Key | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| websocket.pingTimeout | number | 60000 | Ping超时（毫秒） |
| websocket.pingInterval | number | 25000 | Ping间隔（毫秒） |

### 安全配置 (category: security)
| Key | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| security.bcryptSaltRounds | number | 10 | 密码加密强度 |
| security.maxLoginAttempts | number | 5 | 最大登录尝试次数 |
| security.passwordMinLength | number | 6 | 密码最小长度 |

## 故障排查

### 问题1：配置服务初始化失败
**症状**：启动时看到"配置服务初始化失败"警告

**原因**：数据库表未创建或连接失败

**解决**：
```bash
# 检查数据库连接
./db-cli.sh status

# 执行迁移脚本
./db-cli.sh connect
\i backend/migrations/014_app_configurations.sql
```

### 问题2：配置未生效
**症状**：修改配置后未生效

**原因**：配置服务缓存未刷新

**解决**：
```bash
# 调用reload API
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:50301/api/manage/configs/reload
```

### 问题3：获取配置返回undefined
**症状**：`configService.get()` 返回 undefined

**原因**：配置键不存在或拼写错误

**解决**：
```bash
# 检查配置是否存在
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:50301/api/manage/configs/your-config-key

# 或直接查询数据库
SELECT * FROM app_configs WHERE config_key = 'your-config-key';
```

## 向后兼容性

ConfigService 支持环境变量后备机制：
1. 首先从数据库加载配置
2. 如果数据库配置不存在，尝试从环境变量读取
3. 如果都不存在，使用提供的默认值

这确保了在迁移过程中系统仍能正常运行。

## 性能影响

- **数据库查询**：首次加载时从数据库读取，后续使用内存缓存
- **缓存TTL**：1分钟，自动刷新
- **查询性能**：~1-3ms（有索引），命中缓存后 <1ms
- **内存占用**：约100KB（1000个配置项）

## 后续计划

- [ ] 开发前端配置管理界面
- [ ] 实现配置导入/导出功能
- [ ] 添加配置版本控制
- [ ] 实现配置审批流程
- [ ] 支持配置模板和预设
- [ ] 实现配置A/B测试

## 相关文档

- [数据库迁移脚本](./migrations/014_app_configurations.sql)
- [ConfigService API文档](./src/services/configService.ts)
- [配置管理API](http://localhost:50301/api-docs#/配置管理)
- [硬编码问题报告](../HARDCODED_ISSUES_REPORT.md)
