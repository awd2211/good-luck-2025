import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '../contexts/CartContext'
import './BottomNav.css'

const BottomNav = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { itemCount } = useCart()

  const navItems = [
    {
      path: '/',
      icon: '🏠',
      activeIcon: '🏠',
      label: t('nav.home'),
    },
    {
      path: '/categories',
      icon: '📂',
      activeIcon: '📂',
      label: t('nav.categories'),
    },
    {
      path: '/cart',
      icon: '🛒',
      activeIcon: '🛒',
      label: t('nav.cart'),
      badge: itemCount,
    },
    {
      path: '/profile',
      icon: '👤',
      activeIcon: '👤',
      label: t('nav.profile'),
    },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div
      className="bottom-nav"
      data-testid="bottom-nav"
    >
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <div className="nav-icon-wrapper">
            <span className="nav-icon">
              {isActive(item.path) ? item.activeIcon : item.icon}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
            )}
          </div>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export default BottomNav
