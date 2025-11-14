import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, message, Alert, Space } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { login } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null)
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [form] = Form.useForm()

  const onFinish = async (values: { username: string; password: string; twoFactorToken?: string }) => {
    setLoading(true)
    try {
      // 如果是2FA验证阶段，使用保存的凭据
      const loginData = requiresTwoFactor && credentials
        ? { ...credentials, twoFactorToken: values.twoFactorToken }
        : values

      // 调用真实的登录API
      const response = await login(loginData)

      if (response.success && response.data) {
        // 登录成功
        authLogin(response.data.token, response.data.user)
        message.success('登录成功')
        navigate('/')
      } else if (response.requiresTwoFactor) {
        // 需要2FA验证
        setRequiresTwoFactor(true)
        setCredentials({ username: values.username, password: values.password })
        message.info(response.message || '请输入双因素认证码')
      } else {
        message.error(response.message || '登录失败')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || '登录失败，请检查网络连接'
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false)
    setCredentials(null)
    form.resetFields(['twoFactorToken'])
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
        title="算命平台管理后台"
        style={{ width: 400 }}
        headStyle={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}
      >
        {requiresTwoFactor && (
          <Alert
            message="需要双因素认证"
            description="请在身份验证器应用中查看6位验证码，或使用备用恢复代码。"
            type="info"
            showIcon
            icon={<SafetyOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          {!requiresTwoFactor ? (
            <>
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名: admin" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码: admin123" />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="twoFactorToken"
              rules={[
                { required: true, message: '请输入验证码' },
                { len: 6, message: '验证码为6位数字' },
                { pattern: /^[0-9A-F]+$/i, message: '验证码格式不正确' }
              ]}
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="6位验证码或8位备用代码"
                maxLength={8}
                autoFocus
                style={{ letterSpacing: '0.3em', fontSize: 18, textAlign: 'center' }}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                {requiresTwoFactor ? '验证' : '登录'}
              </Button>
              {requiresTwoFactor && (
                <Button onClick={handleBackToLogin} block>
                  返回登录
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>

        {!requiresTwoFactor && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Link to="/forgot-password" style={{ color: '#667eea' }}>
                忘记密码？
              </Link>
            </div>
            <div style={{ textAlign: 'center', color: '#888', fontSize: 12 }}>
              默认账号：admin / admin123
            </div>
          </>
        )}

        {requiresTwoFactor && (
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 8 }}>
            提示：如果无法访问身份验证器，请使用备用恢复代码
          </div>
        )}
      </Card>
    </div>
  )
}

export default Login
