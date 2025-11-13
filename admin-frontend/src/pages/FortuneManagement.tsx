import { useState, useEffect } from 'react'
import { Card, Table, Tag, Space, Button, Input, Select, Modal, message, Statistic, Row, Col } from 'antd'
import { EyeOutlined, SearchOutlined, ReloadOutlined, DollarOutlined, ShoppingOutlined, LineChartOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/apiService'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'

const { Option } = Select

interface Order {
  id: string
  order_number: string
  user_id: number
  username?: string
  service_id: number
  service_name: string
  amount: number
  status: string
  payment_status: string
  payment_method?: string
  result?: any
  created_at: string
  updated_at: string
}

const FortuneManagement = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgAmount: 0
  })
  const checkPermission = usePermission()

  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params: any = {
        page,
        pageSize,
        search: searchText || undefined,
        status: statusFilter || undefined
      }

      const res = await api.get('/orders', { params })
      if (res.data.success) {
        const ordersData = res.data.data || []
        setOrders(ordersData)

        if (res.data.pagination) {
          setPagination({
            current: res.data.pagination.page,
            pageSize: res.data.pagination.pageSize,
            total: res.data.pagination.total
          })
        }

        // 计算统计数据
        const totalRevenue = ordersData.reduce((sum: number, order: Order) =>
          sum + (order.payment_status === 'paid' ? Number(order.amount) : 0), 0
        )
        const totalOrders = ordersData.length
        const avgAmount = totalOrders > 0 ? totalRevenue / totalOrders : 0

        setStats({
          totalRevenue,
          totalOrders,
          avgAmount
        })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取算命记录失败')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize)
  }, [searchText, statusFilter])

  const handleViewDetail = (record: Order) => {
    Modal.info({
      title: `订单详情 - ${record.order_number}`,
      width: 700,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>用户：</strong>{record.username || `ID: ${record.user_id}`}</p>
          <p><strong>服务：</strong>{record.service_name}</p>
          <p><strong>金额：</strong>¥{Number(record.amount).toFixed(2)}</p>
          <p><strong>订单状态：</strong>{getStatusText(record.status)}</p>
          <p><strong>支付状态：</strong>{getPaymentStatusText(record.payment_status)}</p>
          {record.payment_method && <p><strong>支付方式：</strong>{record.payment_method}</p>}
          <p><strong>创建时间：</strong>{new Date(record.created_at).toLocaleString('zh-CN')}</p>
          {record.result && (
            <>
              <p style={{ marginTop: 16 }}><strong>算命结果：</strong></p>
              <div style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                maxHeight: 300,
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, fontSize: 12 }}>
                  {JSON.stringify(record.result, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      )
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'processing',
      processing: 'processing',
      completed: 'success',
      cancelled: 'default',
      failed: 'error'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      cancelled: '已取消',
      failed: '失败'
    }
    return texts[status] || status
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'warning',
      paid: 'success',
      refunded: 'default',
      failed: 'error'
    }
    return colors[status] || 'default'
  }

  const getPaymentStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待支付',
      paid: '已支付',
      refunded: '已退款',
      failed: '支付失败'
    }
    return texts[status] || status
  }

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 180,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (username, record) => username || `ID: ${record.user_id}`
    },
    {
      title: '算命服务',
      dataIndex: 'service_name',
      key: 'service_name',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
      sorter: (a, b) => Number(a.amount) - Number(b.amount)
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '支付状态',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 100,
      render: (status) => (
        <Tag color={getPaymentStatusColor(status)}>
          {getPaymentStatusText(status)}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => new Date(time).toLocaleString('zh-CN'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
        </Space>
      )
    }
  ]

  return (
    <PermissionGuard permission={Permission.FORTUNE_VIEW}>
      <div>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="总收入"
                value={stats.totalRevenue}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#3f8600' }}
                suffix={<span style={{ fontSize: 14, color: '#888' }}>（已支付）</span>}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="订单总数"
                value={stats.totalOrders}
                prefix={<ShoppingOutlined />}
                suffix="笔"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="平均客单价"
                value={stats.avgAmount}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 订单列表 */}
        <Card
          title="算命记录"
          extra={
            <Space>
              <Select
                placeholder="订单状态"
                value={statusFilter || undefined}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                allowClear
              >
                <Option value="pending">待处理</Option>
                <Option value="processing">处理中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
                <Option value="failed">失败</Option>
              </Select>
              <Input
                placeholder="搜索订单号或用户"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchOrders(pagination.current, pagination.pageSize)}
              >
                刷新
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条记录`,
              onChange: (page, pageSize) => {
                fetchOrders(page, pageSize)
              },
              onShowSizeChange: (current, size) => {
                fetchOrders(1, size)
              }
            }}
          />
        </Card>
      </div>
    </PermissionGuard>
  )
}

export default FortuneManagement
