/**
 * bannerController 单元测试
 */

import { Request, Response } from 'express'
import * as bannerController from '../../../controllers/bannerController'
import * as bannerService from '../../../services/bannerService'

jest.mock('../../../services/bannerService')

describe('bannerController - 横幅管理控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockJson: jest.Mock
  let mockStatus: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockJson = jest.fn()
    mockStatus = jest.fn().mockReturnValue({ json: mockJson })
    mockRequest = {
      query: {},
      params: {},
      body: {},
    }
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    }
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    ;(console.error as jest.Mock).mockRestore()
  })

  describe('getBanners - 获取横幅列表', () => {
    it('应该成功获取横幅列表', async () => {
      const mockData = {
        data: [{ id: 1, title: '测试横幅' }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }

      ;(bannerService.getAllBanners as jest.Mock).mockResolvedValue(mockData)

      await bannerController.getBanners(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockData.data,
        pagination: {
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      })
    })

    it('应该支持分页参数', async () => {
      mockRequest.query = { page: '2', pageSize: '10' }

      ;(bannerService.getAllBanners as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        pageSize: 10,
        totalPages: 0,
      })

      await bannerController.getBanners(mockRequest as Request, mockResponse as Response)

      expect(bannerService.getAllBanners).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        status: undefined,
      })
    })
  })

  describe('getActiveBannersPublic - 获取激活横幅', () => {
    it('应该成功获取激活横幅', async () => {
      const mockBanners = [{ id: 1, title: '横幅1', status: 'active' }]

      ;(bannerService.getActiveBanners as jest.Mock).mockResolvedValue(mockBanners)

      await bannerController.getActiveBannersPublic(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockBanners,
      })
    })
  })

  describe('getBanner - 获取单个横幅', () => {
    it('应该成功获取单个横幅', async () => {
      mockRequest.params = { id: '1' }
      const mockBanner = { id: 1, title: '测试横幅' }

      ;(bannerService.getBannerById as jest.Mock).mockResolvedValue(mockBanner)

      await bannerController.getBanner(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockBanner,
      })
    })

    it('应该在横幅不存在时返回404', async () => {
      mockRequest.params = { id: '999' }

      ;(bannerService.getBannerById as jest.Mock).mockResolvedValue(null)

      await bannerController.getBanner(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(404)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '横幅不存在',
      })
    })
  })

  describe('addBanner - 创建横幅', () => {
    it('应该成功创建横幅', async () => {
      mockRequest.body = { title: '新横幅', image_url: 'image.jpg' }
      const mockNewBanner = { id: 1, ...mockRequest.body }

      ;(bannerService.createBanner as jest.Mock).mockResolvedValue(mockNewBanner)

      await bannerController.addBanner(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(201)
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '横幅创建成功',
        data: mockNewBanner,
      })
    })

    it('应该在标题为空时返回400', async () => {
      mockRequest.body = { image_url: 'image.jpg' }

      await bannerController.addBanner(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '横幅标题不能为空',
      })
    })
  })

  describe('modifyBanner - 更新横幅', () => {
    it('应该成功更新横幅', async () => {
      mockRequest.params = { id: '1' }
      mockRequest.body = { title: '更新后的标题' }
      const mockUpdatedBanner = { id: 1, ...mockRequest.body }

      ;(bannerService.updateBanner as jest.Mock).mockResolvedValue(mockUpdatedBanner)

      await bannerController.modifyBanner(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '横幅更新成功',
        data: mockUpdatedBanner,
      })
    })

    it('应该在横幅不存在时返回404', async () => {
      mockRequest.params = { id: '999' }
      mockRequest.body = { title: '更新' }

      ;(bannerService.updateBanner as jest.Mock).mockResolvedValue(null)

      await bannerController.modifyBanner(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(404)
    })
  })

  describe('removeBanner - 删除横幅', () => {
    it('应该成功删除横幅', async () => {
      mockRequest.params = { id: '1' }

      ;(bannerService.deleteBanner as jest.Mock).mockResolvedValue(true)

      await bannerController.removeBanner(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '横幅删除成功',
      })
    })

    it('应该在横幅不存在时返回404', async () => {
      mockRequest.params = { id: '999' }

      ;(bannerService.deleteBanner as jest.Mock).mockResolvedValue(false)

      await bannerController.removeBanner(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(404)
    })
  })

  describe('changeBannerPosition - 更新横幅位置', () => {
    it('应该成功更新位置', async () => {
      mockRequest.params = { id: '1' }
      mockRequest.body = { position: 2 }
      const mockUpdatedBanner = { id: 1, position: 2 }

      ;(bannerService.updateBannerPosition as jest.Mock).mockResolvedValue(mockUpdatedBanner)

      await bannerController.changeBannerPosition(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '位置更新成功',
        data: mockUpdatedBanner,
      })
    })

    it('应该在位置参数为空时返回400', async () => {
      mockRequest.params = { id: '1' }
      mockRequest.body = {}

      await bannerController.changeBannerPosition(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: '位置参数不能为空',
      })
    })
  })
})
