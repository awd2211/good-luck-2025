import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import * as emailAuthApi from '../services/emailAuthService'
import { showToast } from '../components/ToastContainer'
import './LoginPage.css'

const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [mode, setMode] = useState<'code' | 'password'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 发送验证码
  const handleSendCode = async () => {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      setError(t('auth.invalidEmail'))
      return
    }

    try {
      setError('')
      await emailAuthApi.sendVerificationCode(email, 'login')

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

      showToast({ title: t('common.success'), content: t('auth.codeSent'), type: 'success' })
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('auth.sendCodeFailed')
      setError(errorMsg)
      console.error('发送验证码失败:', err)
    }
  }

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      setError(t('auth.invalidEmail'))
      return
    }

    if (mode === 'code') {
      if (!verificationCode || verificationCode.length !== 6) {
        setError(t('auth.invalidCode'))
        return
      }
    } else {
      if (!password || password.length < 6) {
        setError(t('auth.passwordMinLength'))
        return
      }
    }

    try {
      setLoading(true)
      let response

      if (mode === 'password') {
        // 密码登录
        response = await emailAuthApi.loginWithPassword(email, password)
      } else {
        // 验证码登录
        response = await emailAuthApi.loginWithCode(email, verificationCode)
      }

      if (response.success) {
        // 更新认证上下文（会自动保存到storage）
        setAuth(response.data.token, response.data.user)

        // 跳转到首页
        navigate('/')
      } else {
        setError(response.message || t('auth.loginFailed'))
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('auth.loginError')
      setError(errorMsg)
      console.error('登录失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 一键填充测试账号
  const fillTestAccount = (testEmail: string, testPassword: string) => {
    setEmail(testEmail)
    setPassword(testPassword)
    setMode('password')
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>{t('auth.welcomeBack')}</h1>
          <p>{t('auth.loginSubtitle')}</p>
        </div>

        {/* 开发环境测试账号提示 */}
        {import.meta.env.DEV && (
          <div className="test-accounts-hint">
            <div className="hint-title">🧪 {t('auth.testAccounts')}</div>
            <div className="test-accounts-list">
              <div className="test-account-item">
                <div className="account-info">
                  <span className="account-label">{t('auth.accountLabel')}1:</span>
                  <span className="account-email">zhangsan@example.com</span>
                  <span className="account-password">{t('auth.password')}: password123</span>
                </div>
                <button
                  type="button"
                  className="fill-btn"
                  onClick={() => fillTestAccount('zhangsan@example.com', 'password123')}
                >
                  {t('auth.fillAccount')}
                </button>
              </div>
              <div className="test-account-item">
                <div className="account-info">
                  <span className="account-label">{t('auth.accountLabel')}2:</span>
                  <span className="account-email">lisi@example.com</span>
                  <span className="account-password">{t('auth.password')}: password123</span>
                </div>
                <button
                  type="button"
                  className="fill-btn"
                  onClick={() => fillTestAccount('lisi@example.com', 'password123')}
                >
                  {t('auth.fillAccount')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="login-tabs">
          <button
            className={mode === 'password' ? 'active' : ''}
            onClick={() => setMode('password')}
          >
            {t('auth.loginWithPassword')}
          </button>
          <button
            className={mode === 'code' ? 'active' : ''}
            onClick={() => setMode('code')}
          >
            {t('auth.loginWithCode')}
          </button>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {/* 邮箱 */}
          <div className="form-group">
            <label>{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>

          {mode === 'code' ? (
            <div className="form-group">
              <label>{t('auth.verificationCode')}</label>
              <div className="code-input-group">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('auth.codePlaceholder')}
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className="send-code-btn"
                >
                  {countdown > 0 ? `${countdown}${t('auth.retryAfterSeconds')}` : t('auth.sendCode')}
                </button>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                minLength={6}
                required
              />
            </div>
          )}

          {/* 错误提示 */}
          {error && <div className="error-message">{error}</div>}

          {/* 登录按钮 */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? t('auth.loggingIn') : t('auth.loginNow')}
          </button>

          {/* 跳转注册和忘记密码 */}
          <div className="switch-mode">
            {t('auth.noAccount')}
            <Link to="/register">{t('auth.goToRegister')}</Link>
          </div>
          {mode === 'password' && (
            <div className="switch-mode" style={{ marginTop: '8px' }}>
              <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default LoginPage
