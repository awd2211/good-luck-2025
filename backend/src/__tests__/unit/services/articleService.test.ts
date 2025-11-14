/**
 * articleService 单元测试
 */

import * as articleService from '../../../services/user/articleService'

// Mock 依赖模块
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

// Mock 数据
const mockArticles = {
  rows: [
    {
      id: 1,
      title: '2025年生肖运势解析',
      summary: '详细解析2025年十二生肖运势',
      category: '运势',
      cover_image: 'cover1.jpg',
      author: '大师',
      view_count: 1000,
      published_at: new Date('2025-01-01'),
      created_at: new Date('2024-12-25'),
    },
    {
      id: 2,
      title: '八字算命入门指南',
      summary: '初学者必读的八字算命知识',
      category: '教程',
      cover_image: 'cover2.jpg',
      author: '专家',
      view_count: 500,
      published_at: new Date('2025-01-10'),
      created_at: new Date('2025-01-05'),
    },
  ],
  rowCount: 2,
}

const mockArticleDetail = {
  rows: [
    {
      id: 1,
      title: '2025年生肖运势解析',
      summary: '详细解析2025年十二生肖运势',
      content: '这是完整的文章内容...',
      category: '运势',
      cover_image: 'cover1.jpg',
      author: '大师',
      view_count: 1000,
      published_at: new Date('2025-01-01'),
      created_at: new Date('2024-12-25'),
      updated_at: new Date('2024-12-30'),
    },
  ],
  rowCount: 1,
}

describe('articleService - 文章服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPublishedArticles - 获取已发布文章列表', () => {
    it('应该成功获取文章列表', async () => {
      // Mock 查询总数
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      // Mock 查询列表
      query.mockResolvedValueOnce(mockArticles)

      const result = await articleService.getPublishedArticles({
        page: 1,
        limit: 20,
      })

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('pagination')
      expect(result.items).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('应该支持分页查询', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [mockArticles.rows[0]], rowCount: 1 })

      const result = await articleService.getPublishedArticles({
        page: 2,
        limit: 10,
      })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(10)
      expect(result.pagination.total).toBe(50)
      expect(result.pagination.totalPages).toBe(5)

      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.arrayContaining([10, 10]) // limit=10, offset=(2-1)*10=10
      )
    })

    it('应该支持按分类筛选', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '5' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [mockArticles.rows[0]], rowCount: 1 })

      await articleService.getPublishedArticles({
        page: 1,
        limit: 20,
        category: '运势',
      })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('category = $1'),
        expect.arrayContaining(['运势'])
      )
    })

    it('应该只返回已发布状态的文章', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockArticles)

      await articleService.getPublishedArticles({
        page: 1,
        limit: 20,
      })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'published'"),
        expect.any(Array)
      )
    })

    it('应该按发布时间倒序排列', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockArticles)

      await articleService.getPublishedArticles({
        page: 1,
        limit: 20,
      })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY published_at DESC'),
        expect.any(Array)
      )
    })

    it('应该返回空列表当没有文章时', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await articleService.getPublishedArticles({
        page: 1,
        limit: 20,
      })

      expect(result.items).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
    })

    it('应该包含文章的基本信息', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockArticles)

      const result = await articleService.getPublishedArticles({
        page: 1,
        limit: 20,
      })

      expect(result.items[0]).toHaveProperty('id')
      expect(result.items[0]).toHaveProperty('title')
      expect(result.items[0]).toHaveProperty('summary')
      expect(result.items[0]).toHaveProperty('category')
      expect(result.items[0]).toHaveProperty('cover_image')
      expect(result.items[0]).toHaveProperty('author')
      expect(result.items[0]).toHaveProperty('view_count')
      expect(result.items[0]).toHaveProperty('published_at')
    })

    it('应该不包含文章的完整内容', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockArticles)

      const result = await articleService.getPublishedArticles({
        page: 1,
        limit: 20,
      })

      expect(result.items[0]).not.toHaveProperty('content')
    })

    it('应该正确计算总页数', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '25' }], rowCount: 1 })
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await articleService.getPublishedArticles({
        page: 1,
        limit: 10,
      })

      expect(result.pagination.totalPages).toBe(3) // ceil(25/10) = 3
    })

    it('应该在不指定分类时返回所有文章', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 })
      query.mockResolvedValueOnce(mockArticles)

      await articleService.getPublishedArticles({
        page: 1,
        limit: 20,
      })

      expect(query).toHaveBeenCalledWith(
        expect.not.stringContaining('category = $'),
        expect.any(Array)
      )
    })
  })

  describe('getArticleById - 获取文章详情', () => {
    it('应该成功获取文章详情', async () => {
      query.mockResolvedValueOnce(mockArticleDetail)

      const result = await articleService.getArticleById(1)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('content')
      expect(result.id).toBe(1)
    })

    it('应该包含完整的文章内容', async () => {
      query.mockResolvedValueOnce(mockArticleDetail)

      const result = await articleService.getArticleById(1)

      expect(result).toHaveProperty('content')
      expect(result.content).toBe('这是完整的文章内容...')
    })

    it('应该在文章不存在时返回null', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await articleService.getArticleById(999)

      expect(result).toBeNull()
    })

    it('应该只返回已发布状态的文章', async () => {
      query.mockResolvedValueOnce(mockArticleDetail)

      await articleService.getArticleById(1)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'published'"),
        expect.any(Array)
      )
    })

    it('应该包含文章的所有字段', async () => {
      query.mockResolvedValueOnce(mockArticleDetail)

      const result = await articleService.getArticleById(1)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('content')
      expect(result).toHaveProperty('category')
      expect(result).toHaveProperty('cover_image')
      expect(result).toHaveProperty('author')
      expect(result).toHaveProperty('view_count')
      expect(result).toHaveProperty('published_at')
      expect(result).toHaveProperty('created_at')
      expect(result).toHaveProperty('updated_at')
    })

    it('应该使用正确的文章ID查询', async () => {
      query.mockResolvedValueOnce(mockArticleDetail)

      await articleService.getArticleById(123)

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        [123]
      )
    })
  })

  describe('incrementViewCount - 增加文章浏览量', () => {
    it('应该成功增加文章浏览量', async () => {
      query.mockResolvedValueOnce({ rowCount: 1 })

      await articleService.incrementViewCount(1)

      expect(query).toHaveBeenCalledWith(
        'UPDATE articles SET view_count = view_count + 1 WHERE id = $1',
        [1]
      )
    })

    it('应该使用正确的文章ID', async () => {
      query.mockResolvedValueOnce({ rowCount: 1 })

      await articleService.incrementViewCount(456)

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        [456]
      )
    })

    it('应该在文章不存在时正常执行', async () => {
      query.mockResolvedValueOnce({ rowCount: 0 })

      await expect(
        articleService.incrementViewCount(999)
      ).resolves.not.toThrow()
    })

    it('应该使用原子操作增加浏览量', async () => {
      query.mockResolvedValueOnce({ rowCount: 1 })

      await articleService.incrementViewCount(1)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('view_count = view_count + 1'),
        expect.any(Array)
      )
    })
  })
})
