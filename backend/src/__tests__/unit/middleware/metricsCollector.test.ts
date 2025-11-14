/**
 * metricsCollector 中间件单元测试
 */

import { Request, Response, NextFunction } from 'express'
import {
  metricsCollector,
  getMetrics,
  resetMetrics,
} from '../../../middleware/metricsCollector'
import { EventEmitter } from 'events'

describe('metricsCollector middleware - 性能指标收集中间件', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response> & EventEmitter
  let mockNext: NextFunction

  beforeEach(() => {
    // 重置指标
    resetMetrics()

    mockRequest = {
      method: 'GET',
      path: '/api/test',
    }

    // 创建一个 EventEmitter 来模拟 Response 对象的事件
    mockResponse = new EventEmitter() as Partial<Response> & EventEmitter

    mockNext = jest.fn()
  })

  describe('metricsCollector - 收集性能指标', () => {
    it('应该在健康检查端点时跳过收集', () => {
      mockRequest.path = '/health'

      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()

      // 验证没有收集指标
      const metrics = getMetrics()
      expect(metrics.routes.size).toBe(0)
    })

    it('应该在根路径时跳过收集', () => {
      mockRequest.path = '/'

      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()

      const metrics = getMetrics()
      expect(metrics.routes.size).toBe(0)
    })

    it('应该在静态资源路径时跳过收集', () => {
      mockRequest.path = '/static/image.png'

      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()

      const metrics = getMetrics()
      expect(metrics.routes.size).toBe(0)
    })

    it('应该收集API请求的性能指标', (done) => {
      mockRequest.path = '/api/users'
      mockRequest.method = 'GET'

      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()

      // 模拟响应完成
      setTimeout(() => {
        mockResponse.emit('finish')

        const metrics = getMetrics()
        expect(metrics.requests.total).toBe(1)
        expect(metrics.routes.size).toBe(1)
        expect(metrics.routes.has('GET /api/users')).toBe(true)

        const routeMetrics = metrics.routes.get('GET /api/users')!
        expect(routeMetrics.count).toBe(1)
        expect(routeMetrics.totalTime).toBeGreaterThanOrEqual(0)
        expect(routeMetrics.minTime).toBeGreaterThanOrEqual(0)
        expect(routeMetrics.maxTime).toBeGreaterThanOrEqual(0)
        expect(routeMetrics.lastAccess).toBeDefined()

        done()
      }, 10)
    })

    it('应该累积同一路由的多次请求', (done) => {
      mockRequest.path = '/api/test'
      mockRequest.method = 'POST'

      // 第一次请求
      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      setTimeout(() => {
        mockResponse.emit('finish')

        // 第二次请求
        const mockResponse2 = new EventEmitter() as Partial<Response> & EventEmitter
        metricsCollector(
          mockRequest as Request,
          mockResponse2 as Response,
          mockNext
        )

        setTimeout(() => {
          mockResponse2.emit('finish')

          const metrics = getMetrics()
          expect(metrics.requests.total).toBe(2)

          const routeMetrics = metrics.routes.get('POST /api/test')!
          expect(routeMetrics.count).toBe(2)
          expect(routeMetrics.totalTime).toBeGreaterThanOrEqual(0)

          done()
        }, 10)
      }, 10)
    })

    it('应该计算平均响应时间', (done) => {
      mockRequest.path = '/api/average-test'
      mockRequest.method = 'GET'

      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      setTimeout(() => {
        mockResponse.emit('finish')

        const metrics = getMetrics()
        expect(metrics.requests.averageResponseTime).toBeGreaterThanOrEqual(0)
        expect(typeof metrics.requests.averageResponseTime).toBe('number')

        done()
      }, 10)
    })

    it('应该记录最慢的端点', (done) => {
      // 第一个快速请求
      mockRequest.path = '/api/fast'
      mockRequest.method = 'GET'

      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      setTimeout(() => {
        mockResponse.emit('finish')

        // 第二个较慢的请求
        const mockRequest2: Partial<Request> = {
          method: 'POST',
          path: '/api/slow',
        }
        const mockResponse2 = new EventEmitter() as Partial<Response> & EventEmitter

        metricsCollector(
          mockRequest2 as Request,
          mockResponse2 as Response,
          mockNext
        )

        setTimeout(() => {
          mockResponse2.emit('finish')

          const metrics = getMetrics()
          expect(metrics.requests.slowestEndpoint).toBeDefined()
          expect(metrics.requests.slowestTime).toBeGreaterThanOrEqual(0)

          done()
        }, 50) // 较长延迟
      }, 5) // 较短延迟
    })

    it('应该更新路由的最小和最大响应时间', (done) => {
      mockRequest.path = '/api/minmax'
      mockRequest.method = 'GET'

      // 第一次请求
      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      setTimeout(() => {
        mockResponse.emit('finish')

        // 第二次请求（不同响应时间）
        const mockResponse2 = new EventEmitter() as Partial<Response> & EventEmitter

        metricsCollector(
          mockRequest as Request,
          mockResponse2 as Response,
          mockNext
        )

        setTimeout(() => {
          mockResponse2.emit('finish')

          const routeMetrics = getMetrics().routes.get('GET /api/minmax')!
          expect(routeMetrics.minTime).toBeLessThanOrEqual(routeMetrics.maxTime)
          expect(routeMetrics.count).toBe(2)

          done()
        }, 20)
      }, 10)
    })

    it('应该记录最后访问时间', (done) => {
      mockRequest.path = '/api/timestamp'
      mockRequest.method = 'GET'

      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      setTimeout(() => {
        mockResponse.emit('finish')

        const routeMetrics = getMetrics().routes.get('GET /api/timestamp')!
        expect(routeMetrics.lastAccess).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        )

        done()
      }, 10)
    })
  })

  describe('getMetrics - 获取指标', () => {
    it('应该返回初始指标', () => {
      const metrics = getMetrics()

      expect(metrics).toBeDefined()
      expect(metrics.requests).toBeDefined()
      expect(metrics.requests.total).toBe(0)
      expect(metrics.requests.averageResponseTime).toBe(0)
      expect(metrics.routes).toBeInstanceOf(Map)
      expect(metrics.routes.size).toBe(0)
    })

    it('应该返回收集的指标', (done) => {
      mockRequest.path = '/api/metrics-test'

      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      setTimeout(() => {
        mockResponse.emit('finish')

        const metrics = getMetrics()
        expect(metrics.requests.total).toBe(1)
        expect(metrics.routes.size).toBe(1)

        done()
      }, 10)
    })
  })

  describe('resetMetrics - 重置指标', () => {
    it('应该清空所有指标', (done) => {
      // 先收集一些指标
      mockRequest.path = '/api/reset-test'

      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      setTimeout(() => {
        mockResponse.emit('finish')

        // 验证指标已收集
        let metrics = getMetrics()
        expect(metrics.requests.total).toBe(1)
        expect(metrics.routes.size).toBe(1)

        // 重置指标
        resetMetrics()

        // 验证指标已清空
        metrics = getMetrics()
        expect(metrics.requests.total).toBe(0)
        expect(metrics.requests.averageResponseTime).toBe(0)
        expect(metrics.requests.slowestEndpoint).toBeUndefined()
        expect(metrics.requests.slowestTime).toBeUndefined()
        expect(metrics.routes.size).toBe(0)

        done()
      }, 10)
    })

    it('应该重置后可以重新收集指标', (done) => {
      mockRequest.path = '/api/reset-recollect'

      // 第一次收集
      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      setTimeout(() => {
        mockResponse.emit('finish')

        // 重置
        resetMetrics()

        // 第二次收集
        const mockResponse2 = new EventEmitter() as Partial<Response> & EventEmitter
        metricsCollector(
          mockRequest as Request,
          mockResponse2 as Response,
          mockNext
        )

        setTimeout(() => {
          mockResponse2.emit('finish')

          const metrics = getMetrics()
          expect(metrics.requests.total).toBe(1) // 重置后只有1次
          expect(metrics.routes.size).toBe(1)

          done()
        }, 10)
      }, 10)
    })
  })

  describe('全局指标暴露', () => {
    it('应该将指标暴露到全局对象', (done) => {
      mockRequest.path = '/api/global-test'

      metricsCollector(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      setTimeout(() => {
        mockResponse.emit('finish')

        // 验证全局指标
        expect(global.apiMetrics).toBeDefined()
        expect(global.apiMetrics.total).toBe(1)
        expect(global.apiMetrics.averageResponseTime).toBeGreaterThanOrEqual(0)

        done()
      }, 10)
    })
  })
})
