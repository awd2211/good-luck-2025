import { Request, Response, NextFunction } from 'express'
import * as authService from '../../services/user/authService'

/**
 * 发送验证码
 */
export const sendCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的手机号',
      })
    }

    await authService.sendVerificationCode(phone)

    res.json({
      success: true,
      message: '验证码已发送',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 验证码登录
 */
export const loginWithCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code } = req.body

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: '手机号和验证码不能为空',
      })
    }

    const result = await authService.loginWithCode(phone, code)

    res.json({
      success: true,
      message: '登录成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 密码登录
 */
export const loginWithPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: '手机号和密码不能为空',
      })
    }

    const result = await authService.loginWithPassword(phone, password)

    res.json({
      success: true,
      message: '登录成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 用户注册
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code, password, nickname } = req.body

    if (!phone || !code || !password) {
      return res.status(400).json({
        success: false,
        message: '手机号、验证码和密码不能为空',
      })
    }

    const result = await authService.register({ phone, code, password, nickname })

    res.json({
      success: true,
      message: '注册成功',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取当前用户信息
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const profile = await authService.getUserProfile(req.user.id)

    res.json({
      success: true,
      data: profile,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 更新个人信息
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { nickname, avatar } = req.body
    const profile = await authService.updateUserProfile(req.user.id, { nickname, avatar })

    res.json({
      success: true,
      message: '更新成功',
      data: profile,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 修改密码
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码和新密码不能为空',
      })
    }

    await authService.changePassword(req.user.id, oldPassword, newPassword)

    res.json({
      success: true,
      message: '密码修改成功',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 重置密码
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code, newPassword } = req.body

    if (!phone || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '手机号、验证码和新密码不能为空',
      })
    }

    await authService.resetPassword(phone, code, newPassword)

    res.json({
      success: true,
      message: '密码重置成功',
    })
  } catch (error) {
    next(error)
  }
}
