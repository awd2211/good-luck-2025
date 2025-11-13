import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import './ProfilePage.css'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { itemCount } = useCart()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout()
      navigate('/login')
    }
  }

  if (!user) {
    return null
  }

  const menuItems = [
    {
      section: '我的服务',
      items: [
        { icon: '📦', label: '我的订单', path: '/orders', badge: null },
        { icon: '💰', label: '我的余额', path: '/balance', badge: `¥${user.balance.toFixed(2)}` },
        { icon: '🎫', label: '优惠券', path: '/coupons', badge: null },
        { icon: '⭐', label: '我的收藏', path: '/favorites', badge: null },
        { icon: '👁️', label: '浏览历史', path: '/history', badge: null },
      ],
    },
    {
      section: '客户服务',
      items: [
        { icon: '💬', label: '在线客服', path: '/customer-service', badge: null },
        { icon: '📝', label: '我的评价', path: '/my-reviews', badge: null },
        { icon: '❓', label: '帮助中心', path: '/help', badge: null },
      ],
    },
    {
      section: '账号设置',
      items: [
        { icon: '👤', label: '个人信息', path: '/profile/edit', badge: null },
        { icon: '🔒', label: '修改密码', path: '/profile/password', badge: null },
        { icon: '⚙️', label: '设置', path: '/settings', badge: null },
      ],
    },
  ]

  return (
    <div className="profile-page">
      {/* 用户信息卡片 */}
      <div className="user-card">
        <div className="user-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.nickname || '用户'} />
          ) : (
            <div className="avatar-placeholder">
              {(user.nickname || user.phone)?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="user-info">
          <h2>{user.nickname || '未设置昵称'}</h2>
          <p>{user.phone}</p>
        </div>
        <button className="edit-btn" onClick={() => navigate('/profile/edit')}>
          编辑
        </button>
      </div>

      {/* 快捷统计 */}
      <div className="stats-grid">
        <Link to="/orders?status=pending" className="stat-item">
          <div className="stat-value">0</div>
          <div className="stat-label">待支付</div>
        </Link>
        <Link to="/orders?status=processing" className="stat-item">
          <div className="stat-value">0</div>
          <div className="stat-label">处理中</div>
        </Link>
        <Link to="/orders?status=completed" className="stat-item">
          <div className="stat-value">0</div>
          <div className="stat-label">已完成</div>
        </Link>
        <Link to="/cart" className="stat-item">
          <div className="stat-value">{itemCount}</div>
          <div className="stat-label">购物车</div>
        </Link>
      </div>

      {/* 菜单列表 */}
      {menuItems.map((section, index) => (
        <div key={index} className="menu-section">
          <h3 className="section-title">{section.section}</h3>
          <div className="menu-list">
            {section.items.map((item, idx) => (
              <Link key={idx} to={item.path} className="menu-item">
                <div className="menu-item-left">
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </div>
                <div className="menu-item-right">
                  {item.badge && <span className="badge">{item.badge}</span>}
                  <span className="arrow">›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* 退出登录 */}
      <button className="logout-btn" onClick={handleLogout}>
        退出登录
      </button>

      <div className="app-info">
        <p>算命平台 v1.0.0</p>
      </div>
    </div>
  )
}

export default ProfilePage
