/**
 * adminController 单元测试
 */

import { Request, Response } from 'express'
import * as adminController from '../../../controllers/adminController'
import * as adminService from '../../../services/adminService'

jest.mock('../../../services/adminService')
jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }))

describe('adminController - 管理员控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockJson: jest.Mock
  let mockStatus: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockJson = jest.fn()
    mockStatus = jest.fn().mockReturnValue({ json: mockJson })
    mockRequest = { query: {}, params: {}, body: {}, user: { id: 'admin1', role: 'super_admin' } } as any
    mockResponse = { json: mockJson, status: mockStatus }
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    ;(console.error as jest.Mock).mockRestore()
  })

  describe('getAdmins - 获取管理员列表', () => {
    it('应该成功获取管理员列表', async () => {
      const mockData = { data: [{ id: '1', username: 'admin' }], total: 1 }
      ;(adminService.getAllAdmins as jest.Mock).mockResolvedValue(mockData)

      await adminController.getAdmins(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({ success: true, data: mockData })
    })
  })

  describe('getAdmin - 获取单个管理员', () => {
    it('应该成功获取管理员详情', async () => {
      mockRequest.params = { id: '1' }
      const mockAdmin = { id: '1', username: 'admin' }
      ;(adminService.getAdminById as jest.Mock).mockResolvedValue(mockAdmin)

      await adminController.getAdmin(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({ success: true, data: mockAdmin })
    })

    it('应该在管理员不存在时返回404', async () => {
      mockRequest.params = { id: '999' }
      ;(adminService.getAdminById as jest.Mock).mockResolvedValue(null)

      await adminController.getAdmin(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(404)
    })
  })

  describe('addAdmin - 创建管理员', () => {
    it('应该成功创建管理员', async () => {
      mockRequest.body = { username: 'newadmin', role: 'manager', email: 'test@example.com' }
      const mockNew = { id: '1', ...mockRequest.body }
      ;(adminService.createAdmin as jest.Mock).mockResolvedValue(mockNew)

      await adminController.addAdmin(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '管理员创建成功',
        data: mockNew,
      })
    })

    it('应该在缺少必填字段时返回400', async () => {
      mockRequest.body = { username: 'test' }

      await adminController.addAdmin(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(400)
    })

    it('应该在角色无效时返回400', async () => {
      mockRequest.body = { username: 'test', role: 'invalid', email: 'test@example.com' }

      await adminController.addAdmin(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(400)
      expect(mockJson).toHaveBeenCalledWith({ success: false, message: '无效的角色' })
    })
  })

  describe('modifyAdmin - 更新管理员', () => {
    it('应该成功更新管理员', async () => {
      mockRequest.params = { id: '2' }
      mockRequest.body = { username: '更新名称' }
      const mockUpdated = { id: '2', ...mockRequest.body }
      ;(adminService.updateAdmin as jest.Mock).mockResolvedValue(mockUpdated)

      await adminController.modifyAdmin(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: '管理员更新成功',
        data: mockUpdated,
      })
    })

    it('应该禁止修改自己的角色', async () => {
      mockRequest.params = { id: 'admin1' }
      mockRequest.body = { role: 'viewer' }

      await adminController.modifyAdmin(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(403)
      expect(mockJson).toHaveBeenCalledWith({ success: false, message: '不能修改自己的角色' })
    })
  })

  describe('removeAdmin - 删除管理员', () => {
    it('应该成功删除管理员', async () => {
      mockRequest.params = { id: '2' }
      ;(adminService.deleteAdmin as jest.Mock).mockResolvedValue(true)

      await adminController.removeAdmin(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({ success: true, message: '管理员删除成功' })
    })

    it('应该禁止删除自己', async () => {
      mockRequest.params = { id: 'admin1' }

      await adminController.removeAdmin(mockRequest as Request, mockResponse as Response)

      expect(mockStatus).toHaveBeenCalledWith(403)
      expect(mockJson).toHaveBeenCalledWith({ success: false, message: '不能删除自己' })
    })
  })

  describe('getStats - 获取统计', () => {
    it('应该成功获取统计信息', async () => {
      const mockStats = { total: 10, byRole: {} }
      ;(adminService.getAdminStats as jest.Mock).mockResolvedValue(mockStats)

      await adminController.getStats(mockRequest as Request, mockResponse as Response)

      expect(mockJson).toHaveBeenCalledWith({ success: true, data: mockStats })
    })
  })
})
