import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'

const BalancePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  const balance = typeof user.balance === 'number' ? user.balance : parseFloat(user.balance || '0')

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer'
          }}
        >
          ‹
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 20px 0' }}>{t('balance.title')}</h1>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#667eea',
          margin: '40px 0'
        }}>
          ¥{balance.toFixed(2)}
        </div>
        <p style={{ color: '#666', margin: '20px 0' }}>
          {t('balance.currentBalance')}
        </p>
        <div style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
          <button style={{
            flex: 1,
            padding: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            {t('balance.recharge')}
          </button>
          <button style={{
            flex: 1,
            padding: '14px',
            background: '#f5f5f5',
            color: '#666',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            {t('balance.transactions')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BalancePage
