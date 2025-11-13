import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import * as favoriteService from '../services/favoriteService'
import { SkeletonList } from '../components/Skeleton'
import './BrowseHistoryPage.css'

const BrowseHistoryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      setHistory(response.data || [])
    } catch (error) {
      console.error('获取浏览历史失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (!window.confirm('确定要清空浏览历史吗？')) return

    try {
      await favoriteService.clearBrowseHistory()
      setHistory([])
    } catch (error) {
      alert('操作失败，请重试')
    }
  }

  const handleAddToCart = async (item: any) => {
    try {
      await addItem(item.fortune)
      alert('已添加到购物车')
    } catch (error) {
      alert('添加失败，请重试')
    }
  }

  const groupByDate = (items: any[]) => {
    const groups: { [key: string]: any[] } = {}

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
                      onClick={() => navigate(`/fortune/${item.fortune.id}`)}
                    >
                      <div
                        className="fortune-icon"
                        style={{ background: item.fortune.bgColor || '#f5f5f5' }}
                      >
                        {item.fortune.icon || '🔮'}
                      </div>
                      <div className="fortune-info">
                        <h3 className="fortune-title">{item.fortune.title}</h3>
                        <p className="fortune-desc">{item.fortune.description}</p>
                        <div className="fortune-footer">
                          <span className="fortune-price">¥{item.fortune.price}</span>
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
  )
}

export default BrowseHistoryPage
