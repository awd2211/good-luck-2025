# 健康检查接口优化文档

## 概述

本次优化为后端健康检查接口添加了全面的监控指标和智能告警机制，从简单的"服务运行中"状态升级为完整的应用健康监控系统。

## 新增功能

### 1. 监控指标

#### 数据库连接状态
- **状态检测**: 通过执行 `SELECT 1` 测试数据库连接
- **连接池统计**:
  - `total`: 总连接数
  - `idle`: 空闲连接数
  - `waiting`: 等待中的连接数
- **响应时间**: 记录数据库查询延迟（毫秒）

#### Redis连接状态
- **可配置启用**: 仅在 `REDIS_ENABLED=true` 时检查
- **PING测试**: 使用 `redis.ping()` 验证连接
- **响应时间**: 记录Redis响应延迟（毫秒）
- **降级支持**: Redis未启用时显示 "disabled" 状态

#### 内存使用情况
- **堆内存统计**:
  - `rss`: 常驻内存集大小（MB）
  - `heapTotal`: 堆总大小（MB）
  - `heapUsed`: 已使用堆大小（MB）
  - `external`: 外部内存使用（MB）
  - `percentUsed`: 堆内存使用百分比
- **实时监控**: 直接读取 `process.memoryUsage()`

#### API响应时间统计
- **全局指标**:
  - `total`: 总请求次数
  - `averageResponseTime`: 平均响应时间（毫秒）
  - `slowestEndpoint`: 最慢端点路径
  - `slowestTime`: 最慢端点平均响应时间
- **路由级别追踪**:
  - 每个路由的请求次数
  - 最小/最大/平均响应时间
  - 最后访问时间

### 2. 告警机制

#### 内存告警
| 级别 | 阈值 | 状态 | 说明 |
|------|------|------|------|
| 正常 | < 80% | `ok` | 内存使用正常 |
| 警告 | 80%-90% | `warning` | 内存使用率较高 |
| 临界 | ≥ 90% | `critical` | 内存使用率过高 |

**告警示例**:
```
内存使用率较高: 85% (警告值: 80%)
```

#### 响应时间告警
| 级别 | 阈值 | 状态 | 说明 |
|------|------|------|------|
| 正常 | < 1000ms | `ok` | 响应时间正常 |
| 警告 | 1000-3000ms | `warning` | 响应时间较慢 |
| 临界 | ≥ 3000ms | `critical` | 响应时间过慢 |

**告警示例**:
```
API平均响应时间较慢: 1500ms (警告值: 1000ms)
最慢端点 POST /api/fortune/bazi: 2000ms
```

#### 连接池告警
| 级别 | 阈值 | 状态 | 说明 |
|------|------|------|------|
| 正常 | < 80% | `ok` | 连接池使用正常 |
| 警告 | 80%-95% | `warning` | 连接池使用率较高 |
| 临界 | ≥ 95% | `critical` | 连接池使用率过高 |

**计算公式**:
```javascript
poolUsage = (total - idle) / total * 100
```

**告警示例**:
```
数据库连接池使用率较高: 85.0%
```

### 3. 整体健康状态

健康检查返回三种整体状态：

| 状态 | HTTP状态码 | 触发条件 |
|------|-----------|---------|
| `healthy` | 200 | 所有检查通过，无告警 |
| `degraded` | 200 | 存在警告，但服务可用 |
| `unhealthy` | 503 | 数据库连接失败或其他严重错误 |

**状态判定逻辑**:
1. 数据库连接失败 → `unhealthy`
2. 存在任何告警或内存临界 → `degraded`
3. 否则 → `healthy`

## 技术实现

### 文件结构

```
backend/src/
├── services/
│   └── healthService.ts         # 健康检查服务层
├── middleware/
│   └── metricsCollector.ts      # API性能指标收集中间件
└── index.ts                      # 集成健康检查路由
```

### 关键组件

#### 1. 健康检查服务 (`healthService.ts`)

**核心函数**:
```typescript
export async function performHealthCheck(
  includeMetrics: boolean = false
): Promise<HealthCheckResult>
```

**参数**:
- `includeMetrics`: 是否包含API性能指标（默认false）

**返回结构**:
```typescript
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  checks: {
    database: DatabaseCheck;
    redis: RedisCheck;
    memory: MemoryCheck;
  };
  metrics?: MetricsData;
  warnings: string[];
}
```

#### 2. 指标收集中间件 (`metricsCollector.ts`)

**功能**:
- 自动拦截所有API请求（排除 `/health`, `/`, 静态资源）
- 记录每个请求的响应时间
- 按路由统计请求次数和平均响应时间
- 计算全局平均响应时间和最慢端点

**使用方式**:
```typescript
import { metricsCollector } from './middleware/metricsCollector';
app.use(metricsCollector);
```

**全局指标访问**:
```typescript
// 在任何地方访问指标
const metrics = global.apiMetrics;
console.log(metrics.total, metrics.averageResponseTime);
```

### 配置参数

所有告警阈值定义在 `healthService.ts` 中：

```typescript
const THRESHOLDS = {
  memory: {
    warning: 80,  // 80% 内存使用率
    critical: 90  // 90% 内存使用率
  },
  responseTime: {
    warning: 1000,    // 1秒
    critical: 3000    // 3秒
  },
  connectionPool: {
    warning: 80,      // 80% 连接池使用率
    critical: 95      // 95% 连接池使用率
  }
};
```

**如何调整阈值**:
根据实际业务需求修改 `THRESHOLDS` 对象的值即可。

## API使用示例

### 请求

```bash
GET http://localhost:3000/health
```

### 响应示例

#### 健康状态（无告警）

```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T10:30:45.123Z",
  "uptime": 3600.5,
  "environment": "development",
  "checks": {
    "database": {
      "status": "ok",
      "message": "数据库连接正常",
      "connectionPool": {
        "total": 10,
        "idle": 8,
        "waiting": 0
      },
      "responseTime": 15
    },
    "redis": {
      "status": "disabled",
      "message": "Redis未启用"
    },
    "memory": {
      "status": "ok",
      "message": "内存使用正常: 45%",
      "usage": {
        "rss": "120.50 MB",
        "heapTotal": "80.25 MB",
        "heapUsed": "36.11 MB",
        "external": "2.34 MB",
        "percentUsed": 45
      }
    }
  },
  "metrics": {
    "total": 1250,
    "averageResponseTime": 85,
    "slowestEndpoint": "POST /api/fortune/bazi",
    "slowestTime": 350
  },
  "warnings": []
}
```

#### 降级状态（有告警）

```json
{
  "status": "degraded",
  "timestamp": "2025-11-13T10:35:20.456Z",
  "uptime": 3900.8,
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "message": "数据库连接正常",
      "connectionPool": {
        "total": 10,
        "idle": 1,
        "waiting": 2
      },
      "responseTime": 45
    },
    "redis": {
      "status": "ok",
      "message": "Redis连接正常",
      "responseTime": 5
    },
    "memory": {
      "status": "warning",
      "message": "内存使用率较高: 85% (警告值: 80%)",
      "usage": {
        "rss": "450.80 MB",
        "heapTotal": "400.00 MB",
        "heapUsed": "340.00 MB",
        "external": "10.50 MB",
        "percentUsed": 85
      }
    }
  },
  "metrics": {
    "total": 50000,
    "averageResponseTime": 1200,
    "slowestEndpoint": "POST /api/fortune/liuren",
    "slowestTime": 2500
  },
  "warnings": [
    "数据库连接池使用率较高: 90.0%",
    "内存使用率较高: 85% (警告值: 80%)",
    "API平均响应时间较慢: 1200ms (警告值: 1000ms)",
    "最慢端点 POST /api/fortune/liuren: 2500ms"
  ]
}
```

#### 不健康状态（数据库故障）

```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-13T10:40:15.789Z",
  "uptime": 4200.2,
  "environment": "production",
  "checks": {
    "database": {
      "status": "error",
      "message": "数据库连接失败: Connection refused"
    },
    "redis": {
      "status": "ok",
      "message": "Redis连接正常",
      "responseTime": 3
    },
    "memory": {
      "status": "ok",
      "message": "内存使用正常: 50%",
      "usage": {
        "rss": "150.00 MB",
        "heapTotal": "100.00 MB",
        "heapUsed": "50.00 MB",
        "external": "3.00 MB",
        "percentUsed": 50
      }
    }
  },
  "metrics": {
    "total": 1000,
    "averageResponseTime": 150
  },
  "warnings": [
    "数据库连接失败: Connection refused"
  ]
}
```

## 运维集成

### 1. 负载均衡器健康检查

**Nginx 配置示例**:
```nginx
upstream backend_pool {
    server backend1:3000 max_fails=3 fail_timeout=30s;
    server backend2:3000 max_fails=3 fail_timeout=30s;

    # 健康检查
    check interval=3000 rise=2 fall=5 timeout=1000 type=http;
    check_http_send "GET /health HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx http_3xx;
}
```

**HAProxy 配置示例**:
```haproxy
backend backend_servers
    option httpchk GET /health
    http-check expect status 200
    server backend1 backend1:3000 check inter 3s
    server backend2 backend2:3000 check inter 3s
```

### 2. Kubernetes Probes

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: fortune-backend
spec:
  containers:
  - name: backend
    image: fortune-backend:latest
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 10
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
      successThreshold: 1
      failureThreshold: 3
```

### 3. 监控系统集成

#### Prometheus 集成

可以添加 Prometheus 格式的指标端点：

```typescript
// 添加到 backend/src/index.ts
app.get('/metrics', async (req, res) => {
  const health = await performHealthCheck(true);
  const metrics = getMetrics();

  // 输出 Prometheus 格式
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP app_health_status Application health status (1=healthy, 0.5=degraded, 0=unhealthy)
# TYPE app_health_status gauge
app_health_status{status="${health.status}"} ${health.status === 'healthy' ? 1 : health.status === 'degraded' ? 0.5 : 0}

# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds counter
app_uptime_seconds ${health.uptime}

# HELP app_memory_usage_percent Memory usage percentage
# TYPE app_memory_usage_percent gauge
app_memory_usage_percent ${health.checks.memory.usage.percentUsed}

# HELP app_db_response_time_ms Database response time in milliseconds
# TYPE app_db_response_time_ms gauge
app_db_response_time_ms ${health.checks.database.responseTime || 0}

# HELP app_http_requests_total Total HTTP requests
# TYPE app_http_requests_total counter
app_http_requests_total ${health.metrics?.total || 0}

# HELP app_http_response_time_avg_ms Average HTTP response time in milliseconds
# TYPE app_http_response_time_avg_ms gauge
app_http_response_time_avg_ms ${health.metrics?.averageResponseTime || 0}
  `.trim());
});
```

#### Grafana Dashboard

使用上述 Prometheus 指标可以构建 Grafana 仪表板，监控：
- 应用健康状态时间线
- 内存使用趋势
- API响应时间趋势
- 数据库连接池使用率
- 请求吞吐量

## 测试

### 运行测试脚本

```bash
# 启动后端
cd backend && npm run dev

# 在另一个终端运行测试
./test-health-check.sh
```

### 手动测试

```bash
# 基础健康检查
curl http://localhost:3000/health | jq

# 压力测试（生成大量请求以测试性能指标）
for i in {1..100}; do
  curl -s http://localhost:3000/api/public/banners > /dev/null &
done
wait

# 再次检查健康状态（应该显示请求统计）
curl http://localhost:3000/health | jq '.metrics'
```

## 性能影响

### 开销分析

- **指标收集**: 每个请求增加 ~0.1ms 延迟（记录时间戳）
- **健康检查**: 约 20-50ms（包含数据库和Redis查询）
- **内存占用**: 指标存储约 1-2MB（取决于路由数量）

### 优化建议

1. **定期清理指标**: 在生产环境可以定期重置指标
   ```typescript
   import { resetMetrics } from './middleware/metricsCollector';

   // 每小时重置一次指标
   setInterval(() => resetMetrics(), 60 * 60 * 1000);
   ```

2. **跳过静态资源**: 中间件已自动跳过 `/health`, `/`, 静态资源

3. **异步健康检查**: 健康检查已使用并行检查（`Promise.all`）

## 故障排查

### 常见问题

#### 1. 健康检查返回 503 "unhealthy"

**原因**: 数据库连接失败

**解决**:
```bash
# 检查数据库是否运行
./db-cli.sh status

# 启动数据库
docker compose up -d

# 检查后端数据库配置
cat backend/.env | grep DB_
```

#### 2. 内存告警持续出现

**原因**: 内存泄漏或负载过高

**解决**:
- 检查是否有内存泄漏（使用 `node --inspect`）
- 增加Node.js堆内存限制: `NODE_OPTIONS="--max-old-space-size=4096"`
- 考虑水平扩展（增加实例数量）

#### 3. 响应时间告警

**原因**: 数据库查询慢或算法复杂

**解决**:
- 检查慢查询: 在健康检查中查看 `slowestEndpoint`
- 优化数据库索引
- 启用Redis缓存
- 使用数据库连接池

#### 4. Redis连接失败但不影响服务

**行为**: Redis显示 "error" 但整体状态仍为 "degraded"

**说明**: 这是预期行为，Redis是可选组件，失败不会导致服务不可用

**解决**:
```bash
# 检查Redis配置
cat backend/.env | grep REDIS_

# 如果不需要Redis，设置为disabled
echo "REDIS_ENABLED=false" >> backend/.env
```

## 未来改进

### 可能的扩展

1. **历史趋势**: 保存历史健康数据，提供趋势分析
2. **自定义检查**: 允许注册自定义健康检查项
3. **告警通知**: 集成邮件/Slack/钉钉告警
4. **分级健康检查**: 轻量级 `/health/liveness` 和详细 `/health/readiness`
5. **请求追踪**: 集成OpenTelemetry进行分布式追踪

### 贡献指南

如需添加新的监控指标：

1. 在 `healthService.ts` 中添加新的检查函数
2. 更新 `HealthCheckResult` 类型定义
3. 在 `performHealthCheck` 中调用新检查
4. 添加相应的告警阈值和逻辑
5. 更新本文档

## 总结

本次优化将健康检查从简单的"运行中"状态升级为全面的应用监控系统，包括：

✅ **4个监控维度**: 数据库、Redis、内存、API性能
✅ **3级告警机制**: 正常、警告、临界
✅ **智能状态判定**: healthy / degraded / unhealthy
✅ **生产级集成**: 支持负载均衡器、Kubernetes、Prometheus
✅ **零配置使用**: 开箱即用，自动收集指标

现在运维团队可以通过单一端点全面了解应用健康状态，快速定位性能瓶颈和潜在问题。

---

**相关文件**:
- `backend/src/services/healthService.ts`: 健康检查服务
- `backend/src/middleware/metricsCollector.ts`: 指标收集中间件
- `backend/src/index.ts`: 路由集成
- `test-health-check.sh`: 测试脚本

**版本**: 1.0.0
**最后更新**: 2025-11-13
