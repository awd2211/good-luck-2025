import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { SkeletonList } from '../components/Skeleton'

const MyReviewsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [reviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    // 模拟加载
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }, [user, navigate])

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            background: '#fff',
            border: '1px solid #ddd',
            fontSize: '24px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            marginRight: '15px'
          }}
        >
          ‹
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>{t('myReviews.title')}</h1>
      </div>

      {loading ? (
        <SkeletonList count={5} />
      ) : reviews.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '60px 24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
          <p style={{ color: '#999' }}>{t('myReviews.noReviews')}</p>
          <button
            onClick={() => navigate('/orders')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {t('myReviews.goToOrders')}
          </button>
        </div>
      ) : (
        <div>
          {reviews.map((review, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px'
            }}>
              {/* 评价内容 */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyReviewsPage
