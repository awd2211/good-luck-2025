/**
 * authController 单元测试
 */

import * as authController from '../../../controllers/user/authController'
import * as authService from '../../../services/user/authService'
import { createMockRequest, createMockResponse, createMockNext } from '../../helpers/testHelpers'

// Mock authService
jest.mock('../../../services/user/authService')

describe('authController - 认证控制器', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendCode - 发送验证码', () => {
    it('应该成功发送验证码', async () => {
      const req = createMockRequest({
        body: { phone: '13900000001' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      ;(authService.sendVerificationCode as jest.Mock).mockResolvedValue(true)

      await authController.sendCode(req as any, res as any, next)

      expect(authService.sendVerificationCode).toHaveBeenCalledWith('13900000001')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '验证码已发送',
      })
    })

    it('应该在手机号无效时返回400错误', async () => {
      const req = createMockRequest({
        body: { phone: '12345' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authController.sendCode(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请输入有效的手机号',
      })
    })

    it('应该在手机号为空时返回400错误', async () => {
      const req = createMockRequest({
        body: {},
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authController.sendCode(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '请输入有效的手机号',
      })
    })

    it('应该在发生错误时调用next', async () => {
      const req = createMockRequest({
        body: { phone: '13900000001' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      const error = new Error('发送失败')
      ;(authService.sendVerificationCode as jest.Mock).mockRejectedValue(error)

      await authController.sendCode(req as any, res as any, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('loginWithCode - 验证码登录', () => {
    it('应该成功登录', async () => {
      const mockResult = {
        token: 'test.jwt.token',
        user: {
          id: 'user_123',
          phone: '13900000001',
          nickname: '测试用户',
          avatar: null,
          balance: 100,
        },
      }

      const req = createMockRequest({
        body: { phone: '13900000001', code: '123456' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      ;(authService.loginWithCode as jest.Mock).mockResolvedValue(mockResult)

      await authController.loginWithCode(req as any, res as any, next)

      expect(authService.loginWithCode).toHaveBeenCalledWith('13900000001', '123456')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '登录成功',
        data: mockResult,
      })
    })

    it('应该在参数缺失时返回400错误', async () => {
      const req = createMockRequest({
        body: { phone: '13900000001' }, // 缺少 code
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authController.loginWithCode(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '手机号和验证码不能为空',
      })
    })

    it('应该在服务层抛出错误时调用next', async () => {
      const req = createMockRequest({
        body: { phone: '13900000001', code: '123456' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      const error = new Error('验证码错误')
      ;(authService.loginWithCode as jest.Mock).mockRejectedValue(error)

      await authController.loginWithCode(req as any, res as any, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('loginWithPassword - 密码登录', () => {
    it('应该成功登录', async () => {
      const mockResult = {
        token: 'test.jwt.token',
        user: {
          id: 'user_123',
          phone: '13900000001',
          nickname: '测试用户',
          avatar: null,
          balance: 100,
        },
      }

      const req = createMockRequest({
        body: { phone: '13900000001', password: 'password123' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      ;(authService.loginWithPassword as jest.Mock).mockResolvedValue(mockResult)

      await authController.loginWithPassword(req as any, res as any, next)

      expect(authService.loginWithPassword).toHaveBeenCalledWith('13900000001', 'password123')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '登录成功',
        data: mockResult,
      })
    })

    it('应该在参数缺失时返回400错误', async () => {
      const req = createMockRequest({
        body: { phone: '13900000001' }, // 缺少 password
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authController.loginWithPassword(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '手机号和密码不能为空',
      })
    })
  })

  describe('register - 用户注册', () => {
    it('应该成功注册用户', async () => {
      const mockResult = {
        token: 'test.jwt.token',
        user: {
          id: 'user_new',
          phone: '13900000002',
          nickname: '新用户',
          avatar: null,
          balance: 0,
        },
      }

      const req = createMockRequest({
        body: {
          phone: '13900000002',
          code: '123456',
          password: 'password123',
          nickname: '新用户',
        },
      })
      const res = createMockResponse()
      const next = createMockNext()

      ;(authService.register as jest.Mock).mockResolvedValue(mockResult)

      await authController.register(req as any, res as any, next)

      expect(authService.register).toHaveBeenCalledWith({
        phone: '13900000002',
        code: '123456',
        password: 'password123',
        nickname: '新用户',
      })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '注册成功',
        data: mockResult,
      })
    })

    it('应该在必填参数缺失时返回400错误', async () => {
      const req = createMockRequest({
        body: {
          phone: '13900000002',
          code: '123456',
          // 缺少 password
        },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authController.register(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '手机号、验证码和密码不能为空',
      })
    })
  })

  describe('getProfile - 获取用户信息', () => {
    it('应该成功获取用户信息', async () => {
      const mockProfile = {
        id: 'user_123',
        phone: '13900000001',
        nickname: '测试用户',
        avatar: null,
        balance: 100,
        created_at: new Date('2025-01-01'),
      }

      const req = createMockRequest({
        user: { id: 'user_123', role: 'user' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      ;(authService.getUserProfile as jest.Mock).mockResolvedValue(mockProfile)

      await authController.getProfile(req as any, res as any, next)

      expect(authService.getUserProfile).toHaveBeenCalledWith('user_123')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile,
      })
    })

    it('应该在未登录时返回401错误', async () => {
      const req = createMockRequest({
        // 没有 user 属性
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authController.getProfile(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未登录',
      })
    })
  })

  describe('updateProfile - 更新用户信息', () => {
    it('应该成功更新用户信息', async () => {
      const mockUpdatedProfile = {
        id: 'user_123',
        phone: '13900000001',
        nickname: '新昵称',
        avatar: 'new-avatar.jpg',
        balance: 100,
      }

      const req = createMockRequest({
        user: { id: 'user_123', role: 'user' },
        body: { nickname: '新昵称', avatar: 'new-avatar.jpg' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      ;(authService.updateUserProfile as jest.Mock).mockResolvedValue(mockUpdatedProfile)

      await authController.updateProfile(req as any, res as any, next)

      expect(authService.updateUserProfile).toHaveBeenCalledWith('user_123', {
        nickname: '新昵称',
        avatar: 'new-avatar.jpg',
      })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '更新成功',
        data: mockUpdatedProfile,
      })
    })

    it('应该在未登录时返回401错误', async () => {
      const req = createMockRequest({
        body: { nickname: '新昵称' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authController.updateProfile(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未登录',
      })
    })
  })

  describe('changePassword - 修改密码', () => {
    it('应该成功修改密码', async () => {
      const req = createMockRequest({
        user: { id: 'user_123', role: 'user' },
        body: { oldPassword: 'old_password', newPassword: 'new_password' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      ;(authService.changePassword as jest.Mock).mockResolvedValue(undefined)

      await authController.changePassword(req as any, res as any, next)

      expect(authService.changePassword).toHaveBeenCalledWith(
        'user_123',
        'old_password',
        'new_password'
      )
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '密码修改成功',
      })
    })

    it('应该在未登录时返回401错误', async () => {
      const req = createMockRequest({
        body: { oldPassword: 'old', newPassword: 'new' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authController.changePassword(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('应该在参数缺失时返回400错误', async () => {
      const req = createMockRequest({
        user: { id: 'user_123', role: 'user' },
        body: { oldPassword: 'old' }, // 缺少 newPassword
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authController.changePassword(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '旧密码和新密码不能为空',
      })
    })
  })

  describe('resetPassword - 重置密码', () => {
    it('应该成功重置密码', async () => {
      const req = createMockRequest({
        body: {
          phone: '13900000001',
          code: '123456',
          newPassword: 'new_password',
        },
      })
      const res = createMockResponse()
      const next = createMockNext()

      ;(authService.resetPassword as jest.Mock).mockResolvedValue(undefined)

      await authController.resetPassword(req as any, res as any, next)

      expect(authService.resetPassword).toHaveBeenCalledWith('13900000001', '123456', 'new_password')
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '密码重置成功',
      })
    })

    it('应该在参数缺失时返回400错误', async () => {
      const req = createMockRequest({
        body: {
          phone: '13900000001',
          code: '123456',
          // 缺少 newPassword
        },
      })
      const res = createMockResponse()
      const next = createMockNext()

      await authController.resetPassword(req as any, res as any, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '手机号、验证码和新密码不能为空',
      })
    })
  })
})
