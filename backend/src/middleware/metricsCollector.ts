import { Request, Response, NextFunction } from 'express';

interface RouteMetrics {
  count: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  lastAccess: string;
}

interface ApiMetrics {
  requests: {
    total: number;
    averageResponseTime: number;
    slowestEndpoint?: string;
    slowestTime?: number;
  };
  routes: Map<string, RouteMetrics>;
}

// 全局指标存储
const metrics: ApiMetrics = {
  requests: {
    total: 0,
    averageResponseTime: 0
  },
  routes: new Map()
};

// 将指标暴露到全局，供健康检查使用
declare global {
  // eslint-disable-next-line no-var
  var apiMetrics: {
    total: number;
    averageResponseTime: number;
    slowestEndpoint?: string;
    slowestTime?: number;
  };
}

global.apiMetrics = metrics.requests;

/**
 * API 性能指标收集中间件
 */
export function metricsCollector(req: Request, res: Response, next: NextFunction): void {
  // 跳过健康检查端点和静态资源
  if (req.path === '/health' || req.path === '/' || req.path.startsWith('/static')) {
    return next();
  }

  const startTime = Date.now();

  // 监听响应完成事件
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const route = `${req.method} ${req.path}`;

    // 更新路由级别指标
    const routeMetrics = metrics.routes.get(route);
    if (routeMetrics) {
      routeMetrics.count++;
      routeMetrics.totalTime += responseTime;
      routeMetrics.minTime = Math.min(routeMetrics.minTime, responseTime);
      routeMetrics.maxTime = Math.max(routeMetrics.maxTime, responseTime);
      routeMetrics.lastAccess = new Date().toISOString();
    } else {
      metrics.routes.set(route, {
        count: 1,
        totalTime: responseTime,
        minTime: responseTime,
        maxTime: responseTime,
        lastAccess: new Date().toISOString()
      });
    }

    // 更新全局指标
    metrics.requests.total++;

    // 计算平均响应时间（使用所有路由的总时间）
    let totalTime = 0;
    let totalCount = 0;
    metrics.routes.forEach((route) => {
      totalTime += route.totalTime;
      totalCount += route.count;
    });
    metrics.requests.averageResponseTime = totalCount > 0 ? Math.round(totalTime / totalCount) : 0;

    // 找出最慢的端点
    let slowestEndpoint = '';
    let slowestTime = 0;
    metrics.routes.forEach((routeMetrics, routePath) => {
      const avgTime = routeMetrics.totalTime / routeMetrics.count;
      if (avgTime > slowestTime) {
        slowestTime = avgTime;
        slowestEndpoint = routePath;
      }
    });

    if (slowestEndpoint) {
      metrics.requests.slowestEndpoint = slowestEndpoint;
      metrics.requests.slowestTime = Math.round(slowestTime);
    }
  });

  next();
}

/**
 * 获取所有指标（用于详细监控）
 */
export function getMetrics(): ApiMetrics {
  return metrics;
}

/**
 * 重置指标（用于测试或定期清理）
 */
export function resetMetrics(): void {
  metrics.requests.total = 0;
  metrics.requests.averageResponseTime = 0;
  delete metrics.requests.slowestEndpoint;
  delete metrics.requests.slowestTime;
  metrics.routes.clear();
}
