import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { updateProfile } from '../services/profileService'
import { showToast } from '../components/ToastContainer'
import './ProfileEditPage.css'

const ProfileEditPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    avatar: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // 初始化表单数据
    setFormData({
      nickname: user.nickname || '',
      email: user.email || '',
      avatar: user.avatar || ''
    })
  }, [user, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const updatedUser = await updateProfile(formData)
      updateUser(updatedUser)
      showToast({ title: t('common.success'), content: t('profileEdit.updateSuccess'), type: 'success' })
      navigate('/profile')
    } catch (err: any) {
      setError(err.response?.data?.message || t('profileEdit.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="profile-edit-page">
      <div className="edit-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          ‹ {t('profileEdit.back')}
        </button>
        <h1>{t('profileEdit.title')}</h1>
      </div>

      <form className="edit-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nickname">{t('profileEdit.nickname')}</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            placeholder={t('profileEdit.nicknamePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">{t('profileEdit.email')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('profileEdit.emailPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="avatar">{t('profileEdit.avatarUrl')}</label>
          <input
            type="url"
            id="avatar"
            name="avatar"
            value={formData.avatar}
            onChange={handleChange}
            placeholder={t('profileEdit.avatarPlaceholder')}
          />
          {formData.avatar && (
            <div className="avatar-preview">
              <img src={formData.avatar} alt={t('profileEdit.avatarPreview')} />
            </div>
          )}
        </div>

        <div className="form-info">
          <p>{t('profileEdit.email')}: {user.email}</p>
          <small>（{t('profileEdit.phoneNotEditable')}）</small>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/profile')}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? t('profileEdit.saving') : t('profileEdit.save')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProfileEditPage
