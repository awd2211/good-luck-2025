import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { showToast } from '../components/ToastContainer'

const CustomerServicePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) return null

  const quickQuestions = [
    { id: 1, text: t('customerService.question1'), answer: t('customerService.answer1') },
    { id: 2, text: t('customerService.question2'), answer: t('customerService.answer2') },
    { id: 3, text: t('customerService.question3'), answer: t('customerService.answer3') },
    { id: 4, text: t('customerService.question4'), answer: t('customerService.answer4') }
  ]

  const handleQuickQuestion = (question: any) => {
    setMessage(question.text)
  }

  const handleSendMessage = () => {
    if (!message.trim()) return
    // TODO: 实际发送消息到客服
    showToast({ title: t('common.success'), content: t('customerService.messageSent'), type: 'success' })
    setMessage('')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      {/* 头部 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        display: 'flex',
        alignItems: 'center'
      }}>
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
            cursor: 'pointer',
            marginRight: '15px'
          }}
        >
          ‹
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>{t('customerService.title')}</h1>
      </div>

      {/* 快捷问题 */}
      <div style={{ padding: '20px', background: 'white', marginBottom: '12px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>{t('customerService.commonQuestions')}</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {quickQuestions.map(q => (
            <button
              key={q.id}
              onClick={() => handleQuickQuestion(q)}
              style={{
                padding: '12px',
                background: '#f5f5f5',
                border: '1px solid #eee',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#666'
              }}
            >
              {q.text}
            </button>
          ))}
        </div>
      </div>

      {/* 消息区域 */}
      <div style={{
        flex: 1,
        background: 'white',
        padding: '20px',
        overflowY: 'auto'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#999',
          padding: '40px 0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
          <p>{t('customerService.workingHours')}</p>
          <p style={{ marginTop: '10px' }}>{t('customerService.askAnytime')}</p>
        </div>
      </div>

      {/* 输入框 */}
      <div style={{
        background: 'white',
        borderTop: '1px solid #eee',
        padding: '15px',
        display: 'flex',
        gap: '10px'
      }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('customerService.inputPlaceholder')}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSendMessage}
          style={{
            padding: '12px 24px',
            background: message.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ddd',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {t('customerService.send')}
        </button>
      </div>
    </div>
  )
}

export default CustomerServicePage
