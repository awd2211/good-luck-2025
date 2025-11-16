import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './FloatingActionButton.css'

interface FABAction {
  icon: string
  label: string
  onClick: () => void
  color?: string
}

const FloatingActionButton = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const actions: FABAction[] = [
    {
      icon: '🏠',
      label: '首页',
      onClick: () => navigate('/'),
      color: '#667eea'
    },
    {
      icon: '🛒',
      label: '购物车',
      onClick: () => navigate('/cart'),
      color: '#f093fb'
    },
    {
      icon: '⭐',
      label: '收藏',
      onClick: () => navigate('/favorites'),
      color: '#ffd89b'
    },
    {
      icon: '👁️',
      label: '历史',
      onClick: () => navigate('/history'),
      color: '#96e6a1'
    },
  ]

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleAction = (action: FABAction) => {
    action.onClick()
    setIsOpen(false)
  }

  return (
    <>
      {/* FAB Menu */}
      <div className={`fab-container ${isOpen ? 'open' : ''}`}>
        {/* Sub Actions */}
        <div className="fab-actions">
          {actions.map((action, index) => (
            <div
              key={index}
              className="fab-action"
              style={{
                transitionDelay: isOpen ? `${index * 0.05}s` : `${(actions.length - index - 1) * 0.05}s`
              }}
              onClick={() => handleAction(action)}
            >
              <div className="fab-action-label">{action.label}</div>
              <button
                className="fab-sub-button"
                style={{ background: action.color }}
              >
                <span className="fab-icon">{action.icon}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Main FAB Button */}
        <button
          className={`fab-main-button ${isOpen ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          <span className="fab-icon main">
            {isOpen ? '✕' : '⚡'}
          </span>
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fab-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default FloatingActionButton
