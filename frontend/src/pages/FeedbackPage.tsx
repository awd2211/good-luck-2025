/**
 * 意见反馈页面
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as feedbackService from '../services/feedbackService'
import type { Feedback } from '../services/feedbackService'
import { showToast } from '../components/ToastContainer'
import './FeedbackPage.css'

const FeedbackPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'submit' | 'list'>('submit')
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)

  // 提交表单数据
  const [formData, setFormData] = useState({
    type: 'suggestion' as 'bug' | 'suggestion' | 'complaint' | 'praise' | 'other',
    title: '',
    content: '',
    contact_info: ''
  })

  useEffect(() => {
    if (activeTab === 'list') {
      loadMyFeedbacks()
    }
  }, [activeTab])

  // 加载我的反馈列表
  const loadMyFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await feedbackService.getMyFeedbacks({ page: 1, limit: 50 })
      if (response.data.success && response.data.data) {
        setFeedbacks(response.data.data)
      }
    } catch (error) {
      console.error('加载反馈列表失败:', error)
      showToast({ title: t('common.error'), content: t('helpCenter.loadFailed'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // 提交反馈
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      showToast({ title: t('feedback.titleRequired'), content: '', type: 'warning' })
      return
    }

    if (!formData.content.trim()) {
      showToast({ title: t('feedback.contentRequired'), content: '', type: 'warning' })
      return
    }

    try {
      setLoading(true)
      const response = await feedbackService.submitFeedback({
        type: formData.type,
        title: formData.title,
        content: formData.content,
        contact_info: formData.contact_info || undefined
      })

      if (response.data.success) {
        showToast({ title: t('feedback.submitSuccess'), content: t('feedback.submitSuccessMessage'), type: 'success' })
        // 重置表单
        setFormData({
          type: 'suggestion',
          title: '',
          content: '',
          contact_info: ''
        })
        // 切换到列表页
        setActiveTab('list')
      }
    } catch (error: any) {
      console.error('提交失败:', error)
      showToast({
        title: t('feedback.submitFailed'),
        content: error.response?.data?.message || t('helpCenter.retry'),
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: t('feedback.statusPending'),
      processing: t('feedback.statusProcessing'),
      resolved: t('feedback.statusResolved'),
      closed: t('feedback.statusClosed')
    }
    return statusMap[status] || status
  }

  // 获取类型文本
  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      bug: t('feedback.bugType'),
      suggestion: t('feedback.suggestionType'),
      complaint: t('feedback.complaintType'),
      praise: t('feedback.praiseType'),
      other: t('feedback.otherType')
    }
    return typeMap[type] || type
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#ffa940',
      processing: '#1890ff',
      resolved: '#52c41a',
      closed: '#8c8c8c'
    }
    return colorMap[status] || '#8c8c8c'
  }

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← {t('feedback.back')}
        </button>
        <h1>{t('feedback.title')}</h1>
        <div></div>
      </div>

      {/* 标签页切换 */}
      <div className="feedback-tabs">
        <button
          className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          {t('feedback.submitTab')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          {t('feedback.listTab')}
        </button>
      </div>

      {/* 提交反馈表单 */}
      {activeTab === 'submit' && (
        <div className="feedback-submit">
          <form onSubmit={handleSubmit}>
            {/* 反馈类型 */}
            <div className="form-group">
              <label className="form-label">{t('feedback.type')} *</label>
              <div className="type-grid">
                {[
                  { value: 'bug', label: t('feedback.bugType'), icon: '🐛' },
                  { value: 'suggestion', label: t('feedback.suggestionType'), icon: '💡' },
                  { value: 'complaint', label: t('feedback.complaintType'), icon: '😡' },
                  { value: 'praise', label: t('feedback.praiseType'), icon: '👍' },
                  { value: 'other', label: t('feedback.otherType'), icon: '📝' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`type-btn ${formData.type === item.value ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, type: item.value as any })}
                  >
                    <span className="type-icon">{item.icon}</span>
                    <span className="type-label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 标题 */}
            <div className="form-group">
              <label className="form-label">{t('feedback.titleLabel')} *</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('feedback.titlePlaceholder')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={100}
              />
            </div>

            {/* 内容 */}
            <div className="form-group">
              <label className="form-label">{t('feedback.contentLabel')} *</label>
              <textarea
                className="form-textarea"
                placeholder={t('feedback.contentPlaceholder')}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                maxLength={500}
              />
              <div className="char-count">{formData.content.length}/500</div>
            </div>

            {/* 联系方式 */}
            <div className="form-group">
              <label className="form-label">{t('feedback.contactLabel')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('feedback.contactPlaceholder')}
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              />
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? t('feedback.submitting') : t('feedback.submitButton')}
            </button>
          </form>
        </div>
      )}

      {/* 反馈列表 */}
      {activeTab === 'list' && (
        <div className="feedback-list">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">{t('feedback.loading')}</div>
            </div>
          ) : feedbacks.length > 0 ? (
            feedbacks.map((feedback) => (
              <div key={feedback.id} className="feedback-item">
                <div className="feedback-item-header">
                  <span className="feedback-type">{getTypeText(feedback.type)}</span>
                  <span
                    className="feedback-status"
                    style={{ backgroundColor: getStatusColor(feedback.status) }}
                  >
                    {getStatusText(feedback.status)}
                  </span>
                </div>
                <h3 className="feedback-item-title">{feedback.title}</h3>
                <p className="feedback-item-content">{feedback.content}</p>
                {feedback.reply && (
                  <div className="feedback-reply">
                    <div className="reply-label">{t('feedback.adminReply')}</div>
                    <div className="reply-content">{feedback.reply}</div>
                  </div>
                )}
                <div className="feedback-item-footer">
                  <span className="feedback-date">
                    {new Date(feedback.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>{t('feedback.noRecords')}</p>
              <button
                className="empty-btn"
                onClick={() => setActiveTab('submit')}
              >
                {t('feedback.submitFirst')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FeedbackPage
