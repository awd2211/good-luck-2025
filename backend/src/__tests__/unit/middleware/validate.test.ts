/**
 * validate 中间件单元测试
 */

import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validate, validateData } from '../../../middleware/validate'

describe('validate middleware - 验证中间件', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      body: {},
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
  })

  describe('validate - 中间件验证', () => {
    it('应该通过有效数据的验证', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })

      mockRequest.body = {
        name: '张三',
        age: 25,
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })

    it('应该拒绝无效数据', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })

      mockRequest.body = {
        name: '张三',
        age: '二十五', // 错误：应该是数字
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: '请求数据验证失败',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      })
    })

    it('应该处理缺失的必需字段', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      })

      mockRequest.body = {
        name: '张三',
        // email 缺失
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(400)

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0]
      expect(response.errors).toBeDefined()
      expect(response.errors.length).toBeGreaterThan(0)
    })

    it('应该验证嵌套对象', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
        }),
      })

      mockRequest.body = {
        user: {
          name: '张三',
          age: 25,
        },
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该验证数组', () => {
      const schema = z.object({
        tags: z.array(z.string()),
      })

      mockRequest.body = {
        tags: ['标签1', '标签2', '标签3'],
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该拒绝无效的数组元素', () => {
      const schema = z.object({
        tags: z.array(z.string()),
      })

      mockRequest.body = {
        tags: ['标签1', 123, '标签3'], // 错误：包含数字
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该验证字符串长度限制', () => {
      const schema = z.object({
        username: z.string().min(3).max(20),
      })

      // 太短
      mockRequest.body = { username: 'ab' }
      let middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(400)

      // 重置 mock
      mockNext.mockClear()
      ;(mockResponse.status as jest.Mock).mockClear()
      ;(mockResponse.json as jest.Mock).mockClear()

      // 太长
      mockRequest.body = { username: 'a'.repeat(21) }
      middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该验证数字范围', () => {
      const schema = z.object({
        age: z.number().min(0).max(120),
      })

      mockRequest.body = { age: -1 }
      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该验证电子邮件格式', () => {
      const schema = z.object({
        email: z.string().email(),
      })

      mockRequest.body = { email: 'invalid-email' }
      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(400)

      // 有效邮箱
      mockNext.mockClear()
      ;(mockResponse.status as jest.Mock).mockClear()
      mockRequest.body = { email: 'test@example.com' }

      const middleware2 = validate(schema)
      middleware2(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('应该处理可选字段', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional(),
      })

      mockRequest.body = {
        name: '张三',
        // age 可选，可以省略
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('应该格式化多个验证错误', () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().min(0),
      })

      mockRequest.body = {
        name: 'ab', // 太短
        email: 'invalid', // 无效邮箱
        age: -1, // 负数
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(400)

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0]
      expect(response.errors.length).toBeGreaterThan(1)
    })

    it('应该处理非ZodError错误', () => {
      // 创建一个会抛出非ZodError的schema
      const schema = {
        parse: () => {
          throw new Error('非预期错误')
        },
      } as any

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: '服务器内部错误',
      })
    })
  })

  describe('validateData - 数据验证函数', () => {
    it('应该返回解析后的有效数据', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })

      const data = {
        name: '张三',
        age: 25,
      }

      const result = validateData(schema, data)

      expect(result).toEqual(data)
    })

    it('应该在数据无效时抛出错误', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })

      const data = {
        name: '张三',
        age: '二十五', // 错误类型
      }

      expect(() => {
        validateData(schema, data)
      }).toThrow('数据验证失败')
    })

    it('应该包含详细的错误信息', () => {
      const schema = z.object({
        email: z.string().email(),
      })

      const data = {
        email: 'invalid-email',
      }

      try {
        validateData(schema, data)
        fail('应该抛出错误')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('数据验证失败')
        expect((error as Error).message).toContain('email')
      }
    })

    it('应该验证复杂的嵌套结构', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            age: z.number(),
            city: z.string(),
          }),
        }),
      })

      const data = {
        user: {
          name: '张三',
          profile: {
            age: 25,
            city: '北京',
          },
        },
      }

      const result = validateData(schema, data)

      expect(result).toEqual(data)
    })

    it('应该重新抛出非ZodError错误', () => {
      const schema = {
        parse: () => {
          throw new Error('自定义错误')
        },
      } as any

      expect(() => {
        validateData(schema, {})
      }).toThrow('自定义错误')
    })

    it('应该支持类型转换', () => {
      const schema = z.object({
        age: z.coerce.number(), // 强制转换为数字
      })

      const data = {
        age: '25', // 字符串
      }

      const result = validateData(schema, data)

      expect(result.age).toBe(25)
      expect(typeof result.age).toBe('number')
    })
  })

  describe('错误消息格式', () => {
    it('应该包含字段路径', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
        }),
      })

      mockRequest.body = {
        user: {
          name: 123, // 错误类型
        },
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0]
      expect(response.errors[0].field).toBe('user.name')
    })

    it('应该包含错误消息', () => {
      const schema = z.object({
        age: z.number(),
      })

      mockRequest.body = {
        age: 'not-a-number',
      }

      const middleware = validate(schema)
      middleware(mockRequest as Request, mockResponse as Response, mockNext)

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0]
      expect(response.errors[0].message).toBeDefined()
      expect(typeof response.errors[0].message).toBe('string')
    })
  })
})
