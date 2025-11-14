/**
 * 双因素认证控制器
 */

import { Request, Response } from 'express'
import * as twoFactorService from '../services/twoFactorService'
import { send2FAEnabledEmail } from '../services/emailService'
import { query } from '../config/database'

/**
 * 生成2FA设置（获取二维码）
 */
export const setup2FA = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    // 获取用户信息
    const result = await query(
      'SELECT username, email FROM admins WHERE id = $1',
      [req.user.id]
    )

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      })
    }

    const { username, email } = result.rows[0]

    // 生成密钥和二维码
    const { secret, qrCode, manualEntry } =
      await twoFactorService.generateTwoFactorSecret(username, email || username)

    // 生成备用代码
    const backupCodes = twoFactorService.generateBackupCodes()

    // 临时保存到session或返回给前端（不立即保存到数据库）
    res.json({
      success: true,
      data: {
        secret,
        qrCode,
        manualEntry,
        backupCodes,
      },
    })
  } catch (error) {
    console.error('生成2FA设置失败:', error)
    res.status(500).json({
      success: false,
      message: '生成2FA设置失败',
    })
  }
}

/**
 * 启用2FA（验证后）
 */
export const enable2FA = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { secret, token, backupCodes } = req.body

    if (!secret || !token || !backupCodes) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      })
    }

    // 验证用户输入的验证码
    const isValid = twoFactorService.verifyTwoFactorToken(secret, token)

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '验证码错误，请重试',
      })
    }

    // 启用2FA
    await twoFactorService.enableTwoFactor(req.user.id, secret, backupCodes)

    // 发送启用通知邮件
    const result = await query(
      'SELECT username, email FROM admins WHERE id = $1',
      [req.user.id]
    )

    if (result.rows[0]?.email) {
      await send2FAEnabledEmail(
        result.rows[0].email,
        result.rows[0].username
      ).catch((err) => console.error('发送2FA通知邮件失败:', err))
    }

    res.json({
      success: true,
      message: '双因素认证已启用',
    })
  } catch (error) {
    console.error('启用2FA失败:', error)
    res.status(500).json({
      success: false,
      message: '启用2FA失败',
    })
  }
}

/**
 * 禁用2FA
 */
export const disable2FA = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { password } = req.body

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '请输入密码以确认操作',
      })
    }

    // 验证密码（使用authService的login逻辑）
    const bcrypt = require('bcryptjs')
    const result = await query(
      'SELECT password FROM admins WHERE id = $1',
      [req.user.id]
    )

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      })
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      result.rows[0].password
    )

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '密码错误',
      })
    }

    // 禁用2FA
    await twoFactorService.disableTwoFactor(req.user.id)

    res.json({
      success: true,
      message: '双因素认证已禁用',
    })
  } catch (error) {
    console.error('禁用2FA失败:', error)
    res.status(500).json({
      success: false,
      message: '禁用2FA失败',
    })
  }
}

/**
 * 获取2FA状态
 */
export const get2FAStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const status = await twoFactorService.getTwoFactorStatus(req.user.id)

    res.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('获取2FA状态失败:', error)
    res.status(500).json({
      success: false,
      message: '获取2FA状态失败',
    })
  }
}

/**
 * 重新生成备用代码
 */
export const regenerateBackupCodes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      })
    }

    const { password } = req.body

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '请输入密码以确认操作',
      })
    }

    // 验证密码
    const bcrypt = require('bcryptjs')
    const result = await query(
      'SELECT password, two_factor_enabled FROM admins WHERE id = $1',
      [req.user.id]
    )

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      })
    }

    if (!result.rows[0].two_factor_enabled) {
      return res.status(400).json({
        success: false,
        message: '未启用双因素认证',
      })
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      result.rows[0].password
    )

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '密码错误',
      })
    }

    // 生成新的备用代码
    const backupCodes = twoFactorService.generateBackupCodes()

    await query(
      'UPDATE admins SET two_factor_backup_codes = $1 WHERE id = $2',
      [backupCodes, req.user.id]
    )

    res.json({
      success: true,
      data: { backupCodes },
      message: '备用代码已重新生成',
    })
  } catch (error) {
    console.error('重新生成备用代码失败:', error)
    res.status(500).json({
      success: false,
      message: '重新生成备用代码失败',
    })
  }
}
