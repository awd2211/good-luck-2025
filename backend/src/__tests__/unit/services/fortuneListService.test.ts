/**
 * fortuneListService 单元测试
 */

import * as fortuneListService from '../../../services/user/fortuneListService'

// Mock 依赖模块
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

// Mock 数据
const mockFortunes = {
  rows: [
    {
      id: 'fortune_1',
      title: '生肖运势',
      subtitle: '2025年运势详批',
      category: 'shengxiao',
      category_name: '生肖运势',
      description: '详细描述',
      price: '88.00',
      original_price: '128.00',
      icon: 'icon.png',
      bg_color: '#F9E6D5',
      sales_count: 1000,
      rating: 4.8,
    },
    {
      id: 'fortune_2',
      title: '八字精批',
      subtitle: '一生运势详批',
      category: 'bazi',
      category_name: '八字算命',
      description: '详细描述',
      price: '128.00',
      original_price: '188.00',
      icon: 'icon2.png',
      bg_color: '#F9E6D5',
      sales_count: 800,
      rating: 4.9,
    },
  ],
  rowCount: 2,
}

const mockFortuneDetail = {
  rows: [
    {
      id: 'fortune_1',
      title: '生肖运势',
      subtitle: '2025年运势详批',
      category: 'shengxiao',
      description: '详细描述',
      price: '88.00',
      original_price: '128.00',
      icon: 'icon.png',
      bg_color: '#FF6B6B',
      sales_count: 1000,
      rating: 4.8,
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-13'),
    },
  ],
  rowCount: 1,
}

const mockCategories = {
  rows: [
    {
      id: 1,
      category: 'shengxiao',
      name: '生肖运势',
      icon: 'icon1.png',
      description: '生肖运势描述',
      count: '5',
      min_price: '58.00',
      max_price: '128.00',
    },
    {
      id: 2,
      category: 'bazi',
      name: '八字算命',
      icon: 'icon2.png',
      description: '八字算命描述',
      count: '3',
      min_price: '88.00',
      max_price: '188.00',
    },
  ],
  rowCount: 2,
}

describe('fortuneListService - 算命列表服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFortuneList - 获取算命服务列表', () => {
    it('应该成功获取服务列表', async () => {
      // Mock 查询总数
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      // Mock 查询列表
      query.mockResolvedValueOnce(mockFortunes)

      const result = await fortuneListService.getFortuneList({})

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('pagination')
      expect(result.items).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('应该支持分页查询', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [mockFortunes.rows[0]], rowCount: 1 })

      const result = await fortuneListService.getFortuneList({ page: 2, limit: 10 })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.total).toBe(50)
      expect(result.pagination.totalPages).toBe(5)
    })

    it('应该支持按分类筛选', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '5' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [mockFortunes.rows[0]], rowCount: 1 })

      await fortuneListService.getFortuneList({ category: 'shengxiao' })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('fc.code = $1'),
        expect.arrayContaining(['shengxiao'])
      )
    })

    it('应该支持关键词搜索', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [mockFortunes.rows[0]], rowCount: 1 })

      await fortuneListService.getFortuneList({ keyword: '生肖' })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%生肖%'])
      )
    })

    it('应该支持按价格升序排序', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getFortuneList({ sort: 'price_asc' })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY fs.current_price ASC'),
        expect.any(Array)
      )
    })

    it('应该支持按价格降序排序', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getFortuneList({ sort: 'price_desc' })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY fs.current_price DESC'),
        expect.any(Array)
      )
    })

    it('应该支持按人气排序', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getFortuneList({ sort: 'popular' })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY fs.order_count DESC'),
        expect.any(Array)
      )
    })

    it('应该支持按评分排序', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getFortuneList({ sort: 'rating' })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY fs.rating DESC'),
        expect.any(Array)
      )
    })

    it('应该使用默认分页参数', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockFortunes)

      const result = await fortuneListService.getFortuneList({})

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('应该只返回active状态的服务', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getFortuneList({})

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("fs.status = 'active'"),
        expect.any(Array)
      )
    })

    it('应该返回空列表当没有服务时', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await fortuneListService.getFortuneList({})

      expect(result.items).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('应该支持同时筛选分类和关键词', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [mockFortunes.rows[0]], rowCount: 1 })

      await fortuneListService.getFortuneList({ category: 'shengxiao', keyword: '2025' })

      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(/fc\.code.*AND.*ILIKE/s),
        expect.arrayContaining(['shengxiao', '%2025%'])
      )
    })
  })

  describe('getFortuneDetail - 获取算命服务详情', () => {
    it('应该成功获取服务详情（未登录）', async () => {
      query.mockResolvedValueOnce(mockFortuneDetail)

      const result = await fortuneListService.getFortuneDetail('fortune_1')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('price')
      expect(result).toHaveProperty('isFavorited')
      expect(result.isFavorited).toBe(false)
    })

    it('应该成功获取服务详情并检查收藏状态（已登录）', async () => {
      query.mockResolvedValueOnce(mockFortuneDetail)
      query.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })

      const result = await fortuneListService.getFortuneDetail('fortune_1', 'user_123')

      expect(result.isFavorited).toBe(true)
      expect(query).toHaveBeenCalledTimes(2)
    })

    it('应该在服务不存在时抛出异常', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      await expect(fortuneListService.getFortuneDetail('nonexistent')).rejects.toThrow(
        '商品不存在或已下架'
      )
    })

    it('应该包含完整的服务信息', async () => {
      query.mockResolvedValueOnce(mockFortuneDetail)

      const result = await fortuneListService.getFortuneDetail('fortune_1')

      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('subtitle')
      expect(result).toHaveProperty('category')
      expect(result).toHaveProperty('description')
      expect(result).toHaveProperty('price')
      expect(result).toHaveProperty('original_price')
      expect(result).toHaveProperty('rating')
      expect(result).toHaveProperty('sales_count')
    })

    it('应该在用户已登录但未收藏时返回false', async () => {
      query.mockResolvedValueOnce(mockFortuneDetail)
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await fortuneListService.getFortuneDetail('fortune_1', 'user_123')

      expect(result.isFavorited).toBe(false)
    })
  })

  describe('getPopularFortunes - 获取热门服务', () => {
    it('应该成功获取热门服务', async () => {
      query.mockResolvedValueOnce(mockFortunes)

      const result = await fortuneListService.getPopularFortunes()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('sales_count')
    })

    it('应该按销量降序排列', async () => {
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getPopularFortunes()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY sales_count DESC'),
        expect.any(Array)
      )
    })

    it('应该支持自定义限制数量', async () => {
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getPopularFortunes(5)

      expect(query).toHaveBeenCalledWith(expect.any(String), [5])
    })

    it('应该使用默认限制10个', async () => {
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getPopularFortunes()

      expect(query).toHaveBeenCalledWith(expect.any(String), [10])
    })

    it('应该只返回active状态的服务', async () => {
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getPopularFortunes()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        expect.any(Array)
      )
    })

    it('应该返回空数组当没有热门服务时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await fortuneListService.getPopularFortunes()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })
  })

  describe('getRecommendedFortunes - 获取推荐服务', () => {
    it('应该成功获取推荐服务', async () => {
      query.mockResolvedValueOnce(mockFortunes)

      const result = await fortuneListService.getRecommendedFortunes()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('rating')
    })

    it('应该按评分和销量降序排列', async () => {
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getRecommendedFortunes()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY rating DESC, sales_count DESC'),
        expect.any(Array)
      )
    })

    it('应该支持自定义限制数量', async () => {
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getRecommendedFortunes(5)

      expect(query).toHaveBeenCalledWith(expect.any(String), [5])
    })

    it('应该使用默认限制10个', async () => {
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getRecommendedFortunes()

      expect(query).toHaveBeenCalledWith(expect.any(String), [10])
    })

    it('应该只返回active状态的服务', async () => {
      query.mockResolvedValueOnce(mockFortunes)

      await fortuneListService.getRecommendedFortunes()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        expect.any(Array)
      )
    })

    it('应该返回空数组当没有推荐服务时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await fortuneListService.getRecommendedFortunes()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })
  })

  describe('getCategories - 获取分类列表', () => {
    it('应该成功获取分类列表', async () => {
      query.mockResolvedValueOnce(mockCategories)

      const result = await fortuneListService.getCategories()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('category')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('count')
    })

    it('应该包含分类统计信息', async () => {
      query.mockResolvedValueOnce(mockCategories)

      const result = await fortuneListService.getCategories()

      expect(result[0]).toHaveProperty('count')
      expect(result[0]).toHaveProperty('minPrice')
      expect(result[0]).toHaveProperty('maxPrice')
      expect(typeof result[0].count).toBe('number')
      expect(typeof result[0].minPrice).toBe('number')
    })

    it('应该正确转换数据类型', async () => {
      query.mockResolvedValueOnce(mockCategories)

      const result = await fortuneListService.getCategories()

      expect(result[0].count).toBe(5)
      expect(result[0].minPrice).toBe(58)
      expect(result[0].maxPrice).toBe(128)
      expect(result[1].count).toBe(3)
    })

    it('应该只返回active状态的分类', async () => {
      query.mockResolvedValueOnce(mockCategories)

      await fortuneListService.getCategories()

      expect(query).toHaveBeenCalledWith(expect.stringContaining("fc.status = 'active'"))
    })

    it('应该按排序顺序和数量排列', async () => {
      query.mockResolvedValueOnce(mockCategories)

      await fortuneListService.getCategories()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY fc.sort_order ASC, count DESC')
      )
    })

    it('应该返回空数组当没有分类时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await fortuneListService.getCategories()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('应该正确处理没有服务的分类', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            ...mockCategories.rows[0],
            count: '0',
            min_price: null,
            max_price: null,
          },
        ],
        rowCount: 1,
      })

      const result = await fortuneListService.getCategories()

      expect(result[0].count).toBe(0)
      expect(result[0].minPrice).toBe(0)
      expect(result[0].maxPrice).toBe(0)
    })

    it('应该包含分类的图标和描述', async () => {
      query.mockResolvedValueOnce(mockCategories)

      const result = await fortuneListService.getCategories()

      expect(result[0]).toHaveProperty('icon')
      expect(result[0]).toHaveProperty('description')
      expect(result[0].icon).toBe('icon1.png')
      expect(result[0].description).toBe('生肖运势描述')
    })
  })
})
