import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../contexts/CartContext'
import * as favoriteService from '../services/favoriteService'
import * as reviewService from '../services/reviewService'
import * as fortuneService from '../services/fortuneService'
import type { Fortune } from '../types'
import { showToast } from '../components/ToastContainer'
import TrustFooter from '../components/TrustFooter'
import './FortuneDetail.css'

// Fortune service mock data (fallback only)
const fortuneDataFallback: any = {
  'birth-animal': {
    title: '生肖运势',
    subtitle: '了解你的生肖运程',
    icon: '🐍',
    bgColor: '#F9E6D5',
    price: 9.9,
    description: '根据您的生肖属相,为您详细解读本年度的运势走向,包括事业、财运、健康、感情等各方面的运程分析,助您趋吉避凶,把握机遇。',
    features: ['专业大师一对一解读', '详细的运势分析报告', '全年12个月运势详解', '幸运色和幸运数字指引'],
    salesCount: 12580,
    rating: 4.9
  },
  'bazi': {
    title: '八字精批',
    subtitle: '详解你的命理',
    icon: '🎋',
    bgColor: '#F5D6A8',
    price: 29.9,
    description: '通过您的生辰八字,分析命理五行,详批一生命运走势。包含性格特点、事业财运、婚姻感情、健康状况等全方位解读。',
    features: ['八字排盘分析', '五行强弱详解', '十神关系解读', '大运流年预测'],
    salesCount: 8960,
    rating: 4.8
  },
  'flow-year': {
    title: '流年运势',
    subtitle: '查看年度运势',
    icon: '🎊',
    bgColor: '#E8968F',
    price: 19.9,
    description: '精准分析您在指定年份的整体运势,包括事业发展、财富机遇、感情婚姻、健康平安等方面,为您的人生规划提供参考。',
    features: ['全年运势总览', '每月运势详批', '重要事项提醒', '开运建议指导'],
    salesCount: 6540,
    rating: 4.7
  },
  'name-detail': {
    title: '生辰详批',
    subtitle: '深度解析生辰八字',
    icon: '☯️',
    bgColor: '#5A8FA9',
    price: 39.9,
    description: '结合生辰八字与五行命理,深度剖析您的命运特质。包括先天命格、后天运势、性格分析、事业方向等专业解读。',
    features: ['命盘详细排列', '命格层次分析', '用神喜忌指点', '改运建议方案'],
    salesCount: 5230,
    rating: 4.9
  },
  'marriage': {
    title: '八字合婚',
    subtitle: '测算婚姻匹配度',
    icon: '💑',
    bgColor: '#D96C75',
    price: 49.9,
    description: '通过双方八字合婚分析,测算婚姻匹配程度。包括性格契合度、运势相生相克、婚后生活预测等,为您的婚姻保驾护航。',
    features: ['双方八字合盘', '婚姻匹配指数', '相处建议指导', '婚后运势预测'],
    salesCount: 9870,
    rating: 4.8
  },
  'marriage-analysis': {
    title: '姻缘分析',
    subtitle: '寻找你的缘分',
    icon: '💝',
    bgColor: '#E87A8D',
    price: 29.9,
    description: '分析您的姻缘运势,预测正缘出现时间,解读感情发展趋势,帮助您找到属于自己的幸福。',
    features: ['姻缘出现时间', '正缘特征分析', '感情运势走向', '脱单建议指导'],
    salesCount: 7650,
    rating: 4.6
  },
  'name-match': {
    title: '姓名配对',
    subtitle: '姓名缘分测试',
    icon: '🎴',
    bgColor: '#E87A8D',
    price: 9.9,
    description: '通过姓名学原理,分析两人姓名的契合度,测算缘分指数,为感情发展提供参考。',
    features: ['姓名五格分析', '缘分指数测算', '配对建议指导', '感情发展预测'],
    salesCount: 5430,
    rating: 4.5
  },
  'wealth': {
    title: '财运分析',
    subtitle: '把握财富机会',
    icon: '💰',
    bgColor: '#D4A574',
    price: 39.9,
    description: '全面分析您的财运走势,指点财富方位和时机,助您把握机遇,积累财富。',
    features: ['财运总体分析', '投资理财建议', '财富方位指点', '旺财时机预测'],
    salesCount: 8920,
    rating: 4.7
  },
  'number-divination': {
    title: '号码吉凶',
    subtitle: '测试号码运势',
    icon: '🔢',
    bgColor: '#7B2B2B',
    price: 19.9,
    description: '通过数字能量学,分析手机号、车牌号等号码的吉凶,为您选择最适合的号码。',
    features: ['号码能量分析', '吉凶程度测算', '号码改运建议', '数字开运指导'],
    salesCount: 4320,
    rating: 4.6
  },
  'purple-star': {
    title: '紫微斗数',
    subtitle: '紫微命盘详批',
    icon: '⭐',
    bgColor: '#5E3A8E',
    price: 59.9,
    description: '紫微斗数是中国传统命理学的重要分支,通过排盘分析,详解一生运势格局和各阶段发展趋势。',
    features: ['紫微命盘排列', '十二宫位详解', '主星特质分析', '大限流年预测'],
    salesCount: 6780,
    rating: 4.9
  },
  'name-detail-2': {
    title: '姓名详批',
    subtitle: '解析姓名奥秘',
    icon: '✍️',
    bgColor: '#C67A5F',
    price: 29.9,
    description: '运用姓名学原理,分析姓名的五格数理,解读姓名对运势的影响,为改名提供参考。',
    features: ['五格数理分析', '姓名吉凶测算', '性格影响解读', '改名建议指导'],
    salesCount: 5670,
    rating: 4.7
  },
  'baby-name': {
    title: '宝宝取名',
    subtitle: '为宝宝起个好名',
    icon: '👶',
    bgColor: '#F4A460',
    price: 99.9,
    description: '结合生辰八字和五行命理,为宝宝量身定制吉祥美名,确保名字既好听又有利于宝宝一生运势。',
    features: ['八字五行分析', '多个吉名推荐', '名字含义详解', '终身免费咨询'],
    salesCount: 11230,
    rating: 5.0
  },
}

const FortuneDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()

  const [fortune, setFortune] = useState<Fortune | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'detail' | 'reviews'>('detail')

  useEffect(() => {
    if (id) {
      fetchFortuneDetail()
      fetchReviews()
    }
  }, [id])

  useEffect(() => {
    if (id && user) {
      checkFavoriteStatus()
      addToBrowseHistory()
    }
  }, [id, user])

  const fetchFortuneDetail = async () => {
    try {
      setLoading(true)
      const response = await fortuneService.getFortune(id!)
      setFortune(response.data.data || null)
    } catch (error) {
      console.error('获取服务详情失败:', error)
      // Fallback to mock data if API fails
      const fallback = fortuneDataFallback[id!]
      if (fallback) {
        setFortune({
          id: id!,
          title: fallback.title,
          subtitle: fallback.subtitle,
          description: fallback.description,
          price: fallback.price.toString(),
          icon: fallback.icon,
          bg_color: fallback.bgColor,
          category: 'unknown',
          sales_count: fallback.salesCount,
          rating: fallback.rating.toString()
        } as Fortune)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await reviewService.getReviews(id!)
      // 后端返回 { items, stats, pagination }
      const reviewData = response.data.data
      setReviews(reviewData?.items || [])
    } catch (error) {
      console.error('获取评价失败:', error)
      setReviews([])
    }
  }

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoriteService.checkFavorite(id!)
      setIsFavorite(response.data.data?.is_favorite || false)
    } catch (error) {
      console.error('检查收藏状态失败:', error)
    }
  }

  const addToBrowseHistory = async () => {
    try {
      await favoriteService.addBrowseHistory(id!)
    } catch (error) {
      console.error('添加浏览历史失败:', error)
    }
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(id!)
        setIsFavorite(false)
      } else {
        await favoriteService.addFavorite(id!)
        setIsFavorite(true)
      }
    } catch (error) {
      showToast({ title: t('common.error'), content: t('fortuneDetail.operationFailed'), type: 'error' })
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!fortune) return

    try {
      await addItem({
        id: id!,
        title: fortune.title,
        description: fortune.subtitle || fortune.description,
        price: fortune.price,
        icon: fortune.icon,
        category: 'fortune',
      } as any)
      showToast({ title: t('common.success'), content: t('fortuneDetail.addedToCart'), type: 'success' })
    } catch (error) {
      showToast({ title: t('common.error'), content: t('fortuneDetail.addFailed'), type: 'error' })
    }
  }

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!fortune) return

    try {
      await addItem({
        id: id!,
        title: fortune.title,
        description: fortune.subtitle || fortune.description,
        price: fortune.price,
        icon: fortune.icon,
        category: 'fortune',
      } as any)
      navigate('/cart')
    } catch (error) {
      showToast({ title: t('common.error'), content: t('fortuneDetail.operationFailed'), type: 'error' })
    }
  }

  const handleQuickCalculate = () => {
    if (!user) {
      navigate('/login')
      return
    }
    // 直接跳转到参数输入页面（免费测算）
    navigate(`/fortune/${id}/input`)
  }

  const renderStars = (rating: number | string) => {
    const ratingNum = typeof rating === 'string' ? parseFloat(rating) : rating
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(ratingNum) ? 'star filled' : 'star'}>
        ★
      </span>
    ))
  }

  if (loading) {
    return (
      <div className="fortune-detail-page">
        <div className="error-container">
          <div className="error-icon">⏳</div>
          <p>{t('fortuneDetail.loading')}</p>
        </div>
      </div>
    )
  }

  if (!fortune) {
    return (
      <div className="fortune-detail-page">
        <div className="error-container">
          <div className="error-icon">😕</div>
          <p>{t('fortuneDetail.notFound')}</p>
          <button onClick={() => navigate('/')} className="back-home-btn">
            {t('fortuneDetail.backHome')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fortune-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ‹
        </button>
        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={handleToggleFavorite}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Hero Section */}
      <div className="fortune-hero" style={{ background: fortune.bg_color || '#F9E6D5' }}>
        <div className="fortune-icon-large">{fortune.icon}</div>
        <h1 className="fortune-title">{fortune.title}</h1>
        <p className="fortune-subtitle">{fortune.subtitle}</p>
      </div>

      {/* Price Bar */}
      <div className="price-bar">
        <div className="price-info">
          <span className="price-label">{t('fortuneDetail.price')}</span>
          <span className="price-value">¥{fortune.price}</span>
        </div>
        <div className="sales-info">
          <span className="sales-count">{t('fortuneDetail.sold')} {fortune.sales_count || 0}</span>
          <span className="rating">
            ⭐ {fortune.rating || '0.0'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`tab-btn ${activeTab === 'detail' ? 'active' : ''}`}
          onClick={() => setActiveTab('detail')}
        >
          {t('fortuneDetail.serviceDetails')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          {t('fortuneDetail.userReviews')} ({reviews.length})
        </button>
      </div>

      {/* Content */}
      <div className="detail-content">
        {activeTab === 'detail' ? (
          <div className="detail-tab">
            <section className="detail-section">
              <h3 className="section-title">{t('fortuneDetail.serviceIntro')}</h3>
              <p className="section-text">{fortune.description}</p>
            </section>

            <section className="detail-section">
              <h3 className="section-title">{t('fortuneDetail.serviceContent')}</h3>
              <ul className="feature-list">
                {(fortune as any).features ? (fortune as any).features.map((feature: string, index: number) => (
                  <li key={index}>✨ {feature}</li>
                )) : (
                  <>
                    <li>✨ {t('fortuneDetail.feature1')}</li>
                    <li>✨ {t('fortuneDetail.feature2')}</li>
                    <li>✨ {t('fortuneDetail.feature3')}</li>
                    <li>✨ {t('fortuneDetail.feature4')}</li>
                  </>
                )}
              </ul>
            </section>

            <section className="detail-section">
              <h3 className="section-title">{t('fortuneDetail.serviceProcess')}</h3>
              <div className="process-steps">
                <div className="step">
                  <div className="step-icon">1</div>
                  <div className="step-content">
                    <h4>{t('fortuneDetail.step1Title')}</h4>
                    <p>{t('fortuneDetail.step1Desc')}</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-icon">2</div>
                  <div className="step-content">
                    <h4>{t('fortuneDetail.step2Title')}</h4>
                    <p>{t('fortuneDetail.step2Desc')}</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-icon">3</div>
                  <div className="step-content">
                    <h4>{t('fortuneDetail.step3Title')}</h4>
                    <p>{t('fortuneDetail.step3Desc')}</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-icon">4</div>
                  <div className="step-content">
                    <h4>{t('fortuneDetail.step4Title')}</h4>
                    <p>{t('fortuneDetail.step4Desc')}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="detail-section">
              <h3 className="section-title">{t('fortuneDetail.tips')}</h3>
              <div className="tips-box">
                <p>{t('fortuneDetail.tip1')}</p>
                <p>{t('fortuneDetail.tip2')}</p>
                <p>{t('fortuneDetail.tip3')}</p>
              </div>
            </section>
          </div>
        ) : (
          <div className="reviews-tab">
            {reviews.length > 0 ? (
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="user-info">
                        <img
                          src={review.user?.avatar || '/default-avatar.png'}
                          alt="avatar"
                          className="user-avatar"
                        />
                        <div>
                          <div className="user-name">{review.user?.nickname || t('fortuneDetail.anonymousUser')}</div>
                          <div className="review-date">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="review-rating">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="review-content">{review.content}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="review-images">
                        {review.images.map((img: string, idx: number) => (
                          <img key={idx} src={img} alt="review" className="review-image" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-reviews">
                <div className="empty-icon">💬</div>
                <p>{t('fortuneDetail.noReviews')}</p>
                <p className="empty-hint">{t('fortuneDetail.beFirstReview')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 信任保障区域 */}
      <TrustFooter />

      {/* Bottom Action Bar */}
      <div className="action-bar">
        <button className="quick-calc-btn" onClick={handleQuickCalculate}>
          <span className="btn-icon">✨</span>
          <span className="btn-text">{t('fortuneDetail.freeReading')}</span>
        </button>
        <button className="add-cart-btn" onClick={handleAddToCart}>
          {t('fortuneDetail.addToCart')}
        </button>
        <button className="buy-now-btn" onClick={handleBuyNow}>
          {t('fortuneDetail.buyNow')}
        </button>
      </div>
    </div>
  )
}

export default FortuneDetail
