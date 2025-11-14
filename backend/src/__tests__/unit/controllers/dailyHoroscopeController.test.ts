/**
 * dailyHoroscopeController 单元测试
 */

import { Request, Response } from 'express'
import * as dailyHoroscopeController from '../../../controllers/user/dailyHoroscopeController'
import * as dailyHoroscopeService from '../../../services/user/dailyHoroscopeService'

// Mock dailyHoroscopeService
jest.mock('../../../services/user/dailyHoroscopeService')

describe('dailyHoroscopeController - 每日运势控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    mockRequest = {
      query: {},
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

  describe('getTodayHoroscope - 获取指定生肖的今日运势', () => {
    it('应该成功获取今日运势', async () => {
      mockRequest.query = { zodiac: 'dragon' }

      const mockHoroscope = {
        id: 1,
        zodiac_sign: 'dragon',
        date: '2025-01-13',
        overall_rating: 85,
        love_rating: 88,
        career_rating: 82,
        wealth_rating: 90,
        health_rating: 78,
        summary: '今日运势不错',
        lucky_color: '红色',
        lucky_number: '8',
      }

      ;(dailyHoroscopeService.getTodayHoroscopeByZodiac as jest.Mock).mockResolvedValue(
        mockHoroscope
      )

      await dailyHoroscopeController.getTodayHoroscope(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(dailyHoroscopeService.getTodayHoroscopeByZodiac).toHaveBeenCalledWith('dragon')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHoroscope,
      })
    })

    it('应该支持不同的生肖', async () => {
      mockRequest.query = { zodiac: 'tiger' }

      const mockHoroscope = {
        id: 3,
        zodiac_sign: 'tiger',
        overall_rating: 75,
      }

      ;(dailyHoroscopeService.getTodayHoroscopeByZodiac as jest.Mock).mockResolvedValue(
        mockHoroscope
      )

      await dailyHoroscopeController.getTodayHoroscope(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(dailyHoroscopeService.getTodayHoroscopeByZodiac).toHaveBeenCalledWith('tiger')
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHoroscope,
      })
    })

    it('应该在zodiac参数为空时返回400', async () => {
      mockRequest.query = {}

      await dailyHoroscopeController.getTodayHoroscope(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '请提供生肖参数',
      })
      expect(dailyHoroscopeService.getTodayHoroscopeByZodiac).not.toHaveBeenCalled()
    })

    it('应该在运势不存在时返回404', async () => {
      mockRequest.query = { zodiac: 'unknown' }

      ;(dailyHoroscopeService.getTodayHoroscopeByZodiac as jest.Mock).mockResolvedValue(null)

      await dailyHoroscopeController.getTodayHoroscope(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '未找到该生肖的运势',
      })
    })

    it('应该在发生错误时返回500', async () => {
      mockRequest.query = { zodiac: 'dragon' }
      const error = new Error('数据库错误')
      ;(dailyHoroscopeService.getTodayHoroscopeByZodiac as jest.Mock).mockRejectedValue(error)

      await dailyHoroscopeController.getTodayHoroscope(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith('获取今日运势失败:', error)
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '获取今日运势失败',
      })
    })
  })

  describe('getAllHoroscopes - 获取所有生肖的今日运势', () => {
    it('应该成功获取所有生肖运势', async () => {
      const mockHoroscopes = [
        {
          id: 1,
          zodiac_sign: 'rat',
          overall_rating: 75,
          lucky_color: '蓝色',
        },
        {
          id: 2,
          zodiac_sign: 'ox',
          overall_rating: 80,
          lucky_color: '黄色',
        },
        {
          id: 5,
          zodiac_sign: 'dragon',
          overall_rating: 85,
          lucky_color: '红色',
        },
      ]

      ;(dailyHoroscopeService.getAllTodayHoroscopes as jest.Mock).mockResolvedValue(
        mockHoroscopes
      )

      await dailyHoroscopeController.getAllHoroscopes(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(dailyHoroscopeService.getAllTodayHoroscopes).toHaveBeenCalled()
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHoroscopes,
      })
    })

    it('应该返回空数组当没有运势时', async () => {
      ;(dailyHoroscopeService.getAllTodayHoroscopes as jest.Mock).mockResolvedValue([])

      await dailyHoroscopeController.getAllHoroscopes(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      })
    })

    it('应该返回12个生肖的运势', async () => {
      const mock12Horoscopes = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        zodiac_sign: [
          'rat',
          'ox',
          'tiger',
          'rabbit',
          'dragon',
          'snake',
          'horse',
          'goat',
          'monkey',
          'rooster',
          'dog',
          'pig',
        ][i],
        overall_rating: 80,
      }))

      ;(dailyHoroscopeService.getAllTodayHoroscopes as jest.Mock).mockResolvedValue(
        mock12Horoscopes
      )

      await dailyHoroscopeController.getAllHoroscopes(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mock12Horoscopes,
      })
    })

    it('应该在发生错误时返回500', async () => {
      const error = new Error('数据库错误')
      ;(dailyHoroscopeService.getAllTodayHoroscopes as jest.Mock).mockRejectedValue(error)

      await dailyHoroscopeController.getAllHoroscopes(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith('获取运势列表失败:', error)
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '获取运势列表失败',
      })
    })
  })
})
