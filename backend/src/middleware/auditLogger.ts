/**
 * 自动审计日志记录中间件
 * 自动拦截所有管理端API请求并记录操作日志
 */

import { Request, Response, NextFunction } from 'express';
import { addAuditLog } from '../services/auditService';

/**
 * 从请求URL智能识别操作类型
 */
const getActionFromRequest = (req: Request): string => {
  const method = req.method;
  const path = req.path;

  // 特殊路径识别
  if (path.includes('/login')) return '登录';
  if (path.includes('/logout')) return '登出';
  if (path.includes('/register')) return '注册';

  // 根据HTTP方法识别
  switch (method) {
    case 'POST':
      return '创建';
    case 'PUT':
    case 'PATCH':
      return '更新';
    case 'DELETE':
      return '删除';
    case 'GET':
    default:
      return '查看';
  }
};

/**
 * 从URL提取资源名称
 */
const getResourceFromUrl = (path: string): string => {
  // 移除API前缀
  let resource = path.replace(/^\/api\/(manage\/)?/, '');

  // 资源映射表
  const resourceMap: Record<string, string> = {
    '/auth': '认证',
    '/users': '用户管理',
    '/orders': '订单管理',
    '/banners': '横幅管理',
    '/notifications': '通知管理',
    '/coupons': '优惠券管理',
    '/refunds': '退款管理',
    '/feedbacks': '反馈管理',
    '/reviews': '评价管理',
    '/admins': '管理员管理',
    '/roles': '角色管理',
    '/audit': '审计日志',
    '/stats': '统计数据',
    '/fortune-categories': '算命分类',
    '/fortune-services': '算命服务',
    '/fortune-templates': '算命模板',
    '/daily-horoscopes': '每日运势',
    '/articles': '文章管理',
    '/ai-models': 'AI模型管理',
    '/system-configs': '系统配置',
    '/attribution': '归因分析',
    '/cs/agents': '客服管理',
    '/cs/sessions': '客服会话',
    '/chat': '在线聊天'
  };

  // 查找匹配的资源
  for (const [key, value] of Object.entries(resourceMap)) {
    if (resource.includes(key)) {
      return value;
    }
  }

  // 提取第一级路径作为资源名
  const parts = resource.split('/');
  return parts[0] || '未知资源';
};

/**
 * 从URL提取资源ID
 */
const getResourceIdFromUrl = (path: string): string | undefined => {
  // 匹配 /resource/id 格式
  const match = path.match(/\/([a-zA-Z-]+)\/([a-zA-Z0-9-]+)$/);
  if (match && match[2]) {
    return match[2];
  }
  return undefined;
};

/**
 * 判断日志等级
 */
const getLogLevel = (req: Request, statusCode: number): 'info' | 'warning' | 'error' => {
  // HTTP 错误 = error
  if (statusCode >= 400) {
    return 'error';
  }

  // 敏感操作 = warning
  const sensitiveActions = ['delete', 'remove', 'clean', 'archive', 'reset'];
  const path = req.path.toLowerCase();

  for (const action of sensitiveActions) {
    if (path.includes(action) || req.method === 'DELETE') {
      return 'warning';
    }
  }

  // 其他 = info
  return 'info';
};

/**
 * 判断操作状态
 */
const getStatus = (statusCode: number): 'success' | 'failed' | 'warning' => {
  if (statusCode >= 400) return 'failed';
  if (statusCode >= 300) return 'warning';
  return 'success';
};

/**
 * 判断是否需要记录日志
 */
const shouldLog = (req: Request): boolean => {
  const path = req.path;

  // 忽略的路径
  const ignorePaths = [
    '/health',
    '/api/audit', // 避免日志查询产生日志
    '/api/manage/audit' // 避免日志查询产生日志
  ];

  for (const ignorePath of ignorePaths) {
    if (path.startsWith(ignorePath)) {
      return false;
    }
  }

  // 只记录管理端API
  return path.startsWith('/api/manage/');
};

/**
 * 审计日志中间件
 */
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  // 检查是否需要记录
  if (!shouldLog(req)) {
    return next();
  }

  const startTime = Date.now();

  // 保存原始的res.send方法
  const originalSend = res.send;
  const originalJson = res.json;

  let isLogged = false;

  // 记录日志的函数
  const logAudit = async () => {
    if (isLogged) return; // 防止重复记录
    isLogged = true;

    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    // 提取用户信息
    const userId = req.user?.id || 'anonymous';
    const username = req.user?.username || '未登录';

    // 提取IP地址(支持代理)
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';

    // 构建详情信息
    const action = getActionFromRequest(req);
    const resource = getResourceFromUrl(req.path);
    const resourceId = getResourceIdFromUrl(req.path);

    let details = `${action}${resource}`;
    if (resourceId) {
      details += ` (ID: ${resourceId})`;
    }

    // 构建请求体(过滤敏感信息)
    let requestBody = '';
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      // 过滤敏感字段
      delete sanitizedBody.password;
      delete sanitizedBody.oldPassword;
      delete sanitizedBody.newPassword;
      delete sanitizedBody.token;

      requestBody = JSON.stringify(sanitizedBody);
      // 限制长度
      if (requestBody.length > 1000) {
        requestBody = requestBody.substring(0, 1000) + '...';
      }
    }

    try {
      await addAuditLog({
        userId,
        username,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent: req.headers['user-agent'],
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        requestBody,
        responseStatus: statusCode,
        responseTime,
        status: getStatus(statusCode),
        level: getLogLevel(req, statusCode)
      });
    } catch (error) {
      // 记录日志失败不应影响业务
      console.error('审计日志记录失败:', error);
    }
  };

  // 重写res.send
  res.send = function (data: any) {
    logAudit();
    return originalSend.call(this, data);
  };

  // 重写res.json
  res.json = function (data: any) {
    logAudit();
    return originalJson.call(this, data);
  };

  // 监听finish事件(作为备份)
  res.on('finish', () => {
    logAudit();
  });

  next();
};

/**
 * 手动记录日志(用于特殊场景)
 */
export const logManual = async (req: Request, action: string, resource: string, details: string) => {
  try {
    const userId = req.user?.id || 'system';
    const username = req.user?.username || '系统';
    const ipAddress = req.ip || 'unknown';

    await addAuditLog({
      userId,
      username,
      action,
      resource,
      details,
      ipAddress,
      userAgent: req.headers['user-agent'],
      status: 'success',
      level: 'info'
    });
  } catch (error) {
    console.error('手动记录日志失败:', error);
  }
};
