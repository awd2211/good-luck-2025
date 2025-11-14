import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../../config/database'
import { config } from '../../config'

// 验证码存储 (生产环境应使用Redis)
const verificationCodes = new Map<string, { code: string; expireAt: number }>()

/**
 * 发送验证码 (模拟发送)
 */
export const sendVerificationCode = async (phone: string) => {
  // 生成6位随机验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // 存储验证码，5分钟有效
  verificationCodes.set(phone, {
    code,
    expireAt: Date.now() + 5 * 60 * 1000,
  })

  // 生产环境中这里应该调用短信服务API
  console.log(`📱 发送验证码到 ${phone}: ${code}`)

  return true
}

/**
 * 验证码登录
 */
export const loginWithCode = async (phone: string, code: string) => {
  // 验证验证码
  const stored = verificationCodes.get(phone)
  if (!stored || stored.code !== code || stored.expireAt < Date.now()) {
    throw new Error('验证码错误或已过期')
  }

  // 删除已使用的验证码
  verificationCodes.delete(phone)

  // 查找或创建用户
  let user = await findUserByPhone(phone)
  if (!user) {
    user = await createUser({ phone })
  }

  // 生成Token
  const token = generateToken(user.id, 'user')

  return {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      balance: user.balance,
    },
  }
}

/**
 * 密码登录
 */
export const loginWithPassword = async (phone: string, password: string) => {
  const user = await findUserByPhone(phone)

  if (!user || !user.password_hash) {
    throw new Error('手机号或密码错误')
  }

  // 验证密码
  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) {
    throw new Error('手机号或密码错误')
  }

  // 生成Token
  const token = generateToken(user.id, 'user')

  return {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      balance: user.balance,
    },
  }
}

/**
 * 用户注册
 */
export const register = async (data: {
  phone: string
  code: string
  password: string
  nickname?: string
}) => {
  // 验证验证码
  const stored = verificationCodes.get(data.phone)
  if (!stored || stored.code !== data.code || stored.expireAt < Date.now()) {
    throw new Error('验证码错误或已过期')
  }

  // 删除已使用的验证码
  verificationCodes.delete(data.phone)

  // 检查手机号是否已注册
  const existing = await findUserByPhone(data.phone)
  if (existing) {
    throw new Error('该手机号已注册')
  }

  // 创建用户
  const user = await createUser({
    phone: data.phone,
    password: data.password,
    nickname: data.nickname,
  })

  // 生成Token
  const token = generateToken(user.id, 'user')

  return {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      balance: user.balance,
    },
  }
}

/**
 * 获取用户信息
 */
export const getUserProfile = async (userId: string) => {
  const result = await query(
    'SELECT id, phone, nickname, avatar, balance, created_at FROM users WHERE id = $1',
    [userId]
  )

  if (result.rows.length === 0) {
    throw new Error('用户不存在')
  }

  return result.rows[0]
}

/**
 * 更新用户信息
 */
export const updateUserProfile = async (
  userId: string,
  data: { nickname?: string; avatar?: string }
) => {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.nickname !== undefined) {
    updates.push(`nickname = $${paramIndex++}`)
    values.push(data.nickname)
  }

  if (data.avatar !== undefined) {
    updates.push(`avatar = $${paramIndex++}`)
    values.push(data.avatar)
  }

  if (updates.length === 0) {
    throw new Error('没有可更新的数据')
  }

  values.push(userId)

  const result = await query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING id, phone, nickname, avatar, balance`,
    values
  )

  return result.rows[0]
}

/**
 * 修改密码
 */
export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId])

  if (result.rows.length === 0) {
    throw new Error('用户不存在')
  }

  const user = result.rows[0]

  // 验证旧密码
  if (!user.password_hash) {
    throw new Error('请先设置密码')
  }

  const isValid = await bcrypt.compare(oldPassword, user.password_hash)
  if (!isValid) {
    throw new Error('旧密码错误')
  }

  // 更新密码
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
    passwordHash,
    userId,
  ])
}

/**
 * 重置密码
 */
export const resetPassword = async (phone: string, code: string, newPassword: string) => {
  // 验证验证码
  const stored = verificationCodes.get(phone)
  if (!stored || stored.code !== code || stored.expireAt < Date.now()) {
    throw new Error('验证码错误或已过期')
  }

  // 删除已使用的验证码
  verificationCodes.delete(phone)

  // 查找用户
  const user = await findUserByPhone(phone)
  if (!user) {
    throw new Error('用户不存在')
  }

  // 更新密码
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
    passwordHash,
    user.id,
  ])
}

// ========== 辅助函数 ==========

/**
 * 根据手机号查找用户
 */
async function findUserByPhone(phone: string) {
  const result = await query(
    'SELECT id, phone, nickname, avatar, balance, password_hash FROM users WHERE phone = $1',
    [phone]
  )

  return result.rows.length > 0 ? result.rows[0] : null
}

/**
 * 创建用户
 */
async function createUser(data: { phone: string; password?: string; nickname?: string }) {
  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null
  // 生成UUID作为用户ID
  const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  const result = await query(
    `INSERT INTO users (id, phone, username, password_hash, nickname, balance)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, phone, nickname, avatar, balance`,
    [
      userId,
      data.phone,
      data.phone, // username使用phone
      passwordHash,
      data.nickname || `用户${data.phone.slice(-4)}`,
      0
    ]
  )

  return result.rows[0]
}

/**
 * 生成JWT Token
 */
function generateToken(userId: string, role: 'user' | 'admin'): string {
  return jwt.sign(
    { id: userId, role },
    config.jwt.secret,
    { expiresIn: '7d' } // 7天有效期
  )
}
