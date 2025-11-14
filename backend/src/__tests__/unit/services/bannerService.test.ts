/**
 * bannerService 单元测试
 */

import * as bannerService from '../../../services/bannerService'
import { query } from '../../../config/database'

// Mock database
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

describe('bannerService - 横幅服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllBanners - 获取所有横幅', () => {
    it('应该返回分页的横幅列表', async () => {
      const mockBanners = [
        { id: 1, title: '横幅1', position: 1, status: 'active' },
        { id: 2, title: '横幅2', position: 2, status: 'active' },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // count query
        .mockResolvedValueOnce({ rows: mockBanners }) // data query

      const result = await bannerService.getAllBanners({
        page: 1,
        pageSize: 10,
      })

      expect(result.data).toEqual(mockBanners)
      expect(result.total).toBe(10)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.totalPages).toBe(1)
    })

    it('应该使用默认分页参数', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] })

      const result = await bannerService.getAllBanners()

      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })

    it('应该支持按状态筛选', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [] })

      await bannerService.getAllBanners({ status: 'active' })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        ['active']
      )
    })

    it('应该在status为all时不添加筛选条件', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] })

      await bannerService.getAllBanners({ status: 'all' })

      const firstCall = (query as jest.Mock).mock.calls[0]
      expect(firstCall[0]).not.toContain('WHERE')
    })

    it('应该正确计算偏移量', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '50' }] })
        .mockResolvedValueOnce({ rows: [] })

      await bannerService.getAllBanners({ page: 3, pageSize: 20 })

      // page 3, pageSize 20 -> offset = (3-1) * 20 = 40
      const dataCall = (query as jest.Mock).mock.calls[1]
      expect(dataCall[1]).toContain(40) // offset
    })

    it('应该按position和id排序', async () => {
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] })

      await bannerService.getAllBanners()

      const dataCall = (query as jest.Mock).mock.calls[1]
      expect(dataCall[0]).toContain('ORDER BY position, id')
    })
  })

  describe('getActiveBanners - 获取激活的横幅', () => {
    it('应该只返回激活状态的横幅', async () => {
      const mockBanners = [
        { id: 1, title: '激活横幅1', status: 'active' },
        { id: 2, title: '激活横幅2', status: 'active' },
      ]

      ;(query as jest.Mock).mockResolvedValue({ rows: mockBanners })

      const result = await bannerService.getActiveBanners()

      expect(result).toEqual(mockBanners)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        []
      )
    })

    it('应该过滤未开始的横幅', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await bannerService.getActiveBanners()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('start_date IS NULL OR start_date <= NOW()'),
        []
      )
    })

    it('应该过滤已结束的横幅', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await bannerService.getActiveBanners()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('end_date IS NULL OR end_date >= NOW()'),
        []
      )
    })

    it('应该按position排序', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      await bannerService.getActiveBanners()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY position'),
        []
      )
    })
  })

  describe('getBannerById - 根据ID获取横幅', () => {
    it('应该返回指定ID的横幅', async () => {
      const mockBanner = { id: 1, title: '测试横幅', status: 'active' }

      ;(query as jest.Mock).mockResolvedValue({ rows: [mockBanner] })

      const result = await bannerService.getBannerById(1)

      expect(result).toEqual(mockBanner)
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM banners WHERE id = $1',
        [1]
      )
    })

    it('应该在横幅不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await bannerService.getBannerById(999)

      expect(result).toBeNull()
    })
  })

  describe('createBanner - 创建横幅', () => {
    it('应该成功创建横幅', async () => {
      const newBanner = {
        title: '新横幅',
        subtitle: '副标题',
        image_url: 'http://example.com/image.jpg',
        link_url: 'http://example.com',
        bg_color: '#ff0000',
        text_color: '#ffffff',
        position: 1,
        status: 'active' as const,
      }

      const createdBanner = { id: 1, ...newBanner }
      ;(query as jest.Mock).mockResolvedValue({ rows: [createdBanner] })

      const result = await bannerService.createBanner(newBanner)

      expect(result).toEqual(createdBanner)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO banners'),
        expect.arrayContaining([
          newBanner.title,
          newBanner.subtitle,
          newBanner.image_url,
          newBanner.link_url,
          newBanner.bg_color,
          newBanner.text_color,
          newBanner.position,
          newBanner.status,
        ])
      )
    })

    it('应该使用默认值创建横幅', async () => {
      const minimalBanner = {
        title: '最小横幅',
        bg_color: '',
        text_color: '',
        position: 0,
        status: 'active' as const,
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await bannerService.createBanner(minimalBanner)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1]).toContain(null) // subtitle
      expect(call[1]).toContain(null) // image_url
      expect(call[1]).toContain(null) // link_url
    })

    it('应该处理开始和结束日期', async () => {
      const bannerWithDates = {
        title: '限时横幅',
        bg_color: '#ff0000',
        text_color: '#ffffff',
        position: 1,
        status: 'active' as const,
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await bannerService.createBanner(bannerWithDates)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[1]).toContain(bannerWithDates.start_date)
      expect(call[1]).toContain(bannerWithDates.end_date)
    })
  })

  describe('updateBanner - 更新横幅', () => {
    it('应该成功更新横幅', async () => {
      const updateData = {
        title: '更新后的标题',
        status: 'inactive' as const,
      }

      const updatedBanner = { id: 1, ...updateData }
      ;(query as jest.Mock).mockResolvedValue({ rows: [updatedBanner] })

      const result = await bannerService.updateBanner(1, updateData)

      expect(result).toEqual(updatedBanner)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE banners SET'),
        expect.arrayContaining([...Object.values(updateData), 1])
      )
    })

    it('应该过滤掉不应更新的字段', async () => {
      const updateData = {
        title: '新标题',
        id: 999, // 应该被忽略
        created_at: new Date(), // 应该被忽略
        updated_at: new Date(), // 应该被忽略
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{}] })

      await bannerService.updateBanner(1, updateData)

      const call = (query as jest.Mock).mock.calls[0]
      // 检查SET子句中没有这些字段 (不包含WHERE中的id)
      expect(call[0]).toContain('UPDATE banners SET title = $1')
      expect(call[0]).not.toContain('created_at =')
      expect(call[0]).not.toContain('updated_at =')
      // 只有title被更新，所以参数应该是 [title, id]
      expect(call[1]).toEqual(['新标题', 1])
    })

    it('应该在没有字段更新时返回null', async () => {
      const result = await bannerService.updateBanner(1, {})

      expect(result).toBeNull()
      expect(query).not.toHaveBeenCalled()
    })

    it('应该在横幅不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await bannerService.updateBanner(999, { title: '新标题' })

      expect(result).toBeNull()
    })

    it('应该能更新多个字段', async () => {
      const updateData = {
        title: '新标题',
        subtitle: '新副标题',
        position: 5,
        status: 'inactive' as const,
      }

      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })

      await bannerService.updateBanner(1, updateData)

      const call = (query as jest.Mock).mock.calls[0]
      expect(call[0]).toContain('title = $1')
      expect(call[0]).toContain('subtitle = $2')
      expect(call[0]).toContain('position = $3')
      expect(call[0]).toContain('status = $4')
    })
  })

  describe('deleteBanner - 删除横幅', () => {
    it('应该成功删除横幅', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 1 })

      const result = await bannerService.deleteBanner(1)

      expect(result).toBe(true)
      expect(query).toHaveBeenCalledWith(
        'DELETE FROM banners WHERE id = $1 RETURNING id',
        [1]
      )
    })

    it('应该在横幅不存在时返回false', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rowCount: 0 })

      const result = await bannerService.deleteBanner(999)

      expect(result).toBe(false)
    })
  })

  describe('updateBannerPosition - 更新横幅位置', () => {
    it('应该成功更新横幅位置', async () => {
      const updatedBanner = { id: 1, position: 5 }
      ;(query as jest.Mock).mockResolvedValue({ rows: [updatedBanner] })

      const result = await bannerService.updateBannerPosition(1, 5)

      expect(result).toEqual(updatedBanner)
      expect(query).toHaveBeenCalledWith(
        'UPDATE banners SET position = $1 WHERE id = $2 RETURNING *',
        [5, 1]
      )
    })

    it('应该在横幅不存在时返回null', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [] })

      const result = await bannerService.updateBannerPosition(999, 5)

      expect(result).toBeNull()
    })

    it('应该能将位置设为0', async () => {
      ;(query as jest.Mock).mockResolvedValue({ rows: [{ id: 1, position: 0 }] })

      await bannerService.updateBannerPosition(1, 0)

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        [0, 1]
      )
    })
  })
})
