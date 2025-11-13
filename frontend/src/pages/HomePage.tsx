import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import './HomePage.css'

interface FortuneItem {
  id: string
  title: string
  subtitle: string
  icon: string
  bgColor: string
  price: number
}

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [searchQuery, setSearchQuery] = useState('')

  const fortuneItems: FortuneItem[] = [
    { id: 'birth-animal', title: '生肖运势', subtitle: '了解你的生肖运程', icon: '🐍', bgColor: '#F9E6D5', price: 9.9 },
    { id: 'bazi', title: '八字精批', subtitle: '详解你的命理', icon: '🎋', bgColor: '#F5D6A8', price: 29.9 },
    { id: 'flow-year', title: '流年运势', subtitle: '查看年度运势', icon: '🎊', bgColor: '#E8968F', price: 19.9 },
    { id: 'name-detail', title: '生辰详批', subtitle: '深度解析生辰八字', icon: '☯️', bgColor: '#5A8FA9', price: 39.9 },
    { id: 'marriage', title: '八字合婚', subtitle: '测算婚姻匹配度', icon: '💑', bgColor: '#D96C75', price: 49.9 },
    { id: 'marriage-analysis', title: '姻缘分析', subtitle: '寻找你的缘分', icon: '💝', bgColor: '#E87A8D', price: 29.9 },
    { id: 'name-match', title: '姓名配对', subtitle: '姓名缘分测试', icon: '🎴', bgColor: '#E87A8D', price: 9.9 },
    { id: 'wealth', title: '财运分析', subtitle: '把握财富机会', icon: '💰', bgColor: '#D4A574', price: 39.9 },
    { id: 'number-divination', title: '号码吉凶', subtitle: '测试号码运势', icon: '🔢', bgColor: '#7B2B2B', price: 19.9 },
    { id: 'purple-star', title: '紫微斗数', subtitle: '紫微命盘详批', icon: '⭐', bgColor: '#5E3A8E', price: 59.9 },
    { id: 'name-detail-2', title: '姓名详批', subtitle: '解析姓名奥秘', icon: '✍️', bgColor: '#C67A5F', price: 29.9 },
    { id: 'baby-name', title: '宝宝取名', subtitle: '为宝宝起个好名', icon: '👶', bgColor: '#F4A460', price: 99.9 },
  ]

  // 筛选搜索结果
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return fortuneItems
    return fortuneItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const handleItemClick = useCallback((id: string) => {
    navigate(`/fortune/${id}`)
  }, [navigate])

  const handleAddToCart = useCallback((e: React.MouseEvent, item: FortuneItem) => {
    e.stopPropagation()

    if (!user) {
      navigate('/login')
      return
    }

    addItem({
      id: item.id,
      title: item.title,
      description: item.subtitle,
      price: item.price,
      icon: item.icon,
      category: 'fortune',
    } as any)

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

      {/* 横幅 */}
      <div className="banner">
        <div className="banner-content">
          <h1 className="banner-title">掌握财富运势</h1>
          <p className="banner-subtitle">抓住机会做个有钱人</p>
        </div>
        <div className="banner-decoration">🎊</div>
      </div>

      {/* 搜索结果或所有服务 */}
      <div className="section">
        <h2 className="section-title">
          {searchQuery ? `搜索结果 (${filteredItems.length})` : '热门服务'}
        </h2>

        {filteredItems.length > 0 ? (
          <div className="service-list">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="service-card"
                onClick={() => handleItemClick(item.id)}
              >
                <div className="service-icon" style={{ backgroundColor: item.bgColor }}>
                  {item.icon}
                </div>
                <div className="service-info">
                  <h3 className="service-title">{item.title}</h3>
                  <p className="service-subtitle">{item.subtitle}</p>
                  <div className="service-footer">
                    <span className="service-price">¥{item.price}</span>
                    <button
                      className="add-cart-btn"
                      onClick={(e) => handleAddToCart(e, item)}
                    >
                      加入购物车
                    </button>
                  </div>
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

      {/* 分类快捷入口 */}
      {!searchQuery && (
        <div className="section">
          <h2 className="section-title">服务分类</h2>
          <div className="category-grid">
            <div className="category-item" onClick={() => setSearchQuery('运势')}>
              <div className="category-icon">🔮</div>
              <div className="category-label">运势测算</div>
            </div>
            <div className="category-item" onClick={() => setSearchQuery('婚姻')}>
              <div className="category-icon">💕</div>
              <div className="category-label">婚姻姻缘</div>
            </div>
            <div className="category-item" onClick={() => setSearchQuery('财运')}>
              <div className="category-icon">💰</div>
              <div className="category-label">财运分析</div>
            </div>
            <div className="category-item" onClick={() => setSearchQuery('取名')}>
              <div className="category-icon">📝</div>
              <div className="category-label">起名改名</div>
            </div>
          </div>
        </div>
      )}

      {/* 底部提示 */}
      <div className="footer">
        <p>—— 已经到底啦 ——</p>
      </div>
    </div>
  )
}

export default HomePage
