import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, message, Alert, Space, Collapse, Table, Tag } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined, CrownOutlined, TeamOutlined, EyeOutlined, EditOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import { login } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

const { Panel } = Collapse

// 测试账号列表
const testAccounts = [
  { username: 'admin', password: 'admin123', role: 'super_admin', roleName: '超级管理员', icon: <CrownOutlined />, color: 'red' },
  { username: 'manager', password: 'manager123', role: 'manager', roleName: '经理', icon: <TeamOutlined />, color: 'cyan' },
  { username: 'editor', password: 'editor123', role: 'editor', roleName: '编辑', icon: <EditOutlined />, color: 'blue' },
  { username: 'viewer', password: 'viewer123', role: 'viewer', roleName: '访客', icon: <EyeOutlined />, color: 'default' },
  { username: 'cs_manager', password: 'cs_manager123', role: 'cs_manager', roleName: '客服主管', icon: <CustomerServiceOutlined />, color: 'purple' },
  { username: 'cs_agent', password: 'cs_agent123', role: 'cs_agent', roleName: '客服专员', icon: <CustomerServiceOutlined />, color: 'geekblue' },
  { username: 'cs_manager_test', password: 'Test123456', role: 'cs_manager', roleName: '客服主管(测试)', icon: <CustomerServiceOutlined />, color: 'purple' },
  { username: 'cs_agent_test', password: 'Test123456', role: 'cs_agent', roleName: '客服专员(测试)', icon: <CustomerServiceOutlined />, color: 'geekblue' },
]

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

  // 快速填充测试账号
  const handleQuickFill = (username: string, password: string) => {
    form.setFieldsValue({ username, password })
    message.info(`已填充测试账号: ${username}`)
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
        title="LUCK.DAY 管理后台"
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
            {/* 测试账号列表 */}
            <Collapse
              ghost
              style={{ marginBottom: 16 }}
              items={[
                {
                  key: 'test-accounts',
                  label: (
                    <div style={{ textAlign: 'center', color: '#667eea', fontWeight: 500 }}>
                      📝 测试账号列表（点击展开）
                    </div>
                  ),
                  children: (
                    <div style={{ marginTop: -8 }}>
                      <div style={{ marginBottom: 12, fontSize: 12, color: '#999', textAlign: 'center' }}>
                        点击账号可快速填充到表单
                      </div>
                      <Table
                        dataSource={testAccounts}
                        pagination={false}
                        size="small"
                        rowKey="username"
                        onRow={(record) => ({
                          onClick: () => handleQuickFill(record.username, record.password),
                          style: { cursor: 'pointer' }
                        })}
                        columns={[
                          {
                            title: '角色',
                            dataIndex: 'roleName',
                            key: 'roleName',
                            width: 100,
                            render: (text: string, record: any) => (
                              <Tag color={record.color} icon={record.icon}>
                                {text}
                              </Tag>
                            )
                          },
                          {
                            title: '用户名',
                            dataIndex: 'username',
                            key: 'username',
                            render: (text: string) => <code style={{ color: '#667eea' }}>{text}</code>
                          },
                          {
                            title: '密码',
                            dataIndex: 'password',
                            key: 'password',
                            render: (text: string) => <code style={{ color: '#667eea' }}>{text}</code>
                          },
                        ]}
                      />
                    </div>
                  )
                }
              ]}
            />

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
