/**
 * errorHandler 中间件单元测试
 */

import { Request, Response, NextFunction } from 'express'
import {
  AppError,
  ValidationError,
  catchAsync,
  errorHandler,
  notFoundHandler,
} from '../../../middleware/errorHandler'

describe('errorHandler middleware - 错误处理中间件', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/api/test',
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    jest.clearAllMocks()

    // 设置为开发环境
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('AppError - 自定义错误类', () => {
    it('应该创建带有状态码的错误', () => {
      const error = new AppError('测试错误', 400)

      expect(error.message).toBe('测试错误')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
    })

    it('应该默认使用500状态码', () => {
      const error = new AppError('默认错误')

      expect(error.statusCode).toBe(500)
    })

    it('应该继承自Error类', () => {
      const error = new AppError('测试错误')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
    })

    it('应该包含stack trace', () => {
      const error = new AppError('测试错误')

      expect(error.stack).toBeDefined()
    })
  })

  describe('ValidationError - 验证错误类', () => {
    it('应该创建400状态码的错误', () => {
      const error = new ValidationError('验证失败')

      expect(error.message).toBe('验证失败')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
    })

    it('应该继承自AppError', () => {
      const error = new ValidationError('验证失败')

      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('catchAsync - 异步错误包装器', () => {
    it('应该捕获异步函数中的错误', async () => {
      const asyncFn = async (req: Request, res: Response) => {
        throw new Error('异步错误')
      }

      const wrappedFn = catchAsync(asyncFn)

      await wrappedFn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      const error = (mockNext as jest.Mock).mock.calls[0][0]
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('异步错误')
    })

    it('应该不影响正常的异步函数', async () => {
      const asyncFn = async (req: Request, res: Response) => {
        res.json({ success: true })
      }

      const wrappedFn = catchAsync(asyncFn)

      await wrappedFn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该捕获Promise rejection', async () => {
      const asyncFn = async (req: Request, res: Response) => {
        throw new Error('Promise错误')
      }

      const wrappedFn = catchAsync(asyncFn)

      await wrappedFn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      const error = (mockNext as jest.Mock).mock.calls[0][0]
      expect(error.message).toBe('Promise错误')
    })

    it('应该传递请求参数', async () => {
      let receivedReq: Request | null = null
      const asyncFn = async (req: Request, res: Response) => {
        receivedReq = req
      }

      const wrappedFn = catchAsync(asyncFn)

      await wrappedFn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(receivedReq).toBe(mockRequest)
    })
  })

  describe('errorHandler - 全局错误处理', () => {
    it('应该处理AppError错误', () => {
      const error = new AppError('自定义错误', 400)

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: '自定义错误',
        error: '自定义错误',
        stack: expect.any(String),
      })
    })

    it('应该处理普通Error错误', () => {
      const error = new Error('普通错误')

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: '服务器内部错误',
        error: '普通错误',
        stack: expect.any(String),
      })
    })

    it('应该在开发环境返回详细错误信息', () => {
      process.env.NODE_ENV = 'development'
      const error = new AppError('测试错误', 404)

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0]
      expect(response).toHaveProperty('error')
      expect(response).toHaveProperty('stack')
    })

    it('应该在生产环境隐藏详细错误信息', () => {
      process.env.NODE_ENV = 'production'
      const error = new AppError('测试错误', 404)

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0]
      expect(response).not.toHaveProperty('stack')
      expect(response).toHaveProperty('status', 'error')
      expect(response).toHaveProperty('message', '测试错误')
    })

    it('应该记录非操作性错误', () => {
      const error = new Error('系统错误')

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ 未处理的错误:', error)
    })

    it('应该不记录操作性错误', () => {
      const error = new AppError('操作性错误', 400)

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('应该处理ValidationError', () => {
      const error = new ValidationError('字段验证失败')

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: '字段验证失败',
        error: '字段验证失败',
        stack: expect.any(String),
      })
    })

    it('应该处理不同的HTTP状态码', () => {
      const testCases = [
        { statusCode: 400, message: 'Bad Request' },
        { statusCode: 401, message: 'Unauthorized' },
        { statusCode: 403, message: 'Forbidden' },
        { statusCode: 404, message: 'Not Found' },
        { statusCode: 500, message: 'Internal Server Error' },
      ]

      testCases.forEach(({ statusCode, message }) => {
        const error = new AppError(message, statusCode)
        mockResponse.status = jest.fn().mockReturnThis()
        mockResponse.json = jest.fn().mockReturnThis()

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )

        expect(mockResponse.status).toHaveBeenCalledWith(statusCode)
      })
    })
  })

  describe('notFoundHandler - 404处理', () => {
    it('应该创建404错误并传递给next', () => {
      mockRequest.originalUrl = '/api/not-found'

      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      const error = (mockNext as jest.Mock).mock.calls[0][0]
      expect(error).toBeInstanceOf(AppError)
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('无法找到路径: /api/not-found')
    })

    it('应该包含请求的URL', () => {
      mockRequest.originalUrl = '/api/some/path'

      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const error = (mockNext as jest.Mock).mock.calls[0][0]
      expect(error.message).toContain('/api/some/path')
    })

    it('应该创建操作性错误', () => {
      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const error = (mockNext as jest.Mock).mock.calls[0][0]
      expect(error.isOperational).toBe(true)
    })
  })
})
