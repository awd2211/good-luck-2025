import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { query } from '../config/database'
import { config } from '../config'

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
    'SELECT id, username, password, role, email FROM admins WHERE username = $1',
    [username]
  )
  return result.rows[0] || null
}

/**
 * 用户登录
 */
export const login = async (username: string, password: string) => {
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
 */
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}
