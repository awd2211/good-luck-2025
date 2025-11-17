/**
 * 用户邮箱认证控制器
 */
import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../../config/database'
import * as emailVerificationService from '../../services/emailVerificationService'
import * as emailTemplateService from '../../services/emailTemplateService'
import * as emailService from '../../services/emailService'
import * as emailNotifications from '../../services/emailNotificationService'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'
const JWT_EXPIRES_IN = '30d' // 用户token有效期30天

/**
 * 发送邮箱验证码
 */
export const sendVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, purpose } = req.body

    // 验证输入
    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: '邮箱和用途不能为空',
      })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      })
    }

    // 验证purpose
    if (!['register', 'login', 'reset_password'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: '无效的用途',
      })
    }

    // 检查邮箱是否已注册
    const isRegistered = await emailVerificationService.isEmailRegistered(email)

    if (purpose === 'register' && isRegistered) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册',
      })
    }

    if ((purpose === 'login' || purpose === 'reset_password') && !isRegistered) {
      return res.status(400).json({
        success: false,
        message: '该邮箱未注册',
      })
    }

    // 生成并保存验证码
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || ''
    const code = await emailVerificationService.createVerificationCode(
      email,
      purpose as any,
      ipAddress
    )

    // 发送邮件（使用新的邮件通知服务）
    emailNotifications.sendVerificationCodeEmail(email, code, purpose as any)
      .then(result => {
        if (result.success) {
          console.log(`✅ 验证码邮件已发送至: ${email}`)
        } else {
          console.warn(`⚠️  验证码邮件发送失败: ${result.error}`)
          // 在开发环境下打印验证码到控制台
          if (process.env.NODE_ENV === 'development') {
            console.log('='.repeat(60))
            console.log('📧 验证码（开发模式）')
            console.log('邮箱:', email)
            console.log('验证码:', code)
            console.log('用途:', purpose)
            console.log('='.repeat(60))
          }
        }
      })
      .catch(err => {
        console.error('❌ 发送验证码邮件时出错:', err)
      })

    res.json({
      success: true,
      message: '验证码已发送到您的邮箱',
    })
  } catch (error: any) {
    console.error('发送验证码失败:', error)
    if (error.message.includes('频繁')) {
      return res.status(429).json({
        success: false,
        message: error.message,
      })
    }
    next(error)
  }
}

/**
 * 邮箱注册
 */
export const registerWithEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, nickname, password, verificationCode } = req.body

    // 验证基本输入（验证码为可选）
    if (!email || !nickname || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱、昵称和密码不能为空',
      })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      })
    }

    // 验证昵称长度
    if (nickname.length < 2 || nickname.length > 20) {
      return res.status(400).json({
        success: false,
        message: '昵称长度应在2-20个字符之间',
      })
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位',
      })
    }

    // 验证邮箱是否已注册
    const isRegistered = await emailVerificationService.isEmailRegistered(email)
    if (isRegistered) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册',
      })
    }

    // 验证昵称是否已被使用
    const nicknameUsed = await emailVerificationService.isNicknameUsed(nickname)
    if (nicknameUsed) {
      return res.status(400).json({
        success: false,
        message: '该昵称已被使用',
      })
    }

    // 如果提供了验证码，则验证它
    if (verificationCode) {
      const codeValid = await emailVerificationService.verifyCode(
        email,
        verificationCode,
        'register'
      )

      if (!codeValid) {
        return res.status(400).json({
          success: false,
          message: '验证码无效或已过期',
        })
      }
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10)

    // 生成用户ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // 创建用户
    const result = await query(
      `INSERT INTO users (id, email, nickname, username, password_hash, email_verified, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, nickname, avatar, balance, status, created_at`,
      [userId, email, nickname, nickname, passwordHash, true, 'active']
    )

    const user = result.rows[0]

    // 发送欢迎邮件（异步，不阻塞注册流程）
    emailService.sendWelcomeEmail(user.email, user.nickname)
      .then(emailResult => {
        if (emailResult.success) {
          console.log('✅ 注册成功，欢迎邮件已发送至:', user.email)
        } else {
          console.warn('⚠️  注册成功，但欢迎邮件发送失败:', emailResult.error)
        }
      })
      .catch(err => {
        console.error('❌ 发送欢迎邮件时出错:', err)
      })

    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          balance: parseFloat(user.balance),
        },
      },
    })
  } catch (error) {
    console.error('注册失败:', error)
    next(error)
  }
}

/**
 * 邮箱+密码登录
 */
export const loginWithPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空',
      })
    }

    // 查找用户
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      })
    }

    const user = result.rows[0]

    // 检查账号状态
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: '账号已被封禁',
      })
    }

    // 验证密码
    const passwordValid = await bcrypt.compare(password, user.password_hash)

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      })
    }

    // 生成token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // 更新最后登录时间
    await query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          balance: parseFloat(user.balance),
        },
      },
    })
  } catch (error) {
    console.error('登录失败:', error)
    next(error)
  }
}

/**
 * 邮箱+验证码登录
 */
export const loginWithCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, verificationCode } = req.body

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: '邮箱和验证码不能为空',
      })
    }

    // 验证验证码
    const codeValid = await emailVerificationService.verifyCode(
      email,
      verificationCode,
      'login'
    )

    if (!codeValid) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期',
      })
    }

    // 查找用户
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      })
    }

    const user = result.rows[0]

    // 检查账号状态
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: '账号已被封禁',
      })
    }

    // 生成token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // 更新最后登录时间
    await query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          balance: parseFloat(user.balance),
        },
      },
    })
  } catch (error) {
    console.error('验证码登录失败:', error)
    next(error)
  }
}

/**
 * 重置密码
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, verificationCode, newPassword } = req.body

    if (!email || !verificationCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '所有字段都不能为空',
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6位',
      })
    }

    // 验证验证码
    const codeValid = await emailVerificationService.verifyCode(
      email,
      verificationCode,
      'reset_password'
    )

    if (!codeValid) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期',
      })
    }

    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // 更新密码
    const result = await query(
      `UPDATE users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE email = $2
       RETURNING id`,
      [passwordHash, email]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      })
    }

    // 发送密码修改成功邮件（异步，不阻塞响应）
    emailNotifications.sendPasswordChangedEmail(email)
      .then(result => {
        if (result.success) {
          console.log(`✅ 密码修改通知邮件已发送至: ${email}`)
        } else {
          console.warn(`⚠️  密码修改通知邮件发送失败: ${result.error}`)
        }
      })
      .catch(err => {
        console.error('❌ 发送密码修改通知邮件时出错:', err)
      })

    res.json({
      success: true,
      message: '密码重置成功',
    })
  } catch (error) {
    console.error('重置密码失败:', error)
    next(error)
  }
}
