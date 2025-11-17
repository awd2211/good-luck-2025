import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Select, message, Tag, Space, Switch, Modal, Alert, Image, Row, Col, Avatar, Statistic, Collapse, Typography } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, SafetyOutlined, QrcodeOutlined, KeyOutlined, EditOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { roleNames } from '../config/permissions'
import api from '../services/api'
import dayjs from 'dayjs'
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator'
import { validatePasswordMinimum } from '../utils/passwordStrength'

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

const ProfileSettings = () => {
  const { user, updateUser } = useAuth()
  const [passwordForm] = Form.useForm()
  const [profileForm] = Form.useForm()
  const [twoFactorForm] = Form.useForm()
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  // 2FA 相关状态
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading2FA, setLoading2FA] = useState(false)
  const [setupModalVisible, setSetupModalVisible] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  // 获取2FA状态
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const response = await api.get('/auth/2fa/status')
        if (response.data.success) {
          setTwoFactorEnabled(response.data?.data?.enabled || false)
        }
      } catch (error) {
        console.error('获取2FA状态失败:', error)
      }
    }
    fetch2FAStatus()
  }, [])

  const handlePasswordChange = async () => {
    try {
      setLoadingPassword(true)
      const values = await passwordForm.validateFields()

      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致')
        return
      }

      await api.post('/auth/change-password', {
        old_password: values.oldPassword,
        new_password: values.newPassword,
      })

      message.success('密码修改成功')
      passwordForm.resetFields()
      setNewPassword('')
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败')
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setLoadingProfile(true)
      const values = await profileForm.validateFields()

      await api.put('/auth/profile', {
        email: values.email,
        phone: values.phone,
        language: values.language,
        timezone: values.timezone,
      })

      // 更新本地用户信息
      if (updateUser) {
        updateUser({
          ...user!,
          email: values.email,
          phone: values.phone,
          language: values.language,
          timezone: values.timezone,
        })
      }

      message.success('个人信息更新成功')
    } catch (error: any) {
      message.error(error.response?.data?.message || '个人信息更新失败')
    } finally {
      setLoadingProfile(false)
    }
  }

  // 2FA 相关处理函数
  const handleEnable2FA = async () => {
    try {
      setLoading2FA(true)
      const response = await api.post('/auth/2fa/setup')

      if (response.data.success) {
        setQrCode(response.data?.data?.qrCode || '')
        setSecret(response.data?.data?.secret || '')
        setBackupCodes(response.data?.data?.backupCodes || [])
        setSetupModalVisible(true)
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '生成2FA配置失败')
    } finally {
      setLoading2FA(false)
    }
  }

  const handleConfirmEnable2FA = async () => {
    try {
      const values = await twoFactorForm.validateFields()
      setLoading2FA(true)

      const response = await api.post('/auth/2fa/enable', {
        secret,
        token: values.token,
        backupCodes,
      })

      if (response.data.success) {
        message.success('双因素认证已启用')
        setTwoFactorEnabled(true)
        setSetupModalVisible(false)
        setShowBackupCodes(true)
        twoFactorForm.resetFields()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '启用2FA失败')
    } finally {
      setLoading2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    Modal.confirm({
      title: '禁用双因素认证',
      content: (
        <div>
          <Alert
            message="警告"
            description="禁用双因素认证会降低账户安全性。请输入您的密码以确认此操作。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form>
            <Form.Item label="密码" name="password">
              <Input.Password id="disable-2fa-password" placeholder="请输入密码" />
            </Form.Item>
          </Form>
        </div>
      ),
      onOk: async () => {
        const passwordInput = document.getElementById('disable-2fa-password') as HTMLInputElement
        const password = passwordInput?.value

        if (!password) {
          message.error('请输入密码')
          throw new Error('缺少密码')
        }

        try {
          const response = await api.post('/auth/2fa/disable', { password })

          if (response.data.success) {
            message.success('双因素认证已禁用')
            setTwoFactorEnabled(false)
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '禁用2FA失败')
          throw error
        }
      },
    })
  }

  // 获取用户首字母作为头像
  const getUserInitial = () => {
    return user?.username?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <div style={{ padding: '0 8px' }}>
      {/* 顶部用户信息卡片 */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none'
        }}
        bodyStyle={{ padding: '32px 24px' }}
      >
        <Row gutter={24} align="middle">
          <Col>
            <Avatar
              size={80}
              style={{
                backgroundColor: '#fff',
                color: '#667eea',
                fontSize: 32,
                fontWeight: 'bold',
                border: '4px solid rgba(255,255,255,0.3)'
              }}
            >
              {getUserInitial()}
            </Avatar>
          </Col>
          <Col flex="auto">
            <Title level={3} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
              {user?.username}
            </Title>
            <Space size="large">
              <Space>
                <UserOutlined style={{ color: 'rgba(255,255,255,0.8)' }} />
                <Text style={{ color: '#fff' }}>{user?.id}</Text>
              </Space>
              <Tag color="blue" style={{ margin: 0 }}>
                {user?.role ? roleNames[user.role as keyof typeof roleNames] : '未知'}
              </Tag>
              <Tag color="success" style={{ margin: 0 }}>
                <CheckCircleOutlined /> 账户正常
              </Tag>
            </Space>
          </Col>
          <Col>
            <Row gutter={32}>
              <Col>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>注册时间</span>}
                  value={user?.created_at ? dayjs(user.created_at).format('YYYY-MM-DD') : '-'}
                  valueStyle={{ color: '#fff', fontSize: 16 }}
                />
              </Col>
              <Col>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>最后登录</span>}
                  value={user?.last_login ? dayjs(user.last_login).format('YYYY-MM-DD') : '-'}
                  valueStyle={{ color: '#fff', fontSize: 16 }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 设置卡片网格 */}
      <Row gutter={[24, 24]}>
        {/* 个人信息 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: '#1890ff' }} />
                <span>个人信息</span>
              </Space>
            }
            extra={<EditOutlined style={{ color: '#999' }} />}
            hoverable
            style={{ height: '100%' }}
          >
            <Collapse
              bordered={false}
              defaultActiveKey={['1']}
              style={{ background: 'transparent' }}
            >
              <Panel header="编辑个人资料" key="1">
                <Form
                  form={profileForm}
                  layout="vertical"
                  initialValues={{
                    email: user?.email || '',
                    phone: user?.phone || '',
                    language: user?.language || 'zh-CN',
                    timezone: user?.timezone || 'Asia/Shanghai',
                  }}
                >
                  <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="请输入邮箱地址"
                      maxLength={100}
                    />
                  </Form.Item>

                  <Form.Item
                    label="手机号"
                    name="phone"
                    rules={[
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="请输入手机号码"
                      maxLength={11}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      onClick={handleProfileUpdate}
                      loading={loadingProfile}
                      block
                    >
                      保存个人信息
                    </Button>
                  </Form.Item>
                </Form>
              </Panel>
            </Collapse>
          </Card>
        </Col>

        {/* 系统偏好 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SettingOutlined style={{ color: '#52c41a' }} />
                <span>系统偏好</span>
              </Space>
            }
            hoverable
            style={{ height: '100%' }}
          >
            <Collapse
              bordered={false}
              defaultActiveKey={['1']}
              style={{ background: 'transparent' }}
            >
              <Panel header="语言和时区设置" key="1">
                <Form
                  form={profileForm}
                  layout="vertical"
                  initialValues={{
                    language: user?.language || 'zh-CN',
                    timezone: user?.timezone || 'Asia/Shanghai',
                  }}
                >
                  <Form.Item
                    label="语言偏好"
                    name="language"
                    rules={[{ required: true, message: '请选择语言' }]}
                  >
                    <Select placeholder="请选择语言">
                      <Select.Option value="zh-CN">🇨🇳 简体中文</Select.Option>
                      <Select.Option value="zh-TW">🇹🇼 繁體中文</Select.Option>
                      <Select.Option value="en-US">🇺🇸 English</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="时区"
                    name="timezone"
                    rules={[{ required: true, message: '请选择时区' }]}
                  >
                    <Select placeholder="请选择时区" showSearch>
                      <Select.Option value="Asia/Shanghai">中国标准时间 (UTC+8)</Select.Option>
                      <Select.Option value="Asia/Hong_Kong">香港时间 (UTC+8)</Select.Option>
                      <Select.Option value="Asia/Taipei">台北时间 (UTC+8)</Select.Option>
                      <Select.Option value="Asia/Tokyo">东京时间 (UTC+9)</Select.Option>
                      <Select.Option value="America/New_York">纽约时间 (UTC-5)</Select.Option>
                      <Select.Option value="America/Los_Angeles">洛杉矶时间 (UTC-8)</Select.Option>
                      <Select.Option value="Europe/London">伦敦时间 (UTC+0)</Select.Option>
                      <Select.Option value="Europe/Paris">巴黎时间 (UTC+1)</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      onClick={handleProfileUpdate}
                      loading={loadingProfile}
                      block
                    >
                      保存偏好设置
                    </Button>
                  </Form.Item>
                </Form>
              </Panel>
            </Collapse>
          </Card>
        </Col>

        {/* 安全设置 - 修改密码 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <LockOutlined style={{ color: '#fa8c16' }} />
                <span>密码安全</span>
              </Space>
            }
            hoverable
            style={{ height: '100%' }}
          >
            <Collapse
              bordered={false}
              style={{ background: 'transparent' }}
            >
              <Panel header="修改登录密码" key="1">
                <Form
                  form={passwordForm}
                  layout="vertical"
                >
                  <Form.Item
                    label="当前密码"
                    name="oldPassword"
                    rules={[{ required: true, message: '请输入当前密码' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入当前密码"
                      maxLength={50}
                    />
                  </Form.Item>

                  <Form.Item
                    label="新密码"
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
                      maxLength={50}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </Form.Item>

                  {newPassword && (
                    <Form.Item>
                      <PasswordStrengthIndicator password={newPassword} />
                    </Form.Item>
                  )}

                  <Form.Item
                    label="确认新密码"
                    name="confirmPassword"
                    rules={[
                      { required: true, message: '请再次输入新密码' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请再次输入新密码"
                      maxLength={50}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space style={{ width: '100%' }} direction="vertical" size="small">
                      <Button
                        type="primary"
                        onClick={handlePasswordChange}
                        loading={loadingPassword}
                        block
                      >
                        修改密码
                      </Button>
                      <Alert
                        message="密码应至少8位，包含字母和数字"
                        type="info"
                        showIcon
                        style={{ fontSize: 12 }}
                      />
                    </Space>
                  </Form.Item>
                </Form>
              </Panel>
            </Collapse>
          </Card>
        </Col>

        {/* 双因素认证 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SafetyOutlined style={{ color: '#f5222d' }} />
                <span>双因素认证</span>
              </Space>
            }
            extra={
              <Tag color={twoFactorEnabled ? 'success' : 'default'}>
                {twoFactorEnabled ? '已启用' : '未启用'}
              </Tag>
            }
            hoverable
            style={{ height: '100%' }}
          >
            <div style={{ padding: '16px 0' }}>
              <Alert
                message="增强账户安全"
                description="启用双因素认证，登录时需要额外的动态验证码"
                type={twoFactorEnabled ? 'success' : 'warning'}
                showIcon
                icon={<SafetyOutlined />}
                style={{ marginBottom: 24 }}
              />

              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong>双因素认证状态</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {twoFactorEnabled ? '登录时需要验证码' : '建议启用以提高安全性'}
                    </Text>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onChange={(checked) => {
                      if (checked) {
                        handleEnable2FA()
                      } else {
                        handleDisable2FA()
                      }
                    }}
                    loading={loading2FA}
                  />
                </div>

                {twoFactorEnabled && (
                  <Alert
                    message="更换设备时请使用备用恢复代码登录"
                    type="info"
                    showIcon
                  />
                )}
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 2FA设置模态框 */}
      <Modal
        title="启用双因素认证"
        open={setupModalVisible}
        onCancel={() => {
          setSetupModalVisible(false)
          twoFactorForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <div style={{ padding: '16px 0' }}>
          <Alert
            message="请按照以下步骤设置双因素认证"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div style={{ marginBottom: 24 }}>
            <Title level={5}>
              <QrcodeOutlined /> 步骤 1: 扫描二维码
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 12 }}>
              使用Google Authenticator、Authy或其他身份验证器应用扫描此二维码
            </Paragraph>
            {qrCode && (
              <div style={{ textAlign: 'center', background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                <Image src={qrCode} alt="QR Code" style={{ maxWidth: 200 }} preview={false} />
              </div>
            )}
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <KeyOutlined /> 或手动输入密钥: <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>{secret}</code>
              </Text>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5}>
              <SafetyOutlined /> 步骤 2: 输入验证码
            </Title>
            <Form form={twoFactorForm} onFinish={handleConfirmEnable2FA}>
              <Form.Item
                name="token"
                rules={[
                  { required: true, message: '请输入验证码' },
                  { len: 6, message: '验证码为6位数字' },
                  { pattern: /^[0-9]+$/, message: '验证码只能包含数字' }
                ]}
              >
                <Input
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  style={{ letterSpacing: '0.5em', fontSize: 20, textAlign: 'center' }}
                  autoFocus
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading2FA} block>
                  验证并启用
                </Button>
              </Form.Item>
            </Form>
          </div>

          <Alert
            message="重要提示"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>启用双因素认证后，系统将生成8个备用恢复代码。</p>
                <p style={{ marginBottom: 0 }}>请务必保存这些代码，以防手机丢失或无法访问身份验证器应用。</p>
              </div>
            }
            type="warning"
            showIcon
          />
        </div>
      </Modal>

      {/* 备用代码模态框 */}
      <Modal
        title="备用恢复代码"
        open={showBackupCodes}
        onCancel={() => setShowBackupCodes(false)}
        footer={[
          <Button
            key="copy"
            onClick={() => {
              navigator.clipboard.writeText(backupCodes.join('\n'))
              message.success('备用代码已复制到剪贴板')
            }}
          >
            复制代码
          </Button>,
          <Button key="close" type="primary" onClick={() => setShowBackupCodes(false)}>
            我已保存
          </Button>,
        ]}
      >
        <Alert
          message="请妥善保存这些备用恢复代码"
          description="每个代码只能使用一次。当您无法访问身份验证器应用时，可以使用这些代码登录。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, fontFamily: 'monospace' }}>
          {backupCodes.map((code, index) => (
            <div key={index} style={{ padding: '4px 0', fontSize: 16 }}>
              {index + 1}. {code}
            </div>
          ))}
        </div>
        <Alert
          message="重要提示"
          description={
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
              <li>请将这些代码打印出来或保存到安全的地方</li>
              <li>不要将代码分享给任何人</li>
              <li>使用后该代码将自动失效</li>
            </ul>
          }
          type="info"
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  )
}

export default ProfileSettings
