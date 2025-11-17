import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as dailyHoroscopeService from '../services/dailyHoroscopeService'
import type { DailyHoroscope, BirthAnimalType, ZodiacType } from '../services/dailyHoroscopeService'
import Skeleton from '../components/Skeleton'
import './DailyHoroscopePage.css'

const DailyHoroscopePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [horoscopeType, setHoroscopeType] = useState<'zodiac' | 'birth_animal'>('birth_animal')
  const [horoscopes, setHoroscopes] = useState<DailyHoroscope[]>([])
  const [selectedItem, setSelectedItem] = useState<DailyHoroscope | null>(null)
  const [loading, setLoading] = useState(true)

  // 安全渲染函数：处理字符串、数组、对象
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    if (typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return value.join('、')
    if (typeof value === 'object') {
      // 如果是{primary, secondary}格式，优先显示primary
      if (value.primary) return String(value.primary)
      // 否则JSON化
      return JSON.stringify(value)
    }
    return String(value)
  }

  useEffect(() => {
    loadAllHoroscopes()
  }, [horoscopeType])

  const loadAllHoroscopes = async () => {
    try {
      setLoading(true)
      const response = await dailyHoroscopeService.getAllHoroscopes(horoscopeType)
      if (response.data.success && response.data.data) {
        setHoroscopes(response.data.data)
      }
    } catch (error) {
      console.error('加载每日运势失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRatingStars = (score: number) => {
    return '★'.repeat(score) + '☆'.repeat(5 - score)
  }

  const getRatingColor = (score: number) => {
    if (score >= 4) return '#ff6b6b'
    if (score >= 3) return '#ffa500'
    return '#999'
  }

  // 生肖Emoji
  const birthAnimalEmojis: Record<BirthAnimalType, string> = {
    rat: '🐭',
    ox: '🐮',
    tiger: '🐯',
    rabbit: '🐰',
    dragon: '🐲',
    snake: '🐍',
    horse: '🐴',
    goat: '🐐',
    monkey: '🐵',
    rooster: '🐔',
    dog: '🐕',
    pig: '🐷'
  }

  // 星座Emoji
  const zodiacEmojis: Record<ZodiacType, string> = {
    aries: '♈',
    taurus: '♉',
    gemini: '♊',
    cancer: '♋',
    leo: '♌',
    virgo: '♍',
    libra: '♎',
    scorpio: '♏',
    sagittarius: '♐',
    capricorn: '♑',
    aquarius: '♒',
    pisces: '♓'
  }

  const getEmoji = (item: DailyHoroscope) => {
    if (item.type === 'birth_animal') {
      return birthAnimalEmojis[item.value as BirthAnimalType] || '🔮'
    } else {
      return zodiacEmojis[item.value as ZodiacType] || '⭐'
    }
  }

  return (
    <div className="daily-horoscope-page">
      <div className="horoscope-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← {t('dailyHoroscope.back')}
        </button>
        <h1>{t('dailyHoroscope.title')}</h1>
        <div></div>
      </div>

      {/* 类型切换 */}
      <div className="type-tabs">
        <button
          className={`type-tab ${horoscopeType === 'birth_animal' ? 'active' : ''}`}
          onClick={() => setHoroscopeType('birth_animal')}
        >
          🐉 {t('dailyHoroscope.birthAnimal')}
        </button>
        <button
          className={`type-tab ${horoscopeType === 'zodiac' ? 'active' : ''}`}
          onClick={() => setHoroscopeType('zodiac')}
        >
          ⭐ {t('dailyHoroscope.zodiac')}
        </button>
      </div>

      {loading ? (
        <div className="horoscope-grid">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="horoscope-card">
              <Skeleton variant="circular" width={60} height={60} />
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width="60%" height={14} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* 运势选择网格 */}
          <div className="horoscope-grid">
            {horoscopes.map((item) => (
              <div
                key={item.id}
                className={`horoscope-card ${selectedItem?.id === item.id ? 'active' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="horoscope-emoji">{getEmoji(item)}</div>
                <div className="horoscope-name">{item.name}</div>
                <div
                  className="horoscope-rating"
                  style={{ color: getRatingColor(item.scores.overall) }}
                >
                  {getRatingStars(item.scores.overall)}
                </div>
              </div>
            ))}
          </div>

          {/* 详细运势 */}
          {selectedItem && (
            <div className="horoscope-detail">
              <div className="detail-header">
                <h2>
                  {getEmoji(selectedItem)} {selectedItem.name}
                </h2>
                <div className="detail-meta">
                  <span className="detail-date">
                    {new Date(selectedItem.date).toLocaleDateString('zh-CN')}
                  </span>
                  <span
                    className="detail-rating"
                    style={{ color: getRatingColor(selectedItem.scores.overall) }}
                  >
                    {getRatingStars(selectedItem.scores.overall)}
                  </span>
                </div>
              </div>

              <div className="lucky-info">
                <div className="lucky-item">
                  <span className="lucky-label">{t('dailyHoroscope.luckyNumber')}</span>
                  <span className="lucky-value number">{selectedItem.luckyNumber}</span>
                </div>
                <div className="lucky-item">
                  <span className="lucky-label">{t('dailyHoroscope.luckyColor')}</span>
                  <span className="lucky-value color">
                    {selectedItem.luckyColor}
                  </span>
                </div>
                {selectedItem.luckyDirection && (
                  <div className="lucky-item">
                    <span className="lucky-label">{t('dailyHoroscope.luckyDirection')}</span>
                    <span className="lucky-value">{selectedItem.luckyDirection}</span>
                  </div>
                )}
              </div>

              <div className="fortune-sections">
                <div className="fortune-section">
                  <h3>✨ {t('dailyHoroscope.overall')}</h3>
                  <div className="fortune-score">
                    <span style={{ color: getRatingColor(selectedItem.scores.overall) }}>
                      {getRatingStars(selectedItem.scores.overall)}
                    </span>
                  </div>
                  <p>{safeRender(selectedItem.content.overall)}</p>
                </div>
                <div className="fortune-section">
                  <h3>💕 {t('dailyHoroscope.love')}</h3>
                  <div className="fortune-score">
                    <span style={{ color: getRatingColor(selectedItem.scores.love) }}>
                      {getRatingStars(selectedItem.scores.love)}
                    </span>
                  </div>
                  <p>{safeRender(selectedItem.content.love)}</p>
                </div>
                <div className="fortune-section">
                  <h3>💼 {t('dailyHoroscope.career')}</h3>
                  <div className="fortune-score">
                    <span style={{ color: getRatingColor(selectedItem.scores.career) }}>
                      {getRatingStars(selectedItem.scores.career)}
                    </span>
                  </div>
                  <p>{safeRender(selectedItem.content.career)}</p>
                </div>
                <div className="fortune-section">
                  <h3>💰 {t('dailyHoroscope.wealth')}</h3>
                  <div className="fortune-score">
                    <span style={{ color: getRatingColor(selectedItem.scores.wealth) }}>
                      {getRatingStars(selectedItem.scores.wealth)}
                    </span>
                  </div>
                  <p>{safeRender(selectedItem.content.wealth)}</p>
                </div>
                <div className="fortune-section">
                  <h3>🏥 {t('dailyHoroscope.health')}</h3>
                  <div className="fortune-score">
                    <span style={{ color: getRatingColor(selectedItem.scores.health) }}>
                      {getRatingStars(selectedItem.scores.health)}
                    </span>
                  </div>
                  <p>{safeRender(selectedItem.content.health)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DailyHoroscopePage
