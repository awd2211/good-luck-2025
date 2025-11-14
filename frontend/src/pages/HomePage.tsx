import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../contexts/CartContext'
import * as fortuneService from '../services/fortuneService'
import type { Fortune } from '../types'
import './HomePage.css'

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [searchQuery, setSearchQuery] = useState('')
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

  // 加载算命服务列表
  useEffect(() => {
    loadFortunes()
    loadCategories()
    loadBanners()
    loadNotifications()
    if (user) {
      loadUnreadCount()
    }
  }, [user])

  // 横幅自动轮播
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  const loadFortunes = async () => {
    try {
      setLoading(true)
      const response = await fortuneService.getFortunes({ limit: 100 })
      setFortunes(response.data.data || [])
    } catch (error) {
      console.error('加载服务列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fortuneService.getCategories()
      setCategories(response.data.data || [])
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  const loadBanners = async () => {
    try {
      const response = await fetch('/api/public/banners')
      const data = await response.json()
      if (data.success && data.data) {
        setBanners(data.data)
      }
    } catch (error) {
      console.error('加载横幅失败:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/public/notifications')
      const data = await response.json()
      if (data.success && data.data) {
        setNotifications(data.data)
        // 如果有通知，自动显示
        if (data.data.length > 0) {
          setShowNotifications(true)
        }
      }
    } catch (error) {
      console.error('加载通知失败:', error)
    }
  }

  const loadUnreadCount = async () => {
    if (!user) return
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setUnreadCount(data.data.count || 0)
      }
    } catch (error) {
      console.error('加载未读数量失败:', error)
    }
  }

  // 筛选搜索结果
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return fortunes
    return fortunes.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, fortunes])

  const handleItemClick = useCallback((id: string) => {
    navigate(`/fortune/${id}`)
  }, [navigate])

  const handleAddToCart = useCallback((e: React.MouseEvent, item: Fortune) => {
    e.stopPropagation()

    if (!user) {
      navigate('/login')
      return
    }

    addItem(item)

    // 简单的成功提示
    const btn = e.currentTarget as HTMLElement
    const originalText = btn.textContent
    btn.textContent = '✓ 已添加'
    btn.style.background = '#4caf50'
    setTimeout(() => {
      btn.textContent = originalText
      btn.style.background = ''
    }, 1500)
  }, [user, navigate, addItem])

  return (
    <div className="home-page">
      {/* 顶部栏 */}
      <div className="top-bar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索算命服务..."
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
                <span>{(user.nickname || user.phone)?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
          </div>
        ) : (
          <button className="login-btn" onClick={() => navigate('/login')}>
            登录
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

      {/* 分类快捷入口 */}
      {!searchQuery && categories.length > 0 && (
        <div className="section">
          <h2 className="section-title">服务分类</h2>
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
                <div className="category-count">{cat.count}项</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 搜索结果或所有服务 */}
      <div className="section">
        <h2 className="section-title">
          {searchQuery ? `搜索结果 (${filteredItems.length})` : '热门服务'}
        </h2>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">加载中...</div>
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
                    <div>
                      <span className="service-price">¥{item.price}</span>
                      {item.original_price && item.original_price > item.price && (
                        <span className="original-price">¥{item.original_price}</span>
                      )}
                    </div>
                    <button
                      className="add-cart-btn"
                      onClick={(e) => handleAddToCart(e, item)}
                    >
                      加入购物车
                    </button>
                  </div>
                  {item.sales_count !== undefined && (
                    <div className="service-meta">
                      <span>已售 {item.sales_count}</span>
                      {item.rating && <span className="rating">⭐ {item.rating}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-result">
            <div className="empty-icon">🔍</div>
            <p>没有找到相关服务</p>
            <button onClick={() => setSearchQuery('')} className="reset-btn">
              重置搜索
            </button>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="footer">
        <p>—— 已经到底啦 ——</p>
      </div>
    </div>
  )
}

export default HomePage
