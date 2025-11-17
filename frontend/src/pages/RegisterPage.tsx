import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import * as emailAuthApi from '../services/emailAuthService'
import './LoginPage.css'

const RegisterPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()

  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    level: number
    text: string
    color: string
  }>({ level: 0, text: '', color: '#ddd' })

  // 计算密码强度
  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) {
      return { level: 0, text: '', color: '#ddd' }
    }

    let strength = 0
    const checks = {
      length: pwd.length >= 8,
      hasLower: /[a-z]/.test(pwd),
      hasUpper: /[A-Z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    }

    // 计算强度分数
    if (checks.length) strength += 20
    if (pwd.length >= 12) strength += 10
    if (checks.hasLower) strength += 20
    if (checks.hasUpper) strength += 20
    if (checks.hasNumber) strength += 15
    if (checks.hasSpecial) strength += 15

    // 根据分数返回等级
    if (strength < 40) {
      return { level: 1, text: t('register.weak'), color: '#ff4d4f' }
    } else if (strength < 60) {
      return { level: 2, text: t('register.medium'), color: '#faad14' }
    } else if (strength < 80) {
      return { level: 3, text: t('register.strong'), color: '#52c41a' }
    } else {
      return { level: 4, text: t('register.veryStrong'), color: '#1890ff' }
    }
  }

  // 密码输入处理
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordStrength(calculatePasswordStrength(newPassword))
  }

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      setError(t('register.invalidEmail'))
      return
    }

    // 验证昵称
    if (!nickname || nickname.length < 2 || nickname.length > 20) {
      setError(t('register.nicknameLengthError'))
      return
    }

    // 验证密码
    if (!password || password.length < 6) {
      setError(t('register.passwordMinLength'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'))
      return
    }

    // 验证协议
    if (!agreed) {
      setError(t('register.agreeRequired'))
      return
    }

    try {
      setLoading(true)
      const response = await emailAuthApi.registerWithEmail(
        email,
        nickname,
        password,
        '' // 不使用验证码
      )

      if (response.success) {
        // 保存token和用户信息
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        // 更新认证上下文
        authLogin(response.data.token, response.data.user)

        // 跳转到首页
        navigate('/')
      } else {
        setError(response.message || t('register.registerFailed'))
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('register.registerFailed')
      setError(errorMsg)
      console.error('注册失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>{t('register.welcome')}</h1>
          <p>{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleRegister} className="login-form">
          {/* 邮箱 */}
          <div className="form-group">
            <label>{t('register.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('register.emailPlaceholder')}
              required
            />
          </div>

          {/* 昵称 */}
          <div className="form-group">
            <label>{t('register.nickname')}</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('register.nicknamePlaceholder')}
              minLength={2}
              maxLength={20}
              required
            />
          </div>

          {/* 密码 */}
          <div className="form-group">
            <label>{t('register.password')}</label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder={t('register.passwordPlaceholder')}
              minLength={6}
              required
            />
            {/* 密码强度指示器 */}
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '4px',
                  height: '4px'
                }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        backgroundColor: level <= passwordStrength.level
                          ? passwordStrength.color
                          : '#e8e8e8',
                        borderRadius: '2px',
                        transition: 'background-color 0.3s',
                      }}
                    />
                  ))}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: passwordStrength.color,
                  fontWeight: 500
                }}>
                  {t('register.passwordStrength')}：{passwordStrength.text}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '4px'
                }}>
                  {t('register.passwordTip')}
                </div>
              </div>
            )}
          </div>

          {/* 确认密码 */}
          <div className="form-group">
            <label>{t('register.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('register.confirmPasswordPlaceholder')}
              minLength={6}
              required
            />
          </div>

          {/* 错误提示 */}
          {error && <div className="error-message">{error}</div>}

          {/* 协议 */}
          <div className="agreement-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                {t('register.agreeText')}
                <Link to="/user-agreement" target="_blank"> {t('register.userAgreement')}</Link>
                {t('register.and')}
                <Link to="/privacy-policy" target="_blank"> {t('register.privacyPolicy')}</Link>
              </span>
            </label>
          </div>

          {/* 注册按钮 */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? t('register.registering') : t('register.registerNow')}
          </button>

          {/* 跳转登录 */}
          <div className="switch-mode">
            {t('register.hasAccount')}
            <Link to="/login">{t('register.goToLogin')}</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage
