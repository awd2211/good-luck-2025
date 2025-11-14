/**
 * SMTP配置表单组件
 */
import { useState } from 'react'
import {
  Form, Input, Select, Switch, Button, Alert, message, InputNumber, Row, Col
} from 'antd'
import { MailOutlined, SendOutlined } from '@ant-design/icons'
import api from '../services/apiService'

const { Option } = Select

interface SmtpConfigFormProps {
  initialValues?: any
  onValuesChange?: (values: any) => void
}

const SmtpConfigForm = ({ initialValues, onValuesChange }: SmtpConfigFormProps) => {
  const [form] = Form.useForm()
  const [provider, setProvider] = useState(initialValues?.provider || 'gmail')
  const [testing, setTesting] = useState(false)

  // 预设配置
  const providerPresets: Record<string, any> = {
    gmail: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
    },
    mailgun: {
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
    },
    outlook: {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
    },
    qq: {
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
    },
    '163': {
      host: 'smtp.163.com',
      port: 465,
      secure: true,
    },
    custom: {
      host: '',
      port: 587,
      secure: false,
    }
  }

  // 切换提供商时自动填充配置
  const handleProviderChange = (value: string) => {
    setProvider(value)
    const preset = providerPresets[value]
    if (preset) {
      form.setFieldsValue({
        host: preset.host,
        port: preset.port,
        secure: preset.secure,
      })
    }
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

      // 构造SMTP配置
      const smtpConfig = {
        provider: values.provider,
        host: values.host,
        port: values.port,
        secure: values.secure,
        user: values.user,
        password: values.password,
        from_name: values.from_name,
        from_email: values.from_email || values.user,
        mailgun_domain: values.mailgun_domain,
        mailgun_api_key: values.mailgun_api_key,
      }

      const res = await api.post('/email/test', {
        toEmail: values.test_email,
        smtpConfig
      })

      if (res.data.success) {
        message.success('测试邮件已发送，请检查邮箱（包括垃圾邮件文件夹）')
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
      initialValues={initialValues}
      onValuesChange={(_, allValues) => {
        onValuesChange?.(allValues)
      }}
    >
      <Alert
        message="SMTP邮件配置说明"
        description={
          <div>
            <p>• 用于发送密码重置邮件、2FA验证通知等系统邮件</p>
            <p>• Gmail需要启用"应用专用密码"，不能使用账号密码</p>
            <p>• Mailgun需要配置域名和API密钥</p>
            <p>• 配置完成后请务必发送测试邮件验证</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="provider"
            label="邮件服务提供商"
            rules={[{ required: true, message: '请选择邮件服务提供商' }]}
          >
            <Select onChange={handleProviderChange} placeholder="选择邮件服务商">
              <Option value="gmail">Gmail</Option>
              <Option value="mailgun">Mailgun</Option>
              <Option value="outlook">Outlook / Hotmail</Option>
              <Option value="qq">QQ邮箱</Option>
              <Option value="163">163邮箱</Option>
              <Option value="custom">自定义SMTP服务器</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="enabled"
            label="启用SMTP服务"
            valuePropName="checked"
          >
            <Switch checkedChildren="已启用" unCheckedChildren="已禁用" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Form.Item
            name="host"
            label="SMTP服务器地址"
            rules={[{ required: true, message: '请输入SMTP服务器地址' }]}
          >
            <Input placeholder="smtp.gmail.com" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            name="port"
            label="端口"
            rules={[{ required: true, message: '请输入端口' }]}
          >
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            name="secure"
            label="使用SSL/TLS"
            valuePropName="checked"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="user"
            label="SMTP用户名 / 邮箱地址"
            rules={[{ required: true, message: '请输入SMTP用户名' }]}
          >
            <Input placeholder="your-email@gmail.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="password"
            label="SMTP密码 / 应用专用密码"
            rules={[{ required: true, message: '请输入SMTP密码' }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="from_name"
            label="发件人名称"
            rules={[{ required: true, message: '请输入发件人名称' }]}
          >
            <Input placeholder="算命平台管理后台" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="from_email"
            label="发件人邮箱地址（可选）"
            help="留空则使用SMTP用户名"
          >
            <Input placeholder="noreply@fortune.com" />
          </Form.Item>
        </Col>
      </Row>

      {provider === 'mailgun' && (
        <>
          <Alert
            message="Mailgun配置"
            description="使用Mailgun时需要提供域名和API密钥"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mailgun_domain"
                label="Mailgun域名"
                rules={provider === 'mailgun' ? [{ required: true, message: '请输入Mailgun域名' }] : []}
              >
                <Input placeholder="mg.yourdomain.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mailgun_api_key"
                label="Mailgun API密钥"
                rules={provider === 'mailgun' ? [{ required: true, message: '请输入Mailgun API密钥' }] : []}
              >
                <Input.Password placeholder="key-••••••••" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      <Alert
        message="测试邮件配置"
        description="配置完成后，发送测试邮件验证SMTP设置是否正确"
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16}>
        <Col span={16}>
          <Form.Item
            name="test_email"
            label="测试邮箱地址"
            help="输入您的邮箱地址，点击发送测试邮件"
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
            >
              发送测试邮件
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )
}

export default SmtpConfigForm
