import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  Modal,
  Descriptions,
  message,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import {
  getPaymentTransactions,
  getPaymentTransactionStats
} from '../services/paymentManageService'
import type { PaymentTransaction, TransactionStats } from '../services/paymentManageService'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

const PaymentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState<{
    status: string
    payment_method: string
    provider: string
    search: string
    date_range: [Dayjs, Dayjs] | null
  }>({
    status: '',
    payment_method: '',
    provider: '',
    search: '',
    date_range: null,
  })
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null)
  const [stats, setStats] = useState<TransactionStats | null>(null)

  useEffect(() => {
    fetchTransactions()
    fetchStats()
  }, [pagination.current, pagination.pageSize, filters])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      }

      if (filters.status) params.status = filters.status
      if (filters.payment_method) params.payment_method = filters.payment_method
      if (filters.provider) params.provider = filters.provider
      if (filters.search) params.search = filters.search
      if (filters.date_range?.length === 2) {
        params.start_date = filters.date_range[0].format('YYYY-MM-DD')
        params.end_date = filters.date_range[1].format('YYYY-MM-DD')
      }

      const response = await getPaymentTransactions(params)
      setTransactions(response.data.data || [])
      setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0 }))
    } catch (error) {
      console.error('获取交易记录失败:', error)
      message.error('获取交易记录失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await getPaymentTransactionStats()
      setStats(response.data.data || null)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    fetchTransactions()
  }

  const handleReset = () => {
    setFilters({
      status: '',
      payment_method: '',
      provider: '',
      search: '',
      date_range: null,
    })
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleViewDetail = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction)
    setDetailModalVisible(true)
  }

  const getStatusTag = (status: string) => {
    const statusMap = {
      pending: { color: 'processing', text: '待处理' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '失败' },
      refunded: { color: 'warning', text: '已退款' },
    }
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getProviderTag = (provider: string) => {
    const providerMap = {
      paypal: { color: 'blue', text: 'PayPal' },
      stripe: { color: 'purple', text: 'Stripe' },
      internal: { color: 'green', text: '余额' },
    }
    const config = providerMap[provider as keyof typeof providerMap] || { color: 'default', text: provider }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns: ColumnsType<PaymentTransaction> = [
    {
      title: '交易ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      width: 180,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
      sorter: (a, b) => a.transaction_id.localeCompare(b.transaction_id, 'zh-CN')
    },
    {
      title: '订单ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 180,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
      sorter: (a, b) => a.order_id.localeCompare(b.order_id, 'zh-CN')
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number, record) => (
        <span style={{ fontWeight: 'bold' }}>
          {record.currency === 'CNY' ? '¥' : '$'}
          {amount.toFixed(2)}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      sorter: (a, b) => a.payment_method.localeCompare(b.payment_method, 'zh-CN')
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
      render: (provider: string) => getProviderTag(provider),
      sorter: (a, b) => a.provider.localeCompare(b.provider, 'zh-CN')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: any, record: PaymentTransaction) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card>
              <Statistic
                title="总交易数"
                value={stats.total_count}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="总金额"
                value={stats.total_amount}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="成功交易"
                value={stats.completed_count}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="待处理"
                value={stats.pending_count}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="失败/退款"
                value={stats.failed_count + stats.refunded_count}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card
        title="支付交易记录"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => fetchTransactions()}>
            刷新
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索交易ID/订单ID"
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="支付状态"
            value={filters.status || undefined}
            onChange={value => setFilters(prev => ({ ...prev, status: value || '' }))}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="pending">待处理</Option>
            <Option value="completed">已完成</Option>
            <Option value="failed">失败</Option>
            <Option value="refunded">已退款</Option>
          </Select>
          <Select
            placeholder="支付提供商"
            value={filters.provider || undefined}
            onChange={value => setFilters(prev => ({ ...prev, provider: value || '' }))}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="paypal">PayPal</Option>
            <Option value="stripe">Stripe</Option>
            <Option value="internal">余额</Option>
          </Select>
          <RangePicker
            value={filters.date_range}
            onChange={dates => setFilters(prev => ({ ...prev, date_range: dates ? [dates[0]!, dates[1]!] : null }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }))
            },
          }}
        />
      </Card>

      <Modal
        title="交易详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedTransaction && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="交易ID" span={2}>
              {selectedTransaction.transaction_id}
            </Descriptions.Item>
            <Descriptions.Item label="订单ID" span={2}>
              {selectedTransaction.order_id}
            </Descriptions.Item>
            <Descriptions.Item label="用户ID" span={2}>
              {selectedTransaction.user_id}
            </Descriptions.Item>
            <Descriptions.Item label="金额">
              {selectedTransaction.currency === 'CNY' ? '¥' : '$'}
              {selectedTransaction.amount.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="货币">
              {selectedTransaction.currency}
            </Descriptions.Item>
            <Descriptions.Item label="支付方式">
              {selectedTransaction.payment_method}
            </Descriptions.Item>
            <Descriptions.Item label="提供商">
              {getProviderTag(selectedTransaction.provider)}
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={2}>
              {getStatusTag(selectedTransaction.status)}
            </Descriptions.Item>
            {selectedTransaction.provider_transaction_id && (
              <Descriptions.Item label="第三方交易ID" span={2}>
                {selectedTransaction.provider_transaction_id}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="IP地址">
              {selectedTransaction.ip_address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="User Agent" span={1}>
              {selectedTransaction.user_agent ? (
                <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedTransaction.user_agent}
                </div>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedTransaction.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {selectedTransaction.completed_at
                ? dayjs(selectedTransaction.completed_at).format('YYYY-MM-DD HH:mm:ss')
                : '-'}
            </Descriptions.Item>
            {selectedTransaction.metadata && (
              <Descriptions.Item label="元数据" span={2}>
                <pre style={{ maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(selectedTransaction.metadata, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default PaymentTransactions
