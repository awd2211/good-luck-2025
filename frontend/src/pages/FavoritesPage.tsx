import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../contexts/CartContext'
import * as favoriteService from '../services/favoriteService'
import { SkeletonList } from '../components/Skeleton'
import { EmptyFavorites } from '../components/EmptyState'
import SwipeableListItem from '../components/SwipeableListItem'
import { showToast } from '../components/ToastContainer'
import './FavoritesPage.css'

const FavoritesPage = () => {
  const { t } = useTranslation()
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
      // 后端返回的是 { items, pagination }
      const favData = response.data.data
      setFavorites(favData?.items || [])
    } catch (error) {
      console.error('获取收藏失败:', error)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (fortuneId: string) => {
    try {
      await favoriteService.removeFavorite(fortuneId)
      setFavorites(favorites.filter(f => f.fortune_id !== fortuneId))
      showToast({ title: t('favorites.unfavoriteSuccess'), content: '', type: 'success' })
    } catch (error) {
      showToast({ title: t('favorites.operationFailed'), content: t('favorites.pleaseRetry'), type: 'error' })
    }
  }

  const handleAddToCart = async (fortune: any) => {
    try {
      await addItem(fortune)
      showToast({ title: t('common.success'), content: t('favorites.addSuccess'), type: 'success' })
    } catch (error) {
      showToast({ title: t('common.error'), content: t('favorites.addFailed'), type: 'error' })
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ‹ {t('favorites.back')}
        </button>
        <h1>{t('favorites.title')}</h1>
        <div style={{ width: '48px' }} />
      </div>

      <div className="favorites-content">
        {loading ? (
          <SkeletonList count={4} />
        ) : favorites.length > 0 ? (
          <div className="favorites-list">
            {favorites.map(fav => (
              <SwipeableListItem
                key={fav.id}
                onDelete={() => handleRemove(fav.fortune_id)}
                deleteText={t('favorites.unfavorite')}
                deleteColor="#ff4d4f"
              >
                <div className="favorite-card">
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
                      {t('favorites.unfavorite')}
                    </button>
                    <button
                      className="btn-cart"
                      onClick={() => handleAddToCart(fav.fortune)}
                    >
                      {t('favorites.addToCart')}
                    </button>
                  </div>
                </div>
              </SwipeableListItem>
            ))}
          </div>
        ) : (
          <EmptyFavorites onGoShopping={() => navigate('/')} />
        )}
      </div>
    </div>
  )
}

export default FavoritesPage
