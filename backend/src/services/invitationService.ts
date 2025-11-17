/**
 * 管理员邀请服务
 */

import { query } from '../config/database'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

/**
 * 生成邀请令牌
 */
const generateInvitationToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 发送邀请邮件
 */
const sendInvitationEmail = async (
  email: string,
  username: string,
  invitationToken: string,
  invitedBy: string
) => {
  const nodemailer = require('nodemailer')

  // 构建邀请链接
  const invitationUrl = `${process.env.ADMIN_FRONTEND_URL || 'http://localhost:50303'}/accept-invitation?token=${invitationToken}`

  const subject = '您收到了 LUCK.DAY 管理后台的邀请'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1890ff;">🎉 管理员邀请</h2>
      <p>您好，<strong>${username}</strong>！</p>
      <p><strong>${invitedBy}</strong> 邀请您加入 <strong>LUCK.DAY 管理后台</strong>。</p>
      <p>点击下面的按钮接受邀请并设置您的账号密码：</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invitationUrl}"
           style="background-color: #1890ff; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
          接受邀请并设置密码
        </a>
      </div>
      <p>或者复制以下链接到浏览器：</p>
      <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">${invitationUrl}</p>
      <div style="background: #fff7e6; border-left: 4px solid #faad14; padding: 12px; margin: 20px 0;">
        <p style="margin: 0; color: #faad14; font-weight: bold;">⚠️ 重要提示</p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #666;">
          <li>此邀请链接将在<strong>7天</strong>后过期</li>
          <li>接受邀请后，请妥善保管您的登录凭据</li>
          <li>如果您没有请求此邀请，请忽略此邮件</li>
        </ul>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        © 2025 LUCK.DAY. All rights reserved.
      </p>
    </div>
  `

  try {
    // 获取SMTP配置
    const smtpResult = await query(
      `SELECT config_value FROM system_configs WHERE config_key = 'smtp_settings'`
    )

    let transporter: any

    if (smtpResult.rows.length > 0 && smtpResult.rows[0].config_value.enabled) {
      // 使用数据库配置的SMTP
      const smtpSettings = smtpResult.rows[0].config_value

      if (smtpSettings.email_type === 'smtp') {
        transporter = nodemailer.createTransport({
          host: smtpSettings.smtp_host,
          port: parseInt(smtpSettings.smtp_port),
          secure: smtpSettings.smtp_secure === true,
          auth: {
            user: smtpSettings.smtp_user,
            pass: smtpSettings.smtp_password,
          },
        })
      } else {
        // 第三方API暂时不支持
        console.warn('⚠️ 邀请邮件暂不支持第三方API服务，使用测试模式')
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'test@ethereal.email',
            pass: 'test123456',
          },
        })
      }
    } else {
      // 使用测试传输器
      console.warn('⚠️ 邮件服务未配置，使用测试模式')
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test123456',
        },
      })
    }

    const mailOptions = {
      from: '"LUCK.DAY" <noreply@luck.day>',
      to: email,
      subject,
      html,
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ 邀请邮件已发送:', info.messageId)
    console.log('📧 收件人:', email)
    console.log('🔗 邀请链接:', invitationUrl)

    return { success: true, messageId: info.messageId, invitationUrl }
  } catch (error: any) {
    console.error('❌ 发送邀请邮件失败:', error)
    throw new Error(`发送邀请邮件失败: ${error.message}`)
  }
}

/**
 * 创建邀请
 */
export const createInvitation = async (
  email: string,
  username: string,
  role: string,
  invitedBy: string
) => {
  // 检查邮箱是否已被使用
  const existingAdmin = await query(
    'SELECT id FROM admins WHERE email = $1',
    [email]
  )

  if (existingAdmin.rows.length > 0) {
    throw new Error('该邮箱已被使用')
  }

  // 检查用户名是否已被使用
  const existingUsername = await query(
    'SELECT id FROM admins WHERE username = $1',
    [username]
  )

  if (existingUsername.rows.length > 0) {
    throw new Error('该用户名已被使用')
  }

  // 检查是否有待处理的邀请
  const existingInvitation = await query(
    'SELECT id FROM admin_invitations WHERE email = $1 AND status = $2',
    [email, 'pending']
  )

  if (existingInvitation.rows.length > 0) {
    throw new Error('该邮箱已有待处理的邀请')
  }

  // 生成邀请令牌
  const invitationToken = generateInvitationToken()

  // 设置过期时间（7天后）
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // 插入邀请记录
  const result = await query(
    `INSERT INTO admin_invitations (email, username, role, invitation_token, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [email, username, role, invitationToken, invitedBy, expiresAt]
  )

  const invitation = result.rows[0]

  // 发送邀请邮件
  await sendInvitationEmail(email, username, invitationToken, invitedBy)

  return {
    id: invitation.id,
    email: invitation.email,
    username: invitation.username,
    role: invitation.role,
    invited_by: invitation.invited_by,
    expires_at: invitation.expires_at,
    status: invitation.status,
  }
}

/**
 * 获取待处理的邀请列表
 */
export const getPendingInvitations = async () => {
  const result = await query(
    `SELECT id, email, username, role, invited_by, expires_at, status, created_at
     FROM admin_invitations
     WHERE status = 'pending' AND expires_at > NOW()
     ORDER BY created_at DESC`
  )

  return result.rows
}

/**
 * 获取所有邀请（包括已过期）
 */
export const getAllInvitations = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit

  const result = await query(
    `SELECT id, email, username, role, invited_by, expires_at, status, created_at, accepted_at
     FROM admin_invitations
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )

  const countResult = await query(
    'SELECT COUNT(*) FROM admin_invitations'
  )

  return {
    invitations: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
  }
}

/**
 * 验证邀请令牌
 */
export const validateInvitationToken = async (token: string) => {
  const result = await query(
    `SELECT * FROM admin_invitations
     WHERE invitation_token = $1 AND status = 'pending' AND expires_at > NOW()`,
    [token]
  )

  if (result.rows.length === 0) {
    throw new Error('邀请链接无效或已过期')
  }

  return result.rows[0]
}

/**
 * 接受邀请并创建管理员账号
 */
export const acceptInvitation = async (token: string, password: string) => {
  // 验证邀请
  const invitation = await validateInvitationToken(token)

  // 开始事务
  const client = await query('BEGIN')

  try {
    // 创建管理员账号
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    const adminResult = await query(
      `INSERT INTO admins (username, email, password, role, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id, username, email, role, status, created_at`,
      [invitation.username, invitation.email, hashedPassword, invitation.role]
    )

    // 更新邀请状态
    await query(
      `UPDATE admin_invitations
       SET status = 'accepted', accepted_at = NOW()
       WHERE id = $1`,
      [invitation.id]
    )

    // 提交事务
    await query('COMMIT')

    return adminResult.rows[0]
  } catch (error) {
    // 回滚事务
    await query('ROLLBACK')
    throw error
  }
}

/**
 * 取消邀请
 */
export const cancelInvitation = async (invitationId: number) => {
  const result = await query(
    `UPDATE admin_invitations
     SET status = 'cancelled'
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [invitationId]
  )

  if (result.rows.length === 0) {
    throw new Error('邀请不存在或已被处理')
  }

  return result.rows[0]
}

/**
 * 重新发送邀请邮件
 */
export const resendInvitation = async (invitationId: number) => {
  const result = await query(
    `SELECT * FROM admin_invitations
     WHERE id = $1 AND status = 'pending'`,
    [invitationId]
  )

  if (result.rows.length === 0) {
    throw new Error('邀请不存在或已被处理')
  }

  const invitation = result.rows[0]

  // 检查是否过期
  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error('邀请已过期')
  }

  // 重新发送邮件
  await sendInvitationEmail(
    invitation.email,
    invitation.username,
    invitation.invitation_token,
    invitation.invited_by
  )

  return { success: true }
}
