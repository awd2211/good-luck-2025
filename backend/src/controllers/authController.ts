import { Request, Response } from 'express'
import { login, refreshToken } from '../services/authService'

/**
 * 用户登录
 */
export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      })
    }

    const result = await login(username, password)

    res.json({
      success: true,
      message: '登录成功',
      data: result,
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : '登录失败',
    })
  }
}

/**
 * 刷新 token
 */
export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token不能为空',
      })
    }

    const newToken = refreshToken(token)

    res.json({
      success: true,
      message: 'Token刷新成功',
      data: { token: newToken },
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Token刷新失败',
    })
  }
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '未登录',
    })
  }

  res.json({
    success: true,
    data: req.user,
  })
}

/**
 * 用户登出（客户端清除token即可）
 */
export const logout = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '登出成功',
  })
}
