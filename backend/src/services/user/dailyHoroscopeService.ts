import { query } from '../../config/database'

// 中文到英文的映射（生肖）
const birthAnimalChineseToEnglish: Record<string, string> = {
  '鼠': 'rat',
  '牛': 'ox',
  '虎': 'tiger',
  '兔': 'rabbit',
  '龙': 'dragon',
  '蛇': 'snake',
  '马': 'horse',
  '羊': 'goat',
  '猴': 'monkey',
  '鸡': 'rooster',
  '狗': 'dog',
  '猪': 'pig'
}

// 中文到英文的映射（星座）
const zodiacChineseToEnglish: Record<string, string> = {
  '白羊座': 'aries',
  '金牛座': 'taurus',
  '双子座': 'gemini',
  '巨蟹座': 'cancer',
  '狮子座': 'leo',
  '处女座': 'virgo',
  '天秤座': 'libra',
  '天蝎座': 'scorpio',
  '射手座': 'sagittarius',
  '摩羯座': 'capricorn',
  '水瓶座': 'aquarius',
  '双鱼座': 'pisces'
}

// 英文到中文的映射（生肖）
const birthAnimalEnglishToChinese: Record<string, string> = {
  'rat': '鼠',
  'ox': '牛',
  'tiger': '虎',
  'rabbit': '兔',
  'dragon': '龙',
  'snake': '蛇',
  'horse': '马',
  'goat': '羊',
  'monkey': '猴',
  'rooster': '鸡',
  'dog': '狗',
  'pig': '猪'
}

// 英文到中文的映射（星座）
const zodiacEnglishToChinese: Record<string, string> = {
  'aries': '白羊座',
  'taurus': '金牛座',
  'gemini': '双子座',
  'cancer': '巨蟹座',
  'leo': '狮子座',
  'virgo': '处女座',
  'libra': '天秤座',
  'scorpio': '天蝎座',
  'sagittarius': '射手座',
  'capricorn': '摩羯座',
  'aquarius': '水瓶座',
  'pisces': '双鱼座'
}

// 转换数据库记录为前端格式
const transformHoroscope = (row: any) => {
  if (!row) return null

  const type = row.type
  let value = row.type_value
  let name = row.type_value

  // 将中文转换为英文标识
  if (type === 'birth_animal') {
    value = birthAnimalChineseToEnglish[row.type_value] || row.type_value
  } else if (type === 'zodiac') {
    value = zodiacChineseToEnglish[row.type_value] || row.type_value
  }

  return {
    id: row.id,
    type: row.type,
    value,
    name,
    date: row.date,
    content: {
      overall: row.overall_content || '',
      love: row.love_content || '',
      career: row.career_content || '',
      wealth: row.wealth_content || '',
      health: row.health_content || ''
    },
    scores: {
      overall: row.overall_score || 3,
      love: row.love_score || 3,
      career: row.career_score || 3,
      wealth: row.wealth_score || 3,
      health: row.health_score || 3
    },
    luckyNumber: row.lucky_number || '',
    luckyColor: row.lucky_color || '',
    luckyDirection: row.lucky_direction
  }
}

/**
 * 获取指定类型和值的今日运势
 */
export const getTodayHoroscope = async (type: string, value: string) => {
  const today = new Date().toISOString().split('T')[0]

  // 将英文值转换为中文（用于数据库查询）
  let chineseValue = value
  if (type === 'birth_animal') {
    chineseValue = birthAnimalEnglishToChinese[value] || value
  } else if (type === 'zodiac') {
    chineseValue = zodiacEnglishToChinese[value] || value
  }

  const result = await query(
    `SELECT
      id,
      type,
      type_value,
      date,
      overall_score,
      love_score,
      career_score,
      wealth_score,
      health_score,
      overall_content,
      love_content,
      career_content,
      wealth_content,
      health_content,
      lucky_color,
      lucky_number,
      lucky_direction
    FROM daily_horoscopes
    WHERE type = $1 AND type_value = $2 AND date = $3 AND status = 'published'
    LIMIT 1`,
    [type, chineseValue, today]
  )

  return transformHoroscope(result.rows[0])
}

/**
 * 获取指定类型的所有今日运势
 */
export const getAllTodayHoroscopes = async (type: string) => {
  const today = new Date().toISOString().split('T')[0]

  let orderClause = ''
  if (type === 'birth_animal') {
    orderClause = `ORDER BY
      CASE type_value
        WHEN '鼠' THEN 1
        WHEN '牛' THEN 2
        WHEN '虎' THEN 3
        WHEN '兔' THEN 4
        WHEN '龙' THEN 5
        WHEN '蛇' THEN 6
        WHEN '马' THEN 7
        WHEN '羊' THEN 8
        WHEN '猴' THEN 9
        WHEN '鸡' THEN 10
        WHEN '狗' THEN 11
        WHEN '猪' THEN 12
        ELSE 13
      END`
  } else if (type === 'zodiac') {
    orderClause = `ORDER BY
      CASE type_value
        WHEN '白羊座' THEN 1
        WHEN '金牛座' THEN 2
        WHEN '双子座' THEN 3
        WHEN '巨蟹座' THEN 4
        WHEN '狮子座' THEN 5
        WHEN '处女座' THEN 6
        WHEN '天秤座' THEN 7
        WHEN '天蝎座' THEN 8
        WHEN '射手座' THEN 9
        WHEN '摩羯座' THEN 10
        WHEN '水瓶座' THEN 11
        WHEN '双鱼座' THEN 12
        ELSE 13
      END`
  }

  const result = await query(
    `SELECT
      id,
      type,
      type_value,
      date,
      overall_score,
      love_score,
      career_score,
      wealth_score,
      health_score,
      overall_content,
      love_content,
      career_content,
      wealth_content,
      health_content,
      lucky_color,
      lucky_number,
      lucky_direction
    FROM daily_horoscopes
    WHERE type = $1 AND date = $2 AND status = 'published'
    ${orderClause}`,
    [type, today]
  )

  return result.rows.map(transformHoroscope).filter(Boolean)
}
