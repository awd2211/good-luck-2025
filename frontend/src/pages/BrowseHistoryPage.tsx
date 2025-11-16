import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../contexts/CartContext'
import * as favoriteService from '../services/favoriteService'
import { SkeletonList } from '../components/Skeleton'
import { showToast } from '../components/ToastContainer'
import { useConfirm } from '../hooks/useConfirm'
import ConfirmDialog from '../components/ConfirmDialog'
import './BrowseHistoryPage.css'

const BrowseHistoryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { confirm, isOpen, confirmState } = useConfirm()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchHistory()
  }, [user])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await favoriteService.getBrowseHistory()
      // 后端返回的是 { items, pagination }
      const historyData = response.data.data
      setHistory(historyData?.items || [])
    } catch (error) {
      console.error('获取浏览历史失败:', error)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    const confirmed = await confirm({
      title: '清空浏览历史',
      message: '确定要清空所有浏览历史吗？此操作不可恢复。',
      confirmText: '清空',
      cancelText: '取消',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await favoriteService.clearBrowseHistory()
      setHistory([])
      showToast({ title: '成功', content: '浏览历史已清空', type: 'success' })
    } catch (error) {
      showToast({ title: '错误', content: '操作失败，请重试', type: 'error' })
    }
  }

  const handleAddToCart = async (item: any) => {
    try {
      // 浏览历史返回的是平铺结构，需要构造 Fortune 对象
      const fortune = {
        id: item.fortune_id,
        title: item.title,
        subtitle: item.subtitle,
        category: item.category,
        description: item.description,
        price: item.price,
        original_price: item.original_price,
        icon: item.icon,
        bg_color: item.bg_color,
        rating: item.rating,
        sales_count: item.sales_count,
        status: 'active' as const
      }
      await addItem(fortune)
      showToast({ title: '成功', content: '已添加到购物车', type: 'success' })
    } catch (error) {
      showToast({ title: '错误', content: '添加失败，请重试', type: 'error' })
    }
  }

  const groupByDate = (items: any[]) => {
    const groups: { [key: string]: any[] } = {}

    // 确保 items 是数组
    if (!Array.isArray(items)) {
      return groups
    }

    items.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(item)
    })

    return groups
  }

  const groupedHistory = groupByDate(history)

  if (!user) {
    return null
  }

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
      <div className="browse-history-page">
        <div className="history-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ‹ 返回
        </button>
        <h1>浏览历史</h1>
        {history.length > 0 && (
          <button className="clear-btn" onClick={handleClearHistory}>
            清空
          </button>
        )}
      </div>

      <div className="history-content">
        {loading ? (
          <SkeletonList count={5} />
        ) : history.length > 0 ? (
          <div className="history-timeline">
            {Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date} className="date-group">
                <div className="date-label">
                  <span className="date-icon">📅</span>
                  {date}
                </div>
                <div className="history-list">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="history-card"
                      onClick={() => navigate(`/fortune/${item.fortune_id}`)}
                    >
                      <div
                        className="fortune-icon"
                        style={{ background: item.bg_color || '#f5f5f5' }}
                      >
                        {item.icon || '🔮'}
                      </div>
                      <div className="fortune-info">
                        <h3 className="fortune-title">{item.title}</h3>
                        <p className="fortune-desc">{item.description}</p>
                        <div className="fortune-footer">
                          <span className="fortune-price">¥{item.price}</span>
                          <span className="view-time">
                            {new Date(item.created_at).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <button
                        className="add-cart-mini-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(item)
                        }}
                      >
                        🛒
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-history">
            <div className="empty-icon">🕐</div>
            <p>还没有浏览历史</p>
            <button onClick={() => navigate('/')} className="go-explore-btn">
              去逛逛
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default BrowseHistoryPage
