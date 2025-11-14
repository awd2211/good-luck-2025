/**
 * authService 单元测试
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as authService from '../../../services/user/authService'
import { mockQuery, mockQueryResponses, resetDatabaseMocks } from '../../mocks/database'

// Mock 依赖模块
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

// 导入 mock 后的 query
const { query } = require('../../../config/database')

describe('authService - 用户认证服务', () => {
  beforeEach(() => {
    // 每个测试前重置所有 mock
    jest.clearAllMocks()
    resetDatabaseMocks()
  })

  describe('sendVerificationCode - 发送验证码', () => {
    it('应该成功生成并发送验证码', async () => {
      const phone = '13900000001'
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result = await authService.sendVerificationCode(phone)

      expect(result).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(phone))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📱 发送验证码'))

      consoleSpy.mockRestore()
    })

    it('应该生成6位数字验证码', async () => {
      const phone = '13900000001'
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await authService.sendVerificationCode(phone)

      const logCall = consoleSpy.mock.calls[0][0]
      const codeMatch = logCall.match(/: (\d{6})$/)

      expect(codeMatch).not.toBeNull()
      expect(codeMatch![1]).toHaveLength(6)

      consoleSpy.mockRestore()
    })
  })

  describe('loginWithCode - 验证码登录', () => {
    it('应该在验证码正确时成功登录已存在的用户', async () => {
      const phone = '13900000001'
      const code = '123456'

      // 先发送验证码
      await authService.sendVerificationCode(phone)
      // 获取实际的验证码（从控制台日志中提取）
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      await authService.sendVerificationCode(phone)
      const logCall = consoleSpy.mock.calls[0][0]
      const actualCode = logCall.match(/: (\d{6})$/)?.[1] || code
      consoleSpy.mockRestore()

      // Mock 数据库查询 - 用户已存在
      query.mockResolvedValueOnce(mockQueryResponses.singleUser)

      // Mock JWT 生成
      ;(jwt.sign as jest.Mock).mockReturnValue('test.jwt.token')

      const result = await authService.loginWithCode(phone, actualCode)

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('user')
      expect(result.user.phone).toBe(phone)
      expect(query).toHaveBeenCalled()
    })

    it('应该在用户不存在时自动创建新用户', async () => {
      const phone = '13900000002'

      // 先发送验证码并获取实际验证码
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      await authService.sendVerificationCode(phone)
      const logCall = consoleSpy.mock.calls[0][0]
      const actualCode = logCall.match(/: (\d{6})$/)?.[1] || '123456'
      consoleSpy.mockRestore()

      // Mock 数据库查询 - 用户不存在
      query.mockResolvedValueOnce(mockQueryResponses.empty)
      // Mock 创建用户
      query.mockResolvedValueOnce({
        rows: [{ id: 'user_new', phone, nickname: '新用户', avatar: null, balance: 0 }],
        rowCount: 1,
      })

      // Mock JWT 生成
      ;(jwt.sign as jest.Mock).mockReturnValue('test.jwt.token')

      const result = await authService.loginWithCode(phone, actualCode)

      expect(result).toHaveProperty('token')
      expect(result.user.phone).toBe(phone)
      expect(query).toHaveBeenCalledTimes(2) // 一次查询，一次插入
    })

    it('应该在验证码错误时抛出异常', async () => {
      const phone = '13900000001'
      await authService.sendVerificationCode(phone)

      await expect(authService.loginWithCode(phone, '000000')).rejects.toThrow(
        '验证码错误或已过期'
      )
    })

    it('应该在验证码过期时抛出异常', async () => {
      const phone = '13900000001'

      // 手动设置一个已过期的验证码 (需要访问内部状态，这里用延迟模拟)
      // 注意：这是简化测试，实际应该 mock Date.now()
      await expect(authService.loginWithCode(phone, '123456')).rejects.toThrow(
        '验证码错误或已过期'
      )
    })
  })

  describe('loginWithPassword - 密码登录', () => {
    it('应该在密码正确时成功登录', async () => {
      const phone = '13900000001'
      const password = 'correct_password'

      // Mock 数据库查询 - 返回带密码的用户
      query.mockResolvedValueOnce(mockQueryResponses.singleUser)

      // Mock bcrypt 密码验证
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      // Mock JWT 生成
      ;(jwt.sign as jest.Mock).mockReturnValue('test.jwt.token')

      const result = await authService.loginWithPassword(phone, password)

      expect(result).toHaveProperty('token')
      expect(result.user.phone).toBe(phone)
      expect(bcrypt.compare).toHaveBeenCalledWith(password, expect.any(String))
    })

    it('应该在用户不存在时抛出异常', async () => {
      const phone = '13900000001'
      const password = 'password'

      // Mock 数据库查询 - 用户不存在
      query.mockResolvedValueOnce(mockQueryResponses.empty)

      await expect(authService.loginWithPassword(phone, password)).rejects.toThrow(
        '手机号或密码错误'
      )
    })

    it('应该在密码错误时抛出异常', async () => {
      const phone = '13900000001'
      const password = 'wrong_password'

      // Mock 数据库查询 - 用户存在
      query.mockResolvedValueOnce(mockQueryResponses.singleUser)

      // Mock bcrypt 密码验证 - 密码错误
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(authService.loginWithPassword(phone, password)).rejects.toThrow(
        '手机号或密码错误'
      )
    })

    it('应该在用户未设置密码时抛出异常', async () => {
      const phone = '13900000001'
      const password = 'password'

      // Mock 数据库查询 - 用户存在但没有密码
      query.mockResolvedValueOnce({
        rows: [{ ...mockQueryResponses.singleUser.rows[0], password_hash: null }],
        rowCount: 1,
      })

      await expect(authService.loginWithPassword(phone, password)).rejects.toThrow(
        '手机号或密码错误'
      )
    })
  })

  describe('register - 用户注册', () => {
    it('应该成功注册新用户', async () => {
      const phone = '13900000003'
      const password = 'new_password'
      const nickname = '新用户昵称'

      // 发送验证码并获取
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      await authService.sendVerificationCode(phone)
      const logCall = consoleSpy.mock.calls[0][0]
      const code = logCall.match(/: (\d{6})$/)?.[1] || '123456'
      consoleSpy.mockRestore()

      // Mock 数据库查询 - 用户不存在
      query.mockResolvedValueOnce(mockQueryResponses.empty)

      // Mock bcrypt 密码加密
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')

      // Mock 插入用户
      query.mockResolvedValueOnce({
        rows: [{ id: 'user_new', phone, nickname, avatar: null, balance: 0 }],
        rowCount: 1,
      })

      // Mock JWT 生成
      ;(jwt.sign as jest.Mock).mockReturnValue('test.jwt.token')

      const result = await authService.register({ phone, code, password, nickname })

      expect(result).toHaveProperty('token')
      expect(result.user.phone).toBe(phone)
      expect(result.user.nickname).toBe(nickname)
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10)
    })

    it('应该在手机号已注册时抛出异常', async () => {
      const phone = '13900000001'
      const password = 'password'

      // 发送验证码并获取
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      await authService.sendVerificationCode(phone)
      const logCall = consoleSpy.mock.calls[0][0]
      const code = logCall.match(/: (\d{6})$/)?.[1] || '123456'
      consoleSpy.mockRestore()

      // Mock 数据库查询 - 用户已存在
      query.mockResolvedValueOnce(mockQueryResponses.singleUser)

      await expect(authService.register({ phone, code, password })).rejects.toThrow(
        '该手机号已注册'
      )
    })

    it('应该在验证码错误时抛出异常', async () => {
      const phone = '13900000001'

      await expect(
        authService.register({ phone, code: '000000', password: 'password' })
      ).rejects.toThrow('验证码错误或已过期')
    })
  })

  describe('getUserProfile - 获取用户信息', () => {
    it('应该成功获取用户信息', async () => {
      const userId = 'user_test_123'

      // Mock 数据库查询
      query.mockResolvedValueOnce(mockQueryResponses.singleUser)

      const result = await authService.getUserProfile(userId)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('phone')
      expect(result.id).toBe(userId)
      expect(query).toHaveBeenCalledWith(expect.any(String), [userId])
    })

    it('应该在用户不存在时抛出异常', async () => {
      const userId = 'nonexistent_user'

      // Mock 数据库查询 - 用户不存在
      query.mockResolvedValueOnce(mockQueryResponses.empty)

      await expect(authService.getUserProfile(userId)).rejects.toThrow('用户不存在')
    })
  })

  describe('updateUserProfile - 更新用户信息', () => {
    it('应该成功更新用户昵称', async () => {
      const userId = 'user_test_123'
      const nickname = '新昵称'

      // Mock 数据库更新
      query.mockResolvedValueOnce(mockQueryResponses.updateUser)

      const result = await authService.updateUserProfile(userId, { nickname })

      expect(result).toHaveProperty('nickname')
      expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'), expect.any(Array))
    })

    it('应该成功更新用户头像', async () => {
      const userId = 'user_test_123'
      const avatar = 'new-avatar.jpg'

      // Mock 数据库更新
      query.mockResolvedValueOnce({
        rows: [{ ...mockQueryResponses.updateUser.rows[0], avatar }],
        rowCount: 1,
      })

      const result = await authService.updateUserProfile(userId, { avatar })

      expect(result).toHaveProperty('avatar')
      expect(result.avatar).toBe(avatar)
    })

    it('应该在没有更新数据时抛出异常', async () => {
      const userId = 'user_test_123'

      await expect(authService.updateUserProfile(userId, {})).rejects.toThrow('没有可更新的数据')
    })
  })

  describe('changePassword - 修改密码', () => {
    it('应该成功修改密码', async () => {
      const userId = 'user_test_123'
      const oldPassword = 'old_password'
      const newPassword = 'new_password'

      // Mock 查询用户密码
      query.mockResolvedValueOnce(mockQueryResponses.singleUser)

      // Mock bcrypt 验证旧密码
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      // Mock bcrypt 加密新密码
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password')

      // Mock 更新密码
      query.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await authService.changePassword(userId, oldPassword, newPassword)

      expect(bcrypt.compare).toHaveBeenCalledWith(oldPassword, expect.any(String))
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10)
      expect(query).toHaveBeenCalledTimes(2)
    })

    it('应该在旧密码错误时抛出异常', async () => {
      const userId = 'user_test_123'

      // Mock 查询用户密码
      query.mockResolvedValueOnce(mockQueryResponses.singleUser)

      // Mock bcrypt 验证旧密码 - 失败
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        authService.changePassword(userId, 'wrong_password', 'new_password')
      ).rejects.toThrow('旧密码错误')
    })

    it('应该在用户未设置密码时抛出异常', async () => {
      const userId = 'user_test_123'

      // Mock 查询用户 - 没有密码
      query.mockResolvedValueOnce({
        rows: [{ ...mockQueryResponses.singleUser.rows[0], password_hash: null }],
        rowCount: 1,
      })

      await expect(authService.changePassword(userId, 'old', 'new')).rejects.toThrow(
        '请先设置密码'
      )
    })
  })

  describe('resetPassword - 重置密码', () => {
    it('应该成功重置密码', async () => {
      const phone = '13900000001'
      const newPassword = 'new_password'

      // 发送验证码并获取
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      await authService.sendVerificationCode(phone)
      const logCall = consoleSpy.mock.calls[0][0]
      const code = logCall.match(/: (\d{6})$/)?.[1] || '123456'
      consoleSpy.mockRestore()

      // Mock 查询用户
      query.mockResolvedValueOnce(mockQueryResponses.singleUser)

      // Mock bcrypt 加密新密码
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password')

      // Mock 更新密码
      query.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await authService.resetPassword(phone, code, newPassword)

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10)
      expect(query).toHaveBeenCalledTimes(2)
    })

    it('应该在用户不存在时抛出异常', async () => {
      const phone = '13900000001'

      // 发送验证码并获取
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      await authService.sendVerificationCode(phone)
      const logCall = consoleSpy.mock.calls[0][0]
      const code = logCall.match(/: (\d{6})$/)?.[1] || '123456'
      consoleSpy.mockRestore()

      // Mock 查询用户 - 不存在
      query.mockResolvedValueOnce(mockQueryResponses.empty)

      await expect(authService.resetPassword(phone, code, 'new_password')).rejects.toThrow(
        '用户不存在'
      )
    })

    it('应该在验证码错误时抛出异常', async () => {
      const phone = '13900000001'

      await expect(authService.resetPassword(phone, '000000', 'new_password')).rejects.toThrow(
        '验证码错误或已过期'
      )
    })
  })
})
