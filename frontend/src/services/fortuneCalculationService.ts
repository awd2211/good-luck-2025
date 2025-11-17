/**
 * 算命计算服务
 * 提供各种算命计算功能的API调用
 */

import api from './api'
import type { ApiResponse } from '../types'

// ========== 类型定义 ==========

export interface BirthInfo {
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour?: number
}

export interface PersonInfo {
  name: string
  birthYear: number
  birthMonth: number
  birthDay: number
}

export interface FortuneResult {
  success: boolean
  data: any
  message?: string
}

// ========== 生肖运势 ==========

/**
 * 生肖运势计算
 * POST /api/fortune/birth-animal
 */
export const getBirthFortune = (data: BirthInfo) => {
  return api.post<ApiResponse<{
    zodiac: string
    zodiacName: string
    fortune: string
    personality: string
    lucky: {
      color: string
      number: number
      direction: string
    }
  }>>('/fortune/birth-animal', data)
}

// ========== 八字精批 ==========

/**
 * 八字精批分析
 * POST /api/fortune/bazi
 */
export const getBaziAnalysis = (data: {
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  gender: string
}) => {
  return api.post<ApiResponse<{
    bazi: {
      year: string
      month: string
      day: string
      hour: string
    }
    wuxing: {
      metal: number
      wood: number
      water: number
      fire: number
      earth: number
    }
    analysis: {
      personality: string
      career: string
      wealth: string
      health: string
      marriage: string
    }
    suggestion: string
  }>>('/fortune/bazi', data)
}

// ========== 流年运势 ==========

/**
 * 流年运势计算
 * POST /api/fortune/flow-year
 */
export const getFlowYearFortune = (data: {
  birthYear: number
  targetYear: number
}) => {
  return api.post<ApiResponse<{
    year: number
    overall: string
    monthlyFortune: Array<{
      month: number
      fortune: string
      rating: number
    }>
    luckyMonths: number[]
    warnings: string[]
  }>>('/fortune/flow-year', data)
}

// ========== 姓名详批 ==========

/**
 * 姓名详批分析
 * POST /api/fortune/name
 */
export const getNameAnalysis = (data: {
  name: string
  birthYear: number
  birthMonth: number
  birthDay: number
}) => {
  return api.post<ApiResponse<{
    name: string
    strokes: {
      tian: number
      di: number
      ren: number
      wai: number
      zong: number
    }
    wuxing: {
      tian: string
      di: string
      ren: string
      wai: string
      zong: string
    }
    analysis: {
      personality: string
      career: string
      wealth: string
      health: string
      marriage: string
    }
    compatibility: string
    rating: number
    suggestion?: string
  }>>('/fortune/name', data)
}

// ========== 婚姻分析 ==========

/**
 * 婚姻配对分析
 * POST /api/fortune/marriage
 */
export const getMarriageAnalysis = (data: {
  person1: PersonInfo
  person2: PersonInfo
}) => {
  return api.post<ApiResponse<{
    person1: {
      name: string
      zodiac: string
    }
    person2: {
      name: string
      zodiac: string
    }
    compatibility: {
      overall: number
      emotional: number
      career: number
      financial: number
    }
    analysis: {
      strengths: string[]
      challenges: string[]
      advice: string
    }
    zodiacMatch: string
    rating: number
  }>>('/fortune/marriage', data)
}

// ========== 遗留方法（向后兼容） ==========

/**
 * @deprecated 使用 getBirthFortune 代替
 */
export const getBirthFortuneOld = async (data: BirthInfo) => {
  const response = await api.post('/fortune/birth-animal', data)
  return response.data
}

/**
 * @deprecated 使用 getBaziAnalysis 代替
 */
export const getBaziAnalysisOld = async (data: {
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  gender: string
}) => {
  const response = await api.post('/fortune/bazi', data)
  return response.data
}

/**
 * @deprecated 使用 getFlowYearFortune 代替
 */
export const getFlowYearFortuneOld = async (data: {
  birthYear: number
  targetYear: number
}) => {
  const response = await api.post('/fortune/flow-year', data)
  return response.data
}

/**
 * @deprecated 使用 getNameAnalysis 代替
 */
export const getNameAnalysisOld = async (data: {
  name: string
  birthYear: number
  birthMonth: number
  birthDay: number
}) => {
  const response = await api.post('/fortune/name', data)
  return response.data
}

/**
 * @deprecated 使用 getMarriageAnalysis 代替
 */
export const getMarriageAnalysisOld = async (data: {
  person1: PersonInfo
  person2: PersonInfo
}) => {
  const response = await api.post('/fortune/marriage', data)
  return response.data
}
