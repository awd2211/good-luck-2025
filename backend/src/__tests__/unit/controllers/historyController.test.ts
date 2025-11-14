/**
 * historyController 单元测试
 */

import { Request, Response, NextFunction } from 'express'
import * as historyController from '../../../controllers/user/historyController'
import * as historyService from '../../../services/user/historyService'

// Mock historyService
jest.mock('../../../services/user/historyService')

describe('historyController - 浏览历史控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      user: { id: 'user_123', phone: '13900000001' },
      body: {},
      params: {},
      query: {},
    }
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
    jest.clearAllMocks()
  })

  describe('getHistory - 获取浏览历史', () => {
    it('应该成功获取浏览历史', async () => {
      const mockResult = {
        items: [
          {
            id: 'history_1',
            fortune_id: 'fortune_1',
            title: '生肖运势',
            price: '88.00',
            viewed_at: '2025-01-13',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }

      ;(historyService.getUserHistory as jest.Mock).mockResolvedValue(mockResult)

      await historyController.getHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(historyService.getUserHistory).toHaveBeenCalledWith('user_123', 1, 20)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      })
    })

    it('应该支持分页查询', async () => {
      mockRequest.query = { page: '3', limit: '15' }

      ;(historyService.getUserHistory as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 3, limit: 15, total: 0, totalPages: 0 },
      })

      await historyController.getHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(historyService.getUserHistory).toHaveBeenCalledWith('user_123', 3, 15)
    })

    it('应该使用默认分页参数', async () => {
      mockRequest.query = {}

      ;(historyService.getUserHistory as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      await historyController.getHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(historyService.getUserHistory).toHaveBeenCalledWith('user_123', 1, 20)
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await historyController.getHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '未登录',
      })
      expect(historyService.getUserHistory).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('数据库错误')
      ;(historyService.getUserHistory as jest.Mock).mockRejectedValue(error)

      await historyController.getHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('addHistory - 添加浏览记录', () => {
    it('应该成功添加浏览记录', async () => {
      mockRequest.body = { fortuneId: 'fortune_1' }

      const mockHistory = {
        id: 'history_1',
        user_id: 'user_123',
        fortune_id: 'fortune_1',
      }

      ;(historyService.addHistory as jest.Mock).mockResolvedValue(mockHistory)

      await historyController.addHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(historyService.addHistory).toHaveBeenCalledWith('user_123', 'fortune_1')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '已记录',
        data: mockHistory,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.body = { fortuneId: 'fortune_1' }

      await historyController.addHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(historyService.addHistory).not.toHaveBeenCalled()
    })

    it('应该在fortuneId为空时返回400', async () => {
      mockRequest.body = {}

      await historyController.addHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '商品ID不能为空',
      })
      expect(historyService.addHistory).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.body = { fortuneId: 'fortune_1' }
      const error = new Error('商品不存在')
      ;(historyService.addHistory as jest.Mock).mockRejectedValue(error)

      await historyController.addHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('removeHistory - 删除单条浏览记录', () => {
    it('应该成功删除浏览记录', async () => {
      mockRequest.params = { id: 'history_1' }

      ;(historyService.removeHistory as jest.Mock).mockResolvedValue(undefined)

      await historyController.removeHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(historyService.removeHistory).toHaveBeenCalledWith('user_123', 'history_1')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '删除成功',
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.params = { id: 'history_1' }

      await historyController.removeHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(historyService.removeHistory).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.params = { id: 'history_1' }
      const error = new Error('记录不存在')
      ;(historyService.removeHistory as jest.Mock).mockRejectedValue(error)

      await historyController.removeHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('clearHistory - 清空浏览历史', () => {
    it('应该成功清空浏览历史', async () => {
      const mockResult = { deletedCount: 5 }

      ;(historyService.clearHistory as jest.Mock).mockResolvedValue(mockResult)

      await historyController.clearHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(historyService.clearHistory).toHaveBeenCalledWith('user_123')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '浏览历史已清空',
        data: mockResult,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined

      await historyController.clearHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(historyService.clearHistory).not.toHaveBeenCalled()
    })

    it('应该在发生错误时调用next', async () => {
      const error = new Error('清空失败')
      ;(historyService.clearHistory as jest.Mock).mockRejectedValue(error)

      await historyController.clearHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('batchRemove - 批量删除浏览记录', () => {
    it('应该成功批量删除浏览记录', async () => {
      mockRequest.body = { ids: ['history_1', 'history_2', 'history_3'] }

      const mockResult = {
        deletedCount: 3,
        deletedIds: ['history_1', 'history_2', 'history_3'],
      }

      ;(historyService.batchRemoveHistory as jest.Mock).mockResolvedValue(mockResult)

      await historyController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(historyService.batchRemoveHistory).toHaveBeenCalledWith('user_123', [
        'history_1',
        'history_2',
        'history_3',
      ])
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '成功删除3条记录',
        data: mockResult,
      })
    })

    it('应该在未登录时返回401', async () => {
      mockRequest.user = undefined
      mockRequest.body = { ids: ['history_1'] }

      await historyController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(historyService.batchRemoveHistory).not.toHaveBeenCalled()
    })

    it('应该在ids不是数组时返回400', async () => {
      mockRequest.body = { ids: 'not-an-array' }

      await historyController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '请选择要删除的记录',
      })
      expect(historyService.batchRemoveHistory).not.toHaveBeenCalled()
    })

    it('应该在ids为空数组时返回400', async () => {
      mockRequest.body = { ids: [] }

      await historyController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在ids为null时返回400', async () => {
      mockRequest.body = { ids: null }

      await historyController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })

    it('应该在发生错误时调用next', async () => {
      mockRequest.body = { ids: ['history_1'] }
      const error = new Error('删除失败')
      ;(historyService.batchRemoveHistory as jest.Mock).mockRejectedValue(error)

      await historyController.batchRemove(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })
})
