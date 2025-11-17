import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../contexts/CartContext'
import { SkeletonList } from '../components/Skeleton'
import SwipeableListItem from '../components/SwipeableListItem'
import { showToast } from '../components/ToastContainer'
import { logError } from '../utils/logger'
import './CartPage.css'

// 定义购物车项的类型
interface CartItemType {
  id: string
  fortune_id: string
  title: string
  description: string
  icon: string
  price: number
  quantity: number
}

// 购物车项组件 - 使用 React.memo 优化渲染
interface CartItemProps {
  item: CartItemType
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onDelete: (id: string, title: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onNavigate: (fortuneId: string) => void
}

const CartItem = memo(({ item, isSelected, onToggleSelect, onDelete, onUpdateQuantity, onNavigate }: CartItemProps) => {
  return (
    <SwipeableListItem
      key={item.id}
      onDelete={() => onDelete(item.id, item.title)}
    >
      <div className="cart-item">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          className="item-checkbox"
        />

        <div className="item-image" onClick={() => onNavigate(item.fortune_id)}>
          <img src={item.icon} alt={item.title} />
        </div>

        <div className="item-info">
          <h3 onClick={() => onNavigate(item.fortune_id)}>
            {item.title}
          </h3>
          <p className="item-desc">{item.description}</p>
          <div className="item-bottom">
            <span className="item-price">¥{item.price}</span>
            <div className="quantity-control">
              <button
                onClick={() => {
                  if (item.quantity > 1) {
                    onUpdateQuantity(item.id, item.quantity - 1)
                  }
                }}
                disabled={item.quantity <= 1}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </SwipeableListItem>
  )
})

const CartPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, updateQuantity, removeItem, isLoading } = useCart()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // 全选/取消全选 - 使用 useCallback 优化
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map(item => item.id))
    }
  }, [selectedIds.length, items])

  // 单选 - 使用 useCallback 优化
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id)
      } else {
        return [...prev, id]
      }
    })
  }, [])

  // 计算选中商品的总价 - 使用 useMemo 优化
  const selectedTotal = useMemo(() => {
    return items
      .filter(item => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items, selectedIds])

  // 删除单个商品 - 使用 useCallback 优化
  const handleDeleteItem = useCallback(async (id: string, title: string) => {
    try {
      await removeItem(id)
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
      showToast({ title: t('cartPage.deleteSuccess'), content: t('cartPage.deletedItem', { title }), type: 'success' })
    } catch (error) {
      logError('删除购物车商品失败', error, { id, title })
      showToast({ title: t('cartPage.deleteFailed'), content: t('cartPage.pleaseRetry'), type: 'error' })
      throw error
    }
  }, [removeItem, t])

  // 删除选中 - 使用 useCallback 优化
  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.length === 0) {
      showToast({ title: t('cartPage.notice'), content: t('cartPage.selectItemsToDelete'), type: 'warning' })
      return
    }

    try {
      for (const id of selectedIds) {
        await removeItem(id)
      }
      showToast({ title: t('cartPage.deleteSuccess'), content: t('cartPage.deletedCount', { count: selectedIds.length }), type: 'success' })
      setSelectedIds([])
    } catch (error) {
      logError('批量删除购物车商品失败', error, { count: selectedIds.length })
      showToast({ title: t('cartPage.deleteFailed'), content: t('cartPage.pleaseRetry'), type: 'error' })
    }
  }, [selectedIds, removeItem, t])

  // 结算 - 使用 useCallback 优化
  const handleCheckout = useCallback(() => {
    if (selectedIds.length === 0) {
      showToast({ title: t('cartPage.notice'), content: t('cartPage.selectItemsToCheckout'), type: 'warning' })
      return
    }
    navigate('/checkout', { state: { cartItemIds: selectedIds } })
  }, [selectedIds, navigate, t])

  // 导航到详情页 - 使用 useCallback 优化
  const handleNavigateToDetail = useCallback((fortuneId: string) => {
    navigate(`/fortune/${fortuneId}`)
  }, [navigate])

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <h1>{t('cartPage.title')}</h1>
        </div>
        <div className="cart-content">
          <SkeletonList count={3} />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <p>{t('cartPage.empty')}</p>
          <button onClick={() => navigate('/')} className="go-shopping-btn">
            {t('cartPage.goShopping')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ‹ {t('cartPage.back')}
        </button>
        <h1>{t('cartPage.title')}</h1>
        <button className="delete-btn" onClick={handleDeleteSelected}>
          {t('cartPage.delete')}
        </button>
      </div>

      <div className="cart-list">
        <div className="select-all">
          <label>
            <input
              type="checkbox"
              checked={selectedIds.length === items.length && items.length > 0}
              onChange={toggleSelectAll}
            />
            <span>{t('cartPage.selectAll')}</span>
          </label>
        </div>

        {items.map(item => (
          <CartItem
            key={item.id}
            item={item}
            isSelected={selectedIds.includes(item.id)}
            onToggleSelect={toggleSelect}
            onDelete={handleDeleteItem}
            onUpdateQuantity={updateQuantity}
            onNavigate={handleNavigateToDetail}
          />
        ))}
      </div>

      <div className="cart-footer">
        <div className="footer-info">
          <label>
            <input
              type="checkbox"
              checked={selectedIds.length === items.length && items.length > 0}
              onChange={toggleSelectAll}
            />
            <span>{t('cartPage.selectAll')}</span>
          </label>
          <div className="total-info">
            <span className="selected-count">
              {t('cartPage.selected')} {selectedIds.length} {t('cartPage.items')}
            </span>
            <span className="total-label">{t('cartPage.total')}</span>
            <span className="total-price">¥{selectedTotal.toFixed(2)}</span>
          </div>
        </div>
        <button
          className="checkout-btn"
          onClick={handleCheckout}
          disabled={selectedIds.length === 0}
        >
          {t('cartPage.checkout')} ({selectedIds.length})
        </button>
      </div>
    </div>
  )
}

export default CartPage
