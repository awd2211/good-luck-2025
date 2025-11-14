import { query } from '../../config/database'

/**
 * 获取指定生肖的今日运势
 */
export const getTodayHoroscopeByZodiac = async (zodiac: string) => {
  const today = new Date().toISOString().split('T')[0]

  const result = await query(
    `SELECT
      id,
      zodiac_sign,
      date,
      overall_rating,
      love_rating,
      career_rating,
      wealth_rating,
      health_rating,
      summary,
      love_fortune,
      career_fortune,
      wealth_fortune,
      health_fortune,
      lucky_color,
      lucky_number,
      lucky_direction,
      auspicious_time
    FROM daily_horoscopes
    WHERE zodiac_sign = $1 AND date = $2 AND status = 'active'
    LIMIT 1`,
    [zodiac, today]
  )

  return result.rows[0] || null
}

/**
 * 获取所有生肖的今日运势
 */
export const getAllTodayHoroscopes = async () => {
  const today = new Date().toISOString().split('T')[0]

  const result = await query(
    `SELECT
      id,
      zodiac_sign,
      date,
      overall_rating,
      love_rating,
      career_rating,
      wealth_rating,
      health_rating,
      summary,
      love_fortune,
      career_fortune,
      wealth_fortune,
      health_fortune,
      lucky_color,
      lucky_number,
      lucky_direction,
      auspicious_time
    FROM daily_horoscopes
    WHERE date = $1 AND status = 'active'
    ORDER BY
      CASE zodiac_sign
        WHEN 'rat' THEN 1
        WHEN 'ox' THEN 2
        WHEN 'tiger' THEN 3
        WHEN 'rabbit' THEN 4
        WHEN 'dragon' THEN 5
        WHEN 'snake' THEN 6
        WHEN 'horse' THEN 7
        WHEN 'goat' THEN 8
        WHEN 'monkey' THEN 9
        WHEN 'rooster' THEN 10
        WHEN 'dog' THEN 11
        WHEN 'pig' THEN 12
        ELSE 13
      END`,
    [today]
  )

  return result.rows
}
