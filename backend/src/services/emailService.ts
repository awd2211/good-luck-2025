/**
 * 邮件发送服务
 * 支持多种邮件发送方式：
 * 1. SMTP协议 - 使用nodemailer
 * 2. Mailgun API - 使用mailgun.js
 * 3. SendGrid API - 使用@sendgrid/mail
 * 4. Amazon SES - 使用@aws-sdk/client-ses
 */

import nodemailer from 'nodemailer'
import { query } from '../config/database'
import Mailgun from 'mailgun.js'
import FormData from 'form-data'
import sgMail from '@sendgrid/mail'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

/**
 * 从数据库获取邮件模板
 */
const getEmailTemplate = async (templateKey: string) => {
  try {
    const result = await query(
      'SELECT * FROM email_templates WHERE template_key = $1 AND enabled = true',
      [templateKey]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('获取邮件模板失败:', error)
    return null
  }
}

/**
 * 渲染邮件模板（替换变量）
 */
const renderTemplate = (html: string, variables: Record<string, any>) => {
  let rendered = html
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(regex, String(variables[key]))
  })
  return rendered
}

// 邮件配置接口
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from?: string
  fromName?: string
}

// 从数据库获取SMTP配置
const getSMTPConfig = async (): Promise<EmailConfig | null> => {
  try {
    const result = await query(
      `SELECT config_value FROM system_configs WHERE config_key = 'smtp_settings'`,
      []
    )

    if (result.rows[0]) {
      const smtpSettings = result.rows[0].config_value

      // 检查是否启用
      if (smtpSettings.enabled !== true) {
        return null
      }

      return {
        host: smtpSettings.host,
        port: parseInt(smtpSettings.port),
        secure: smtpSettings.secure === true,
        auth: {
          user: smtpSettings.user,
          pass: smtpSettings.password,
        },
        from: smtpSettings.from_email || smtpSettings.user,
        fromName: smtpSettings.from_name || '算命平台管理后台',
      }
    }
  } catch (error) {
    console.error('获取SMTP配置失败:', error)
  }
  return null
}

// 从环境变量读取邮件配置（后备方案）
const getEnvEmailConfig = (): EmailConfig | null => {
  const user = process.env.EMAIL_USER || ''
  const pass = process.env.EMAIL_PASSWORD || ''

  if (!user || !pass) {
    return null
  }

  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user, pass },
    from: user,
    fromName: '算命平台管理后台',
  }
}

// 创建邮件传输器
const createTransporter = async () => {
  // 优先使用数据库配置
  const dbConfig = await getSMTPConfig()
  const emailConfig = dbConfig || getEnvEmailConfig()

  // 如果没有配置邮件服务，返回测试传输器
  if (!emailConfig) {
    console.warn('⚠️  邮件服务未配置，使用测试模式')
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test123456',
        },
      }),
      config: null,
    }
  }

  return {
    transporter: nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    }),
    config: emailConfig,
  }
}

/**
 * 发送密码重置邮件
 */
export const sendPasswordResetEmail = async (
  email: string,
  username: string,
  resetToken: string
) => {
  const { transporter, config: emailConfig } = await createTransporter()

  // 构建重置链接
  const resetUrl = `${process.env.ADMIN_FRONTEND_URL || 'http://localhost:50303'}/reset-password?token=${resetToken}`

  const fromEmail = emailConfig
    ? `"${emailConfig.fromName}" <${emailConfig.from}>`
    : '"算命平台管理后台" <noreply@fortune.com>'

  // 尝试从数据库获取模板
  const template = await getEmailTemplate('password_reset')

  let subject = '密码重置请求'
  let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1890ff;">密码重置请求</h2>
        <p>您好，<strong>${username}</strong>！</p>
        <p>我们收到了您的密码重置请求。请点击下面的按钮重置您的密码：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #1890ff; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            重置密码
          </a>
        </div>
        <p>或者复制以下链接到浏览器：</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          ⚠️ 此链接将在1小时后过期。<br>
          如果您没有请求重置密码，请忽略此邮件。
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          © 2025 算命平台管理后台. All rights reserved.
        </p>
      </div>
    `

  // 如果找到模板，使用模板
  if (template) {
    subject = template.subject
    html = renderTemplate(template.html_content, { username, resetUrl })
  }

  const mailOptions = {
    from: fromEmail,
    to: email,
    subject,
    html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ 密码重置邮件已发送:', info.messageId)

    // 如果是测试模式，打印预览链接
    if (!emailConfig) {
      console.log('📧 预览链接:', nodemailer.getTestMessageUrl(info))
    }

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ 发送邮件失败:', error)
    throw new Error('邮件发送失败')
  }
}

/**
 * 发送2FA启用通知邮件
 */
export const send2FAEnabledEmail = async (
  email: string,
  username: string
) => {
  const { transporter, config: emailConfig } = await createTransporter()

  const fromEmail = emailConfig
    ? `"${emailConfig.fromName}" <${emailConfig.from}>`
    : '"算命平台管理后台" <noreply@fortune.com>'

  // 尝试从数据库获取模板
  const template = await getEmailTemplate('2fa_enabled')

  let subject = '双因素认证已启用'
  let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #52c41a;">双因素认证已启用</h2>
        <p>您好，<strong>${username}</strong>！</p>
        <p>您的账户已成功启用双因素认证(2FA)。</p>
        <p>从现在开始，登录时您需要输入：</p>
        <ul>
          <li>用户名和密码</li>
          <li>6位动态验证码（来自身份验证器应用）</li>
        </ul>
        <p style="color: #faad14;">⚠️ 请妥善保管您的备用恢复代码，以防手机丢失。</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          如果这不是您的操作，请立即联系管理员。
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          © 2025 算命平台管理后台. All rights reserved.
        </p>
      </div>
    `

  // 如果找到模板，使用模板
  if (template) {
    subject = template.subject
    html = renderTemplate(template.html_content, { username, email })
  }

  const mailOptions = {
    from: fromEmail,
    to: email,
    subject,
    html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ 2FA启用通知邮件已发送:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ 发送邮件失败:', error)
    // 2FA通知邮件失败不应阻止操作
    return { success: false, error }
  }
}

/**
 * 发送用户注册欢迎邮件
 */
export const sendWelcomeEmail = async (
  email: string,
  nickname: string
) => {
  // 获取邮件配置
  const dbConfig = await getSMTPConfig()
  const fromName = dbConfig?.fromName || '算命平台'
  const fromEmail = dbConfig?.from || 'noreply@fortune.com'
  const homeUrl = process.env.FRONTEND_URL || 'http://localhost:50302'

  // 尝试从数据库获取模板
  const template = await getEmailTemplate('user_welcome')

  let subject = '欢迎加入LUCK.DAY！'
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1890ff;">🎉 欢迎加入LUCK.DAY！</h2>
      <p>您好，<strong>${nickname}</strong>！</p>
      <p>感谢您注册LUCK.DAY，我们很高兴您的加入！</p>
      <div style="background: #f0f5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1890ff;">您可以开始：</h3>
        <ul style="line-height: 1.8;">
          <li>📿 浏览各种算命服务</li>
          <li>🔮 体验每日运势</li>
          <li>⭐ 收藏喜欢的服务</li>
          <li>🎁 领取新人优惠券</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${homeUrl}" style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">开始探索</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  // 如果找到模板，使用模板
  if (template) {
    subject = template.subject
    html = renderTemplate(template.html_content, { username: nickname, homeUrl })
  }

  // 获取系统配置
  const configResult = await query(
    `SELECT config_value FROM system_configs WHERE config_key = 'smtp_settings'`,
    []
  )

  if (configResult.rows.length === 0) {
    console.warn('⚠️  未找到邮件配置，跳过发送欢迎邮件')
    return { success: false, error: '邮件服务未配置' }
  }

  const emailConfig = configResult.rows[0].config_value

  // 检查是否启用
  if (emailConfig.enabled !== true) {
    console.warn('⚠️  邮件服务未启用，跳过发送欢迎邮件')
    return { success: false, error: '邮件服务未启用' }
  }

  try {
    // 根据邮件服务类型发送
    if (emailConfig.email_type === 'third_party_api') {
      const provider = emailConfig.api_provider

      if (provider === 'mailgun') {
        // Mailgun API发送
        const mailgun = new Mailgun(FormData)
        const mg = mailgun.client({
          username: 'api',
          key: emailConfig.mailgun_api_key,
          url: emailConfig.mailgun_region === 'eu'
            ? 'https://api.eu.mailgun.net'
            : 'https://api.mailgun.net'
        })

        const messageData = {
          from: `${fromName} <${emailConfig.from_email}>`,
          to: email,
          subject,
          html,
        }

        const result = await mg.messages.create(emailConfig.mailgun_domain, messageData)
        console.log('✅ 欢迎邮件已发送 (Mailgun):', result.id, '发送至:', email)
        return { success: true, messageId: result.id }

      } else if (provider === 'sendgrid') {
        // SendGrid API
        sgMail.setApiKey(emailConfig.sendgrid_api_key)
        const msg = {
          to: email,
          from: { email: emailConfig.from_email, name: fromName },
          subject,
          html,
        }
        const result = await sgMail.send(msg)
        console.log('✅ 欢迎邮件已发送 (SendGrid):', result[0].headers['x-message-id'])
        return { success: true, messageId: result[0].headers['x-message-id'] }

      } else if (provider === 'ses') {
        // Amazon SES
        const sesClient = new SESClient({
          region: emailConfig.ses_region,
          credentials: {
            accessKeyId: emailConfig.ses_access_key,
            secretAccessKey: emailConfig.ses_secret_key,
          },
        })
        const command = new SendEmailCommand({
          Source: `${fromName} <${emailConfig.from_email}>`,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Html: { Data: html, Charset: 'UTF-8' } },
          },
        })
        const result = await sesClient.send(command)
        console.log('✅ 欢迎邮件已发送 (Amazon SES):', result.MessageId)
        return { success: true, messageId: result.MessageId }
      }
    } else if (emailConfig.email_type === 'smtp') {
      // SMTP发送
      const transporter = nodemailer.createTransport({
        host: emailConfig.smtp_host,
        port: parseInt(emailConfig.smtp_port),
        secure: emailConfig.smtp_secure === true,
        auth: {
          user: emailConfig.smtp_user,
          pass: emailConfig.smtp_password,
        },
      })

      const mailOptions = {
        from: `"${fromName}" <${emailConfig.from_email}>`,
        to: email,
        subject,
        html,
      }

      const info = await transporter.sendMail(mailOptions)
      console.log('✅ 欢迎邮件已发送 (SMTP):', info.messageId)
      return { success: true, messageId: info.messageId }
    }

    throw new Error('不支持的邮件服务类型')
  } catch (error: any) {
    console.error('❌ 发送欢迎邮件失败:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 发送测试邮件
 * 支持两种邮件服务类型：
 * 1. SMTP协议发送 - 使用标准SMTP
 * 2. 第三方API服务 - 使用Mailgun/SendGrid/SES等
 */
export const sendTestEmail = async (
  toEmail: string,
  emailConfig?: any
) => {
  const testTime = new Date().toLocaleString('zh-CN')
  const subject = '邮件配置测试邮件'
  const fromName = emailConfig?.from_name || '算命平台管理后台'
  const fromEmail = emailConfig?.from_email || 'noreply@fortune.com'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #52c41a;">✅ 邮件配置测试成功</h2>
      <p>恭喜！您的邮件服务配置正确，邮件发送功能正常。</p>
      <p>此邮件用于测试以下功能：</p>
      <ul>
        <li>✉️ 密码重置邮件</li>
        <li>🔐 双因素认证通知</li>
        <li>📢 系统通知邮件</li>
      </ul>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        测试时间: ${testTime}<br>
        服务类型: ${emailConfig?.email_type === 'smtp' ? 'SMTP协议' : `第三方API (${emailConfig?.api_provider})`}
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        © 2025 算命平台管理后台. All rights reserved.
      </p>
    </div>
  `

  if (!emailConfig) {
    // 使用默认SMTP配置
    const { transporter } = await createTransporter()
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject,
      html,
    }
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ 测试邮件已发送 (默认配置):', info.messageId)
    return { success: true, messageId: info.messageId }
  }

  try {
    // 根据邮件服务类型发送
    if (emailConfig.email_type === 'smtp') {
      // ==================== SMTP协议发送 ====================
      const transporter = nodemailer.createTransport({
        host: emailConfig.smtp_host,
        port: parseInt(emailConfig.smtp_port),
        secure: emailConfig.smtp_secure === true,
        auth: {
          user: emailConfig.smtp_user,
          pass: emailConfig.smtp_password,
        },
      })

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        subject,
        html,
      }

      const info = await transporter.sendMail(mailOptions)
      console.log('✅ 测试邮件已发送 (SMTP):', info.messageId)
      return { success: true, messageId: info.messageId }

    } else if (emailConfig.email_type === 'third_party_api') {
      // ==================== 第三方API服务 ====================
      const provider = emailConfig.api_provider

      if (provider === 'mailgun') {
        // ---------- Mailgun API ----------
        const mailgun = new Mailgun(FormData)
        const mg = mailgun.client({
          username: 'api',
          key: emailConfig.mailgun_api_key,
          url: emailConfig.mailgun_region === 'eu'
            ? 'https://api.eu.mailgun.net'
            : 'https://api.mailgun.net'
        })

        const messageData = {
          from: `${fromName} <${fromEmail}>`,
          to: toEmail,
          subject,
          html,
        }

        const result = await mg.messages.create(emailConfig.mailgun_domain, messageData)
        console.log('✅ 测试邮件已发送 (Mailgun):', result.id)
        return { success: true, messageId: result.id }

      } else if (provider === 'sendgrid') {
        // ---------- SendGrid API ----------
        sgMail.setApiKey(emailConfig.sendgrid_api_key)

        const msg = {
          to: toEmail,
          from: {
            email: fromEmail,
            name: fromName,
          },
          subject,
          html,
        }

        const result = await sgMail.send(msg)
        console.log('✅ 测试邮件已发送 (SendGrid):', result[0].headers['x-message-id'])
        return { success: true, messageId: result[0].headers['x-message-id'] }

      } else if (provider === 'ses') {
        // ---------- Amazon SES ----------
        const sesClient = new SESClient({
          region: emailConfig.ses_region,
          credentials: {
            accessKeyId: emailConfig.ses_access_key,
            secretAccessKey: emailConfig.ses_secret_key,
          },
        })

        const command = new SendEmailCommand({
          Source: `${fromName} <${fromEmail}>`,
          Destination: {
            ToAddresses: [toEmail],
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: html,
                Charset: 'UTF-8',
              },
            },
          },
        })

        const result = await sesClient.send(command)
        console.log('✅ 测试邮件已发送 (Amazon SES):', result.MessageId)
        return { success: true, messageId: result.MessageId }

      } else {
        throw new Error(`不支持的第三方API服务提供商: ${provider}`)
      }
    } else {
      throw new Error('未知的邮件服务类型')
    }
  } catch (error: any) {
    console.error('❌ 发送测试邮件失败:', error)
    throw new Error(error.message || '测试邮件发送失败')
  }
}
