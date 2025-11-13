import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { SkeletonList } from '../components/Skeleton'
import './CartPage.css'

const CartPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, totalAmount, updateQuantity, removeItem, isLoading } = useCart()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map(item => item.id))
    }
  }

  // 单选
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // 计算选中商品的总价
  const selectedTotal = items
    .filter(item => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0)

  // 删除选中
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert('请先选择要删除的商品')
      return
    }

    if (!window.confirm(`确定要删除选中的${selectedIds.length}个商品吗？`)) {
      return
    }

    try {
      for (const id of selectedIds) {
        await removeItem(id)
      }
      setSelectedIds([])
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  // 结算
  const handleCheckout = () => {
    if (selectedIds.length === 0) {
      alert('请先选择要结算的商品')
      return
    }
    navigate('/checkout', { state: { cartItemIds: selectedIds } })
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <h1>购物车</h1>
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
          <p>购物车是空的</p>
          <button onClick={() => navigate('/')} className="go-shopping-btn">
            去逛逛
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ‹ 返回
        </button>
        <h1>购物车</h1>
        <button className="delete-btn" onClick={handleDeleteSelected}>
          删除
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
            <span>全选</span>
          </label>
        </div>

        {items.map(item => (
          <div key={item.id} className="cart-item">
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => toggleSelect(item.id)}
              className="item-checkbox"
            />

            <div className="item-image" onClick={() => navigate(`/fortune/${item.fortune.id}`)}>
              <img src={item.fortune.icon} alt={item.fortune.title} />
            </div>

            <div className="item-info">
              <h3 onClick={() => navigate(`/fortune/${item.fortune.id}`)}>
                {item.fortune.title}
              </h3>
              <p className="item-desc">{item.fortune.description}</p>
              <div className="item-bottom">
                <span className="item-price">¥{item.price}</span>
                <div className="quantity-control">
                  <button
                    onClick={() => {
                      if (item.quantity > 1) {
                        updateQuantity(item.id, item.quantity - 1)
                      }
                    }}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              className="remove-btn"
              onClick={() => {
                if (window.confirm('确定要删除这个商品吗？')) {
                  removeItem(item.id)
                }
              }}
            >
              ×
            </button>
          </div>
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
            <span>全选</span>
          </label>
          <div className="total-info">
            <span className="selected-count">
              已选 {selectedIds.length} 件
            </span>
            <span className="total-label">合计：</span>
            <span className="total-price">¥{selectedTotal.toFixed(2)}</span>
          </div>
        </div>
        <button
          className="checkout-btn"
          onClick={handleCheckout}
          disabled={selectedIds.length === 0}
        >
          结算 ({selectedIds.length})
        </button>
      </div>
    </div>
  )
}

export default CartPage
