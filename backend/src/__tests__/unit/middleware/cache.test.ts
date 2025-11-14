/**
 * cache 中间件单元测试
 */

import { Request, Response, NextFunction } from 'express'
import { cacheMiddleware, getCacheStats, clearCache } from '../../../middleware/cache'

// Mock config
jest.mock('../../../config', () => ({
  config: {
    cache: {
      ttl: 5000, // 5秒用于测试
      maxKeys: 3, // 小容量用于测试LRU
    },
    app: {
      isDevelopment: false, // 禁用console.log
    },
  },
}))

describe('cache middleware - 缓存中间件', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    mockRequest = {
      method: 'POST',
      originalUrl: '/api/test',
      body: { test: 'data' },
    }
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      statusCode: 200,
    }
    mockNext = jest.fn()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

    // 清空缓存
    clearCache({} as Request, { json: jest.fn() } as any)
    jest.clearAllMocks()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  describe('cacheMiddleware - 缓存中间件', () => {
    it('应该在非POST请求时跳过缓存', () => {
      mockRequest.method = 'GET'

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })

    it('应该在第一次POST请求时缓存未命中', () => {
      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      // 第一次请求会重写res.json，不会直接调用
    })

    it('应该缓存成功的响应 (statusCode 200)', () => {
      mockResponse.statusCode = 200

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()

      // 模拟响应
      const jsonFunc = mockResponse.json as jest.Mock
      const responseData = { result: 'success' }
      jsonFunc(responseData)

      // 第二次请求应该从缓存返回
      mockNext.mockClear()
      mockResponse.json = jest.fn().mockReturnThis()

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.json).toHaveBeenCalledWith(responseData)
    })

    it('应该不缓存非200状态码的响应', () => {
      mockResponse.statusCode = 400

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()

      // 模拟错误响应
      const jsonFunc = mockResponse.json as jest.Mock
      jsonFunc({ error: 'bad request' })

      // 第二次请求不应该从缓存返回
      mockNext.mockClear()
      mockResponse.json = jest.fn().mockReturnThis()
      mockResponse.statusCode = 400

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
      // 第二次请求也会重写res.json
    })

    it('应该根据URL和body生成不同的缓存键', () => {
      // 第一个请求
      mockRequest.originalUrl = '/api/test1'
      mockRequest.body = { data: 'A' }

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const jsonFunc1 = mockResponse.json as jest.Mock
      jsonFunc1({ result: 'A' })

      // 第二个请求 (不同URL)
      mockRequest.originalUrl = '/api/test2'
      mockRequest.body = { data: 'A' }
      mockNext.mockClear()
      mockResponse.json = jest.fn().mockReturnThis()

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // 应该未命中，因为URL不同
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该根据不同的body生成不同的缓存键', () => {
      // 第一个请求
      mockRequest.body = { data: 'A' }

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const jsonFunc1 = mockResponse.json as jest.Mock
      jsonFunc1({ result: 'A' })

      // 第二个请求 (不同body)
      mockRequest.body = { data: 'B' }
      mockNext.mockClear()
      mockResponse.json = jest.fn().mockReturnThis()

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // 应该未命中，因为body不同
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该在缓存过期后重新获取数据', async () => {
      // 设置较短的TTL进行测试
      mockRequest.originalUrl = '/api/expire-test'
      mockRequest.body = { test: 'expire' }

      // 第一次请求
      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const jsonFunc = mockResponse.json as jest.Mock
      jsonFunc({ result: 'data' })

      // 等待缓存过期 (TTL = 5000ms)
      await new Promise(resolve => setTimeout(resolve, 5100))

      // 第二次请求应该未命中
      mockNext.mockClear()
      mockResponse.json = jest.fn().mockReturnThis()

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
    }, 10000)

    it('应该支持LRU淘汰策略', () => {
      // maxKeys = 3，添加4个不同的缓存
      const requests = [
        { url: '/api/test1', body: { id: 1 }, response: { data: 1 } },
        { url: '/api/test2', body: { id: 2 }, response: { data: 2 } },
        { url: '/api/test3', body: { id: 3 }, response: { data: 3 } },
        { url: '/api/test4', body: { id: 4 }, response: { data: 4 } },
      ]

      // 添加前3个到缓存
      requests.slice(0, 3).forEach(req => {
        mockRequest.originalUrl = req.url
        mockRequest.body = req.body
        mockResponse.json = jest.fn().mockReturnThis()
        mockNext.mockClear()

        cacheMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )

        const jsonFunc = mockResponse.json as jest.Mock
        jsonFunc(req.response)
      })

      // 添加第4个，应该淘汰第1个
      mockRequest.originalUrl = requests[3].url
      mockRequest.body = requests[3].body
      mockResponse.json = jest.fn().mockReturnThis()
      mockNext.mockClear()

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const jsonFunc4 = mockResponse.json as jest.Mock
      jsonFunc4(requests[3].response)

      // 验证第1个已被淘汰
      mockRequest.originalUrl = requests[0].url
      mockRequest.body = requests[0].body
      mockResponse.json = jest.fn().mockReturnThis()
      mockNext.mockClear()

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // 应该未命中
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('getCacheStats - 获取缓存统计', () => {
    it('应该返回缓存统计信息', () => {
      const mockReq = {} as Request
      const mockRes = {
        json: jest.fn(),
      } as any

      getCacheStats(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalled()
      const stats = (mockRes.json as jest.Mock).mock.calls[0][0]

      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('maxSize')
      expect(stats).toHaveProperty('hitRate')
      expect(stats).toHaveProperty('ttl')
    })

    it('应该包含正确的TTL信息', () => {
      const mockReq = {} as Request
      const mockRes = {
        json: jest.fn(),
      } as any

      getCacheStats(mockReq, mockRes)

      const stats = (mockRes.json as jest.Mock).mock.calls[0][0]
      expect(stats.ttl).toBe('5秒') // TTL = 5000ms
    })

    it('应该显示缓存命中率', () => {
      // 先添加一些缓存并访问
      mockRequest.originalUrl = '/api/stats-test'
      mockRequest.body = { test: 'stats' }

      // 第一次请求 (miss)
      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const jsonFunc = mockResponse.json as jest.Mock
      jsonFunc({ result: 'data' })

      // 第二次请求 (hit)
      mockNext.mockClear()
      mockResponse.json = jest.fn().mockReturnThis()

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // 获取统计
      const mockReq = {} as Request
      const mockRes = {
        json: jest.fn(),
      } as any

      getCacheStats(mockReq, mockRes)

      const stats = (mockRes.json as jest.Mock).mock.calls[0][0]
      expect(stats.hitRate).toMatch(/%$/)
    })
  })

  describe('clearCache - 清空缓存', () => {
    it('应该清空所有缓存', () => {
      // 先添加一些缓存
      mockRequest.originalUrl = '/api/clear-test'
      mockRequest.body = { test: 'clear' }

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const jsonFunc = mockResponse.json as jest.Mock
      jsonFunc({ result: 'data' })

      // 清空缓存
      const mockReq = {} as Request
      const mockRes = {
        json: jest.fn(),
      } as any

      clearCache(mockReq, mockRes)

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '缓存已清空',
      })

      // 验证缓存已清空
      mockNext.mockClear()
      mockResponse.json = jest.fn().mockReturnThis()

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      // 应该未命中
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该重置缓存统计', () => {
      // 添加缓存
      mockRequest.originalUrl = '/api/reset-test'
      mockRequest.body = { test: 'reset' }

      cacheMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      const jsonFunc = mockResponse.json as jest.Mock
      jsonFunc({ result: 'data' })

      // 清空缓存
      clearCache({} as Request, { json: jest.fn() } as any)

      // 获取统计
      const mockRes = {
        json: jest.fn(),
      } as any

      getCacheStats({} as Request, mockRes)

      const stats = (mockRes.json as jest.Mock).mock.calls[0][0]
      expect(stats.size).toBe(0)
    })
  })
})
