/**
 * 邮件配置表单组件
 * 正确分类：
 * 1. SMTP协议发送 - 使用标准SMTP协议的邮件服务器（包括Gmail SMTP、QQ SMTP、自定义SMTP等）
 * 2. 第三方API服务 - 使用专有API的邮件服务（包括Mailgun API、SendGrid API、Amazon SES等）
 */
import { useState } from 'react'
import {
  Form, Input, Select, Switch, Button, Alert, message, InputNumber, Row, Col, Radio, Divider, Card
} from 'antd'
import { MailOutlined, SendOutlined, InfoCircleOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Option } = Select

interface SmtpConfigFormProps {
  initialValues?: any
  onValuesChange?: (values: any) => void
}

const SmtpConfigForm = ({ initialValues, onValuesChange }: SmtpConfigFormProps) => {
  const [form] = Form.useForm()
  const [emailType, setEmailType] = useState(initialValues?.email_type || 'smtp')
  const [apiProvider, setApiProvider] = useState(initialValues?.api_provider || 'mailgun')
  const [testing, setTesting] = useState(false)

  // 第三方API服务提供商配置
  const apiProviders: Record<string, any> = {
    mailgun: {
      name: 'Mailgun',
      description: '专业的邮件发送服务，提供高送达率和详细的统计分析',
      website: 'https://www.mailgun.com',
      help: '需要在Mailgun注册账号并验证域名，免费计划每月可发送5000封邮件',
    },
    sendgrid: {
      name: 'SendGrid',
      description: 'Twilio旗下的邮件发送服务，功能强大',
      website: 'https://sendgrid.com',
      help: '需要在SendGrid注册账号，免费计划每月可发送100封邮件',
    },
    ses: {
      name: 'Amazon SES',
      description: 'AWS的邮件发送服务，成本低廉',
      website: 'https://aws.amazon.com/ses',
      help: '需要AWS账号，按使用量付费',
    },
  }

  // 切换邮件服务类型
  const handleEmailTypeChange = (value: string) => {
    setEmailType(value)
  }

  // 切换第三方API提供商
  const handleApiProviderChange = (value: string) => {
    setApiProvider(value)
  }

  // 发送测试邮件
  const handleTestEmail = async () => {
    try {
      const values = await form.validateFields()

      if (!values.test_email) {
        message.warning('请先填写测试邮箱地址')
        return
      }

      setTesting(true)

      // 根据邮件服务类型构造不同的配置
      let emailConfig: any = {
        email_type: values.email_type,
        from_name: values.from_name,
        from_email: values.from_email,
      }

      if (values.email_type === 'smtp') {
        // SMTP协议发送
        emailConfig = {
          ...emailConfig,
          smtp_host: values.smtp_host,
          smtp_port: values.smtp_port,
          smtp_secure: values.smtp_secure,
          smtp_user: values.smtp_user,
          smtp_password: values.smtp_password,
        }
      } else if (values.email_type === 'third_party_api') {
        // 第三方API服务
        emailConfig = {
          ...emailConfig,
          api_provider: values.api_provider,
        }

        // 根据不同的提供商添加对应的配置
        if (values.api_provider === 'mailgun') {
          emailConfig.mailgun_domain = values.mailgun_domain
          emailConfig.mailgun_api_key = values.mailgun_api_key
          emailConfig.mailgun_region = values.mailgun_region || 'us'
        } else if (values.api_provider === 'sendgrid') {
          emailConfig.sendgrid_api_key = values.sendgrid_api_key
        } else if (values.api_provider === 'ses') {
          emailConfig.ses_region = values.ses_region
          emailConfig.ses_access_key = values.ses_access_key
          emailConfig.ses_secret_key = values.ses_secret_key
        }
      }

      const res = await api.post('/email/test', {
        toEmail: values.test_email,
        emailConfig
      })

      if (res.data.success) {
        message.success('测试邮件已发送成功！请检查收件箱（包括垃圾邮件文件夹）')
      } else {
        message.error(res.data.message || '测试邮件发送失败')
      }
    } catch (error: any) {
      console.error('测试邮件发送失败:', error)
      message.error(error.response?.data?.message || error.message || '测试邮件发送失败')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        email_type: 'smtp',
        smtp_port: 587,
        smtp_secure: false,
        api_provider: 'mailgun',
        mailgun_region: 'us',
        ses_region: 'us-east-1',
        enabled: true,
        ...initialValues
      }}
      onValuesChange={(_, allValues) => {
        onValuesChange?.(allValues)
      }}
    >
      <Alert
        message="邮件配置说明"
        description={
          <div>
            <p><strong>SMTP协议发送</strong>：使用标准SMTP协议发送邮件，适用于任何支持SMTP的邮件服务器（自建服务器、企业邮箱、个人邮箱等）</p>
            <p><strong>第三方API服务</strong>：使用专业邮件服务商的专有API发送邮件（如Mailgun、SendGrid、Amazon SES等），通常具有更高的送达率和完善的统计分析功能</p>
            <p>• 系统邮件用途：密码重置、2FA验证、订单通知等</p>
            <p>• 配置完成后请务必发送测试邮件验证</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="email_type"
            label="邮件服务类型"
            rules={[{ required: true, message: '请选择邮件服务类型' }]}
          >
            <Radio.Group onChange={(e) => handleEmailTypeChange(e.target.value)}>
              <Radio.Button value="smtp">SMTP协议发送</Radio.Button>
              <Radio.Button value="third_party_api">第三方API服务</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="enabled"
            label="启用邮件服务"
            valuePropName="checked"
          >
            <Switch checkedChildren="已启用" unCheckedChildren="已禁用" />
          </Form.Item>
        </Col>
      </Row>

      {/* ==================== SMTP协议发送配置 ==================== */}
      {emailType === 'smtp' && (
        <Card title="SMTP服务器配置" size="small" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="smtp_host"
                label="SMTP服务器地址"
                rules={[{ required: true, message: '请输入SMTP服务器地址' }]}
              >
                <Input placeholder="例如: smtp.gmail.com" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="smtp_port"
                label="端口"
                rules={[{ required: true, message: '请输入端口' }]}
              >
                <InputNumber min={1} max={65535} style={{ width: '100%' }} placeholder="587" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="smtp_secure"
                label="SSL/TLS"
                valuePropName="checked"
                help="465端口通常需要开启"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="smtp_user"
                label="SMTP用户名"
                rules={[{ required: true, message: '请输入SMTP用户名' }]}
                help="通常是完整的邮箱地址"
              >
                <Input placeholder="your-email@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="smtp_password"
                label="SMTP密码"
                rules={[{ required: true, message: '请输入SMTP密码' }]}
                help="Gmail/QQ等需要使用应用专用密码或授权码"
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      )}

      {/* ==================== 第三方API服务配置 ==================== */}
      {emailType === 'third_party_api' && (
        <Card title="第三方API服务配置" size="small" style={{ marginBottom: 24 }}>
          <Form.Item
            name="api_provider"
            label="服务提供商"
            rules={[{ required: true, message: '请选择服务提供商' }]}
          >
            <Select onChange={handleApiProviderChange} placeholder="选择服务提供商">
              <Option value="mailgun">Mailgun</Option>
              <Option value="sendgrid">SendGrid</Option>
              <Option value="ses">Amazon SES</Option>
            </Select>
          </Form.Item>

          {apiProvider && apiProviders[apiProvider] && (
            <Alert
              message={apiProviders[apiProvider].name}
              description={
                <div>
                  <p>{apiProviders[apiProvider].description}</p>
                  <p>{apiProviders[apiProvider].help}</p>
                  <p>官网：<a href={apiProviders[apiProvider].website} target="_blank" rel="noopener noreferrer">{apiProviders[apiProvider].website}</a></p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Mailgun 配置 */}
          {apiProvider === 'mailgun' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="mailgun_domain"
                    label="Mailgun域名"
                    rules={[{ required: true, message: '请输入Mailgun域名' }]}
                    help="在Mailgun控制台中配置的发送域名"
                  >
                    <Input placeholder="mg.yourdomain.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="mailgun_region"
                    label="Mailgun区域"
                    rules={[{ required: true, message: '请选择区域' }]}
                  >
                    <Select>
                      <Option value="us">美国 (US)</Option>
                      <Option value="eu">欧洲 (EU)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="mailgun_api_key"
                label="Mailgun API密钥"
                rules={[{ required: true, message: '请输入Mailgun API密钥' }]}
                help="在Mailgun控制台的Settings > API Keys中获取"
              >
                <Input.Password placeholder="key-••••••••••••••••••••••••••••••••" />
              </Form.Item>
            </>
          )}

          {/* SendGrid 配置 */}
          {apiProvider === 'sendgrid' && (
            <Form.Item
              name="sendgrid_api_key"
              label="SendGrid API密钥"
              rules={[{ required: true, message: '请输入SendGrid API密钥' }]}
              help="在SendGrid控制台的Settings > API Keys中创建"
            >
              <Input.Password placeholder="SG.••••••••••••••••••••••••••••••••" />
            </Form.Item>
          )}

          {/* Amazon SES 配置 */}
          {apiProvider === 'ses' && (
            <>
              <Form.Item
                name="ses_region"
                label="AWS区域"
                rules={[{ required: true, message: '请选择AWS区域' }]}
              >
                <Select placeholder="选择AWS区域">
                  <Option value="us-east-1">美国东部（弗吉尼亚北部）</Option>
                  <Option value="us-west-2">美国西部（俄勒冈）</Option>
                  <Option value="eu-west-1">欧洲（爱尔兰）</Option>
                  <Option value="ap-southeast-1">亚太地区（新加坡）</Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="ses_access_key"
                    label="AWS Access Key ID"
                    rules={[{ required: true, message: '请输入Access Key' }]}
                  >
                    <Input placeholder="AKIA••••••••••••••••" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="ses_secret_key"
                    label="AWS Secret Access Key"
                    rules={[{ required: true, message: '请输入Secret Key' }]}
                  >
                    <Input.Password placeholder="••••••••••••••••••••••••••••••••" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Card>
      )}

      <Divider />

      {/* ==================== 发件人信息（通用） ==================== */}
      <Card title="发件人信息" size="small" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="from_name"
              label="发件人名称"
              rules={[{ required: true, message: '请输入发件人名称' }]}
              help="邮件中显示的发件人姓名"
            >
              <Input placeholder="LUCK.DAY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="from_email"
              label="发件人邮箱地址"
              rules={[
                { required: true, message: '请输入发件人邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
              help={emailType === 'smtp' ? 'SMTP方式通常使用smtp_user作为发件地址' : '第三方API服务需要使用已验证域名的邮箱'}
            >
              <Input placeholder="noreply@yourdomain.com" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* ==================== 测试邮件 ==================== */}
      <Card
        title="发送测试邮件"
        size="small"
        style={{ marginBottom: 0 }}
        extra={
          <Alert
            message="配置完成后，建议先发送测试邮件验证设置是否正确"
            type="success"
            showIcon
            style={{ marginBottom: 0 }}
          />
        }
      >
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="test_email"
              label="测试邮箱地址"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
              help="输入您的邮箱地址，系统将发送测试邮件"
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="your-email@example.com"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label=" ">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleTestEmail}
                loading={testing}
                block
                size="large"
              >
                {testing ? '发送中...' : '发送测试邮件'}
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  )
}

export default SmtpConfigForm
