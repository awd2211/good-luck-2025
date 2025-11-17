import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import * as fortuneService from '../services/fortuneService'
import * as bannerService from '../services/bannerService'
import * as notificationService from '../services/notificationService'
import type { Fortune } from '../types'
import PullToRefresh from '../components/PullToRefresh'
import { SkeletonCard } from '../components/Skeleton'
import { showToast } from '../components/ToastContainer'
import { EmptySearch } from '../components/EmptyState'
import TrustFooter from '../components/TrustFooter'
import './HomePage.css'

const HomePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category') || ''
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms防抖
  const [fortunes, setFortunes] = useState<Fortune[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Array<{
    category: string
    name: string
    count: number
  }>>([])
  const [banners, setBanners] = useState<Array<{
    id: number
    title: string
    subtitle: string
    bg_color: string
    text_color: string
    link_url?: string
  }>>([])
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [notifications, setNotifications] = useState<Array<{
    id: number
    title: string
    content: string
    type: 'info' | 'warning' | 'success' | 'error'
  }>>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      // 并行加载所有数据
      const [fortunesRes, categoriesRes, bannersRes, notificationsRes] = await Promise.all([
        fortuneService.getFortunes({
          limit: 100,
          category: categoryFilter || undefined
        }),
        fortuneService.getCategories(),
        bannerService.getActiveBanners(),
        bannerService.getPublicNotifications(),
      ])

      setFortunes(fortunesRes.data.data?.items || [])
      setCategories(categoriesRes.data.data || [])

      if (bannersRes.data.success && bannersRes.data.data) {
        setBanners(bannersRes.data.data)
      }

      if (notificationsRes.data.success && notificationsRes.data.data) {
        setNotifications(notificationsRes.data.data)
        if (notificationsRes.data.data.length > 0) {
          setShowNotifications(true)
        }
      }

      if (user) {
        loadUnreadCount()
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      showToast({ title: t('common.loadFailed'), content: t('common.retry'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [user, categoryFilter, t])

  // 初始加载（当分类筛选改变时重新加载）
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // 横幅自动轮播
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  // 下拉刷新
  const handleRefresh = async () => {
    await loadAllData()
    showToast({ title: t('messages.refreshSuccess'), content: '', type: 'success' })
  }

  const loadUnreadCount = async () => {
    if (!user) return
    try {
      const response = await notificationService.getUnreadCount()
      if (response.data.success && response.data.data) {
        setUnreadCount(response.data.data.count || 0)
      }
    } catch (error) {
      console.error('加载未读数量失败:', error)
    }
  }

  // 筛选搜索结果 (使用防抖后的搜索值)
  const filteredItems = useMemo(() => {
    // 确保fortunes是数组
    if (!Array.isArray(fortunes)) return []
    if (!debouncedSearchQuery.trim()) return fortunes
    return fortunes.filter(item =>
      item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [debouncedSearchQuery, fortunes])

  const handleItemClick = useCallback((id: string) => {
    // 免费平台：直接进入测算输入页面
    if (!user) {
      showToast({ title: t('messages.loginRequired'), content: '', type: 'warning' })
      navigate('/login')
      return
    }
    navigate(`/fortune/${id}/input`)
  }, [navigate, user, t])

  const handleQuickStart = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    if (!user) {
      showToast({ title: t('messages.loginRequired'), content: '', type: 'warning' })
      navigate('/login')
      return
    }

    // 直接进入测算页面
    navigate(`/fortune/${id}/input`)
  }, [user, navigate, t])

  return (
    <div className="home-page">
      <PullToRefresh onRefresh={handleRefresh}>
        {/* 顶部栏 */}
        <div className="top-bar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>
        {user && (
          <div className="notification-bell" onClick={() => navigate('/notifications')}>
            <span className="bell-icon">🔔</span>
            {unreadCount > 0 && (
              <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>
        )}
        {user ? (
          <div className="user-info" onClick={() => navigate('/profile')}>
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.nickname || 'User'} />
              ) : (
                <span>{(user.nickname || user.email)?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
          </div>
        ) : (
          <button className="login-btn" onClick={() => navigate('/login')}>
            {t('auth.login')}
          </button>
        )}
      </div>

      {/* 通知栏 */}
      {notifications.length > 0 && showNotifications && (
        <div className="notification-bar">
          <div className="notification-icon">
            {notifications[0].type === 'warning' ? '⚠️' :
             notifications[0].type === 'error' ? '❌' :
             notifications[0].type === 'success' ? '✅' : 'ℹ️'}
          </div>
          <div className="notification-content">
            <div className="notification-title">{notifications[0].title}</div>
            <div className="notification-text">{notifications[0].content}</div>
          </div>
          <button
            className="notification-close"
            onClick={() => setShowNotifications(false)}
          >
            ✕
          </button>
          {notifications.length > 1 && (
            <div className="notification-badge">{notifications.length}</div>
          )}
        </div>
      )}

      {/* 横幅轮播 */}
      {banners.length > 0 && (
        <div
          className="banner"
          style={{
            background: banners[currentBannerIndex].bg_color,
            color: banners[currentBannerIndex].text_color,
            cursor: banners[currentBannerIndex].link_url ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (banners[currentBannerIndex].link_url) {
              window.location.href = banners[currentBannerIndex].link_url
            }
          }}
        >
          <div className="banner-content">
            <h1 className="banner-title">{banners[currentBannerIndex].title}</h1>
            <p className="banner-subtitle">{banners[currentBannerIndex].subtitle}</p>
          </div>
          <div className="banner-decoration">🎊</div>
          {banners.length > 1 && (
            <div className="banner-indicators">
              {banners.map((_, index) => (
                <span
                  key={index}
                  className={`indicator ${index === currentBannerIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentBannerIndex(index)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 快捷功能区 */}
      {!searchQuery && (
        <div className="section">
          <h2 className="section-title">{t('quickNav.title')}</h2>
          <div className="quick-nav-grid">
            <div className="quick-nav-item" onClick={() => navigate('/daily-horoscope')}>
              <div className="quick-nav-icon">📅</div>
              <div className="quick-nav-label">{t('quickNav.dailyHoroscope')}</div>
            </div>
            <div className="quick-nav-item" onClick={() => navigate('/articles')}>
              <div className="quick-nav-icon">📰</div>
              <div className="quick-nav-label">{t('quickNav.articles')}</div>
            </div>
            <div className="quick-nav-item" onClick={() => navigate('/my-fortunes')}>
              <div className="quick-nav-icon">🔮</div>
              <div className="quick-nav-label">{t('quickNav.myFortunes')}</div>
            </div>
            <div className="quick-nav-item" onClick={() => navigate('/favorites')}>
              <div className="quick-nav-icon">⭐</div>
              <div className="quick-nav-label">{t('quickNav.favorites')}</div>
            </div>
            <div className="quick-nav-item" onClick={() => navigate('/history')}>
              <div className="quick-nav-icon">📝</div>
              <div className="quick-nav-label">{t('quickNav.history')}</div>
            </div>
            <div className="quick-nav-item" onClick={() => navigate('/coupons')}>
              <div className="quick-nav-icon">🎫</div>
              <div className="quick-nav-label">{t('quickNav.coupons')}</div>
            </div>
            <div className="quick-nav-item" onClick={() => navigate('/help')}>
              <div className="quick-nav-icon">❓</div>
              <div className="quick-nav-label">{t('quickNav.help')}</div>
            </div>
          </div>
        </div>
      )}

      {/* 分类快捷入口 */}
      {!searchQuery && categories.length > 0 && (
        <div className="section">
          <h2 className="section-title">{t('home.categories')}</h2>
          <div className="category-grid">
            {categories.map((cat) => (
              <div
                key={cat.category}
                className="category-item"
                onClick={() => setSearchQuery(cat.name)}
              >
                <div className="category-icon">
                  {cat.category === 'fortune' ? '🔮' :
                   cat.category === 'name' ? '📝' :
                   cat.category === 'marriage' ? '💕' :
                   '⭐'}
                </div>
                <div className="category-label">{cat.name}</div>
                <div className="category-count">{cat.count}{t('common.item')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 搜索结果或所有服务 */}
      <div className="section">
        <h2 className="section-title">
          {searchQuery ? `${t('home.searchResults')} (${filteredItems.length})` : t('home.hotServices')}
        </h2>

        {loading ? (
          <div className="service-list">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="service-list">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="service-card"
                onClick={() => handleItemClick(item.id)}
              >
                <div className="service-icon" style={{ backgroundColor: item.bg_color || '#F9E6D5' }}>
                  {item.icon || '🔮'}
                </div>
                <div className="service-info">
                  <h3 className="service-title">{item.title}</h3>
                  <p className="service-subtitle">{item.subtitle || item.description}</p>
                  <div className="service-footer">
                    <div className="free-tag">
                      <span className="tag-icon">✨</span>
                      <span className="tag-text">{t('home.freeCalculate')}</span>
                    </div>
                    <button
                      className="quick-start-btn"
                      onClick={(e) => handleQuickStart(e, item.id)}
                    >
                      {t('home.calculateNow')}
                    </button>
                  </div>
                  {item.sales_count !== undefined && (
                    <div className="service-meta">
                      <span>{t('service.sold')} {item.sales_count}</span>
                      {item.rating && <span className="rating">⭐ {item.rating}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptySearch onReset={() => setSearchQuery('')} />
        )}
      </div>

        {/* 信任保障区域 */}
        <TrustFooter />
      </PullToRefresh>
    </div>
  )
}

export default HomePage
