import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Form, Input, Button, Card, message, Alert, Result, Spin } from 'antd'
import { LockOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import api from '../services/api'
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator'
import { validatePasswordMinimum } from '../utils/passwordStrength'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenData, setTokenData] = useState<any>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setVerifying(false)
      setTokenValid(false)
      message.error('缺少重置令牌')
      return
    }

    // 验证令牌
    const verifyToken = async () => {
      try {
        const response = await api.get(`/auth/password-reset/verify?token=${token}`)

        if (response.data.success) {
          setTokenValid(true)
          setTokenData(response.data.data)
        } else {
          setTokenValid(false)
          message.error(response.data.message || '无效的重置链接')
        }
      } catch (error: any) {
        setTokenValid(false)
        const errorMsg = error.response?.data?.message || '无效或已过期的重置链接'
        message.error(errorMsg)
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const onFinish = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/password-reset/reset', {
        token,
        newPassword: values.newPassword,
      })

      if (response.data.success) {
        setResetSuccess(true)
        message.success('密码重置成功，请使用新密码登录')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        message.error(response.data.message || '密码重置失败')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || '密码重置失败'
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: '#666' }}>正在验证重置链接...</p>
        </Card>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <Card style={{ width: 450 }}>
          <Result
            status="error"
            icon={<CloseCircleOutlined />}
            title="重置链接无效"
            subTitle={
              <div style={{ color: '#666' }}>
                <p>该重置链接可能已过期、已使用或无效。</p>
                <p style={{ fontSize: 14, marginTop: 16 }}>
                  ⏰ 重置链接有效期为1小时<br />
                  🔒 每个链接只能使用一次<br />
                  📧 请返回重新申请密码重置
                </p>
              </div>
            }
            extra={[
              <Button type="primary" key="forgot">
                <Link to="/forgot-password">重新申请</Link>
              </Button>,
              <Button key="login">
                <Link to="/login">返回登录</Link>
              </Button>,
            ]}
          />
        </Card>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <Card style={{ width: 450 }}>
          <Result
            status="success"
            icon={<CheckCircleOutlined />}
            title="密码重置成功"
            subTitle={
              <div style={{ color: '#666' }}>
                <p>您的密码已成功重置。</p>
                <p style={{ fontSize: 14, marginTop: 16 }}>
                  ✅ 请使用新密码登录<br />
                  🔒 建议启用双因素认证以提高安全性<br />
                  ⏰ 3秒后自动跳转到登录页面...
                </p>
              </div>
            }
            extra={[
              <Button type="primary" key="login" onClick={() => navigate('/login')}>
                立即登录
              </Button>,
            ]}
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card
        title="重置密码"
        style={{ width: 450 }}
        headStyle={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}
      >
        {tokenData && (
          <Alert
            message={`正在为 ${tokenData.username} 重置密码`}
            description={`邮箱: ${tokenData.email}`}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          name="reset-password"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少8个字符' },
              { max: 50, message: '密码最多50个字符' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve()
                  if (!validatePasswordMinimum(value)) {
                    return Promise.reject('密码强度不足，至少需要8位且包含字母和数字')
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入新密码(至少8个字符)"
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Form.Item>

          {newPassword && (
            <Form.Item>
              <PasswordStrengthIndicator password={newPassword} />
            </Form.Item>
          )}

          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              重置密码
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#667eea' }}>
            返回登录
          </Link>
        </div>

        <Alert
          message="密码安全提示"
          description={
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
              <li>密码长度至少8个字符</li>
              <li>建议使用大小写字母、数字和特殊字符的组合</li>
              <li>不要使用过于简单或容易被猜到的密码</li>
              <li>不要与其他网站使用相同的密码</li>
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginTop: 16, fontSize: 12 }}
        />
      </Card>
    </div>
  )
}

export default ResetPassword
