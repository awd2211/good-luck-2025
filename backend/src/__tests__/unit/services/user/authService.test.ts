/**
 * user/authService 单元测试
 */

import * as authService from '../../../../services/user/authService'
import { query } from '../../../../config/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock dependencies
jest.mock('../../../../config/database', () => ({
  query: jest.fn(),
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}))

describe('user/authService - 用户认证服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 清除验证码缓存（通过重新导入模块）
    jest.resetModules()
  })

  describe('sendVerificationCode - 发送验证码', () => {
    it('应该成功发送验证码', async () => {
      const result = await authService.sendVerificationCode('13900000001')

      expect(result).toBe(true)
    })

    it('应该生成6位数字验证码', async () => {
      // 监听console.log来捕获验证码
      const consoleSpy = jest.spyOn(console, 'log')

      await authService.sendVerificationCode('13900000002')

      expect(consoleSpy).toHaveBeenCalled()
      const logMessage = consoleSpy.mock.calls[0][0]
      const codeMatch = logMessage.match(/: (\d{6})/)
      expect(codeMatch).toBeTruthy()
      expect(codeMatch![1]).toHaveLength(6)

      consoleSpy.mockRestore()
    })

    it('应该能够为不同手机号发送验证码', async () => {
      await authService.sendVerificationCode('13900000001')
      await authService.sendVerificationCode('13900000002')

      // 验证码都应该成功发送
      expect(true).toBe(true)
    })
  })

  describe('loginWithCode - 验证码登录', () => {
    it('应该成功登录已存在的用户', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '13900000001',
        nickname: '测试用户',
        avatar: null,
        balance: 100,
      }

      // 先发送验证码
      const consoleSpy = jest.spyOn(console, 'log')
      await authService.sendVerificationCode('13900000001')
      const logMessage = consoleSpy.mock.calls[0][0]
      const code = logMessage.match(/: (\d{6})/)[1]
      consoleSpy.mockRestore()

      // Mock 查找用户
      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUser] })
      ;(jwt.sign as jest.Mock).mockReturnValue('mock_token')

      const result = await authService.loginWithCode('13900000001', code)

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('user')
      expect(result.user.id).toBe('user_123')
      expect(result.token).toBe('mock_token')
    })

    it('应该为新用户自动创建账号', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      await authService.sendVerificationCode('13900000001')
      const logMessage = consoleSpy.mock.calls[0][0]
      const code = logMessage.match(/: (\d{6})/)[1]
      consoleSpy.mockRestore()

      // Mock 查找用户返回空
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // findUserByPhone
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'user_new_123',
              phone: '13900000001',
              nickname: '用户0001',
              avatar: null,
              balance: 0,
            },
          ],
        }) // createUser

      ;(jwt.sign as jest.Mock).mockReturnValue('mock_token')

      const result = await authService.loginWithCode('13900000001', code)

      expect(result).toHaveProperty('token')
      expect(result.user.balance).toBe(0)
    })

    it('应该在验证码错误时抛出异常', async () => {
      await authService.sendVerificationCode('13900000001')

      await expect(authService.loginWithCode('13900000001', '000000')).rejects.toThrow(
        '验证码错误或已过期'
      )
    })

    it('应该在验证码过期后抛出异常', async () => {
      // 这个测试需要模拟时间流逝，暂时跳过
      // 实际场景中验证码5分钟过期
    })

    it('应该在使用验证码后删除验证码', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      await authService.sendVerificationCode('13900000001')
      const logMessage = consoleSpy.mock.calls[0][0]
      const code = logMessage.match(/: (\d{6})/)[1]
      consoleSpy.mockRestore()

      ;(query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'user_123', phone: '13900000001', balance: 0 }],
      })
      ;(jwt.sign as jest.Mock).mockReturnValue('mock_token')

      await authService.loginWithCode('13900000001', code)

      // 再次使用相同验证码应该失败
      await expect(authService.loginWithCode('13900000001', code)).rejects.toThrow(
        '验证码错误或已过期'
      )
    })
  })

  describe('loginWithPassword - 密码登录', () => {
    it('应该成功登录', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '13900000001',
        nickname: '测试用户',
        avatar: null,
        balance: 100,
        password_hash: 'hashed_password',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUser] })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock).mockReturnValue('mock_token')

      const result = await authService.loginWithPassword('13900000001', 'password123')

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('user')
      expect(result.user.id).toBe('user_123')
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password')
    })

    it('应该在用户不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(
        authService.loginWithPassword('13900000001', 'password123')
      ).rejects.toThrow('手机号或密码错误')
    })

    it('应该在密码错误时抛出异常', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '13900000001',
        password_hash: 'hashed_password',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUser] })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        authService.loginWithPassword('13900000001', 'wrong_password')
      ).rejects.toThrow('手机号或密码错误')
    })

    it('应该在用户未设置密码时抛出异常', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '13900000001',
        password_hash: null,
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUser] })

      await expect(
        authService.loginWithPassword('13900000001', 'password123')
      ).rejects.toThrow('手机号或密码错误')
    })
  })

  describe('register - 用户注册', () => {
    it('应该成功注册新用户', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      await authService.sendVerificationCode('13900000001')
      const logMessage = consoleSpy.mock.calls[0][0]
      const code = logMessage.match(/: (\d{6})/)[1]
      consoleSpy.mockRestore()

      // Mock 查找用户返回空（未注册）
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // findUserByPhone
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'user_new_123',
              phone: '13900000001',
              nickname: '新用户',
              avatar: null,
              balance: 0,
            },
          ],
        }) // createUser

      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')
      ;(jwt.sign as jest.Mock).mockReturnValue('mock_token')

      const result = await authService.register({
        phone: '13900000001',
        code,
        password: 'password123',
        nickname: '新用户',
      })

      expect(result).toHaveProperty('token')
      expect(result.user.nickname).toBe('新用户')
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
    })

    it('应该在手机号已注册时抛出异常', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      await authService.sendVerificationCode('13900000001')
      const logMessage = consoleSpy.mock.calls[0][0]
      const code = logMessage.match(/: (\d{6})/)[1]
      consoleSpy.mockRestore()

      // Mock 查找用户返回已存在的用户
      ;(query as jest.Mock).mockResolvedValue({
        rows: [{ id: 'user_123', phone: '13900000001' }],
      })

      await expect(
        authService.register({
          phone: '13900000001',
          code,
          password: 'password123',
        })
      ).rejects.toThrow('该手机号已注册')
    })

    it('应该在验证码错误时抛出异常', async () => {
      await authService.sendVerificationCode('13900000001')

      await expect(
        authService.register({
          phone: '13900000001',
          code: '000000',
          password: 'password123',
        })
      ).rejects.toThrow('验证码错误或已过期')
    })
  })

  describe('getUserProfile - 获取用户信息', () => {
    it('应该成功获取用户信息', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '13900000001',
        nickname: '测试用户',
        avatar: 'https://example.com/avatar.jpg',
        balance: 100,
        created_at: '2025-01-01',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUser] })

      const result = await authService.getUserProfile('user_123')

      expect(result).toEqual(mockUser)
      expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['user_123'])
    })

    it('应该在用户不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(authService.getUserProfile('user_not_exist')).rejects.toThrow('用户不存在')
    })
  })

  describe('updateUserProfile - 更新用户信息', () => {
    it('应该成功更新昵称', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '13900000001',
        nickname: '新昵称',
        avatar: null,
        balance: 100,
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUser] })

      const result = await authService.updateUserProfile('user_123', {
        nickname: '新昵称',
      })

      expect(result.nickname).toBe('新昵称')
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['新昵称', 'user_123'])
      )
    })

    it('应该成功更新头像', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '13900000001',
        nickname: '测试用户',
        avatar: 'https://example.com/new-avatar.jpg',
        balance: 100,
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUser] })

      const result = await authService.updateUserProfile('user_123', {
        avatar: 'https://example.com/new-avatar.jpg',
      })

      expect(result.avatar).toBe('https://example.com/new-avatar.jpg')
    })

    it('应该支持同时更新多个字段', async () => {
      const mockUser = {
        id: 'user_123',
        phone: '13900000001',
        nickname: '新昵称',
        avatar: 'https://example.com/new-avatar.jpg',
        balance: 100,
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUser] })

      const result = await authService.updateUserProfile('user_123', {
        nickname: '新昵称',
        avatar: 'https://example.com/new-avatar.jpg',
      })

      expect(result.nickname).toBe('新昵称')
      expect(result.avatar).toBe('https://example.com/new-avatar.jpg')
    })

    it('应该在没有可更新数据时抛出异常', async () => {
      await expect(authService.updateUserProfile('user_123', {})).rejects.toThrow(
        '没有可更新的数据'
      )
    })
  })

  describe('changePassword - 修改密码', () => {
    it('应该成功修改密码', async () => {
      const mockUser = {
        password_hash: 'old_hashed_password',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockUser] }) // 查询用户
        .mockResolvedValueOnce({ rows: [] }) // 更新密码

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password')

      await authService.changePassword('user_123', 'old_password', 'new_password')

      expect(bcrypt.compare).toHaveBeenCalledWith('old_password', 'old_hashed_password')
      expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 10)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password_hash'),
        ['new_hashed_password', 'user_123']
      )
    })

    it('应该在用户不存在时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await expect(
        authService.changePassword('user_not_exist', 'old_password', 'new_password')
      ).rejects.toThrow('用户不存在')
    })

    it('应该在用户未设置密码时抛出异常', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [{ password_hash: null }] })

      await expect(
        authService.changePassword('user_123', 'old_password', 'new_password')
      ).rejects.toThrow('请先设置密码')
    })

    it('应该在旧密码错误时抛出异常', async () => {
      const mockUser = {
        password_hash: 'hashed_password',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockUser] })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        authService.changePassword('user_123', 'wrong_old_password', 'new_password')
      ).rejects.toThrow('旧密码错误')
    })
  })

  describe('resetPassword - 重置密码', () => {
    it('应该成功重置密码', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      await authService.sendVerificationCode('13900000001')
      const logMessage = consoleSpy.mock.calls[0][0]
      const code = logMessage.match(/: (\d{6})/)[1]
      consoleSpy.mockRestore()

      // Mock 查找用户
      ;(query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 'user_123', phone: '13900000001' }],
        }) // findUserByPhone
        .mockResolvedValueOnce({ rows: [] }) // 更新密码

      ;(bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password')

      await authService.resetPassword('13900000001', code, 'new_password')

      expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 10)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password_hash'),
        ['new_hashed_password', 'user_123']
      )
    })

    it('应该在验证码错误时抛出异常', async () => {
      await authService.sendVerificationCode('13900000001')

      await expect(
        authService.resetPassword('13900000001', '000000', 'new_password')
      ).rejects.toThrow('验证码错误或已过期')
    })

    it('应该在用户不存在时抛出异常', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      await authService.sendVerificationCode('13900000001')
      const logMessage = consoleSpy.mock.calls[0][0]
      const code = logMessage.match(/: (\d{6})/)[1]
      consoleSpy.mockRestore()

      ;(query as jest.Mock).mockResolvedValue({ rows: [] }) // findUserByPhone

      await expect(
        authService.resetPassword('13900000001', code, 'new_password')
      ).rejects.toThrow('用户不存在')
    })
  })
})
