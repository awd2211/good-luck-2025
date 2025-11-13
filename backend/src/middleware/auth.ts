import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../services/authService'
import { Role, Resource, Action, hasPermission } from '../config/permissions'

// 扩展 Express Request 类型，添加 user 属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        username: string
        role: string
        email: string
      }
    }
  }
}

/**
 * JWT 认证中间件
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证token',
      })
    }

    // Bearer token 格式: "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader

    // 验证 token
    const decoded = verifyToken(token)

    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email,
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token无效或已过期',
    })
  }
}

/**
 * 角色权限检查中间件
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证',
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      })
    }

    next()
  }
}

/**
 * 可选认证中间件（不强制要求登录）
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader

      const decoded = verifyToken(token)
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        email: decoded.email,
      }
    }
  } catch (error) {
    // 可选认证失败不影响继续
  }

  next()
}

/**
 * 细粒度权限检查中间件
 * @param resource 资源类型
 * @param action 操作类型
 */
export const requirePermission = (resource: Resource, action: Action) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证',
      })
    }

    const userRole = req.user.role as Role

    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法执行此操作',
      })
    }

    next()
  }
}

/**
 * 组合中间件：认证 + 权限检查
 * @param resource 资源类型
 * @param action 操作类型
 */
export const requireAuth = (resource: Resource, action: Action) => {
  return [authenticate, requirePermission(resource, action)]
}
