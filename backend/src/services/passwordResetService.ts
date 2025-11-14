/**
 * 密码重置服务
 */

import crypto from 'crypto'
import { query } from '../config/database'
import { hashPassword } from './authService'
import { sendPasswordResetEmail } from './emailService'

/**
 * 生成密码重置令牌
 */
const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 请求密码重置
 */
export const requestPasswordReset = async (email: string) => {
  // 查找用户
  const result = await query(
    'SELECT id, username, email FROM admins WHERE email = $1',
    [email]
  )

  if (!result.rows[0]) {
    // 为了安全，即使邮箱不存在也返回成功
    // 这样可以防止攻击者枚举有效邮箱
    return {
      success: true,
      message: '如果该邮箱存在，重置链接已发送',
    }
  }

  const admin = result.rows[0]

  // 生成重置令牌
  const token = generateResetToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1小时后过期

  // 保存令牌到数据库
  await query(
    `INSERT INTO password_reset_tokens (admin_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [admin.id, token, expiresAt]
  )

  // 发送重置邮件
  try {
    await sendPasswordResetEmail(admin.email, admin.username, token)
  } catch (error) {
    console.error('发送重置邮件失败:', error)
    throw new Error('邮件发送失败，请稍后重试')
  }

  return {
    success: true,
    message: '重置链接已发送到您的邮箱',
  }
}

/**
 * 验证重置令牌
 */
export const verifyResetToken = async (token: string) => {
  const result = await query(
    `SELECT prt.*, a.username, a.email
     FROM password_reset_tokens prt
     JOIN admins a ON prt.admin_id = a.id
     WHERE prt.token = $1
       AND prt.used = false
       AND prt.expires_at > NOW()`,
    [token]
  )

  if (!result.rows[0]) {
    throw new Error('无效或已过期的重置链接')
  }

  return {
    valid: true,
    adminId: result.rows[0].admin_id,
    username: result.rows[0].username,
    email: result.rows[0].email,
  }
}

/**
 * 重置密码
 */
export const resetPassword = async (token: string, newPassword: string) => {
  // 验证令牌
  const tokenData = await verifyResetToken(token)

  // 哈希新密码
  const hashedPassword = await hashPassword(newPassword)

  // 开始事务
  try {
    // 更新密码
    await query(
      'UPDATE admins SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, tokenData.adminId]
    )

    // 标记令牌为已使用
    await query(
      'UPDATE password_reset_tokens SET used = true WHERE token = $1',
      [token]
    )

    // 删除该用户的所有其他未使用的重置令牌
    await query(
      `DELETE FROM password_reset_tokens
       WHERE admin_id = $1 AND token != $2 AND used = false`,
      [tokenData.adminId, token]
    )

    return {
      success: true,
      message: '密码重置成功',
    }
  } catch (error) {
    console.error('密码重置失败:', error)
    throw new Error('密码重置失败')
  }
}

/**
 * 清理过期的重置令牌（定时任务）
 */
export const cleanupExpiredTokens = async () => {
  await query(
    `DELETE FROM password_reset_tokens
     WHERE expires_at < NOW() OR used = true`,
    []
  )
}
