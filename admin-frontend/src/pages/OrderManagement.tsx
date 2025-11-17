import { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Input, Card, Select, message, Modal, Descriptions } from 'antd'
import { SearchOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'
import { getOrders } from '../services/orderService'
import dayjs from 'dayjs'

interface Order {
  id: string
  orderId: string
  userId: string
  username: string
  fortuneType: string
  fortuneName: string
  amount: number
  status: string
  createTime: string
  updateTime: string
  payMethod?: string
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const checkPermission = usePermission()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params: any = {
        page,
        pageSize,
        search: searchText || undefined,
        status: statusFilter || undefined
      }

      const response = await getOrders(params)

      // 使用新的数据结构
      setOrders(response.data.data || [])
      setPagination({
        current: response.data.pagination?.page || page,
        pageSize: response.data.pagination?.limit || pageSize,
        total: response.data.pagination?.total || 0
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载订单列表失败')
      console.error('加载订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    loadOrders(1, pagination.pageSize)
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'warning', text: '待支付' },
      paid: { color: 'processing', text: '已支付' },
      completed: { color: 'success', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' },
      refunded: { color: 'error', text: '已退款' }
    }
    const config = statusMap[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getFortuneTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'birth-animal': '生肖运势',
      'bazi': '八字精批',
      'year': '流年运势',
      'name': '姓名详批',
      'marriage': '婚姻分析',
      'career': '事业运势',
      'wealth': '财运分析'
    }
    return typeMap[type] || type
  }

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 150,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '服务类型',
      dataIndex: 'fortuneType',
      key: 'fortuneType',
      width: 120,
      render: (type) => getFortuneTypeName(type)
    },
    {
      title: '服务名称',
      dataIndex: 'fortuneName',
      key: 'fortuneName',
      width: 150,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => `¥${Number(amount).toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: '支付方式',
      dataIndex: 'payMethod',
      key: 'payMethod',
      width: 100,
      render: (method) => method || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => getStatusTag(status),
      filters: [
        { text: '待支付', value: 'pending' },
        { text: '已支付', value: 'paid' },
        { text: '已完成', value: 'completed' },
        { text: '已取消', value: 'cancelled' },
        { text: '已退款', value: 'refunded' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
      sorter: (a, b) => dayjs(a.createTime).unix() - dayjs(b.createTime).unix()
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {checkPermission.has(Permission.ORDER_VIEW) && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            >
              查看
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <PermissionGuard permission={Permission.ORDER_VIEW}>
      <Card
        title="订单管理"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadOrders()}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索订单号/用户名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="订单状态"
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
          >
            <Select.Option value="pending">待支付</Select.Option>
            <Select.Option value="paid">已支付</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
            <Select.Option value="refunded">已退款</Select.Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个订单`,
            onChange: (page, pageSize) => loadOrders(page, pageSize)
          }}
          scroll={{ x: 1400 }}
        />

        <Modal
          title="订单详情"
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false)
            setSelectedOrder(null)
          }}
          footer={[
            <Button key="close" onClick={() => setIsModalOpen(false)}>
              关闭
            </Button>
          ]}
          width={700}
        >
          {selectedOrder && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="订单号" span={2}>
                {selectedOrder.orderId}
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                {selectedOrder.userId}
              </Descriptions.Item>
              <Descriptions.Item label="用户名">
                {selectedOrder.username}
              </Descriptions.Item>
              <Descriptions.Item label="服务类型">
                {getFortuneTypeName(selectedOrder.fortuneType)}
              </Descriptions.Item>
              <Descriptions.Item label="服务名称">
                {selectedOrder.fortuneName}
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span style={{ color: '#f5222d', fontSize: 16, fontWeight: 'bold' }}>
                  ¥{Number(selectedOrder.amount).toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="支付方式">
                {selectedOrder.payMethod || '未支付'}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                {getStatusTag(selectedOrder.status)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(selectedOrder.createTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间" span={2}>
                {dayjs(selectedOrder.updateTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </Card>
    </PermissionGuard>
  )
}

export default OrderManagement
