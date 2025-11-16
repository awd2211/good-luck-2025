import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../contexts/CartContext'
import { getUserTags, getUserPortrait, type UserTag, type UserPortrait } from '../services/profileService'
import { useConfirm } from '../hooks/useConfirm'
import ConfirmDialog from '../components/ConfirmDialog'
import './ProfilePage.css'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const [userTags, setUserTags] = useState<UserTag[]>([])
  const [portrait, setPortrait] = useState<UserPortrait | null>(null)
  const { confirm, isOpen, confirmState } = useConfirm()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else {
      // 加载用户数据
      loadUserTags()
      loadUserPortrait()
    }
  }, [user, navigate])

  const loadUserTags = async () => {
    try {
      const tags = await getUserTags()
      setUserTags(tags)
    } catch (error) {
      console.error('加载用户标签失败:', error)
      // 忽略错误，标签是可选的
    }
  }

  const loadUserPortrait = async () => {
    try {
      const data = await getUserPortrait()
      setPortrait(data)
    } catch (error) {
      console.error('加载用户画像失败:', error)
      // 忽略错误，画像是可选的
    }
  }

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: '退出登录',
      message: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      variant: 'danger'
    })

    if (confirmed) {
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
        { icon: '💰', label: '我的余额', path: '/balance', badge: `¥${typeof user.balance === 'number' ? user.balance.toFixed(2) : user.balance}` },
        { icon: '🎫', label: '优惠券', path: '/coupons', badge: null },
        { icon: '⭐', label: '我的收藏', path: '/favorites', badge: null },
        { icon: '👁️', label: '浏览历史', path: '/history', badge: null },
      ],
    },
    {
      section: '客户服务',
      items: [
        { icon: '💬', label: '在线客服', path: '/customer-service', badge: null },
        { icon: '❓', label: '帮助中心', path: '/help', badge: null },
        { icon: '📝', label: '我的评价', path: '/my-reviews', badge: null },
        { icon: '💭', label: '意见反馈', path: '/feedback', badge: null },
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
    <>
      <ConfirmDialog
        isOpen={isOpen}
        title={confirmState?.title}
        message={confirmState?.message || ''}
        confirmText={confirmState?.confirmText}
        cancelText={confirmState?.cancelText}
        variant={confirmState?.variant}
        onConfirm={confirmState?.onConfirm || (() => {})}
        onCancel={confirmState?.onCancel || (() => {})}
      />
      <div className="profile-page">
      {/* 用户信息卡片 */}
      <div className="user-card">
        <div className="user-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.nickname || '用户'} />
          ) : (
            <div className="avatar-placeholder">
              {(user.nickname || user.email)?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="user-info">
          <h2>{user.nickname || '未设置昵称'}</h2>
          <p>{user.email}</p>
          {userTags.length > 0 && (
            <div className="user-tags">
              {userTags.map(tag => (
                <span
                  key={tag.id}
                  className="user-tag"
                  title={tag.description}
                >
                  <span className="user-tag-icon">🏷️</span>
                  {tag.tag_name}
                </span>
              ))}
            </div>
          )}
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

      {/* 用户画像 */}
      {portrait && (
        <div className="portrait-card">
          <div className="portrait-header">
            <h3>我的画像</h3>
            <span className="vip-badge">{portrait.profile.vipLabel}</span>
          </div>

          <div className="portrait-stats">
            <div className="portrait-stat-item">
              <div className="portrait-stat-icon">💬</div>
              <div className="portrait-stat-content">
                <div className="portrait-stat-value">{portrait.profile.totalSessions}</div>
                <div className="portrait-stat-label">会话次数</div>
              </div>
            </div>

            <div className="portrait-stat-item">
              <div className="portrait-stat-icon">✉️</div>
              <div className="portrait-stat-content">
                <div className="portrait-stat-value">{portrait.profile.totalMessages}</div>
                <div className="portrait-stat-label">消息数</div>
              </div>
            </div>

            {portrait.profile.avgSatisfactionRating && (
              <div className="portrait-stat-item">
                <div className="portrait-stat-icon">⭐</div>
                <div className="portrait-stat-content">
                  <div className="portrait-stat-value">{portrait.profile.avgSatisfactionRating}</div>
                  <div className="portrait-stat-label">平均评分</div>
                </div>
              </div>
            )}
          </div>

          {portrait.sessionStats.total > 0 && (
            <div className="portrait-session-stats">
              <div className="session-stat-bar">
                <div className="session-stat-label">
                  <span>总会话: {portrait.sessionStats.total}</span>
                </div>
                <div className="session-stat-details">
                  <span className="stat-completed">已完成: {portrait.sessionStats.completed}</span>
                  {portrait.sessionStats.active > 0 && (
                    <span className="stat-active">进行中: {portrait.sessionStats.active}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {portrait.profile.memberSince && (
            <div className="portrait-footer">
              <span className="member-since">
                👤 会员自 {new Date(portrait.profile.memberSince).toLocaleDateString('zh-CN')}
              </span>
            </div>
          )}
        </div>
      )}

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
        <p>LUCK.DAY v1.0.0</p>
      </div>
    </div>
    </>
  )
}

export default ProfilePage
