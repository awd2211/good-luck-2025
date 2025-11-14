/**
 * 双因素认证服务
 * 使用TOTP (Time-based One-Time Password) 算法
 */

import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { query } from '../config/database'

/**
 * 生成2FA密钥和二维码
 */
export const generateTwoFactorSecret = async (username: string, email: string) => {
  // 生成密钥
  const secret = speakeasy.generateSecret({
    name: `算命平台管理后台 (${username})`,
    issuer: '算命平台',
    length: 32,
  })

  // 生成二维码
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '')

  return {
    secret: secret.base32, // 保存到数据库的密钥
    qrCode: qrCodeUrl,     // 显示给用户的二维码
    manualEntry: secret.base32, // 手动输入的密钥
  }
}

/**
 * 验证2FA验证码
 */
export const verifyTwoFactorToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // 允许前后2个时间窗口，提高容错性
  })
}

/**
 * 生成备用恢复代码
 */
export const generateBackupCodes = (count: number = 8): string[] => {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // 生成8位随机代码
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

/**
 * 验证备用恢复代码
 */
export const verifyBackupCode = async (
  userId: string,
  code: string
): Promise<boolean> => {
  // 获取用户的备用代码
  const result = await query(
    'SELECT two_factor_backup_codes FROM admins WHERE id = $1',
    [userId]
  )

  if (!result.rows[0] || !result.rows[0].two_factor_backup_codes) {
    return false
  }

  const backupCodes = result.rows[0].two_factor_backup_codes as string[]

  // 检查代码是否存在
  const codeIndex = backupCodes.findIndex(
    (c) => c.toUpperCase() === code.toUpperCase()
  )

  if (codeIndex === -1) {
    return false
  }

  // 使用后删除该代码
  const updatedCodes = backupCodes.filter((_, index) => index !== codeIndex)
  await query(
    'UPDATE admins SET two_factor_backup_codes = $1 WHERE id = $2',
    [updatedCodes, userId]
  )

  return true
}

/**
 * 启用2FA
 */
export const enableTwoFactor = async (
  userId: string,
  secret: string,
  backupCodes: string[]
) => {
  await query(
    `UPDATE admins
     SET two_factor_enabled = true,
         two_factor_secret = $1,
         two_factor_backup_codes = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [secret, backupCodes, userId]
  )
}

/**
 * 禁用2FA
 */
export const disableTwoFactor = async (userId: string) => {
  await query(
    `UPDATE admins
     SET two_factor_enabled = false,
         two_factor_secret = NULL,
         two_factor_backup_codes = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  )
}

/**
 * 获取用户的2FA状态
 */
export const getTwoFactorStatus = async (userId: string) => {
  const result = await query(
    `SELECT two_factor_enabled, two_factor_secret, two_factor_backup_codes
     FROM admins WHERE id = $1`,
    [userId]
  )

  if (!result.rows[0]) {
    throw new Error('用户不存在')
  }

  const row = result.rows[0]
  return {
    enabled: row.two_factor_enabled || false,
    hasSecret: !!row.two_factor_secret,
    backupCodesCount: row.two_factor_backup_codes
      ? row.two_factor_backup_codes.length
      : 0,
  }
}
