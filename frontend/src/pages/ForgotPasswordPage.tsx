import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as emailAuthApi from '../services/emailAuthService'
import './LoginPage.css'

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 发送验证码
  const handleSendCode = async () => {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      setError(t('forgotPassword.invalidEmail'))
      return
    }

    try {
      setError('')
      setLoading(true)
      await emailAuthApi.sendVerificationCode(email, 'reset_password')

      // 开始倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setSuccess(t('forgotPassword.codeSent'))
      setStep('reset')
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('forgotPassword.sendCodeFailed')
      setError(errorMsg)
      console.error('发送验证码失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 重置密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // 验证验证码
    if (!verificationCode || verificationCode.length !== 6) {
      setError(t('forgotPassword.invalidCode'))
      return
    }

    // 验证密码
    if (!newPassword || newPassword.length < 6) {
      setError(t('forgotPassword.passwordTooShort'))
      return
    }

    // 验证确认密码
    if (newPassword !== confirmPassword) {
      setError(t('forgotPassword.passwordMismatch'))
      return
    }

    try {
      setLoading(true)
      const response = await emailAuthApi.resetPassword(
        email,
        verificationCode,
        newPassword
      )

      if (response.success) {
        setSuccess(t('forgotPassword.resetSuccess'))
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(response.message || t('forgotPassword.resetFailed'))
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('forgotPassword.resetFailed')
      setError(errorMsg)
      console.error('密码重置失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>{t('forgotPassword.title')}</h1>
          <p>{t('forgotPassword.subtitle')}</p>
        </div>

        {step === 'email' ? (
          // 第一步：输入邮箱
          <div className="login-form">
            <div className="form-group">
              <label>{t('forgotPassword.emailLabel')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('forgotPassword.emailPlaceholder')}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message" style={{ color: '#52c41a', marginBottom: '16px' }}>{success}</div>}

            <button
              type="button"
              onClick={handleSendCode}
              className="submit-btn"
              disabled={loading}
            >
              {loading ? t('forgotPassword.sending') : t('forgotPassword.sendCode')}
            </button>

            <div className="switch-mode">
              <Link to="/login">{t('forgotPassword.backToLogin')} →</Link>
            </div>
          </div>
        ) : (
          // 第二步：输入验证码和新密码
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label>{t('forgotPassword.emailLabel')}</label>
              <input
                type="email"
                value={email}
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label>{t('forgotPassword.codeLabel')}</label>
              <div className="code-input-group">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('forgotPassword.codePlaceholder')}
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className="send-code-btn"
                >
                  {countdown > 0 ? t('forgotPassword.retryAfter', { seconds: countdown }) : t('forgotPassword.resend')}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>{t('forgotPassword.newPasswordLabel')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('forgotPassword.newPasswordPlaceholder')}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('forgotPassword.confirmPasswordLabel')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                minLength={6}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message" style={{ color: '#52c41a', marginBottom: '16px' }}>{success}</div>}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? t('forgotPassword.resetting') : t('forgotPassword.resetButton')}
            </button>

            <div className="switch-mode">
              <Link to="/login">{t('forgotPassword.backToLogin')} →</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
