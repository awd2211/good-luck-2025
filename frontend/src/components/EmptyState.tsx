import { type ReactNode } from 'react'
import './EmptyState.css'

export interface EmptyStateProps {
  icon?: string | ReactNode
  title?: string
  description?: string
  action?: {
    text: string
    onClick: () => void
    primary?: boolean
  }
  secondaryAction?: {
    text: string
    onClick: () => void
  }
  illustration?: 'empty' | 'search' | 'error' | 'cart' | 'order' | 'favorite' | 'notification'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const illustrations = {
  empty: '📭',
  search: '🔍',
  error: '😢',
  cart: '🛒',
  order: '📦',
  favorite: '⭐',
  notification: '🔔',
}

const EmptyState = ({
  icon,
  title = '暂无数据',
  description,
  action,
  secondaryAction,
  illustration = 'empty',
  size = 'medium',
  className = '',
}: EmptyStateProps) => {
  const displayIcon = icon || illustrations[illustration]

  return (
    <div className={`empty-state empty-state-${size} ${className}`}>
      <div className="empty-state-content">
        {/* 图标/插图 */}
        <div className="empty-state-icon">
          {typeof displayIcon === 'string' ? (
            <span className="empty-state-emoji">{displayIcon}</span>
          ) : (
            displayIcon
          )}
        </div>

        {/* 标题 */}
        <h3 className="empty-state-title">{title}</h3>

        {/* 描述 */}
        {description && (
          <p className="empty-state-description">{description}</p>
        )}

        {/* 操作按钮 */}
        {(action || secondaryAction) && (
          <div className="empty-state-actions">
            {action && (
              <button
                className={`empty-state-button ${
                  action.primary ? 'primary' : 'secondary'
                }`}
                onClick={action.onClick}
              >
                {action.text}
              </button>
            )}
            {secondaryAction && (
              <button
                className="empty-state-button secondary"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.text}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 预设的空状态组件
export const EmptyCart = ({ onGoShopping }: { onGoShopping: () => void }) => (
  <EmptyState
    illustration="cart"
    title="购物车是空的"
    description="还没有添加任何商品哦~"
    action={{
      text: '去逛逛',
      onClick: onGoShopping,
      primary: true,
    }}
  />
)

export const EmptyOrders = ({ onGoShopping }: { onGoShopping: () => void }) => (
  <EmptyState
    illustration="order"
    title="暂无订单"
    description="您还没有任何订单记录"
    action={{
      text: '去下单',
      onClick: onGoShopping,
      primary: true,
    }}
  />
)

export const EmptyFavorites = ({ onGoShopping }: { onGoShopping: () => void }) => (
  <EmptyState
    illustration="favorite"
    title="还没有收藏"
    description="快去收藏喜欢的服务吧~"
    action={{
      text: '去发现',
      onClick: onGoShopping,
      primary: true,
    }}
  />
)

export const EmptySearch = ({ onReset }: { onReset: () => void }) => (
  <EmptyState
    illustration="search"
    title="没有找到相关内容"
    description="试试调整搜索关键词"
    action={{
      text: '重置搜索',
      onClick: onReset,
    }}
  />
)

export const EmptyNotifications = () => (
  <EmptyState
    illustration="notification"
    title="暂无通知"
    description="您目前没有任何通知消息"
    size="small"
  />
)

export default EmptyState
