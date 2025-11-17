import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  message,
  Tag,
  Popconfirm,
  Tabs,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  getPaymentConfigs,
  createPaymentConfig,
  updatePaymentConfig,
  deletePaymentConfig,
  testPaymentConfig
} from '../services/paymentManageService'
import type { PaymentConfig } from '../services/paymentManageService'

const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

const PaymentConfigManagement: React.FC = () => {
  const [configs, setConfigs] = useState<PaymentConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingConfig, setEditingConfig] = useState<PaymentConfig | null>(null)
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('paypal')
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox')
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchConfigs()
  }, [activeTab, environment])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const isProduction = environment === 'production'
      const response = await getPaymentConfigs({
        provider: activeTab,
        is_production: isProduction
      })
      setConfigs(response.data.data || [])
    } catch (error) {
      console.error('获取支付配置失败:', error)
      message.error('获取支付配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingConfig(null)
    form.resetFields()
    form.setFieldsValue({
      provider: activeTab,
      is_production: environment === 'production',
      is_enabled: true,
    })
    setModalVisible(true)
  }

  const handleEdit = (config: PaymentConfig) => {
    setEditingConfig(config)
    form.setFieldsValue(config)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentConfig(id)
      message.success('删除成功')
      fetchConfigs()
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingConfig) {
        // 更新
        await updatePaymentConfig(editingConfig.id, values)
        message.success('更新成功')
      } else {
        // 创建
        await createPaymentConfig(values)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchConfigs()
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    }
  }

  const handleTestConfig = async () => {
    try {
      const response = await testPaymentConfig({
        provider: activeTab,
        is_production: environment === 'production',
      })

      message.success(response.data.data?.message || '测试成功')
    } catch (error: any) {
      console.error('测试失败:', error)
      message.error(error.response?.data?.message || '测试配置失败')
    }
  }

  const toggleShowValue = (id: string) => {
    setShowValues(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const columns = [
    {
      title: '配置项',
      dataIndex: 'config_key',
      key: 'config_key',
      render: (text: string) => {
        const keyMap: Record<string, string> = {
          client_id: 'Client ID',
          client_secret: 'Client Secret',
          webhook_secret: 'Webhook Secret',
          publishable_key: 'Publishable Key',
          secret_key: 'Secret Key',
        }
        return keyMap[text] || text
      },
    },
    {
      title: '配置值',
      dataIndex: 'config_value',
      key: 'config_value',
      render: (value: string, record: PaymentConfig) => {
        const isMasked = record.is_masked
        const isVisible = showValues[record.id]

        if (isMasked && !isVisible) {
          return (
            <Space>
              <span>{value}</span>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => toggleShowValue(record.id)}
              >
                显示
              </Button>
            </Space>
          )
        }

        return (
          <Space>
            <span style={{ fontFamily: 'monospace' }}>{value}</span>
            {isMasked && (
              <Button
                type="link"
                size="small"
                icon={<EyeInvisibleOutlined />}
                onClick={() => toggleShowValue(record.id)}
              >
                隐藏
              </Button>
            )}
          </Space>
        )
      },
    },
    {
      title: '环境',
      dataIndex: 'is_production',
      key: 'is_production',
      render: (value: boolean) =>
        value ? <Tag color="red">生产环境</Tag> : <Tag color="blue">测试环境</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (value: boolean) =>
        value ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            启用
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            禁用
          </Tag>
        ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PaymentConfig) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个配置吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const getConfigHints = () => {
    if (activeTab === 'paypal') {
      return (
        <Alert
          message="PayPal配置说明"
          description={
            <div>
              <p>测试环境 (Sandbox):</p>
              <ul>
                <li>Client ID: 在 PayPal Developer Dashboard 的 Sandbox Apps 中获取</li>
                <li>Client Secret: 在同一位置获取</li>
                <li>测试账号: 使用 PayPal Sandbox 测试账号进行测试</li>
              </ul>
              <p>生产环境 (Live):</p>
              <ul>
                <li>需要通过 PayPal 审核后才能使用</li>
                <li>使用真实的 PayPal 账号和资金</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )
    } else if (activeTab === 'stripe') {
      return (
        <Alert
          message="Stripe配置说明"
          description={
            <div>
              <p>测试环境 (Test):</p>
              <ul>
                <li>Publishable Key: 以 pk_test_ 开头</li>
                <li>Secret Key: 以 sk_test_ 开头</li>
                <li>使用测试卡号: 4242 4242 4242 4242</li>
              </ul>
              <p>生产环境 (Live):</p>
              <ul>
                <li>Publishable Key: 以 pk_live_ 开头</li>
                <li>Secret Key: 以 sk_live_ 开头</li>
                <li>需要完成 Stripe 账号激活</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )
    }
    return null
  }

  return (
    <div>
      <Card
        title="支付配置管理"
        extra={
          <Space>
            <Select
              value={environment}
              onChange={setEnvironment}
              style={{ width: 120 }}
            >
              <Option value="sandbox">测试环境</Option>
              <Option value="production">生产环境</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              添加配置
            </Button>
            <Button onClick={handleTestConfig}>测试配置</Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="PayPal" key="paypal">
            {getConfigHints()}
            <Table
              columns={columns}
              dataSource={configs}
              loading={loading}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
          <TabPane tab="Stripe" key="stripe">
            {getConfigHints()}
            <Table
              columns={columns}
              dataSource={configs}
              loading={loading}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingConfig ? '编辑配置' : '添加配置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="provider" label="支付提供商" rules={[{ required: true }]}>
            <Select disabled={!!editingConfig}>
              <Option value="paypal">PayPal</Option>
              <Option value="stripe">Stripe</Option>
            </Select>
          </Form.Item>

          <Form.Item name="config_key" label="配置项" rules={[{ required: true }]}>
            <Select disabled={!!editingConfig}>
              {activeTab === 'paypal' && (
                <>
                  <Option value="client_id">Client ID</Option>
                  <Option value="client_secret">Client Secret</Option>
                  <Option value="webhook_secret">Webhook Secret</Option>
                </>
              )}
              {activeTab === 'stripe' && (
                <>
                  <Option value="publishable_key">Publishable Key</Option>
                  <Option value="secret_key">Secret Key</Option>
                  <Option value="webhook_secret">Webhook Secret</Option>
                </>
              )}
            </Select>
          </Form.Item>

          <Form.Item name="config_value" label="配置值" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请输入配置值" />
          </Form.Item>

          <Form.Item name="is_production" label="是否生产环境" valuePropName="checked">
            <Switch checkedChildren="生产" unCheckedChildren="测试" disabled={!!editingConfig} />
          </Form.Item>

          <Form.Item name="is_enabled" label="是否启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item name="description" label="说明">
            <TextArea rows={2} placeholder="可选：添加配置说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PaymentConfigManagement
