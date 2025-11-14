/**
 * userController 单元测试
 */

import { Request, Response } from 'express'
import * as userController from '../../../controllers/userController'
import * as userService from '../../../services/userService'

jest.mock('../../../services/userService')

describe('userController - 用户管理控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockJson: jest.Mock
  let mockStatus: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockJson = jest.fn()
    mockStatus = jest.fn().mockReturnValue({ json: mockJson })
    mockRequest = { query: {}, params: {}, body: {} }
    mockResponse = { json: mockJson, status: mockStatus }
  })

  describe('getUsers - 获取用户列表', () => {
    it('应该成功获取用户列表', () => {
      const mockData = {
        data: [{ id: '1', username: '测试用户' }],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }

      ;(userService.getAllUsers as jest.Mock).mockReturnValue(mockData)

      userController.getUsers(mockRequest as Request, mockResponse as Response)

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
  })

  describe('getUser - 获取单个用户', () => {
    it('应该成功获取单个用户', () => {
      mockRequest.params = { id: '1' }
      const mockUser = { id: '1', username: '测试' }

      ;(userService.getUserById as jest.Mock).mockReturnValue(mockUser)

      userController.getUser(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({ success: true, data: mockUser })
    })

    it('应该在用户不存在时返回404', () => {
      mockRequest.params = { id: '999' }
      ;(userService.getUserById as jest.Mock).mockReturnValue(null)

      userController.getUser(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(404)
    })
  })

  describe('addUser - 创建用户', () => {
    it('应该成功创建用户', () => {
      mockRequest.body = { username: '新用户', phone: '13900000001' }
      const mockNewUser = { id: '1', ...mockRequest.body }

      ;(userService.createUser as jest.Mock).mockReturnValue(mockNewUser)

      userController.addUser(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(201)
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '用户创建成功',
        data: mockNewUser,
      })
    })

    it('应该在缺少必填字段时返回400', () => {
      mockRequest.body = { username: '测试' }

      userController.addUser(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(400)
    })
  })

  describe('modifyUser - 更新用户', () => {
    it('应该成功更新用户', () => {
      mockRequest.params = { id: '1' }
      mockRequest.body = { username: '更新名称' }
      const mockUpdated = { id: '1', ...mockRequest.body }

      ;(userService.updateUser as jest.Mock).mockReturnValue(mockUpdated)

      userController.modifyUser(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '用户更新成功',
        data: mockUpdated,
      })
    })
  })

  describe('removeUser - 删除用户', () => {
    it('应该成功删除用户', () => {
      mockRequest.params = { id: '1' }
      ;(userService.deleteUser as jest.Mock).mockReturnValue(true)

      userController.removeUser(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '用户删除成功',
      })
    })
  })

  describe('batchUpdateStatus - 批量更新状态', () => {
    it('应该成功批量更新状态', () => {
      mockRequest.body = { ids: ['1', '2'], status: 'active' }
      ;(userService.batchUpdateUserStatus as jest.Mock).mockReturnValue(2)

      userController.batchUpdateStatus(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '成功更新2个用户的状态',
        data: { count: 2 },
      })
    })

    it('应该在ids为空时返回400', () => {
      mockRequest.body = { ids: [], status: 'active' }

      userController.batchUpdateStatus(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(400)
    })
  })

  describe('getStats - 获取统计', () => {
    it('应该成功获取统计信息', () => {
      const mockStats = { total: 100, active: 80 }
      ;(userService.getUserStats as jest.Mock).mockReturnValue(mockStats)

      userController.getStats(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({ success: true, data: mockStats })
    })
  })
})
