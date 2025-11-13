import { Card, Form, Input, Button, Switch, Select, message, Space } from 'antd'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'

const Settings = () => {
  const [form] = Form.useForm()
  const checkPermission = usePermission()

  const onFinish = (values: any) => {
    console.log('设置保存:', values)
    message.success('设置已保存')
  }

  return (
    <PermissionGuard permission={Permission.SETTINGS_VIEW}>
      <div>
        <Card title="系统设置">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            siteName: '算命平台',
            contactEmail: 'admin@fortune.com',
            contactPhone: '400-888-8888',
            enableRegistration: true,
            enablePayment: true,
            currency: 'CNY',
            defaultLanguage: 'zh-CN',
          }}
        >
          <h3>基本设置</h3>
          <Form.Item
            label="网站名称"
            name="siteName"
            rules={[{ required: true, message: '请输入网站名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="联系邮箱"
            name="contactEmail"
            rules={[{ required: true, type: 'email', message: '请输入有效的邮箱' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="联系电话"
            name="contactPhone"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input />
          </Form.Item>

          <h3 style={{ marginTop: 32 }}>功能设置</h3>
          <Form.Item
            label="允许用户注册"
            name="enableRegistration"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="启用支付功能"
            name="enablePayment"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="货币单位"
            name="currency"
          >
            <Select
              options={[
                { label: '人民币 (CNY)', value: 'CNY' },
                { label: '美元 (USD)', value: 'USD' },
                { label: '欧元 (EUR)', value: 'EUR' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="默认语言"
            name="defaultLanguage"
          >
            <Select
              options={[
                { label: '简体中文', value: 'zh-CN' },
                { label: '繁体中文', value: 'zh-TW' },
                { label: 'English', value: 'en-US' },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              {checkPermission.has(Permission.SETTINGS_EDIT) && (
                <Button type="primary" htmlType="submit">
                  保存设置
                </Button>
              )}
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
    </PermissionGuard>
  )
}

export default Settings
