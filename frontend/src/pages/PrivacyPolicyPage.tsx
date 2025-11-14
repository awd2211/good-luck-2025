import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import './PolicyPage.css'

const PrivacyPolicyPage = () => {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState('')

  useEffect(() => {
    loadPolicy()
  }, [])

  const loadPolicy = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/policies/privacy-policy')
      const data = await response.json()
      if (data.success) {
        setContent(data.data.content)
        setUpdatedAt(data.data.updatedAt)
      }
    } catch (error) {
      console.error('加载隐私政策失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="policy-page">
      <div className="policy-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>隐私政策</h1>
        <div></div>
      </div>

      <div className="policy-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">加载中...</div>
          </div>
        ) : (
          <>
            <ReactMarkdown>{content}</ReactMarkdown>
            {updatedAt && (
              <div className="update-time">
                最后更新: {new Date(updatedAt).toLocaleDateString('zh-CN')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
