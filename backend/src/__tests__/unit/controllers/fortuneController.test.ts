/**
 * fortuneController 单元测试
 */

import { Request, Response } from 'express'
import * as fortuneController from '../../../controllers/fortuneController'
import * as fortuneService from '../../../services/fortuneService'

// Mock fortuneService
jest.mock('../../../services/fortuneService')

describe('fortuneController - 算命控制器', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    mockRequest = {
      body: {},
    }
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
    jest.clearAllMocks()
  })

  describe('getBirthFortune - 生肖运势', () => {
    it('应该成功计算生肖运势', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
      }

      const mockResult = {
        zodiac: '马',
        fortune: '今年运势不错',
        luckyColor: '红色',
      }

      ;(fortuneService.calculateBirthFortune as jest.Mock).mockReturnValue(mockResult)

      fortuneController.getBirthFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(fortuneService.calculateBirthFortune).toHaveBeenCalledWith({
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
      })
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
    })

    it('应该支持不传birthHour参数', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
      }

      const mockResult = { zodiac: '马' }
      ;(fortuneService.calculateBirthFortune as jest.Mock).mockReturnValue(mockResult)

      fortuneController.getBirthFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(fortuneService.calculateBirthFortune).toHaveBeenCalledWith({
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: undefined,
      })
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
    })

    it('应该在缺少birthYear时返回400', () => {
      mockRequest.body = {
        birthMonth: 5,
        birthDay: 15,
      }

      fortuneController.getBirthFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供完整的生日信息',
      })
      expect(fortuneService.calculateBirthFortune).not.toHaveBeenCalled()
    })

    it('应该在缺少birthMonth时返回400', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthDay: 15,
      }

      fortuneController.getBirthFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供完整的生日信息',
      })
    })

    it('应该在缺少birthDay时返回400', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
      }

      fortuneController.getBirthFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供完整的生日信息',
      })
    })

    it('应该在发生错误时返回500', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
      }

      ;(fortuneService.calculateBirthFortune as jest.Mock).mockImplementation(() => {
        throw new Error('计算错误')
      })

      fortuneController.getBirthFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '计算失败',
      })
    })
  })

  describe('getBaziAnalysis - 八字精批', () => {
    it('应该成功计算八字精批', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
        gender: 'male',
      }

      const mockResult = {
        bazi: '庚午年 辛巳月 甲子日 己巳时',
        wuxing: { metal: 2, wood: 1, water: 1, fire: 2, earth: 1 },
        analysis: '八字分析结果',
      }

      ;(fortuneService.calculateBazi as jest.Mock).mockReturnValue(mockResult)

      fortuneController.getBaziAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(fortuneService.calculateBazi).toHaveBeenCalledWith({
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
        gender: 'male',
      })
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
    })

    it('应该支持female性别', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
        gender: 'female',
      }

      const mockResult = { bazi: '庚午年 辛巳月 甲子日 己巳时' }
      ;(fortuneService.calculateBazi as jest.Mock).mockReturnValue(mockResult)

      fortuneController.getBaziAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(fortuneService.calculateBazi).toHaveBeenCalledWith({
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
        gender: 'female',
      })
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
    })

    it('应该在缺少birthYear时返回400', () => {
      mockRequest.body = {
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
        gender: 'male',
      }

      fortuneController.getBaziAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供完整的八字信息',
      })
      expect(fortuneService.calculateBazi).not.toHaveBeenCalled()
    })

    it('应该在缺少birthMonth时返回400', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthDay: 15,
        birthHour: 10,
        gender: 'male',
      }

      fortuneController.getBaziAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供完整的八字信息',
      })
    })

    it('应该在缺少birthDay时返回400', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
        birthHour: 10,
        gender: 'male',
      }

      fortuneController.getBaziAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供完整的八字信息',
      })
    })

    it('应该在缺少birthHour时返回400', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        gender: 'male',
      }

      fortuneController.getBaziAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供完整的八字信息',
      })
    })

    it('应该在缺少gender时返回400', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
      }

      fortuneController.getBaziAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供完整的八字信息',
      })
    })

    it('应该在发生错误时返回500', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
        gender: 'male',
      }

      ;(fortuneService.calculateBazi as jest.Mock).mockImplementation(() => {
        throw new Error('计算错误')
      })

      fortuneController.getBaziAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '计算失败',
      })
    })
  })

  describe('getFlowYearFortune - 流年运势', () => {
    it('应该成功计算流年运势', () => {
      mockRequest.body = {
        birthYear: 1990,
        targetYear: 2025,
      }

      const mockResult = {
        zodiac: '马',
        targetYear: 2025,
        fortune: '2025年运势分析',
        score: 85,
      }

      ;(fortuneService.calculateFlowYear as jest.Mock).mockReturnValue(mockResult)

      fortuneController.getFlowYearFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(fortuneService.calculateFlowYear).toHaveBeenCalledWith({
        birthYear: 1990,
        targetYear: 2025,
      })
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
    })

    it('应该支持不同的年份组合', () => {
      mockRequest.body = {
        birthYear: 1985,
        targetYear: 2024,
      }

      const mockResult = { zodiac: '牛', targetYear: 2024 }
      ;(fortuneService.calculateFlowYear as jest.Mock).mockReturnValue(mockResult)

      fortuneController.getFlowYearFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(fortuneService.calculateFlowYear).toHaveBeenCalledWith({
        birthYear: 1985,
        targetYear: 2024,
      })
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
    })

    it('应该在缺少birthYear时返回400', () => {
      mockRequest.body = {
        targetYear: 2025,
      }

      fortuneController.getFlowYearFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供出生年份和目标年份',
      })
      expect(fortuneService.calculateFlowYear).not.toHaveBeenCalled()
    })

    it('应该在缺少targetYear时返回400', () => {
      mockRequest.body = {
        birthYear: 1990,
      }

      fortuneController.getFlowYearFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供出生年份和目标年份',
      })
    })

    it('应该在发生错误时返回500', () => {
      mockRequest.body = {
        birthYear: 1990,
        targetYear: 2025,
      }

      ;(fortuneService.calculateFlowYear as jest.Mock).mockImplementation(() => {
        throw new Error('计算错误')
      })

      fortuneController.getFlowYearFortune(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '计算失败',
      })
    })
  })

  describe('getNameAnalysis - 姓名详批', () => {
    it('应该成功计算姓名分析', () => {
      mockRequest.body = {
        name: '张三',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
      }

      const mockResult = {
        name: '张三',
        score: 85,
        analysis: '姓名分析结果',
        wuxing: '木',
      }

      ;(fortuneService.calculateNameScore as jest.Mock).mockReturnValue(mockResult)

      fortuneController.getNameAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(fortuneService.calculateNameScore).toHaveBeenCalledWith({
        name: '张三',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
      })
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
    })

    it('应该支持不同的姓名', () => {
      mockRequest.body = {
        name: '李四',
        birthYear: 1985,
        birthMonth: 3,
        birthDay: 20,
      }

      const mockResult = { name: '李四', score: 90 }
      ;(fortuneService.calculateNameScore as jest.Mock).mockReturnValue(mockResult)

      fortuneController.getNameAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(fortuneService.calculateNameScore).toHaveBeenCalledWith({
        name: '李四',
        birthYear: 1985,
        birthMonth: 3,
        birthDay: 20,
      })
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
    })

    it('应该在缺少name时返回400', () => {
      mockRequest.body = {
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
      }

      fortuneController.getNameAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供姓名和生日信息',
      })
      expect(fortuneService.calculateNameScore).not.toHaveBeenCalled()
    })

    it('应该在缺少birthYear时返回400', () => {
      mockRequest.body = {
        name: '张三',
        birthMonth: 5,
        birthDay: 15,
      }

      fortuneController.getNameAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供姓名和生日信息',
      })
    })

    it('应该在缺少birthMonth时返回400', () => {
      mockRequest.body = {
        name: '张三',
        birthYear: 1990,
        birthDay: 15,
      }

      fortuneController.getNameAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供姓名和生日信息',
      })
    })

    it('应该在缺少birthDay时返回400', () => {
      mockRequest.body = {
        name: '张三',
        birthYear: 1990,
        birthMonth: 5,
      }

      fortuneController.getNameAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供姓名和生日信息',
      })
    })

    it('应该在发生错误时返回500', () => {
      mockRequest.body = {
        name: '张三',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
      }

      ;(fortuneService.calculateNameScore as jest.Mock).mockImplementation(() => {
        throw new Error('计算错误')
      })

      fortuneController.getNameAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '计算失败',
      })
    })
  })

  describe('getMarriageAnalysis - 婚姻分析', () => {
    it('应该成功计算婚姻分析', () => {
      mockRequest.body = {
        person1: {
          name: '张三',
          birthYear: 1990,
          birthMonth: 5,
          birthDay: 15,
        },
        person2: {
          name: '李四',
          birthYear: 1992,
          birthMonth: 8,
          birthDay: 20,
        },
      }

      const mockResult = {
        compatibility: 85,
        analysis: '婚姻分析结果',
        suggestions: '建议内容',
      }

      ;(fortuneService.calculateMarriage as jest.Mock).mockReturnValue(mockResult)

      fortuneController.getMarriageAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(fortuneService.calculateMarriage).toHaveBeenCalledWith({
        person1: {
          name: '张三',
          birthYear: 1990,
          birthMonth: 5,
          birthDay: 15,
        },
        person2: {
          name: '李四',
          birthYear: 1992,
          birthMonth: 8,
          birthDay: 20,
        },
      })
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
    })

    it('应该支持只传必填字段', () => {
      mockRequest.body = {
        person1: {
          name: '张三',
          birthYear: 1990,
        },
        person2: {
          name: '李四',
          birthYear: 1992,
        },
      }

      const mockResult = { compatibility: 75 }
      ;(fortuneService.calculateMarriage as jest.Mock).mockReturnValue(mockResult)

      fortuneController.getMarriageAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(fortuneService.calculateMarriage).toHaveBeenCalledWith({
        person1: {
          name: '张三',
          birthYear: 1990,
          birthMonth: undefined,
          birthDay: undefined,
        },
        person2: {
          name: '李四',
          birthYear: 1992,
          birthMonth: undefined,
          birthDay: undefined,
        },
      })
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
    })

    it('应该在缺少person1.name时返回400', () => {
      mockRequest.body = {
        person1: {
          birthYear: 1990,
        },
        person2: {
          name: '李四',
          birthYear: 1992,
        },
      }

      fortuneController.getMarriageAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供双方的姓名和生日信息',
      })
      expect(fortuneService.calculateMarriage).not.toHaveBeenCalled()
    })

    it('应该在缺少person1.birthYear时返回400', () => {
      mockRequest.body = {
        person1: {
          name: '张三',
        },
        person2: {
          name: '李四',
          birthYear: 1992,
        },
      }

      fortuneController.getMarriageAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供双方的姓名和生日信息',
      })
    })

    it('应该在缺少person2.name时返回400', () => {
      mockRequest.body = {
        person1: {
          name: '张三',
          birthYear: 1990,
        },
        person2: {
          birthYear: 1992,
        },
      }

      fortuneController.getMarriageAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供双方的姓名和生日信息',
      })
    })

    it('应该在缺少person2.birthYear时返回400', () => {
      mockRequest.body = {
        person1: {
          name: '张三',
          birthYear: 1990,
        },
        person2: {
          name: '李四',
        },
      }

      fortuneController.getMarriageAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '请提供双方的姓名和生日信息',
      })
    })

    it('应该在缺少person1时返回500', () => {
      mockRequest.body = {
        person2: {
          name: '李四',
          birthYear: 1992,
        },
      }

      fortuneController.getMarriageAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '计算失败',
      })
    })

    it('应该在缺少person2时返回500', () => {
      mockRequest.body = {
        person1: {
          name: '张三',
          birthYear: 1990,
        },
      }

      fortuneController.getMarriageAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '计算失败',
      })
    })

    it('应该在发生错误时返回500', () => {
      mockRequest.body = {
        person1: {
          name: '张三',
          birthYear: 1990,
        },
        person2: {
          name: '李四',
          birthYear: 1992,
        },
      }

      ;(fortuneService.calculateMarriage as jest.Mock).mockImplementation(() => {
        throw new Error('计算错误')
      })

      fortuneController.getMarriageAnalysis(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '计算失败',
      })
    })
  })
})
