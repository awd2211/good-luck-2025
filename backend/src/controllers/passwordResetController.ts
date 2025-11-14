/**
 * 密码重置控制器
 */

import { Request, Response } from 'express'
import * as passwordResetService from '../services/passwordResetService'

/**
 * 请求密码重置
 */
export const requestReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: '请输入邮箱地址',
      })
    }

    const result = await passwordResetService.requestPasswordReset(email)

    res.json(result)
  } catch (error) {
    console.error('请求密码重置失败:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '请求失败',
    })
  }
}

/**
 * 验证重置令牌
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: '无效的令牌',
      })
    }

    const result = await passwordResetService.verifyResetToken(token)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : '令牌验证失败',
    })
  }
}

/**
 * 重置密码
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少8个字符',
      })
    }

    const result = await passwordResetService.resetPassword(token, newPassword)

    res.json(result)
  } catch (error) {
    console.error('密码重置失败:', error)
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : '密码重置失败',
    })
  }
}
