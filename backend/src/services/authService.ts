import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { query } from '../config/database'
import { config } from '../config'
import configService from './configService'

// 管理员用户接口
interface AdminUser {
  id: string
  username: string
  password: string // 哈希后的密码
  role: string
  email: string
}

/**
 * 从数据库获取管理员用户
 */
const getAdminByUsername = async (username: string): Promise<AdminUser | null> => {
  const result = await query(
    'SELECT id, username, password, role, email, two_factor_enabled, two_factor_secret FROM admins WHERE username = $1',
    [username]
  )
  return result.rows[0] || null
}

/**
 * 用户登录（第一步：验证用户名密码）
 */
export const login = async (username: string, password: string, twoFactorToken?: string) => {
  // 从数据库查找用户
  const user = await getAdminByUsername(username)

  if (!user) {
    throw new Error('用户名或密码错误')
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw new Error('用户名或密码错误')
  }

  // 检查是否启用了2FA
  const twoFactorEnabled = (user as any).two_factor_enabled || false

  if (twoFactorEnabled) {
    // 如果启用了2FA但没有提供token，返回需要2FA
    if (!twoFactorToken) {
      return {
        requiresTwoFactor: true,
        tempUserId: user.id,
        message: '请输入双因素认证码',
      }
    }

    // 验证2FA token
    const { verifyTwoFactorToken, verifyBackupCode } = await import('./twoFactorService')
    const secret = (user as any).two_factor_secret

    if (!secret) {
      throw new Error('双因素认证配置错误')
    }

    // 先尝试验证TOTP token
    const isValidTotp = verifyTwoFactorToken(secret, twoFactorToken)

    // 如果TOTP失败，尝试备用代码
    if (!isValidTotp) {
      const isValidBackup = await verifyBackupCode(user.id, twoFactorToken)
      if (!isValidBackup) {
        throw new Error('验证码错误')
      }
    }
  }

  // 生成 JWT token
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  )

  // 返回用户信息和 token
  return {
    requiresTwoFactor: false,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    },
  }
}

/**
 * 验证 token
 */
export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    return decoded as {
      id: string
      username: string
      role: string
      email: string
      iat: number
      exp: number
    }
  } catch (error) {
    throw new Error('Token无效或已过期')
  }
}

/**
 * 刷新 token
 */
export const refreshToken = (oldToken: string) => {
  try {
    const decoded = verifyToken(oldToken)

    // 生成新的 token
    const newToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        email: decoded.email,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    )

    return newToken
  } catch (error) {
    throw new Error('Token刷新失败')
  }
}

/**
 * 生成密码哈希（辅助工具，用于创建管理员账号）
 * BCRYPT_SALT_ROUNDS 已迁移到数据库配置：security.bcryptSaltRounds（默认10）
 */
export const hashPassword = async (password: string) => {
  const saltRounds = await configService.get<number>('security.bcryptSaltRounds', 10)
  const salt = await bcrypt.genSalt(saltRounds)
  return bcrypt.hash(password, salt)
}

/**
 * 修改密码
 */
export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  // 从数据库查找用户
  const result = await query(
    'SELECT id, username, password FROM admins WHERE id = $1',
    [userId]
  )
  const user = result.rows[0]

  if (!user) {
    throw new Error('用户不存在')
  }

  // 验证旧密码
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password)

  if (!isPasswordValid) {
    throw new Error('当前密码错误')
  }

  // 生成新密码的哈希
  const newPasswordHash = await hashPassword(newPassword)

  // 更新密码
  await query(
    'UPDATE admins SET password = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  )

  return {
    message: '密码修改成功',
  }
}
