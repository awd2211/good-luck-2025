import api from './api'
import type { ApiResponse } from '../types'

// 生肖类型
export type BirthAnimalType = 'rat' | 'ox' | 'tiger' | 'rabbit' | 'dragon' | 'snake' | 'horse' | 'goat' | 'monkey' | 'rooster' | 'dog' | 'pig'

// 星座类型
export type ZodiacType = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces'

export interface DailyHoroscope {
  id: string | number
  type: 'zodiac' | 'birth_animal'
  value: string  // 星座或生肖的标识
  name: string   // 中文名称
  date: string
  content: {
    overall: string
    love: string
    career: string
    wealth: string
    health: string
  }
  scores: {
    overall: number
    love: number
    career: number
    wealth: number
    health: number
  }
  luckyNumber: string
  luckyColor: string
  luckyDirection?: string
}

// 生肖中文名称映射
export const birthAnimalNames: Record<BirthAnimalType, string> = {
  rat: '鼠',
  ox: '牛',
  tiger: '虎',
  rabbit: '兔',
  dragon: '龙',
  snake: '蛇',
  horse: '马',
  goat: '羊',
  monkey: '猴',
  rooster: '鸡',
  dog: '狗',
  pig: '猪'
}

// 星座中文名称映射
export const zodiacNames: Record<ZodiacType, string> = {
  aries: '白羊座',
  taurus: '金牛座',
  gemini: '双子座',
  cancer: '巨蟹座',
  leo: '狮子座',
  virgo: '处女座',
  libra: '天秤座',
  scorpio: '天蝎座',
  sagittarius: '射手座',
  capricorn: '摩羯座',
  aquarius: '水瓶座',
  pisces: '双鱼座'
}

// 获取今日运势（指定类型和值）
export const getTodayHoroscope = (type: 'zodiac' | 'birth_animal', value: string) => {
  return api.get<ApiResponse<DailyHoroscope>>('/daily-horoscopes/today', {
    params: { type, value }
  })
}

// 获取所有运势（指定类型）
export const getAllHoroscopes = (type: 'zodiac' | 'birth_animal') => {
  return api.get<ApiResponse<DailyHoroscope[]>>('/daily-horoscopes/all', {
    params: { type }
  })
}

// 根据出生年份计算生肖
export const getBirthAnimalByYear = (year: number): BirthAnimalType => {
  const animals: BirthAnimalType[] = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig']
  // 1900年是鼠年，从0开始计算
  const index = (year - 1900) % 12
  return animals[index < 0 ? index + 12 : index]
}

// 根据出生日期计算星座
export const getZodiacByDate = (month: number, day: number): ZodiacType => {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries'
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return 'gemini'
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return 'cancer'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo'
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo'
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return 'libra'
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return 'scorpio'
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return 'sagittarius'
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn'
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius'
  return 'pisces'
}
