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
  InputNumber,
  Upload,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UploadOutlined,
  BarChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { fetchWithAuth } from '../services/apiService'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select
const { TextArea } = Input

interface PaymentMethod {
  id: string
  method_code: string
  method_name: string
  provider?: string
  icon?: string
  description?: string
  is_enabled: boolean
  sort_order: number
  min_amount: number
  max_amount?: number
  fee_type: 'none' | 'fixed' | 'percentage'
  fee_value: number
  created_at: string
  updated_at: string
}

interface PaymentMethodStats {
  total_transactions: number
  completed_count: number
  pending_count: number
  failed_count: number
  total_amount: number
  avg_amount: number
}

const PaymentMethodManagement: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [statsModalVisible, setStatsModalVisible] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [selectedMethodStats, setSelectedMethodStats] = useState<PaymentMethodStats | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    setLoading(true)
    try {
      const response = await fetchWithAuth('/payment-methods')
      if (response.success) {
        setMethods(response.data)
      }
    } catch (error) {
      console.error('获取支付方式失败:', error)
      message.error('获取支付方式失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingMethod(null)
    form.resetFields()
    form.setFieldsValue({
      is_enabled: true,
      sort_order: 0,
      min_amount: 0.01,
      fee_type: 'none',
      fee_value: 0,
    })
    setModalVisible(true)
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    form.setFieldsValue(method)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetchWithAuth(`/payment-methods/${id}`, {
        method: 'DELETE',
      })
      if (response.success) {
        message.success('删除成功')
        fetchMethods()
      }
    } catch (error: any) {
      console.error('删除失败:', error)
      message.error(error.message || '删除失败')
    }
  }

  const handleToggle = async (id: string) => {
    try {
      const response = await fetchWithAuth(`/payment-methods/${id}/toggle`, {
        method: 'PATCH',
      })
      if (response.success) {
        message.success(response.message)
        fetchMethods()
      }
    } catch (error) {
      console.error('切换状态失败:', error)
      message.error('切换状态失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingMethod) {
        // 更新
        const response = await fetchWithAuth(`/payment-methods/${editingMethod.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        })
        if (response.success) {
          message.success('更新成功')
          setModalVisible(false)
          fetchMethods()
        }
      } else {
        // 创建
        const response = await fetchWithAuth('/payment-methods', {
          method: 'POST',
          body: JSON.stringify(values),
        })
        if (response.success) {
          message.success('创建成功')
          setModalVisible(false)
          fetchMethods()
        }
      }
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    }
  }

  const handleViewStats = async (method: PaymentMethod) => {
    try {
      const response = await fetchWithAuth(`/payment-methods/${method.id}/stats`)
      if (response.success) {
        setSelectedMethodStats(response.data.stats)
        setStatsModalVisible(true)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      message.error('获取统计数据失败')
    }
  }

  const columns: ColumnsType<PaymentMethod> = [
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: (a, b) => a.sort_order - b.sort_order,
    },
    {
      title: '支付方式',
      dataIndex: 'method_name',
      key: 'method_name',
      render: (text: string, record) => (
        <Space>
          {record.icon && <img src={record.icon} alt={text} style={{ width: 24, height: 24 }} />}
          <span>{text}</span>
          <Tag color="default">{record.method_code}</Tag>
        </Space>
      ),
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: (text: string) => text || '-',
    },
    {
      title: '金额范围',
      key: 'amount_range',
      render: (_, record) => {
        const min = record.min_amount.toFixed(2)
        const max = record.max_amount ? record.max_amount.toFixed(2) : '无限制'
        return `¥${min} - ${max}`
      },
    },
    {
      title: '手续费',
      key: 'fee',
      render: (_, record) => {
        if (record.fee_type === 'none') return '无'
        if (record.fee_type === 'fixed') return `固定 ¥${record.fee_value}`
        if (record.fee_type === 'percentage') return `${record.fee_value}%`
        return '-'
      },
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
      title: '操作',
      key: 'action',
      width: 250,
      render: (_: any, record: PaymentMethod) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => handleViewStats(record)}
          >
            统计
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggle(record.id)}
          >
            {record.is_enabled ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确定要删除这个支付方式吗？"
            description="删除后无法恢复，且有交易记录的支付方式不允许删除"
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

  return (
    <div>
      <Card
        title="支付方式管理"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchMethods}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              添加支付方式
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={methods}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={editingMethod ? '编辑支付方式' : '添加支付方式'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="method_code"
                label="方式代码"
                rules={[
                  { required: true, message: '请输入方式代码' },
                  { pattern: /^[a-z_]+$/, message: '只能使用小写字母和下划线' },
                ]}
              >
                <Input placeholder="例如: paypal, stripe, balance" disabled={!!editingMethod} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="method_name"
                label="方式名称"
                rules={[{ required: true, message: '请输入方式名称' }]}
              >
                <Input placeholder="例如: PayPal支付, 余额支付" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="provider" label="提供商">
                <Select allowClear placeholder="选择支付提供商">
                  <Option value="paypal">PayPal</Option>
                  <Option value="stripe">Stripe</Option>
                  <Option value="internal">内部（余额）</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="icon" label="图标URL">
                <Input placeholder="https://example.com/icon.png" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="支付方式的描述信息" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="min_amount"
                label="最小金额"
                rules={[{ required: true, message: '请输入最小金额' }]}
              >
                <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="max_amount" label="最大金额">
                <InputNumber min={0} step={1} style={{ width: '100%' }} prefix="¥" placeholder="不限制" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sort_order"
                label="排序"
                rules={[{ required: true, message: '请输入排序值' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fee_type" label="手续费类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="none">无手续费</Option>
                  <Option value="fixed">固定金额</Option>
                  <Option value="percentage">百分比</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fee_value"
                label="手续费值"
                rules={[{ required: true, message: '请输入手续费值' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="is_enabled" label="是否启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="支付方式统计"
        open={statsModalVisible}
        onCancel={() => setStatsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setStatsModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedMethodStats && (
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="总交易数" value={selectedMethodStats.total_transactions} />
            </Col>
            <Col span={8}>
              <Statistic
                title="成功交易"
                value={selectedMethodStats.completed_count}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="待处理"
                value={selectedMethodStats.pending_count}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={8} style={{ marginTop: 16 }}>
              <Statistic
                title="失败交易"
                value={selectedMethodStats.failed_count}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={8} style={{ marginTop: 16 }}>
              <Statistic
                title="总金额"
                value={selectedMethodStats.total_amount}
                precision={2}
                prefix="¥"
              />
            </Col>
            <Col span={8} style={{ marginTop: 16 }}>
              <Statistic
                title="平均金额"
                value={selectedMethodStats.avg_amount}
                precision={2}
                prefix="¥"
              />
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  )
}

export default PaymentMethodManagement
