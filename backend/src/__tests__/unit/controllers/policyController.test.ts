/**
 * policyController 单元测试
 */

import { Request, Response } from 'express'
import * as policyController from '../../../controllers/user/policyController'

// Mock database
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

describe('policyController - 政策控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    mockRequest = {}
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    jest.clearAllMocks()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('getUserAgreement - 获取用户协议', () => {
    it('应该成功获取用户协议', async () => {
      const mockConfig = {
        config_value: { content: '这是用户协议的内容' },
        updated_at: '2025-01-13T10:00:00Z',
      }

      query.mockResolvedValue({ rows: [mockConfig] })

      await policyController.getUserAgreement(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(query).toHaveBeenCalledWith(
        'SELECT config_value, updated_at FROM system_configs WHERE config_key = $1',
        ['user_agreement']
      )
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          title: '用户协议',
          content: '这是用户协议的内容',
          updatedAt: '2025-01-13T10:00:00Z',
        },
      })
    })

    it('应该在没有配置时返回默认内容', async () => {
      query.mockResolvedValue({ rows: [] })

      await policyController.getUserAgreement(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          title: '用户协议',
          content: '暂无用户协议内容',
          updatedAt: undefined,
        },
      })
    })

    it('应该在配置值为空时返回默认内容', async () => {
      query.mockResolvedValue({
        rows: [{ config_value: null, updated_at: '2025-01-13' }],
      })

      await policyController.getUserAgreement(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          title: '用户协议',
          content: '暂无用户协议内容',
          updatedAt: '2025-01-13',
        },
      })
    })

    it('应该在配置值缺少content字段时返回默认内容', async () => {
      query.mockResolvedValue({
        rows: [{ config_value: {}, updated_at: '2025-01-13' }],
      })

      await policyController.getUserAgreement(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          title: '用户协议',
          content: '暂无用户协议内容',
          updatedAt: '2025-01-13',
        },
      })
    })

    it('应该在发生错误时返回500', async () => {
      const error = new Error('数据库错误')
      query.mockRejectedValue(error)

      await policyController.getUserAgreement(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith('获取用户协议失败:', error)
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '获取用户协议失败',
      })
    })
  })

  describe('getPrivacyPolicy - 获取隐私政策', () => {
    it('应该成功获取隐私政策', async () => {
      const mockConfig = {
        config_value: { content: '这是隐私政策的内容' },
        updated_at: '2025-01-13T10:00:00Z',
      }

      query.mockResolvedValue({ rows: [mockConfig] })

      await policyController.getPrivacyPolicy(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(query).toHaveBeenCalledWith(
        'SELECT config_value, updated_at FROM system_configs WHERE config_key = $1',
        ['privacy_policy']
      )
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          title: '隐私政策',
          content: '这是隐私政策的内容',
          updatedAt: '2025-01-13T10:00:00Z',
        },
      })
    })

    it('应该在没有配置时返回默认内容', async () => {
      query.mockResolvedValue({ rows: [] })

      await policyController.getPrivacyPolicy(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          title: '隐私政策',
          content: '暂无隐私政策内容',
          updatedAt: undefined,
        },
      })
    })

    it('应该在配置值为空时返回默认内容', async () => {
      query.mockResolvedValue({
        rows: [{ config_value: null, updated_at: '2025-01-13' }],
      })

      await policyController.getPrivacyPolicy(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          title: '隐私政策',
          content: '暂无隐私政策内容',
          updatedAt: '2025-01-13',
        },
      })
    })

    it('应该在配置值缺少content字段时返回默认内容', async () => {
      query.mockResolvedValue({
        rows: [{ config_value: {}, updated_at: '2025-01-13' }],
      })

      await policyController.getPrivacyPolicy(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          title: '隐私政策',
          content: '暂无隐私政策内容',
          updatedAt: '2025-01-13',
        },
      })
    })

    it('应该在发生错误时返回500', async () => {
      const error = new Error('数据库错误')
      query.mockRejectedValue(error)

      await policyController.getPrivacyPolicy(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith('获取隐私政策失败:', error)
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '获取隐私政策失败',
      })
    })

    it('应该处理包含特殊字符的内容', async () => {
      const mockConfig = {
        config_value: { content: '包含<html>标签和"引号"的内容' },
        updated_at: '2025-01-13',
      }

      query.mockResolvedValue({ rows: [mockConfig] })

      await policyController.getPrivacyPolicy(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          title: '隐私政策',
          content: '包含<html>标签和"引号"的内容',
          updatedAt: '2025-01-13',
        },
      })
    })
  })
})
