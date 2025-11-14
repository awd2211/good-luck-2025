import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as authApi from '../services/authService'
import './LoginPage.css'  // 复用登录页样式

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }

    try {
      await authApi.sendVerificationCode(phone)
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
    } catch (err: any) {
      setError(err.response?.data?.message || '发送验证码失败')
    }
  }

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }

    if (!code || code.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    if (!password || password.length < 6) {
      setError('密码至少6位')
      return
    }

    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    if (!agreed) {
      setError('请阅读并同意用户协议和隐私政策')
      return
    }

    setLoading(true)
    try {
      await register({
        phone,
        code,
        password,
        nickname: nickname || undefined,
      })
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>欢迎注册</h1>
          <p>注册算命平台，开启命运探索之旅</p>
        </div>

        <form onSubmit={handleRegister} className="login-form">
          <div className="form-group">
            <label>手机号 *</label>
            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
            />
          </div>

          <div className="form-group">
            <label>验证码 *</label>
            <div className="code-input-wrapper">
              <input
                type="text"
                placeholder="请输入验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="send-code-btn"
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>昵称</label>
            <input
              type="text"
              placeholder="请输入昵称（选填）"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>密码 *</label>
            <input
              type="password"
              placeholder="请输入密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>确认密码 *</label>
            <input
              type="password"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                我已阅读并同意
                <a href="/terms" target="_blank" className="link">《用户协议》</a>
                和
                <a href="/privacy" target="_blank" className="link">《隐私政策》</a>
              </span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>

          <div className="form-footer">
            <Link to="/login" className="link">
              已有账号？立即登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage
