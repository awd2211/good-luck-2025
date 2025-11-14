import { Request, Response } from 'express'
import { login, refreshToken, changePassword } from '../services/authService'

/**
 * 用户登录
 */
export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { username, password, twoFactorToken } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      })
    }

    const result = await login(username, password, twoFactorToken)

    // 如果需要2FA验证
    if (result.requiresTwoFactor) {
      return res.status(200).json({
        success: false,
        requiresTwoFactor: true,
        message: result.message,
      })
    }

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

/**
 * 修改密码
 */
export const changePasswordHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { old_password, new_password } = req.body

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空',
      })
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少8个字符',
      })
    }

    const result = await changePassword(req.user.id, old_password, new_password)

    res.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : '密码修改失败',
    })
  }
}
