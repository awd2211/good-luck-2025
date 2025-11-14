import pool from '../config/database';
import { getRedisClient } from '../config/redis';
import { config } from '../config';

export interface HealthCheckResult {
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

interface DatabaseCheck {
  status: 'ok' | 'error';
  message: string;
  connectionPool?: {
    total: number;
    idle: number;
    waiting: number;
  };
  responseTime?: number;
}

interface RedisCheck {
  status: 'ok' | 'disabled' | 'error';
  message: string;
  responseTime?: number;
}

interface MemoryCheck {
  status: 'ok' | 'warning' | 'critical';
  message: string;
  usage: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
    percentUsed: number;
  };
}

interface MetricsData {
  total: number;
  averageResponseTime: number;
  slowestEndpoint?: string;
  slowestTime?: number;
}

// 告警阈值配置
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

/**
 * 检查数据库连接状态
 */
async function checkDatabase(): Promise<DatabaseCheck> {
  const startTime = Date.now();
  try {
    // 执行简单查询测试连接
    await pool.query('SELECT 1');
    const responseTime = Date.now() - startTime;

    // 获取连接池统计信息
    const totalConnections = pool.totalCount;
    const idleConnections = pool.idleCount;
    const waitingConnections = pool.waitingCount;

    return {
      status: 'ok',
      message: '数据库连接正常',
      connectionPool: {
        total: totalConnections,
        idle: idleConnections,
        waiting: waitingConnections
      },
      responseTime
    };
  } catch (error) {
    return {
      status: 'error',
      message: `数据库连接失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

/**
 * 检查Redis连接状态
 */
async function checkRedis(): Promise<RedisCheck> {
  if (!config.redis.enabled) {
    return {
      status: 'disabled',
      message: 'Redis未启用'
    };
  }

  const startTime = Date.now();
  try {
    const redis = getRedisClient();
    if (!redis) {
      return {
        status: 'error',
        message: 'Redis客户端未初始化'
      };
    }

    // 执行PING命令测试连接
    await redis.ping();
    const responseTime = Date.now() - startTime;

    return {
      status: 'ok',
      message: 'Redis连接正常',
      responseTime
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Redis连接失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

/**
 * 获取系统内存信息（Linux）
 */
function getSystemMemory(): { total: number; used: number; free: number; available: number } | null {
  try {
    const fs = require('fs');
    const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');

    const memTotal = parseInt(meminfo.match(/MemTotal:\s+(\d+)/)?.[1] || '0') / 1024; // MB
    const memFree = parseInt(meminfo.match(/MemFree:\s+(\d+)/)?.[1] || '0') / 1024; // MB
    const memAvailable = parseInt(meminfo.match(/MemAvailable:\s+(\d+)/)?.[1] || '0') / 1024; // MB
    const buffers = parseInt(meminfo.match(/Buffers:\s+(\d+)/)?.[1] || '0') / 1024; // MB
    const cached = parseInt(meminfo.match(/^Cached:\s+(\d+)/m)?.[1] || '0') / 1024; // MB

    const memUsed = memTotal - memFree - buffers - cached;

    return {
      total: Math.round(memTotal),
      used: Math.round(memUsed),
      free: Math.round(memFree),
      available: Math.round(memAvailable)
    };
  } catch (error) {
    return null;
  }
}

/**
 * 检查内存使用情况
 */
function checkMemory(): MemoryCheck {
  const memUsage = process.memoryUsage();

  // 转换为MB
  const rss = (memUsage.rss / 1024 / 1024).toFixed(2);
  const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const external = (memUsage.external / 1024 / 1024).toFixed(2);

  // 计算进程堆内存使用百分比
  const processHeapPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  // 获取系统内存信息
  const systemMem = getSystemMemory();

  let percentUsed: number;
  let status: 'ok' | 'warning' | 'critical';
  let message: string;

  if (systemMem) {
    // 使用系统内存使用率作为主要指标
    percentUsed = Math.round((systemMem.used / systemMem.total) * 100);

    if (percentUsed >= THRESHOLDS.memory.critical) {
      status = 'critical';
      message = `系统内存使用率过高: ${percentUsed}% (临界值: ${THRESHOLDS.memory.critical}%)`;
    } else if (percentUsed >= THRESHOLDS.memory.warning) {
      status = 'warning';
      message = `系统内存使用率较高: ${percentUsed}% (警告值: ${THRESHOLDS.memory.warning}%)`;
    } else {
      status = 'ok';
      message = `内存使用正常: ${percentUsed}% (可用: ${systemMem.available} MB)`;
    }
  } else {
    // 如果无法获取系统内存，使用进程堆内存作为降级方案
    percentUsed = processHeapPercent;

    if (percentUsed >= THRESHOLDS.memory.critical) {
      status = 'critical';
      message = `进程堆内存使用率过高: ${percentUsed}% (临界值: ${THRESHOLDS.memory.critical}%)`;
    } else if (percentUsed >= THRESHOLDS.memory.warning) {
      status = 'warning';
      message = `进程堆内存使用率较高: ${percentUsed}% (警告值: ${THRESHOLDS.memory.warning}%)`;
    } else {
      status = 'ok';
      message = `进程堆内存使用正常: ${percentUsed}%`;
    }
  }

  const result: MemoryCheck = {
    status,
    message,
    usage: {
      rss: `${rss} MB`,
      heapTotal: `${heapTotal} MB`,
      heapUsed: `${heapUsed} MB`,
      external: `${external} MB`,
      percentUsed
    }
  };

  // 如果有系统内存信息，添加到返回值中
  if (systemMem) {
    (result.usage as any).system = {
      total: `${systemMem.total} MB`,
      used: `${systemMem.used} MB`,
      free: `${systemMem.free} MB`,
      available: `${systemMem.available} MB`,
      percentUsed
    };
  }

  return result;
}

/**
 * 执行完整的健康检查
 */
export async function performHealthCheck(includeMetrics = false): Promise<HealthCheckResult> {
  const warnings: string[] = [];

  // 并行执行所有检查
  const [database, redis, memory] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    Promise.resolve(checkMemory())
  ]);

  // 收集告警信息
  if (database.status === 'error') {
    warnings.push(database.message);
  }

  if (database.connectionPool) {
    const poolUsage = ((database.connectionPool.total - database.connectionPool.idle) / database.connectionPool.total) * 100;
    if (poolUsage >= THRESHOLDS.connectionPool.critical) {
      warnings.push(`数据库连接池使用率过高: ${poolUsage.toFixed(1)}%`);
    } else if (poolUsage >= THRESHOLDS.connectionPool.warning) {
      warnings.push(`数据库连接池使用率较高: ${poolUsage.toFixed(1)}%`);
    }
  }

  if (redis.status === 'error') {
    warnings.push(redis.message);
  }

  if (memory.status === 'critical' || memory.status === 'warning') {
    warnings.push(memory.message);
  }

  // 确定整体状态
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

  if (database.status === 'error') {
    overallStatus = 'unhealthy';
  } else if (warnings.length > 0 || memory.status === 'critical') {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.app.nodeEnv,
    checks: {
      database,
      redis,
      memory
    },
    warnings
  };

  // 如果需要，添加性能指标（由中间件提供）
  if (includeMetrics && global.apiMetrics) {
    result.metrics = global.apiMetrics;

    // 检查响应时间告警
    if (global.apiMetrics.averageResponseTime >= THRESHOLDS.responseTime.critical) {
      warnings.push(`API平均响应时间过慢: ${global.apiMetrics.averageResponseTime}ms (临界值: ${THRESHOLDS.responseTime.critical}ms)`);
      if (overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    } else if (global.apiMetrics.averageResponseTime >= THRESHOLDS.responseTime.warning) {
      warnings.push(`API平均响应时间较慢: ${global.apiMetrics.averageResponseTime}ms (警告值: ${THRESHOLDS.responseTime.warning}ms)`);
      if (overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }

    // 标注最慢的端点
    if (global.apiMetrics.slowestEndpoint && global.apiMetrics.slowestTime) {
      if (global.apiMetrics.slowestTime >= THRESHOLDS.responseTime.warning) {
        warnings.push(`最慢端点 ${global.apiMetrics.slowestEndpoint}: ${global.apiMetrics.slowestTime}ms`);
      }
    }
  }

  // 更新最终状态和告警列表
  result.status = overallStatus;
  result.warnings = warnings;

  return result;
}
