/**
 * userAuth 中间件单元测试
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authenticateUser, optionalUserAuth } from '../../../middleware/userAuth'
import { config } from '../../../config'

// Mock jwt
jest.mock('jsonwebtoken')

describe('userAuth middleware - 用户认证中间件', () => {
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

  describe('authenticateUser - 必需认证', () => {
    it('应该成功验证有效的用户token', () => {
      const mockToken = 'valid-user-token'
      const mockDecoded = {
        id: 'user_123',
        role: 'user',
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)

      authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, config.jwt.secret)
      expect(mockRequest.user).toEqual({
        id: 'user_123',
        username: '',
        role: 'user',
        email: '',
      })
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该成功验证不同用户的token', () => {
      const mockToken = 'another-valid-token'
      const mockDecoded = {
        id: 'user_456',
        role: 'user',
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)

      authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockRequest.user).toEqual({
        id: 'user_456',
        username: '',
        role: 'user',
        email: '',
      })
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该在没有authorization header时返回401', () => {
      mockRequest.headers = {}

      authenticateUser(
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

    it('应该在authorization header不以Bearer开头时返回401', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      }

      authenticateUser(
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

    it('应该在token角色不是user时返回403', () => {
      const mockToken = 'admin-token'
      const mockDecoded = {
        id: 'admin_123',
        role: 'admin',
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)

      authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '权限不足',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该在token过期时返回401', () => {
      const mockToken = 'expired-token'

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date())
      })

      authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token已过期',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该在token无效时返回401', () => {
      const mockToken = 'invalid-token'

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token')
      })

      authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token无效',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该在发生其他错误时返回500', () => {
      const mockToken = 'error-token'

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unknown error')
      })

      authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '认证失败',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该正确提取Bearer token (移除Bearer前缀)', () => {
      const mockToken = 'my-token-123'
      const mockDecoded = {
        id: 'user_789',
        role: 'user',
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)

      authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, config.jwt.secret)
    })
  })

  describe('optionalUserAuth - 可选认证', () => {
    it('应该成功验证有效的用户token', () => {
      const mockToken = 'valid-user-token'
      const mockDecoded = {
        id: 'user_123',
        role: 'user',
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)

      optionalUserAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, config.jwt.secret)
      expect(mockRequest.user).toEqual({
        id: 'user_123',
        username: '',
        role: 'user',
        email: '',
      })
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该在没有authorization header时继续执行', () => {
      mockRequest.headers = {}

      optionalUserAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该在authorization header不以Bearer开头时继续执行', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      }

      optionalUserAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该在token角色不是user时不设置user信息', () => {
      const mockToken = 'admin-token'
      const mockDecoded = {
        id: 'admin_123',
        role: 'admin',
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)

      optionalUserAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该在token过期时继续执行', () => {
      const mockToken = 'expired-token'

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date())
      })

      optionalUserAuth(
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

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token')
      })

      optionalUserAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该在发生其他错误时继续执行', () => {
      const mockToken = 'error-token'

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unknown error')
      })

      optionalUserAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该正确提取Bearer token', () => {
      const mockToken = 'my-optional-token'
      const mockDecoded = {
        id: 'user_999',
        role: 'user',
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)

      optionalUserAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, config.jwt.secret)
    })

    it('应该支持不同的用户ID', () => {
      const mockToken = 'user-specific-token'
      const mockDecoded = {
        id: 'user_888',
        role: 'user',
      }

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      }

      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecoded)

      optionalUserAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockRequest.user).toEqual({
        id: 'user_888',
        username: '',
        role: 'user',
        email: '',
      })
      expect(mockNext).toHaveBeenCalled()
    })
  })
})
