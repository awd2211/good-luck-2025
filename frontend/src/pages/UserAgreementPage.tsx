import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import * as policyService from '../services/policyService'
import './PolicyPage.css'

const UserAgreementPage = () => {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')

  useEffect(() => {
    loadAgreement()
  }, [])

  const loadAgreement = async () => {
    try {
      setLoading(true)
      const response = await policyService.getUserAgreement()
      if (response.data.success && response.data.data) {
        const policy = response.data.data
        setContent(policy.content)
        setVersion(policy.version)
        setEffectiveDate(policy.effectiveDate)
      }
    } catch (error) {
      console.error('加载用户协议失败:', error)
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
        <h1>用户协议</h1>
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
            <div className="policy-meta">
              {version && <div className="policy-version">版本: {version}</div>}
              {effectiveDate && (
                <div className="policy-date">
                  生效日期: {new Date(effectiveDate).toLocaleDateString('zh-CN')}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default UserAgreementPage
