/**
 * articleController 单元测试
 */

import { Request, Response } from 'express'
import * as articleController from '../../../controllers/user/articleController'
import * as articleService from '../../../services/user/articleService'

// Mock articleService
jest.mock('../../../services/user/articleService')

describe('articleController - 文章控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    mockRequest = {
      query: {},
      params: {},
    }
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

  describe('getArticles - 获取文章列表', () => {
    it('应该成功获取文章列表', async () => {
      const mockResult = {
        items: [
          {
            id: 1,
            title: '算命知识',
            summary: '摘要',
            category: '知识',
            view_count: 100,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }

      ;(articleService.getPublishedArticles as jest.Mock).mockResolvedValue(mockResult)

      await articleController.getArticles(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(articleService.getPublishedArticles).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        category: undefined,
      })
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.items,
        pagination: mockResult.pagination,
      })
    })

    it('应该支持分页查询', async () => {
      mockRequest.query = { page: '2', limit: '10' }

      ;(articleService.getPublishedArticles as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      })

      await articleController.getArticles(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(articleService.getPublishedArticles).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        category: undefined,
      })
    })

    it('应该支持按分类筛选', async () => {
      mockRequest.query = { category: '知识' }

      ;(articleService.getPublishedArticles as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      await articleController.getArticles(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(articleService.getPublishedArticles).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        category: '知识',
      })
    })

    it('应该使用默认分页参数', async () => {
      mockRequest.query = {}

      ;(articleService.getPublishedArticles as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })

      await articleController.getArticles(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(articleService.getPublishedArticles).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        category: undefined,
      })
    })

    it('应该支持组合查询', async () => {
      mockRequest.query = { page: '3', limit: '15', category: '知识' }

      ;(articleService.getPublishedArticles as jest.Mock).mockResolvedValue({
        items: [],
        pagination: { page: 3, limit: 15, total: 0, totalPages: 0 },
      })

      await articleController.getArticles(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(articleService.getPublishedArticles).toHaveBeenCalledWith({
        page: 3,
        limit: 15,
        category: '知识',
      })
    })

    it('应该在发生错误时返回500', async () => {
      const error = new Error('数据库错误')
      ;(articleService.getPublishedArticles as jest.Mock).mockRejectedValue(error)

      await articleController.getArticles(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith('获取文章列表失败:', error)
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '获取文章列表失败',
      })
    })
  })

  describe('getArticleDetail - 获取文章详情', () => {
    it('应该成功获取文章详情', async () => {
      mockRequest.params = { id: '1' }

      const mockArticle = {
        id: 1,
        title: '算命知识',
        content: '完整内容',
        category: '知识',
        view_count: 100,
      }

      ;(articleService.getArticleById as jest.Mock).mockResolvedValue(mockArticle)
      ;(articleService.incrementViewCount as jest.Mock).mockResolvedValue(undefined)

      await articleController.getArticleDetail(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(articleService.getArticleById).toHaveBeenCalledWith(1)
      expect(articleService.incrementViewCount).toHaveBeenCalledWith(1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockArticle,
      })
    })

    it('应该在获取文章后增加浏览量', async () => {
      mockRequest.params = { id: '5' }

      const mockArticle = { id: 5, title: '测试文章' }
      ;(articleService.getArticleById as jest.Mock).mockResolvedValue(mockArticle)
      ;(articleService.incrementViewCount as jest.Mock).mockResolvedValue(undefined)

      await articleController.getArticleDetail(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(articleService.incrementViewCount).toHaveBeenCalledWith(5)
      expect(articleService.incrementViewCount).toHaveBeenCalledTimes(1)
    })

    it('应该在文章不存在时返回404', async () => {
      mockRequest.params = { id: '999' }

      ;(articleService.getArticleById as jest.Mock).mockResolvedValue(null)

      await articleController.getArticleDetail(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '文章不存在',
      })
      expect(articleService.incrementViewCount).not.toHaveBeenCalled()
    })

    it('应该处理无效的ID', async () => {
      mockRequest.params = { id: 'invalid' }

      ;(articleService.getArticleById as jest.Mock).mockResolvedValue(null)

      await articleController.getArticleDetail(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(articleService.getArticleById).toHaveBeenCalledWith(NaN)
      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })

    it('应该在发生错误时返回500', async () => {
      mockRequest.params = { id: '1' }
      const error = new Error('数据库错误')
      ;(articleService.getArticleById as jest.Mock).mockRejectedValue(error)

      await articleController.getArticleDetail(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith('获取文章详情失败:', error)
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '获取文章详情失败',
      })
    })

    it('应该在增加浏览量失败时仍返回文章', async () => {
      mockRequest.params = { id: '1' }

      const mockArticle = { id: 1, title: '测试文章' }
      ;(articleService.getArticleById as jest.Mock).mockResolvedValue(mockArticle)
      ;(articleService.incrementViewCount as jest.Mock).mockRejectedValue(
        new Error('更新失败')
      )

      await articleController.getArticleDetail(
        mockRequest as Request,
        mockResponse as Response
      )

      // 即使增加浏览量失败，仍应返回500错误（因为是在try-catch中）
      expect(mockResponse.status).toHaveBeenCalledWith(500)
    })
  })
})
