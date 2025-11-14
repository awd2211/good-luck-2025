import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'

// 注意：不需要重复声明，已在 auth.ts 中定义

/**
 * 用户认证中间件
 * 验证JWT token，将用户信息附加到req.user
 */
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证token',
      })
    }

    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀

    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; role: string }

    // 确保是用户token
    if (decoded.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      })
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.id,
      username: '', // 用户端不使用username
      role: decoded.role,
      email: '', // 用户端不使用email
    }

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token已过期',
      })
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Token无效',
      })
    }

    return res.status(500).json({
      success: false,
      message: '认证失败',
    })
  }
}

/**
 * 可选的用户认证中间件
 * Token存在时验证，不存在时跳过
 */
export const optionalUserAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 没有token，跳过认证
      return next()
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; role: string }

    if (decoded.role === 'user') {
      req.user = {
        id: decoded.id,
        username: '',
        role: decoded.role,
        email: '',
      }
    }

    next()
  } catch (error) {
    // Token无效，但不阻止请求继续
    next()
  }
}
