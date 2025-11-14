/**
 * adminService 单元测试
 */

import * as adminService from '../../../services/adminService'
import { query } from '../../../config/database'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

// Mock database
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}))

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

describe('adminService - 管理员服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(uuidv4 as jest.Mock).mockReturnValue('12345678-1234-1234-1234-123456789012')
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')
  })

  describe('getAllAdmins - 获取所有管理员', () => {
    it('应该返回分页的管理员列表', async () => {
      const mockAdmins = [
        { id: 'admin-001', username: 'admin1', role: 'super_admin', email: 'admin1@test.com' },
        { id: 'admin-002', username: 'admin2', role: 'manager', email: 'admin2@test.com' },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // count query
        .mockResolvedValueOnce({ rows: mockAdmins }) // data query

      const result = await adminService.getAllAdmins({
        page: 1,
        pageSize: 10,
      })

      expect(result.data).toEqual(mockAdmins)
      expect(result.total).toBe(10)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.totalPages).toBe(1)
    })

    it('应该使用默认分页参数', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] })

      const result = await adminService.getAllAdmins()

      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })

    it('应该按role筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [] })

      await adminService.getAllAdmins({ role: 'manager' })

      const countCall = (query as jest.Mock).mock.calls[0]
      expect(countCall[0]).toContain('AND role = $1')
      expect(countCall[1]).toContain('manager')
    })

    it('应该支持搜索功能（username或email）', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [] })

      await adminService.getAllAdmins({ search: 'test' })

      const countCall = (query as jest.Mock).mock.calls[0]
      expect(countCall[0]).toContain('AND (username ILIKE $1 OR email ILIKE $1)')
      expect(countCall[1]).toContain('%test%')
    })

    it('应该支持role和search组合筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [] })

      await adminService.getAllAdmins({
        role: 'editor',
        search: 'zhang',
      })

      const countCall = (query as jest.Mock).mock.calls[0]
      expect(countCall[0]).toContain('AND role = $1')
      expect(countCall[0]).toContain('AND (username ILIKE $2 OR email ILIKE $2)')
      expect(countCall[1]).toContain('editor')
      expect(countCall[1]).toContain('%zhang%')
    })

    it('应该按created_at降序排序', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] })

      await adminService.getAllAdmins()

      const dataCall = (query as jest.Mock).mock.calls[1]
      expect(dataCall[0]).toContain('ORDER BY created_at DESC')
    })

    it('应该不返回password字段', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [] })

      await adminService.getAllAdmins()

      const countCall = (query as jest.Mock).mock.calls[0]
      const dataCall = (query as jest.Mock).mock.calls[1]

      expect(countCall[0]).not.toContain('password')
      expect(dataCall[0]).not.toContain('password')
    })
  })

  describe('getAdminById - 根据ID获取管理员', () => {
    it('应该返回指定ID的管理员', async () => {
      const mockAdmin = {
        id: 'admin-001',
        username: 'admin1',
        role: 'super_admin',
        email: 'admin1@test.com',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockAdmin] })

      const result = await adminService.getAdminById('admin-001')

      expect(result).toEqual(mockAdmin)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, username, role, email, created_at, updated_at FROM admins WHERE id = $1'),
        ['admin-001']
      )
    })

    it('应该在管理员不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await adminService.getAdminById('not-exist')

      expect(result).toBeNull()
    })

    it('应该不返回password字段', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await adminService.getAdminById('admin-001')

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).not.toContain('password')
    })
  })

  describe('getAdminByUsername - 根据用户名获取管理员', () => {
    it('应该返回指定用户名的管理员', async () => {
      const mockAdmin = {
        id: 'admin-001',
        username: 'admin1',
        password: 'hashed_password',
        role: 'super_admin',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockAdmin] })

      const result = await adminService.getAdminByUsername('admin1')

      expect(result).toEqual(mockAdmin)
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM admins WHERE username = $1',
        ['admin1']
      )
    })

    it('应该在管理员不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await adminService.getAdminByUsername('not-exist')

      expect(result).toBeNull()
    })

    it('应该返回password字段（用于认证）', async () => {
      const mockAdmin = { id: 'admin-001', username: 'admin1', password: 'hashed' }
      ;(query as jest.Mock).mockResolvedValue({ rows: [mockAdmin] })

      const result = await adminService.getAdminByUsername('admin1')

      expect(result?.password).toBe('hashed')
    })
  })

  describe('createAdmin - 创建管理员', () => {
    it('应该成功创建管理员', async () => {
      const newAdmin = {
        username: 'newadmin',
        password: 'password123',
        role: 'manager' as const,
        email: 'new@test.com',
      }

      // Mock: 用户名不存在
      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [] })
      // Mock: 邮箱不存在
      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [] })
      // Mock: 创建成功
      const createdAdmin = {
        id: 'admin-12345678',
        username: newAdmin.username,
        role: newAdmin.role,
        email: newAdmin.email,
      }
      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [createdAdmin] })

      const result = await adminService.createAdmin(newAdmin)

      expect(result).toEqual(createdAdmin)
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(uuidv4).toHaveBeenCalled()
    })

    it('应该使用默认密码123456', async () => {
      const newAdmin = {
        username: 'newadmin',
        role: 'editor' as const,
        email: 'new@test.com',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'admin-001' }] })

      await adminService.createAdmin(newAdmin)

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10)
    })

    it('应该在用户名已存在时抛出错误', async () => {
      const newAdmin = {
        username: 'existing',
        role: 'manager' as const,
        email: 'new@test.com',
      }

      // Mock: 用户名已存在
      ;(query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'admin-001', username: 'existing' }],
      })

      await expect(adminService.createAdmin(newAdmin)).rejects.toThrow('用户名已存在')
    })

    it('应该在邮箱已存在时抛出错误', async () => {
      const newAdmin = {
        username: 'newadmin',
        role: 'manager' as const,
        email: 'existing@test.com',
      }

      // Mock: 用户名不存在
      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [] })
      // Mock: 邮箱已存在
      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'admin-002' }] })

      await expect(adminService.createAdmin(newAdmin)).rejects.toThrow('邮箱已存在')
    })

    it('应该生成正确格式的ID', async () => {
      const newAdmin = {
        username: 'newadmin',
        role: 'viewer' as const,
        email: 'new@test.com',
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'admin-12345678' }] })

      await adminService.createAdmin(newAdmin)

      const createCall = (query as jest.Mock).mock.calls[2]
      expect(createCall[1][0]).toBe('admin-12345678') // ID格式: admin-{8位uuid}
    })
  })

  describe('updateAdmin - 更新管理员', () => {
    it('应该成功更新管理员用户名', async () => {
      const updateData = { username: 'newname' }

      // Mock: 新用户名未被使用
      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [] })
      // Mock: 更新成功
      ;(query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'admin-001', username: 'newname' }],
      })

      const result = await adminService.updateAdmin('admin-001', updateData)

      expect(result?.username).toBe('newname')
    })

    it('应该成功更新管理员邮箱', async () => {
      const updateData = { email: 'newemail@test.com' }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'admin-001', email: 'newemail@test.com' }] })

      const result = await adminService.updateAdmin('admin-001', updateData)

      expect(result?.email).toBe('newemail@test.com')
    })

    it('应该成功更新管理员角色', async () => {
      const updateData = { role: 'editor' as const }

      ;(query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'admin-001', role: 'editor' }],
      })

      const result = await adminService.updateAdmin('admin-001', updateData)

      expect(result?.role).toBe('editor')
    })

    it('应该成功更新管理员密码（加密）', async () => {
      const updateData = { password: 'newpassword' }

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'admin-001' }] })

      await adminService.updateAdmin('admin-001', updateData)

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10)
    })

    it('应该在用户名被其他管理员使用时抛出错误', async () => {
      const updateData = { username: 'existingname' }

      // Mock: 用户名被其他管理员使用
      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'admin-002' }] })

      await expect(
        adminService.updateAdmin('admin-001', updateData)
      ).rejects.toThrow('用户名已存在')
    })

    it('应该在邮箱被其他管理员使用时抛出错误', async () => {
      const updateData = { email: 'existing@test.com' }

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'admin-002' }] })

      await expect(
        adminService.updateAdmin('admin-001', updateData)
      ).rejects.toThrow('邮箱已存在')
    })

    it('应该在没有字段更新时抛出错误', async () => {
      await expect(
        adminService.updateAdmin('admin-001', {})
      ).rejects.toThrow('没有可更新的字段')
    })

    it('应该更新updated_at时间戳', async () => {
      const updateData = { role: 'viewer' as const }

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'admin-001' }] })

      await adminService.updateAdmin('admin-001', updateData)

      const updateCall = (query as jest.Mock).mock.calls[0]
      expect(updateCall[0]).toContain('updated_at = CURRENT_TIMESTAMP')
    })

    it('应该支持同时更新多个字段', async () => {
      const updateData = {
        username: 'newname',
        email: 'newemail@test.com',
        role: 'manager' as const,
      }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // username check
        .mockResolvedValueOnce({ rows: [] }) // email check
        .mockResolvedValueOnce({ rows: [{ id: 'admin-001' }] }) // update

      await adminService.updateAdmin('admin-001', updateData)

      const updateCall = (query as jest.Mock).mock.calls[2]
      expect(updateCall[0]).toContain('username = $1')
      expect(updateCall[0]).toContain('email = $2')
      expect(updateCall[0]).toContain('role = $3')
    })
  })

  describe('deleteAdmin - 删除管理员', () => {
    it('应该成功删除非超级管理员', async () => {
      const mockAdmin = { id: 'admin-001', role: 'manager' }

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockAdmin] }) // getAdminById
        .mockResolvedValueOnce({ rows: [{ id: 'admin-001' }] }) // delete

      const result = await adminService.deleteAdmin('admin-001')

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM admins WHERE id = $1 RETURNING id',
        ['admin-001']
      )
    })

    it('应该在删除超级管理员时抛出错误', async () => {
      const mockSuperAdmin = { id: 'admin-001', role: 'super_admin' }

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [mockSuperAdmin] })

      await expect(adminService.deleteAdmin('admin-001')).rejects.toThrow(
        '不能删除超级管理员'
      )
    })

    it('应该在管理员不存在时返回false', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // getAdminById returns null
        .mockResolvedValueOnce({ rows: [] }) // delete

      const result = await adminService.deleteAdmin('not-exist')

      expect(result).toBe(false)
    })
  })

  describe('getAdminStats - 获取管理员统计', () => {
    it('应该返回管理员统计信息', async () => {
      const mockStats = {
        total: '10',
        super_admin_count: '2',
        manager_count: '3',
        editor_count: '3',
        viewer_count: '2',
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockStats] })

      const result = await adminService.getAdminStats()

      expect(result).toEqual(mockStats)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total')
      )
    })

    it('应该统计各角色数量', async () => {
      ;(query as jest.Mock).mockResolvedValue({
        rows: [
          {
            total: '5',
            super_admin_count: '1',
            manager_count: '1',
            editor_count: '2',
            viewer_count: '1',
          },
        ],
      })

      await adminService.getAdminStats()

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain("COUNT(CASE WHEN role = 'super_admin' THEN 1 END)")
      expect(call[0]).toContain("COUNT(CASE WHEN role = 'manager' THEN 1 END)")
      expect(call[0]).toContain("COUNT(CASE WHEN role = 'editor' THEN 1 END)")
      expect(call[0]).toContain("COUNT(CASE WHEN role = 'viewer' THEN 1 END)")
    })
  })
})
