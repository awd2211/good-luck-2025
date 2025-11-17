import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Input, Button, Card, message, Alert, Result } from 'antd'
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import api from '../services/api'

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [email, setEmail] = useState('')

  const onFinish = async (values: { email: string }) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/password-reset/request', {
        email: values.email,
      })

      if (response.data.success) {
        setEmailSent(true)
        setEmail(values.email)
        message.success('重置链接已发送到您的邮箱')
      } else {
        message.error(response.data.message || '请求失败')
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || '请求失败，请稍后重试'
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
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
        title="忘记密码"
        style={{ width: 450 }}
        headStyle={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}
      >
        {!emailSent ? (
          <>
            <Alert
              message="重置密码"
              description="请输入您的邮箱地址，我们将发送密码重置链接到您的邮箱。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              name="forgot-password"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="请输入您的邮箱地址"
                  type="email"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  发送重置链接
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <ArrowLeftOutlined />
                返回登录
              </Link>
            </div>
          </>
        ) : (
          <Result
            status="success"
            title="邮件已发送"
            subTitle={
              <div style={{ color: '#666' }}>
                <p>密码重置链接已发送到 <strong>{email}</strong></p>
                <p style={{ fontSize: 14, marginTop: 16 }}>
                  ✅ 请检查您的邮箱（包括垃圾邮件文件夹）<br />
                  ⏰ 重置链接将在1小时后过期<br />
                  📧 如果没有收到邮件，请检查邮箱地址是否正确
                </p>
              </div>
            }
            extra={[
              <Button type="primary" key="login">
                <Link to="/login">返回登录</Link>
              </Button>,
              <Button key="resend" onClick={() => setEmailSent(false)}>
                重新发送
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  )
}

export default ForgotPassword
