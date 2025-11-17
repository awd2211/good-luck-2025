/**
 * 邮件通知服务
 * 包含所有业务场景的邮件发送功能
 */

import { sendWelcomeEmail } from './emailService'
import { query } from '../config/database'
import * as emailNotificationConfigService from './emailNotificationConfigService'
import Mailgun from 'mailgun.js'
import FormData from 'form-data'
import sgMail from '@sendgrid/mail'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import nodemailer from 'nodemailer'

// ============== 辅助函数 ==============

/**
 * 检查场景是否启用
 * 如果场景被禁用，记录日志并返回false
 */
const checkScenarioEnabled = async (scenarioKey: string): Promise<boolean> => {
  try {
    const enabled = await emailNotificationConfigService.isScenarioEnabled(scenarioKey)
    if (!enabled) {
      console.log(`⚠️  邮件通知场景 '${scenarioKey}' 已被禁用，跳过发送`)
    }
    return enabled
  } catch (error) {
    console.error(`检查邮件通知配置失败 (${scenarioKey}):`, error)
    // 如果配置检查失败，默认允许发送（保证系统可用性）
    return true
  }
}

/**
 * 记录邮件发送历史
 */
async function recordEmailHistory(params: {
  scenarioKey: string
  scenarioName: string
  recipientEmail: string
  subject: string
  content: string
  status: 'success' | 'failed'
  messageId?: string
  errorMessage?: string
  provider?: string
  userId?: string
  metadata?: Record<string, any>
}): Promise<void> {
  try {
    await query(
      `INSERT INTO email_send_history
       (scenario_key, scenario_name, recipient_email, subject, content, status, message_id, error_message, provider, user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        params.scenarioKey,
        params.scenarioName,
        params.recipientEmail,
        params.subject,
        params.content,
        params.status,
        params.messageId || null,
        params.errorMessage || null,
        params.provider || null,
        params.userId || null,
        JSON.stringify(params.metadata || {})
      ]
    )
  } catch (error) {
    // 记录历史失败不应影响业务流程，只记录错误日志
    console.error('❌ 记录邮件发送历史失败:', error)
  }
}

/**
 * 带历史记录的邮件发送函数
 */
async function sendEmailWithHistory(
  scenarioKey: string,
  scenarioName: string,
  to: string,
  subject: string,
  html: string,
  options?: {
    userId?: string
    metadata?: Record<string, any>
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // 获取邮件配置以确定provider
  let provider = 'unknown'
  try {
    const configResult = await query(
      `SELECT config_value FROM system_configs WHERE config_key = 'smtp_settings'`,
      []
    )
    if (configResult.rows.length > 0 && configResult.rows[0].config_value.enabled) {
      const emailConfig = configResult.rows[0].config_value
      if (emailConfig.email_type === 'third_party_api') {
        provider = emailConfig.api_provider
      } else if (emailConfig.email_type === 'smtp') {
        provider = 'smtp'
      }
    }
  } catch (error) {
    console.error('获取邮件配置失败:', error)
  }

  // 发送邮件
  const result = await sendEmail(to, subject, html)

  // 记录历史
  await recordEmailHistory({
    scenarioKey,
    scenarioName,
    recipientEmail: to,
    subject,
    content: html,
    status: result.success ? 'success' : 'failed',
    messageId: result.messageId,
    errorMessage: result.error,
    provider,
    userId: options?.userId,
    metadata: options?.metadata
  })

  return result
}

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

/**
 * 统一的邮件发送函数
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // 获取邮件配置
    const configResult = await query(
      `SELECT config_value FROM system_configs WHERE config_key = 'smtp_settings'`,
      []
    )

    if (configResult.rows.length === 0 || !configResult.rows[0].config_value.enabled) {
      console.warn('⚠️  邮件服务未配置或未启用')
      return { success: false, error: '邮件服务未配置' }
    }

    const emailConfig = configResult.rows[0].config_value
    const fromName = emailConfig.from_name || 'LUCK.DAY'
    const fromEmail = emailConfig.from_email || 'no-reply@luck.day'

    // 根据邮件服务类型发送
    if (emailConfig.email_type === 'third_party_api') {
      const provider = emailConfig.api_provider

      if (provider === 'mailgun') {
        const mailgun = new Mailgun(FormData)
        const mg = mailgun.client({
          username: 'api',
          key: emailConfig.mailgun_api_key,
          url: emailConfig.mailgun_region === 'eu'
            ? 'https://api.eu.mailgun.net'
            : 'https://api.mailgun.net'
        })

        const result = await mg.messages.create(emailConfig.mailgun_domain, {
          from: `${fromName} <${fromEmail}>`,
          to,
          subject,
          html,
        })

        console.log(`✅ 邮件已发送 (Mailgun): ${result.id} -> ${to}`)
        return { success: true, messageId: result.id }

      } else if (provider === 'sendgrid') {
        sgMail.setApiKey(emailConfig.sendgrid_api_key)
        const result = await sgMail.send({
          to,
          from: { email: fromEmail, name: fromName },
          subject,
          html,
        })
        console.log(`✅ 邮件已发送 (SendGrid) -> ${to}`)
        return { success: true, messageId: result[0].headers['x-message-id'] }

      } else if (provider === 'ses') {
        const sesClient = new SESClient({
          region: emailConfig.ses_region,
          credentials: {
            accessKeyId: emailConfig.ses_access_key,
            secretAccessKey: emailConfig.ses_secret_key,
          },
        })
        const result = await sesClient.send(new SendEmailCommand({
          Source: `${fromName} <${fromEmail}>`,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Html: { Data: html, Charset: 'UTF-8' } },
          },
        }))
        console.log(`✅ 邮件已发送 (SES) -> ${to}`)
        return { success: true, messageId: result.MessageId }
      }
    } else if (emailConfig.email_type === 'smtp') {
      const transporter = nodemailer.createTransport({
        host: emailConfig.smtp_host,
        port: parseInt(emailConfig.smtp_port),
        secure: emailConfig.smtp_secure === true,
        auth: {
          user: emailConfig.smtp_user,
          pass: emailConfig.smtp_password,
        },
      })

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
      })
      console.log(`✅ 邮件已发送 (SMTP) -> ${to}`)
      return { success: true, messageId: info.messageId }
    }

    throw new Error('不支持的邮件服务类型')
  } catch (error: any) {
    console.error('❌ 发送邮件失败:', error.message)
    return { success: false, error: error.message }
  }
}

// ============== 1. 用户认证和账号安全 (4个) ==============

/**
 * 1.1 发送邮箱验证码
 */
export async function sendVerificationCodeEmail(
  email: string,
  code: string,
  purpose: 'register' | 'login' | 'reset_password'
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('verification_code'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const template = await getEmailTemplate('user_email_verification')

  const purposeMap = {
    register: '注册',
    login: '登录',
    reset_password: '重置密码'
  }

  let subject = `【LUCK.DAY】您的验证码`
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1890ff;">验证码</h2>
      <p>您正在进行<strong>${purposeMap[purpose]}</strong>操作，您的验证码是：</p>
      <div style="background: #f0f5ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #1890ff; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
      </div>
      <p style="color: #999;">验证码5分钟内有效，请勿泄露给他人。</p>
      <p style="color: #999; font-size: 12px;">如果这不是您的操作，请忽略此邮件。</p>
    </div>
  `

  if (template) {
    subject = template.subject
    html = renderTemplate(template.html_content, { code, purpose: purposeMap[purpose] })
  }

  return sendEmailWithHistory(
    'verification_code',
    '邮箱验证码',
    email,
    subject,
    html,
    { metadata: { purpose } }
  )
}

/**
 * 1.2 发送密码修改成功通知
 */
export async function sendPasswordChangedEmail(
  email: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('password_changed'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const subject = '密码修改成功通知'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #52c41a;">✅ 密码修改成功</h2>
      <p>您好，<strong>${username}</strong>！</p>
      <p>您的账号密码已成功修改。</p>
      <div style="background: #f6ffed; padding: 15px; border-left: 4px solid #52c41a; margin: 20px 0;">
        <p style="margin: 0; color: #666;">修改时间：${new Date().toLocaleString('zh-CN')}</p>
      </div>
      <p style="color: #ff4d4f; font-weight: bold;">⚠️ 如果这不是您的操作，请立即联系客服！</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  return sendEmailWithHistory(
    'password_changed',
    '密码修改通知',
    email,
    subject,
    html,
    { metadata: { username } }
  )
}

/**
 * 1.3 发送账号状态变更通知
 */
export async function sendAccountStatusChangedEmail(
  email: string,
  username: string,
  newStatus: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('account_status_changed'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: '正常', color: '#52c41a' },
    suspended: { label: '已冻结', color: '#faad14' },
    banned: { label: '已封禁', color: '#ff4d4f' },
  }

  const status = statusMap[newStatus] || { label: newStatus, color: '#666' }

  const subject = '账号状态变更通知'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${status.color};">账号状态变更通知</h2>
      <p>您好，<strong>${username}</strong>！</p>
      <p>您的账号状态已变更为：<span style="color: ${status.color}; font-weight: bold;">${status.label}</span></p>
      ${reason ? `<div style="background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0;"><strong>变更原因：</strong>${reason}</p>
      </div>` : ''}
      <p style="color: #666;">变更时间：${new Date().toLocaleString('zh-CN')}</p>
      ${newStatus !== 'active' ? '<p style="color: #999;">如有疑问，请联系客服。</p>' : ''}
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  return sendEmailWithHistory(
    'account_status_changed',
    '账号状态变更',
    email,
    subject,
    html,
    { metadata: { username, newStatus, reason } }
  )
}

/**
 * 1.4 发送异常登录提醒
 */
export async function sendSuspiciousLoginEmail(
  email: string,
  username: string,
  loginInfo: {
    ip: string
    location?: string
    device?: string
    time: Date
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('account_status_changed'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const subject = '⚠️ 异常登录提醒'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff4d4f;">⚠️ 检测到异常登录</h2>
      <p>您好，<strong>${username}</strong>！</p>
      <p>我们检测到您的账号在一个新设备上登录：</p>
      <div style="background: #fff1f0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff4d4f;">
        <p style="margin: 5px 0;"><strong>登录时间：</strong>${loginInfo.time.toLocaleString('zh-CN')}</p>
        <p style="margin: 5px 0;"><strong>IP地址：</strong>${loginInfo.ip}</p>
        ${loginInfo.location ? `<p style="margin: 5px 0;"><strong>位置：</strong>${loginInfo.location}</p>` : ''}
        ${loginInfo.device ? `<p style="margin: 5px 0;"><strong>设备：</strong>${loginInfo.device}</p>` : ''}
      </div>
      <p style="color: #ff4d4f; font-weight: bold;">如果这不是您的操作，建议立即修改密码并联系客服！</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  return sendEmailWithHistory(
    'account_status_changed',
    '异常登录提醒',
    email,
    subject,
    html,
    { metadata: { username, loginInfo } }
  )
}

// ============== 2. 订单和支付 (4个) ==============

/**
 * 2.1 发送订单创建确认邮件
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderData: {
    orderNo: string
    items: Array<{ name: string; price: number; quantity: number }>
    totalAmount: number
    createdAt: Date
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('order_confirmation'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const template = await getEmailTemplate('user_order_confirmation')

  let subject = '您的订单已确认'
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1890ff;">订单确认</h2>
      <p>感谢您的订单！</p>
      <div style="background: #f0f5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>订单号：</strong>${orderData.orderNo}</p>
        <p style="margin: 5px 0;"><strong>下单时间：</strong>${orderData.createdAt.toLocaleString('zh-CN')}</p>
        <hr style="border: none; border-top: 1px dashed #d9d9d9; margin: 15px 0;">
        <h3 style="margin: 10px 0;">订单明细：</h3>
        ${orderData.items.map(item => `
          <p style="margin: 5px 0;">${item.name} × ${item.quantity} = ¥${item.price * item.quantity}</p>
        `).join('')}
        <hr style="border: none; border-top: 1px solid #d9d9d9; margin: 15px 0;">
        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1890ff;">
          合计：¥${orderData.totalAmount}
        </p>
      </div>
      <p style="color: #666;">请尽快完成支付，我们将为您提供服务。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  if (template) {
    subject = template.subject
    html = renderTemplate(template.html_content, {
      orderNo: orderData.orderNo,
      totalAmount: orderData.totalAmount.toString(),
      createdAt: orderData.createdAt.toLocaleString('zh-CN')
    })
  }

  return sendEmailWithHistory(
    'order_confirmation',
    '订单确认邮件',
    email,
    subject,
    html,
    { metadata: { orderNo: orderData.orderNo, totalAmount: orderData.totalAmount } }
  )
}

/**
 * 2.2 发送支付成功通知
 */
export async function sendPaymentSuccessEmail(
  email: string,
  paymentData: {
    orderNo: string
    amount: number
    paymentMethod: string
    paidAt: Date
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('payment_success'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const template = await getEmailTemplate('user_payment_success')

  let subject = '支付成功！'
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #52c41a;">✅ 支付成功</h2>
      <p>您的订单已支付成功！</p>
      <div style="background: #f6ffed; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>订单号：</strong>${paymentData.orderNo}</p>
        <p style="margin: 5px 0;"><strong>支付金额：</strong>¥${paymentData.amount}</p>
        <p style="margin: 5px 0;"><strong>支付方式：</strong>${paymentData.paymentMethod}</p>
        <p style="margin: 5px 0;"><strong>支付时间：</strong>${paymentData.paidAt.toLocaleString('zh-CN')}</p>
      </div>
      <p style="color: #666;">我们将尽快为您处理订单，请耐心等待。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  if (template) {
    subject = template.subject
    html = renderTemplate(template.html_content, {
      orderNo: paymentData.orderNo,
      amount: paymentData.amount.toString(),
      paymentMethod: paymentData.paymentMethod,
      paidAt: paymentData.paidAt.toLocaleString('zh-CN')
    })
  }

  return sendEmailWithHistory(
    'payment_success',
    '支付成功通知',
    email,
    subject,
    html,
    { userId, metadata: { orderId, amount, paymentMethod } }
  )
}

/**
 * 2.3 发送订单取消/退款通知
 */
export async function sendOrderCancelledEmail(
  email: string,
  cancelData: {
    orderNo: string
    reason?: string
    refundAmount?: number
    cancelledAt: Date
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('order_cancelled'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const template = await getEmailTemplate('user_refund_notification')

  let subject = cancelData.refundAmount ? '您的退款已处理' : '订单已取消'
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #faad14;">${cancelData.refundAmount ? '退款通知' : '订单取消通知'}</h2>
      <p>您的订单已${cancelData.refundAmount ? '退款' : '取消'}。</p>
      <div style="background: #fffbe6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>订单号：</strong>${cancelData.orderNo}</p>
        ${cancelData.refundAmount ? `<p style="margin: 5px 0;"><strong>退款金额：</strong>¥${cancelData.refundAmount}</p>` : ''}
        ${cancelData.reason ? `<p style="margin: 5px 0;"><strong>原因：</strong>${cancelData.reason}</p>` : ''}
        <p style="margin: 5px 0;"><strong>时间：</strong>${cancelData.cancelledAt.toLocaleString('zh-CN')}</p>
      </div>
      ${cancelData.refundAmount ? '<p style="color: #666;">退款将在3-7个工作日内退回原支付账户。</p>' : ''}
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  if (template) {
    subject = template.subject
    html = renderTemplate(template.html_content, {
      orderNo: cancelData.orderNo,
      refundAmount: cancelData.refundAmount?.toString() || '0',
      reason: cancelData.reason || '',
      cancelledAt: cancelData.cancelledAt.toLocaleString('zh-CN')
    })
  }

  return sendEmailWithHistory(
    'order_cancelled',
    '订单取消通知',
    email,
    subject,
    html,
    { userId, metadata: { orderId, reason } }
  )
}

/**
 * 2.4 发送订单状态更新通知
 */
export async function sendOrderStatusUpdatedEmail(
  email: string,
  statusData: {
    orderNo: string
    oldStatus: string
    newStatus: string
    updatedAt: Date
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('order_status_updated'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  }

  const subject = '订单状态更新通知'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1890ff;">订单状态更新</h2>
      <p>您的订单状态已更新。</p>
      <div style="background: #f0f5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>订单号：</strong>${statusData.orderNo}</p>
        <p style="margin: 5px 0;"><strong>状态变更：</strong>${statusMap[statusData.oldStatus] || statusData.oldStatus} → ${statusMap[statusData.newStatus] || statusData.newStatus}</p>
        <p style="margin: 5px 0;"><strong>更新时间：</strong>${statusData.updatedAt.toLocaleString('zh-CN')}</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  return sendEmailWithHistory(
    'order_status_updated',
    '订单状态更新',
    email,
    subject,
    html,
    { userId, metadata: { orderId, newStatus } }
  )
}

// ============== 3. 算命服务和结果 (4个) ==============

/**
 * 3.1 发送算命结果已生成通知
 */
export async function sendFortuneResultReadyEmail(
  email: string,
  resultData: {
    serviceName: string
    resultId: string
    createdAt: Date
    viewUrl: string
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('fortune_result_ready'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const template = await getEmailTemplate('user_result_ready')

  let subject = `您的${resultData.serviceName}结果已准备好`
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #722ed1;">🔮 您的测算结果已准备好</h2>
      <p>您订购的<strong>${resultData.serviceName}</strong>已完成测算！</p>
      <div style="background: #f9f0ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>服务名称：</strong>${resultData.serviceName}</p>
        <p style="margin: 5px 0;"><strong>完成时间：</strong>${resultData.createdAt.toLocaleString('zh-CN')}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resultData.viewUrl}" style="background-color: #722ed1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
          立即查看结果
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  if (template) {
    subject = renderTemplate(template.subject, { serviceName: resultData.serviceName })
    html = renderTemplate(template.html_content, {
      serviceName: resultData.serviceName,
      resultId: resultData.resultId,
      viewUrl: resultData.viewUrl,
      createdAt: resultData.createdAt.toLocaleString('zh-CN')
    })
  }

  return sendEmailWithHistory(
    'fortune_result_ready',
    '算命结果就绪',
    email,
    subject,
    html,
    { userId, metadata: { orderId, fortuneType } }
  )
}

/**
 * 3.2 发送每日运势推送
 */
export async function sendDailyHoroscopeEmail(
  email: string,
  horoscopeData: {
    zodiac: string
    date: Date
    luckyNumber: number
    luckyColor: string
    summary: string
    rating: number
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('daily_horoscope'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const subject = `每日运势 - ${horoscopeData.zodiac} (${horoscopeData.date.toLocaleDateString('zh-CN')})`

  const stars = '★'.repeat(horoscopeData.rating) + '☆'.repeat(5 - horoscopeData.rating)

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1890ff;">🌟 今日运势</h2>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; color: white; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; font-size: 28px;">${horoscopeData.zodiac}</h3>
        <p style="margin: 5px 0; font-size: 14px;">${horoscopeData.date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        <div style="margin: 15px 0; font-size: 20px;">${stars}</div>
      </div>
      <div style="background: #f0f5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 10px 0; line-height: 1.8;">${horoscopeData.summary}</p>
        <hr style="border: none; border-top: 1px dashed #d9d9d9; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>幸运数字：</strong><span style="color: #1890ff; font-size: 18px; font-weight: bold;">${horoscopeData.luckyNumber}</span></p>
        <p style="margin: 5px 0;"><strong>幸运颜色：</strong><span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: ${horoscopeData.luckyColor}; vertical-align: middle; margin-left: 5px;"></span> ${horoscopeData.luckyColor}</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  return sendEmailWithHistory(
    'daily_horoscope',
    '每日星座运势',
    email,
    subject,
    html,
    { userId, metadata: { sign, date, horoscope } }
  )
}

/**
 * 3.3 发送服务即将过期提醒
 */
export async function sendServiceExpiringEmail(
  email: string,
  serviceData: {
    serviceName: string
    expiresAt: Date
    daysLeft: number
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('service_expiry_reminder'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const subject = `提醒：您的${serviceData.serviceName}即将过期`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #faad14;">⏰ 服务即将过期</h2>
      <p>您的服务即将到期，请及时续费。</p>
      <div style="background: #fffbe6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #faad14;">
        <p style="margin: 5px 0;"><strong>服务名称：</strong>${serviceData.serviceName}</p>
        <p style="margin: 5px 0;"><strong>到期时间：</strong>${serviceData.expiresAt.toLocaleString('zh-CN')}</p>
        <p style="margin: 5px 0; color: #faad14; font-weight: bold;">
          剩余 ${serviceData.daysLeft} 天
        </p>
      </div>
      <p style="color: #666;">为了不影响您的使用，建议尽快续费。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  return sendEmailWithHistory(
    'service_expiry_reminder',
    '服务到期提醒',
    email,
    subject,
    html,
    { userId, metadata: { serviceName, expiryDate, daysLeft } }
  )
}

/**
 * 3.4 发送定期运势报告
 */
export async function sendPeriodicReportEmail(
  email: string,
  reportData: {
    period: 'weekly' | 'monthly'
    zodiac: string
    startDate: Date
    endDate: Date
    summary: string
    highlights: string[]
    advice: string[]
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('weekly_report'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const periodMap = { weekly: '周', monthly: '月' }
  const subject = `${reportData.zodiac} - ${periodMap[reportData.period]}运势报告`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #722ed1;">📊 ${periodMap[reportData.period]}运势报告</h2>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; margin: 20px 0;">
        <h3 style="margin: 0; font-size: 24px;">${reportData.zodiac}</h3>
        <p style="margin: 5px 0; opacity: 0.9;">
          ${reportData.startDate.toLocaleDateString('zh-CN')} - ${reportData.endDate.toLocaleDateString('zh-CN')}
        </p>
      </div>

      <h3 style="color: #1890ff;">总体概况</h3>
      <p style="line-height: 1.8; color: #666;">${reportData.summary}</p>

      <h3 style="color: #1890ff;">本${periodMap[reportData.period]}亮点</h3>
      <ul style="line-height: 1.8; color: #666;">
        ${reportData.highlights.map(h => `<li>${h}</li>`).join('')}
      </ul>

      <h3 style="color: #1890ff;">温馨提示</h3>
      <div style="background: #f0f5ff; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <ul style="line-height: 1.8; margin: 0; padding-left: 20px;">
          ${reportData.advice.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  return sendEmailWithHistory(
    reportType === 'weekly' ? 'weekly_report' : 'monthly_report',
    reportType === 'weekly' ? '周报推送' : '月报推送',
    email,
    subject,
    html,
    { userId, metadata: { reportType, period } }
  )
}

// ============== 4. 优惠券和营销 (4个) ==============

/**
 * 4.1 发送新优惠券发放通知
 */
export async function sendCouponGrantedEmail(
  email: string,
  couponData: {
    name: string
    code: string
    discount: number
    expiresAt: Date
    minAmount?: number
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('coupon_granted'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const template = await getEmailTemplate('user_coupon_granted')

  let subject = '您收到了新的优惠券！'
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #eb2f96;">🎁 您收到了新的优惠券</h2>
      <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: white; font-size: 24px;">${couponData.name}</h3>
        <div style="background: white; display: inline-block; padding: 15px 30px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; color: #eb2f96; font-size: 28px; font-weight: bold;">¥${couponData.discount}</p>
        </div>
        <p style="margin: 10px 0; color: white; opacity: 0.9;">优惠券代码：<strong>${couponData.code}</strong></p>
      </div>
      <div style="background: #fff0f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        ${couponData.minAmount ? `<p style="margin: 5px 0;">满 ¥${couponData.minAmount} 可用</p>` : ''}
        <p style="margin: 5px 0;">有效期至：${couponData.expiresAt.toLocaleDateString('zh-CN')}</p>
      </div>
      <p style="text-align: center; color: #666;">快去使用吧！</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  if (template) {
    subject = template.subject
    html = renderTemplate(template.html_content, {
      name: couponData.name,
      code: couponData.code,
      discount: couponData.discount.toString(),
      expiresAt: couponData.expiresAt.toLocaleDateString('zh-CN')
    })
  }

  return sendEmailWithHistory(
    'coupon_granted',
    '优惠券领取成功',
    email,
    subject,
    html,
    { userId, metadata: { couponCode, discount, validUntil } }
  )
}

/**
 * 4.2 发送优惠券即将过期提醒
 */
export async function sendCouponExpiringEmail(
  email: string,
  couponData: {
    name: string
    code: string
    discount: number
    expiresAt: Date
    daysLeft: number
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('coupon_expiry_reminder'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const subject = `提醒：您的优惠券即将过期`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #faad14;">⏰ 优惠券即将过期</h2>
      <p>您有一张优惠券即将过期，别忘了使用哦！</p>
      <div style="background: #fffbe6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #faad14;">
        <h3 style="margin: 0 0 10px 0; color: #faad14;">${couponData.name}</h3>
        <p style="margin: 5px 0;"><strong>优惠金额：</strong>¥${couponData.discount}</p>
        <p style="margin: 5px 0;"><strong>优惠券代码：</strong>${couponData.code}</p>
        <p style="margin: 5px 0;"><strong>到期时间：</strong>${couponData.expiresAt.toLocaleString('zh-CN')}</p>
        <p style="margin: 5px 0; color: #faad14; font-weight: bold;">
          仅剩 ${couponData.daysLeft} 天
        </p>
      </div>
      <p style="color: #666;">快去使用，不要错过优惠！</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  return sendEmailWithHistory(
    'coupon_expiry_reminder',
    '优惠券到期提醒',
    email,
    subject,
    html,
    { userId, metadata: { couponCode, expiryDate, daysLeft } }
  )
}

/**
 * 4.3 发送促销活动通知
 */
export async function sendPromotionEmail(
  email: string,
  promotionData: {
    activityName: string
    description: string
    startDate: Date
    endDate: Date
    discount?: number
    link?: string
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('coupon_granted'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const template = await getEmailTemplate('marketing_promotion')

  let subject = `${promotionData.activityName} - 限时优惠！`
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 32px;">🎉 ${promotionData.activityName}</h1>
        ${promotionData.discount ? `<p style="margin: 15px 0 0 0; font-size: 48px; font-weight: bold;">${promotionData.discount}% OFF</p>` : ''}
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; line-height: 1.8; color: #666;">${promotionData.description}</p>
        <div style="background: #f9f0ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;">⏰ 活动时间：</p>
          <p style="margin: 5px 0; font-weight: bold;">
            ${promotionData.startDate.toLocaleDateString('zh-CN')} - ${promotionData.endDate.toLocaleDateString('zh-CN')}
          </p>
        </div>
        ${promotionData.link ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${promotionData.link}" style="background-color: #eb2f96; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
              立即查看
            </a>
          </div>
        ` : ''}
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  if (template) {
    subject = renderTemplate(template.subject, { activityName: promotionData.activityName })
    html = renderTemplate(template.html_content, {
      activityName: promotionData.activityName,
      description: promotionData.description,
      discount: promotionData.discount?.toString() || '',
      startDate: promotionData.startDate.toLocaleDateString('zh-CN'),
      endDate: promotionData.endDate.toLocaleDateString('zh-CN'),
      link: promotionData.link || ''
    })
  }

  return sendEmailWithHistory(
    'coupon_granted',
    '促销活动',
    email,
    subject,
    html,
    { userId, metadata: { promotionTitle, promotionType, coupons } }
  )
}

/**
 * 4.4 发送生日祝福和专属优惠
 */
export async function sendBirthdayGreetingEmail(
  email: string,
  birthdayData: {
    username: string
    age?: number
    couponCode?: string
    discount?: number
  }
): Promise<{ success: boolean; error?: string }> {
  // 检查场景是否启用
  if (!(await checkScenarioEnabled('birthday_greeting'))) {
    return { success: false, error: '该场景已被禁用' }
  }

  const subject = `生日快乐！LUCK.DAY 为您送上生日祝福 🎂`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 36px;">🎂 生日快乐</h1>
        <p style="margin: 15px 0; font-size: 20px;">${birthdayData.username}</p>
        ${birthdayData.age ? `<p style="margin: 10px 0; font-size: 48px; font-weight: bold;">${birthdayData.age}</p>` : ''}
      </div>
      <div style="background: white; padding: 30px;">
        <p style="font-size: 16px; line-height: 1.8; text-align: center; color: #666;">
          祝您生日快乐！愿您新的一岁，好运常伴，心想事成！
        </p>
        ${birthdayData.couponCode && birthdayData.discount ? `
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: white;">🎁 生日专属优惠</h3>
            <div style="background: white; display: inline-block; padding: 20px 40px; border-radius: 8px;">
              <p style="margin: 0; color: #eb2f96; font-size: 32px; font-weight: bold;">¥${birthdayData.discount}</p>
            </div>
            <p style="margin: 15px 0 0 0; color: white; font-size: 14px;">优惠券代码：<strong>${birthdayData.couponCode}</strong></p>
          </div>
        ` : ''}
        <p style="text-align: center; color: #666; margin-top: 30px;">再次祝您生日快乐！🎉</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© 2025 LUCK.DAY. All rights reserved.</p>
    </div>
  `

  return sendEmailWithHistory(
    'birthday_greeting',
    '生日祝福',
    email,
    subject,
    html,
    { userId, metadata: { username, birthdayDate, gifts } }
  )
}

// 导出欢迎邮件函数（已在emailService.ts中实现）
export { sendWelcomeEmail }
