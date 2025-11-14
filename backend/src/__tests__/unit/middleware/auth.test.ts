/**
 * auth 中间件单元测试
 */

import { Request, Response, NextFunction } from 'express'
import * as authMiddleware from '../../../middleware/auth'
import * as authService from '../../../services/authService'
import * as permissions from '../../../config/permissions'

// Mock authService
jest.mock('../../../services/authService')

// Mock permissions
jest.mock('../../../config/permissions', () => ({
  ...jest.requireActual('../../../config/permissions'),
  hasPermission: jest.fn(),
}))

describe('auth middleware - 管理员认证中间件', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      headers: {},
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
    jest.clearAllMocks()
  })

  describe('authenticate - 管理员认证', () => {
    it('应该成功验证有效的管理员token', () => {
      const mockToken = 'valid-admin-token'
      const mockDecoded = {
        id: 'admin_123',
        username: 'admin',
        role: 'admin',
        email: 'admin@example.com',
        iat: Date.now(),
        exp: Date.now() + 86400,
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded)

      authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(authService.verifyToken).toHaveBeenCalledWith(mockToken)
      expect(mockRequest.user).toEqual({
        id: 'admin_123',
        username: 'admin',
        role: 'admin',
        email: 'admin@example.com',
      })
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该支持不带Bearer前缀的token', () => {
      const mockToken = 'token-without-bearer'
      const mockDecoded = {
        id: 'admin_456',
        username: 'superadmin',
        role: 'super_admin',
        email: 'super@example.com',
        iat: Date.now(),
        exp: Date.now() + 86400,
      }

      mockRequest.headers = {
        authorization: mockToken,
      }

      ;(authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded)

      authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(authService.verifyToken).toHaveBeenCalledWith(mockToken)
      expect(mockRequest.user).toEqual({
        id: 'admin_456',
        username: 'superadmin',
        role: 'super_admin',
        email: 'super@example.com',
      })
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该在没有authorization header时返回401', () => {
      mockRequest.headers = {}

      authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供认证token',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该在token验证失败时返回401', () => {
      const mockToken = 'invalid-token'

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(authService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token无效或已过期',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该正确提取Bearer token', () => {
      const mockToken = 'my-bearer-token'
      const mockDecoded = {
        id: 'admin_789',
        username: 'manager',
        role: 'manager',
        email: 'manager@example.com',
        iat: Date.now(),
        exp: Date.now() + 86400,
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded)

      authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(authService.verifyToken).toHaveBeenCalledWith(mockToken)
    })
  })

  describe('requireRole - 角色权限检查', () => {
    it('应该允许具有正确角色的用户', () => {
      mockRequest.user = {
        id: 'admin_123',
        username: 'admin',
        role: 'admin',
        email: 'admin@example.com',
      }

      const middleware = authMiddleware.requireRole(['admin', 'super_admin'])
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该允许多个角色中的任一角色', () => {
      mockRequest.user = {
        id: 'admin_456',
        username: 'superadmin',
        role: 'super_admin',
        email: 'super@example.com',
      }

      const middleware = authMiddleware.requireRole(['admin', 'super_admin', 'manager'])
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('应该在未认证时返回401', () => {
      mockRequest.user = undefined

      const middleware = authMiddleware.requireRole(['admin'])
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '未认证',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该在角色不匹配时返回403', () => {
      mockRequest.user = {
        id: 'user_123',
        username: 'viewer',
        role: 'viewer',
        email: 'viewer@example.com',
      }

      const middleware = authMiddleware.requireRole(['admin', 'super_admin'])
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '权限不足',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该区分大小写检查角色', () => {
      mockRequest.user = {
        id: 'admin_123',
        username: 'admin',
        role: 'admin',
        email: 'admin@example.com',
      }

      const middleware = authMiddleware.requireRole(['Admin', 'ADMIN'])
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('optionalAuth - 可选认证', () => {
    it('应该成功验证有效的token', () => {
      const mockToken = 'valid-token'
      const mockDecoded = {
        id: 'admin_123',
        username: 'admin',
        role: 'admin',
        email: 'admin@example.com',
        iat: Date.now(),
        exp: Date.now() + 86400,
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded)

      authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(authService.verifyToken).toHaveBeenCalledWith(mockToken)
      expect(mockRequest.user).toEqual({
        id: 'admin_123',
        username: 'admin',
        role: 'admin',
        email: 'admin@example.com',
      })
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该在没有authorization header时继续执行', () => {
      mockRequest.headers = {}

      authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该在token无效时继续执行', () => {
      const mockToken = 'invalid-token'

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(authService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该支持不带Bearer前缀的token', () => {
      const mockToken = 'simple-token'
      const mockDecoded = {
        id: 'admin_456',
        username: 'manager',
        role: 'manager',
        email: 'manager@example.com',
        iat: Date.now(),
        exp: Date.now() + 86400,
      }

      mockRequest.headers = {
        authorization: mockToken,
      }

      ;(authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded)

      authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(authService.verifyToken).toHaveBeenCalledWith(mockToken)
      expect(mockRequest.user).toEqual({
        id: 'admin_456',
        username: 'manager',
        role: 'manager',
        email: 'manager@example.com',
      })
    })
  })

  describe('requirePermission - 细粒度权限检查', () => {
    it('应该允许有权限的用户', () => {
      mockRequest.user = {
        id: 'admin_123',
        username: 'admin',
        role: 'admin',
        email: 'admin@example.com',
      }

      ;(permissions.hasPermission as jest.Mock).mockReturnValue(true)

      const middleware = authMiddleware.requirePermission(
        'users' as permissions.Resource,
        'read' as permissions.Action
      )
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(permissions.hasPermission).toHaveBeenCalledWith('admin', 'users', 'read')
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该在未认证时返回401', () => {
      mockRequest.user = undefined

      const middleware = authMiddleware.requirePermission(
        'users' as permissions.Resource,
        'write' as permissions.Action
      )
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '未认证',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该在权限不足时返回403', () => {
      mockRequest.user = {
        id: 'user_123',
        username: 'viewer',
        role: 'viewer',
        email: 'viewer@example.com',
      }

      ;(permissions.hasPermission as jest.Mock).mockReturnValue(false)

      const middleware = authMiddleware.requirePermission(
        'users' as permissions.Resource,
        'delete' as permissions.Action
      )
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(permissions.hasPermission).toHaveBeenCalledWith('viewer', 'users', 'delete')
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '权限不足，无法执行此操作',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该支持不同的资源和操作组合', () => {
      mockRequest.user = {
        id: 'admin_456',
        username: 'superadmin',
        role: 'super_admin',
        email: 'super@example.com',
      }

      ;(permissions.hasPermission as jest.Mock).mockReturnValue(true)

      const middleware = authMiddleware.requirePermission(
        'orders' as permissions.Resource,
        'update' as permissions.Action
      )
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(permissions.hasPermission).toHaveBeenCalledWith('super_admin', 'orders', 'update')
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('requireAuth - 组合中间件', () => {
    it('应该返回包含认证和权限检查的中间件数组', () => {
      const result = authMiddleware.requireAuth(
        'users' as permissions.Resource,
        'read' as permissions.Action
      )

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(authMiddleware.authenticate)
      expect(typeof result[1]).toBe('function')
    })

    it('应该正确包装权限检查中间件', () => {
      const middlewares = authMiddleware.requireAuth(
        'orders' as permissions.Resource,
        'write' as permissions.Action
      )

      expect(middlewares).toHaveLength(2)
      expect(typeof middlewares[0]).toBe('function')
      expect(typeof middlewares[1]).toBe('function')
    })
  })
})
