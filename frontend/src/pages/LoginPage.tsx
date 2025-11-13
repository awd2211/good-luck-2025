import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import * as authApi from '../services/authService'
import './LoginPage.css'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [mode, setMode] = useState<'code' | 'password'>('code')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }

    if (mode === 'code') {
      if (!code || code.length !== 6) {
        setError('请输入6位验证码')
        return
      }
    } else {
      if (!password || password.length < 6) {
        setError('密码至少6位')
        return
      }
    }

    setLoading(true)
    try {
      await login({
        phone,
        password: mode === 'password' ? password : undefined,
        code: mode === 'code' ? code : undefined,
      })
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查您的信息')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>欢迎回来</h1>
          <p>登录算命平台，探索您的命运</p>
        </div>

        <div className="login-tabs">
          <button
            className={mode === 'code' ? 'active' : ''}
            onClick={() => setMode('code')}
          >
            验证码登录
          </button>
          <button
            className={mode === 'password' ? 'active' : ''}
            onClick={() => setMode('password')}
          >
            密码登录
          </button>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>手机号</label>
            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
            />
          </div>

          {mode === 'code' ? (
            <div className="form-group">
              <label>验证码</label>
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
          ) : (
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>

          <div className="form-footer">
            <Link to="/register" className="link">
              还没有账号？立即注册
            </Link>
            {mode === 'password' && (
              <Link to="/forgot-password" className="link">
                忘记密码？
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
