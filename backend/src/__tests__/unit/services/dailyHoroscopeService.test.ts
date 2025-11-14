/**
 * dailyHoroscopeService 单元测试
 */

import * as dailyHoroscopeService from '../../../services/user/dailyHoroscopeService'

// Mock 依赖模块
jest.mock('../../../config/database', () => ({
  query: jest.fn(),
}))

const { query } = require('../../../config/database')

// Mock Date
const mockDate = new Date('2025-01-15T10:00:00.000Z')
const mockToday = '2025-01-15'

// Mock 数据
const mockHoroscope = {
  rows: [
    {
      id: 1,
      zodiac_sign: 'dragon',
      date: mockToday,
      overall_rating: 85,
      love_rating: 88,
      career_rating: 82,
      wealth_rating: 90,
      health_rating: 78,
      summary: '今日运势不错，适合投资理财',
      love_fortune: '感情运势佳，单身者有望遇到心仪对象',
      career_fortune: '工作顺利，容易得到上司赏识',
      wealth_fortune: '财运旺盛，投资理财收益可观',
      health_fortune: '身体健康，但需注意休息',
      lucky_color: '红色',
      lucky_number: '8',
      lucky_direction: '东南',
      auspicious_time: '09:00-11:00',
    },
  ],
  rowCount: 1,
}

const mockAllHoroscopes = {
  rows: [
    {
      id: 1,
      zodiac_sign: 'rat',
      date: mockToday,
      overall_rating: 75,
      love_rating: 70,
      career_rating: 80,
      wealth_rating: 75,
      health_rating: 72,
      summary: '鼠年运势',
      love_fortune: '爱情运势',
      career_fortune: '事业运势',
      wealth_fortune: '财富运势',
      health_fortune: '健康运势',
      lucky_color: '蓝色',
      lucky_number: '3',
      lucky_direction: '北',
      auspicious_time: '07:00-09:00',
    },
    {
      id: 2,
      zodiac_sign: 'ox',
      date: mockToday,
      overall_rating: 80,
      love_rating: 75,
      career_rating: 85,
      wealth_rating: 80,
      health_rating: 78,
      summary: '牛年运势',
      love_fortune: '爱情运势',
      career_fortune: '事业运势',
      wealth_fortune: '财富运势',
      health_fortune: '健康运势',
      lucky_color: '黄色',
      lucky_number: '5',
      lucky_direction: '东北',
      auspicious_time: '11:00-13:00',
    },
    {
      id: 5,
      zodiac_sign: 'dragon',
      date: mockToday,
      overall_rating: 85,
      love_rating: 88,
      career_rating: 82,
      wealth_rating: 90,
      health_rating: 78,
      summary: '龙年运势',
      love_fortune: '爱情运势',
      career_fortune: '事业运势',
      wealth_fortune: '财富运势',
      health_fortune: '健康运势',
      lucky_color: '红色',
      lucky_number: '8',
      lucky_direction: '东南',
      auspicious_time: '09:00-11:00',
    },
  ],
  rowCount: 3,
}

describe('dailyHoroscopeService - 每日运势服务', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Date.now()
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getTodayHoroscopeByZodiac - 获取指定生肖的今日运势', () => {
    it('应该成功获取今日运势', async () => {
      query.mockResolvedValueOnce(mockHoroscope)

      const result = await dailyHoroscopeService.getTodayHoroscopeByZodiac('dragon')

      expect(result).toBeDefined()
      expect(result).toHaveProperty('zodiac_sign')
      expect(result).toHaveProperty('overall_rating')
      expect(result.zodiac_sign).toBe('dragon')
    })

    it('应该使用今天的日期查询', async () => {
      query.mockResolvedValueOnce(mockHoroscope)

      await dailyHoroscopeService.getTodayHoroscopeByZodiac('dragon')

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['dragon', mockToday])
      )
    })

    it('应该只返回active状态的运势', async () => {
      query.mockResolvedValueOnce(mockHoroscope)

      await dailyHoroscopeService.getTodayHoroscopeByZodiac('dragon')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        expect.any(Array)
      )
    })

    it('应该在运势不存在时返回null', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await dailyHoroscopeService.getTodayHoroscopeByZodiac('dragon')

      expect(result).toBeNull()
    })

    it('应该包含完整的运势信息', async () => {
      query.mockResolvedValueOnce(mockHoroscope)

      const result = await dailyHoroscopeService.getTodayHoroscopeByZodiac('dragon')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('zodiac_sign')
      expect(result).toHaveProperty('date')
      expect(result).toHaveProperty('overall_rating')
      expect(result).toHaveProperty('love_rating')
      expect(result).toHaveProperty('career_rating')
      expect(result).toHaveProperty('wealth_rating')
      expect(result).toHaveProperty('health_rating')
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('love_fortune')
      expect(result).toHaveProperty('career_fortune')
      expect(result).toHaveProperty('wealth_fortune')
      expect(result).toHaveProperty('health_fortune')
      expect(result).toHaveProperty('lucky_color')
      expect(result).toHaveProperty('lucky_number')
      expect(result).toHaveProperty('lucky_direction')
      expect(result).toHaveProperty('auspicious_time')
    })

    it('应该正确返回评分信息', async () => {
      query.mockResolvedValueOnce(mockHoroscope)

      const result = await dailyHoroscopeService.getTodayHoroscopeByZodiac('dragon')

      expect(result.overall_rating).toBe(85)
      expect(result.love_rating).toBe(88)
      expect(result.career_rating).toBe(82)
      expect(result.wealth_rating).toBe(90)
      expect(result.health_rating).toBe(78)
    })

    it('应该正确返回幸运元素', async () => {
      query.mockResolvedValueOnce(mockHoroscope)

      const result = await dailyHoroscopeService.getTodayHoroscopeByZodiac('dragon')

      expect(result.lucky_color).toBe('红色')
      expect(result.lucky_number).toBe('8')
      expect(result.lucky_direction).toBe('东南')
      expect(result.auspicious_time).toBe('09:00-11:00')
    })

    it('应该限制只返回一条记录', async () => {
      query.mockResolvedValueOnce(mockHoroscope)

      await dailyHoroscopeService.getTodayHoroscopeByZodiac('dragon')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 1'),
        expect.any(Array)
      )
    })

    it('应该支持查询不同的生肖', async () => {
      query.mockResolvedValueOnce({
        rows: [{ ...mockHoroscope.rows[0], zodiac_sign: 'tiger' }],
        rowCount: 1,
      })

      const result = await dailyHoroscopeService.getTodayHoroscopeByZodiac('tiger')

      expect(result.zodiac_sign).toBe('tiger')
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['tiger', mockToday])
      )
    })
  })

  describe('getAllTodayHoroscopes - 获取所有生肖的今日运势', () => {
    it('应该成功获取所有生肖运势', async () => {
      query.mockResolvedValueOnce(mockAllHoroscopes)

      const result = await dailyHoroscopeService.getAllTodayHoroscopes()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(3)
    })

    it('应该使用今天的日期查询', async () => {
      query.mockResolvedValueOnce(mockAllHoroscopes)

      await dailyHoroscopeService.getAllTodayHoroscopes()

      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        [mockToday]
      )
    })

    it('应该只返回active状态的运势', async () => {
      query.mockResolvedValueOnce(mockAllHoroscopes)

      await dailyHoroscopeService.getAllTodayHoroscopes()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        expect.any(Array)
      )
    })

    it('应该按生肖顺序排列', async () => {
      query.mockResolvedValueOnce(mockAllHoroscopes)

      await dailyHoroscopeService.getAllTodayHoroscopes()

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY'),
        expect.any(Array)
      )
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('CASE zodiac_sign'),
        expect.any(Array)
      )
    })

    it('应该返回空数组当没有运势时', async () => {
      query.mockResolvedValueOnce({ rows: [], rowCount: 0 })

      const result = await dailyHoroscopeService.getAllTodayHoroscopes()

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('应该包含所有生肖运势的完整信息', async () => {
      query.mockResolvedValueOnce(mockAllHoroscopes)

      const result = await dailyHoroscopeService.getAllTodayHoroscopes()

      result.forEach(horoscope => {
        expect(horoscope).toHaveProperty('zodiac_sign')
        expect(horoscope).toHaveProperty('date')
        expect(horoscope).toHaveProperty('overall_rating')
        expect(horoscope).toHaveProperty('love_rating')
        expect(horoscope).toHaveProperty('career_rating')
        expect(horoscope).toHaveProperty('wealth_rating')
        expect(horoscope).toHaveProperty('health_rating')
        expect(horoscope).toHaveProperty('lucky_color')
        expect(horoscope).toHaveProperty('lucky_number')
      })
    })

    it('应该返回鼠在第一位', async () => {
      query.mockResolvedValueOnce(mockAllHoroscopes)

      const result = await dailyHoroscopeService.getAllTodayHoroscopes()

      expect(result[0].zodiac_sign).toBe('rat')
    })

    it('应该返回牛在第二位', async () => {
      query.mockResolvedValueOnce(mockAllHoroscopes)

      const result = await dailyHoroscopeService.getAllTodayHoroscopes()

      expect(result[1].zodiac_sign).toBe('ox')
    })

    it('应该包含12个生肖的运势数据结构', async () => {
      const complete12Horoscopes = {
        rows: Array.from({ length: 12 }, (_, i) => ({
          id: i + 1,
          zodiac_sign: ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'][i],
          date: mockToday,
          overall_rating: 80,
          love_rating: 75,
          career_rating: 85,
          wealth_rating: 80,
          health_rating: 78,
          summary: '运势',
          love_fortune: '爱情运势',
          career_fortune: '事业运势',
          wealth_fortune: '财富运势',
          health_fortune: '健康运势',
          lucky_color: '红色',
          lucky_number: '8',
          lucky_direction: '东',
          auspicious_time: '09:00-11:00',
        })),
        rowCount: 12,
      }

      query.mockResolvedValueOnce(complete12Horoscopes)

      const result = await dailyHoroscopeService.getAllTodayHoroscopes()

      expect(result).toHaveLength(12)
      expect(result[0].zodiac_sign).toBe('rat')
      expect(result[11].zodiac_sign).toBe('pig')
    })
  })
})
