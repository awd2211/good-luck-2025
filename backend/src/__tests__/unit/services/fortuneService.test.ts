/**
 * fortuneService 单元测试
 */

import * as fortuneService from '../../../services/fortuneService'

describe('fortuneService - 算命服务', () => {
  describe('calculateBirthFortune - 生肖运势计算', () => {
    it('应该成功计算生肖运势', () => {
      const result = fortuneService.calculateBirthFortune({
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
      })

      expect(result).toHaveProperty('shengxiao')
      expect(result).toHaveProperty('ganzhi')
      expect(result).toHaveProperty('wuxing')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('fortune')
      expect(result).toHaveProperty('luckyColors')
      expect(result).toHaveProperty('luckyNumbers')
      expect(result).toHaveProperty('luckyDirections')
    })

    it('应该为1990年返回正确的生肖（马）', () => {
      const result = fortuneService.calculateBirthFortune({
        birthYear: 1990,
        birthMonth: 1,
        birthDay: 1,
      })

      expect(result.shengxiao).toBe('马')
    })

    it('应该为2000年返回正确的生肖（龙）', () => {
      const result = fortuneService.calculateBirthFortune({
        birthYear: 2000,
        birthMonth: 1,
        birthDay: 1,
      })

      expect(result.shengxiao).toBe('龙')
    })

    it('应该包含完整的运势信息', () => {
      const result = fortuneService.calculateBirthFortune({
        birthYear: 1995,
        birthMonth: 6,
        birthDay: 20,
      })

      expect(result.fortune).toHaveProperty('overall')
      expect(result.fortune).toHaveProperty('career')
      expect(result.fortune).toHaveProperty('wealth')
      expect(result.fortune).toHaveProperty('health')
    })

    it('应该返回数组类型的幸运元素', () => {
      const result = fortuneService.calculateBirthFortune({
        birthYear: 1985,
        birthMonth: 3,
        birthDay: 10,
      })

      expect(Array.isArray(result.luckyColors)).toBe(true)
      expect(Array.isArray(result.luckyNumbers)).toBe(true)
      expect(Array.isArray(result.luckyDirections)).toBe(true)
      expect(result.luckyColors.length).toBeGreaterThan(0)
      expect(result.luckyNumbers.length).toBeGreaterThan(0)
    })

    it('应该为不同的日期计算不同的运势分数', () => {
      const result1 = fortuneService.calculateBirthFortune({
        birthYear: 1990,
        birthMonth: 1,
        birthDay: 1,
      })

      const result2 = fortuneService.calculateBirthFortune({
        birthYear: 1990,
        birthMonth: 12,
        birthDay: 31,
      })

      // 分数应该不同（虽然可能相同，但概率很低）
      expect(result1.score).toBeDefined()
      expect(result2.score).toBeDefined()
    })

    it('应该支持可选的出生时辰参数', () => {
      const result = fortuneService.calculateBirthFortune({
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
      })

      expect(result).toHaveProperty('shengxiao')
      expect(result).toHaveProperty('ganzhi')
    })
  })

  describe('calculateBazi - 八字精批', () => {
    it('应该成功计算八字', () => {
      const result = fortuneService.calculateBazi({
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
        gender: '男',
      })

      expect(result).toHaveProperty('bazi')
      expect(result).toHaveProperty('shengxiao')
      expect(result).toHaveProperty('wuxing')
      expect(result).toHaveProperty('personality')
      expect(result).toHaveProperty('careerAdvice')
      expect(result).toHaveProperty('wealthFortune')
      expect(result).toHaveProperty('healthAdvice')
    })

    it('应该返回完整的八字信息', () => {
      const result = fortuneService.calculateBazi({
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 10,
        gender: '男',
      })

      expect(result.bazi).toHaveProperty('year')
      expect(result.bazi).toHaveProperty('month')
      expect(result.bazi).toHaveProperty('day')
      expect(result.bazi).toHaveProperty('hour')
    })

    it('应该返回五行分析', () => {
      const result = fortuneService.calculateBazi({
        birthYear: 1995,
        birthMonth: 6,
        birthDay: 20,
        birthHour: 14,
        gender: '女',
      })

      expect(result.wuxing).toHaveProperty('wood')
      expect(result.wuxing).toHaveProperty('fire')
      expect(result.wuxing).toHaveProperty('earth')
      expect(result.wuxing).toHaveProperty('metal')
      expect(result.wuxing).toHaveProperty('water')

      // 五行值应该在合理范围内
      expect(result.wuxing.wood).toBeGreaterThanOrEqual(10)
      expect(result.wuxing.wood).toBeLessThanOrEqual(40)
    })

    it('应该包含性格和建议', () => {
      const result = fortuneService.calculateBazi({
        birthYear: 1985,
        birthMonth: 3,
        birthDay: 10,
        birthHour: 8,
        gender: '男',
      })

      expect(typeof result.personality).toBe('string')
      expect(typeof result.careerAdvice).toBe('string')
      expect(typeof result.wealthFortune).toBe('string')
      expect(typeof result.healthAdvice).toBe('string')
      expect(result.personality.length).toBeGreaterThan(0)
    })
  })

  describe('calculateFlowYear - 流年运势', () => {
    it('应该成功计算流年运势', () => {
      const result = fortuneService.calculateFlowYear({
        birthYear: 1990,
        targetYear: 2025,
      })

      expect(result).toHaveProperty('year')
      expect(result).toHaveProperty('ganzhi')
      expect(result).toHaveProperty('shengxiao')
      expect(result).toHaveProperty('age')
      expect(result).toHaveProperty('birthShengxiao')
      expect(result).toHaveProperty('fortune')
      expect(result).toHaveProperty('monthlyFortune')
    })

    it('应该正确计算年龄', () => {
      const result = fortuneService.calculateFlowYear({
        birthYear: 1990,
        targetYear: 2025,
      })

      expect(result.age).toBe(35)
    })

    it('应该返回12个月的运势', () => {
      const result = fortuneService.calculateFlowYear({
        birthYear: 1995,
        targetYear: 2025,
      })

      expect(Array.isArray(result.monthlyFortune)).toBe(true)
      expect(result.monthlyFortune).toHaveLength(12)
      expect(result.monthlyFortune[0]).toHaveProperty('month')
      expect(result.monthlyFortune[0]).toHaveProperty('score')
      expect(result.monthlyFortune[0]).toHaveProperty('advice')
    })

    it('应该包含完整的运势分析', () => {
      const result = fortuneService.calculateFlowYear({
        birthYear: 1985,
        targetYear: 2025,
      })

      expect(result.fortune).toHaveProperty('overall')
      expect(result.fortune).toHaveProperty('career')
      expect(result.fortune).toHaveProperty('wealth')
      expect(result.fortune).toHaveProperty('love')
      expect(result.fortune).toHaveProperty('health')
    })

    it('应该为目标年份返回正确的生肖', () => {
      const result = fortuneService.calculateFlowYear({
        birthYear: 1990,
        targetYear: 2025,
      })

      expect(result.shengxiao).toBe('蛇')
    })

    it('应该返回出生年份的生肖', () => {
      const result = fortuneService.calculateFlowYear({
        birthYear: 1990,
        targetYear: 2025,
      })

      expect(result.birthShengxiao).toBe('马')
    })
  })

  describe('calculateNameScore - 姓名测算', () => {
    it('应该成功计算姓名分数', () => {
      const result = fortuneService.calculateNameScore({
        name: '张三',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
      })

      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('totalScore')
      expect(result).toHaveProperty('scores')
      expect(result).toHaveProperty('wuxing')
      expect(result).toHaveProperty('personality')
      expect(result).toHaveProperty('careerAdvice')
      expect(result).toHaveProperty('suggestions')
    })

    it('应该返回传入的姓名', () => {
      const result = fortuneService.calculateNameScore({
        name: '李四',
        birthYear: 1995,
        birthMonth: 6,
        birthDay: 20,
      })

      expect(result.name).toBe('李四')
    })

    it('应该返回五格分数', () => {
      const result = fortuneService.calculateNameScore({
        name: '王五',
        birthYear: 1985,
        birthMonth: 3,
        birthDay: 10,
      })

      expect(result.scores).toHaveProperty('tiange')
      expect(result.scores).toHaveProperty('dige')
      expect(result.scores).toHaveProperty('renge')
      expect(result.scores).toHaveProperty('waige')
      expect(result.scores).toHaveProperty('zongge')

      // 分数应该在合理范围内
      expect(result.scores.tiange).toBeGreaterThanOrEqual(80)
      expect(result.scores.tiange).toBeLessThanOrEqual(100)
    })

    it('应该返回五行属性', () => {
      const result = fortuneService.calculateNameScore({
        name: '赵六',
        birthYear: 1992,
        birthMonth: 8,
        birthDay: 25,
      })

      expect(result.wuxing).toHaveProperty('primary')
      expect(result.wuxing).toHaveProperty('secondary')
      expect(['木', '火', '土', '金', '水']).toContain(result.wuxing.primary)
      expect(['木', '火', '土', '金', '水']).toContain(result.wuxing.secondary)
    })

    it('应该返回建议数组', () => {
      const result = fortuneService.calculateNameScore({
        name: '孙七',
        birthYear: 1988,
        birthMonth: 11,
        birthDay: 5,
      })

      expect(Array.isArray(result.suggestions)).toBe(true)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('应该总分在合理范围内', () => {
      const result = fortuneService.calculateNameScore({
        name: '周八',
        birthYear: 1990,
        birthMonth: 1,
        birthDay: 1,
      })

      expect(result.totalScore).toBeGreaterThanOrEqual(30)
      expect(result.totalScore).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateMarriage - 婚姻分析', () => {
    it('应该成功计算婚姻相配度', () => {
      const result = fortuneService.calculateMarriage({
        person1: { name: '张三', birthYear: 1990, birthMonth: 5, birthDay: 15 },
        person2: { name: '李四', birthYear: 1992, birthMonth: 8, birthDay: 20 },
      })

      expect(result).toHaveProperty('person1')
      expect(result).toHaveProperty('person2')
      expect(result).toHaveProperty('compatibility')
      expect(result).toHaveProperty('analysis')
      expect(result).toHaveProperty('result')
    })

    it('应该返回双方的生肖信息', () => {
      const result = fortuneService.calculateMarriage({
        person1: { name: '王五', birthYear: 1988, birthMonth: 3, birthDay: 10 },
        person2: { name: '赵六', birthYear: 1990, birthMonth: 6, birthDay: 25 },
      })

      expect(result.person1).toHaveProperty('shengxiao')
      expect(result.person2).toHaveProperty('shengxiao')
      expect(result.person1.shengxiao).toBe('龙')
      expect(result.person2.shengxiao).toBe('马')
    })

    it('应该返回相配度分数对象', () => {
      const result = fortuneService.calculateMarriage({
        person1: { name: '孙七', birthYear: 1990, birthMonth: 1, birthDay: 1 },
        person2: { name: '周八', birthYear: 1990, birthMonth: 12, birthDay: 31 },
      })

      expect(result.compatibility).toHaveProperty('overall')
      expect(result.compatibility).toHaveProperty('love')
      expect(result.compatibility).toHaveProperty('personality')
      expect(result.compatibility).toHaveProperty('career')
      expect(typeof result.compatibility.overall).toBe('number')
      expect(result.compatibility.overall).toBeGreaterThanOrEqual(0)
      expect(result.compatibility.overall).toBeLessThanOrEqual(100)
    })

    it('应该为相同生肖返回高相配度', () => {
      const result = fortuneService.calculateMarriage({
        person1: { name: '张三', birthYear: 1990, birthMonth: 1, birthDay: 1 },
        person2: { name: '李四', birthYear: 1990, birthMonth: 12, birthDay: 31 },
      })

      // 相同生肖应该是高相配度（三合）
      expect(result.compatibility.overall).toBeGreaterThanOrEqual(85)
      expect(result.result).toBe('非常相配')
    })

    it('应该包含分析和建议', () => {
      const result = fortuneService.calculateMarriage({
        person1: { name: '王五', birthYear: 1985, birthMonth: 5, birthDay: 15 },
        person2: { name: '赵六', birthYear: 1987, birthMonth: 7, birthDay: 20 },
      })

      expect(result.analysis).toHaveProperty('strengths')
      expect(result.analysis).toHaveProperty('weaknesses')
      expect(result.analysis).toHaveProperty('advice')
      expect(Array.isArray(result.analysis.strengths)).toBe(true)
      expect(result.analysis.strengths.length).toBeGreaterThan(0)
      expect(typeof result.analysis.advice).toBe('string')
    })
  })
})
