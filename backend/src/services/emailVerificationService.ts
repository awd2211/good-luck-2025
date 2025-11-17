/**
 * 邮件验证码服务
 */
import { query } from '../config/database'
import crypto from 'crypto'

// 生成6位随机验证码
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 发送验证码（保存到数据库）
export const createVerificationCode = async (
  email: string,
  purpose: 'register' | 'login' | 'reset_password',
  ipAddress?: string
): Promise<string> => {
  // 1. 检查频率限制（1分钟内只能发送1次）
  const recentCodeResult = await query(
    `SELECT * FROM email_verification_codes
     WHERE email = $1
     AND purpose = $2
     AND created_at > NOW() - INTERVAL '1 minute'
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, purpose]
  )

  if (recentCodeResult.rows.length > 0) {
    const lastSentAt = recentCodeResult.rows[0].created_at
    const waitSeconds = 60 - Math.floor((Date.now() - new Date(lastSentAt).getTime()) / 1000)
    throw new Error(`验证码发送过于频繁，请${waitSeconds}秒后再试`)
  }

  // 2. 生成验证码
  const code = generateVerificationCode()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5分钟后过期

  // 3. 保存到数据库
  await query(
    `INSERT INTO email_verification_codes
     (email, code, purpose, expires_at, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [email, code, purpose, expiresAt, ipAddress]
  )

  return code
}

// 验证验证码
export const verifyCode = async (
  email: string,
  code: string,
  purpose: 'register' | 'login' | 'reset_password'
): Promise<boolean> => {
  const result = await query(
    `SELECT * FROM email_verification_codes
     WHERE email = $1
     AND code = $2
     AND purpose = $3
     AND is_used = false
     AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, code, purpose]
  )

  if (result.rows.length === 0) {
    return false
  }

  // 标记为已使用
  await query(
    `UPDATE email_verification_codes
     SET is_used = true
     WHERE id = $1`,
    [result.rows[0].id]
  )

  return true
}

// 清理过期验证码（定时任务）
export const cleanupExpiredCodes = async (): Promise<number> => {
  const result = await query(
    `DELETE FROM email_verification_codes
     WHERE expires_at < NOW() OR is_used = true`
  )
  return result.rowCount || 0
}

// 检查邮箱是否已注册
export const isEmailRegistered = async (email: string): Promise<boolean> => {
  const result = await query(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [email]
  )
  return result.rows.length > 0
}

// 检查昵称是否已被使用
export const isNicknameUsed = async (nickname: string): Promise<boolean> => {
  const result = await query(
    'SELECT id FROM users WHERE nickname = $1 LIMIT 1',
    [nickname]
  )
  return result.rows.length > 0
}
