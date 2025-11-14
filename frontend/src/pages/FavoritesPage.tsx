import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../contexts/CartContext'
import * as favoriteService from '../services/favoriteService'
import { SkeletonList } from '../components/Skeleton'
import './FavoritesPage.css'

const FavoritesPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchFavorites()
  }, [user])

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      const response = await favoriteService.getFavorites()
      setFavorites(response.data.data || [])
    } catch (error) {
      console.error('获取收藏失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (fortuneId: string) => {
    if (!window.confirm('确定要取消收藏吗？')) return

    try {
      await favoriteService.removeFavorite(fortuneId)
      setFavorites(favorites.filter(f => f.fortune_id !== fortuneId))
    } catch (error) {
      alert('操作失败，请重试')
    }
  }

  const handleAddToCart = async (fortune: any) => {
    try {
      await addItem(fortune)
      alert('已添加到购物车')
    } catch (error) {
      alert('添加失败，请重试')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ‹ 返回
        </button>
        <h1>我的收藏</h1>
        <div style={{ width: '48px' }} />
      </div>

      <div className="favorites-content">
        {loading ? (
          <SkeletonList count={4} />
        ) : favorites.length > 0 ? (
          <div className="favorites-list">
            {favorites.map(fav => (
              <div key={fav.id} className="favorite-card">
                <div
                  className="card-content"
                  onClick={() => navigate(`/fortune/${fav.fortune.id}`)}
                >
                  <div className="fortune-icon" style={{ background: fav.fortune.bgColor || '#f5f5f5' }}>
                    {fav.fortune.icon || '🔮'}
                  </div>
                  <div className="fortune-info">
                    <h3 className="fortune-title">{fav.fortune.title}</h3>
                    <p className="fortune-desc">{fav.fortune.description}</p>
                    <div className="fortune-footer">
                      <span className="fortune-price">¥{fav.fortune.price}</span>
                      <span className="favorite-time">
                        {new Date(fav.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="btn-remove"
                    onClick={() => handleRemove(fav.fortune_id)}
                  >
                    取消收藏
                  </button>
                  <button
                    className="btn-cart"
                    onClick={() => handleAddToCart(fav.fortune)}
                  >
                    加入购物车
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-favorites">
            <div className="empty-icon">⭐</div>
            <p>还没有收藏</p>
            <button onClick={() => navigate('/')} className="go-explore-btn">
              去逛逛
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesPage
