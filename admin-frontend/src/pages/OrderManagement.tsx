import { useState } from 'react'
import { Table, Button, Tag, Space, Input, Card, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'

interface OrderType {
  key: string
  orderId: string
  username: string
  fortuneType: string
  amount: number
  status: 'pending' | 'completed' | 'cancelled'
  createTime: string
}

const OrderManagement = () => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const checkPermission = usePermission()

  const columns: ColumnsType<OrderType> = [
    {
      title: '订单号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 150,
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '服务类型',
      dataIndex: 'fortuneType',
      key: 'fortuneType',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pending: 'processing',
          completed: 'success',
          cancelled: 'default',
        }
        const labels = {
          pending: '处理中',
          completed: '已完成',
          cancelled: '已取消',
        }
        return <Tag color={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      sorter: (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small">查看详情</Button>
          {record.status === 'pending' && checkPermission.has(Permission.ORDER_EDIT) && (
            <>
              <Button type="link" size="small">完成</Button>
              <Button type="link" size="small" danger>取消</Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const fortuneTypes = ['生肖运势', '八字精批', '流年运势', '姓名详批', '婚姻分析']

  const data: OrderType[] = Array.from({ length: 100 }, (_, i) => ({
    key: `order-${i}`,
    orderId: `ORD${Date.now() - i * 100000}`,
    username: `用户${Math.floor(Math.random() * 100) + 1}`,
    fortuneType: fortuneTypes[Math.floor(Math.random() * fortuneTypes.length)],
    amount: [19.9, 29.9, 39.9, 49.9, 59.9][Math.floor(Math.random() * 5)],
    status: ['pending', 'completed', 'cancelled'][Math.floor(Math.random() * 3)] as any,
    createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' ' +
                new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toTimeString().split(' ')[0],
  }))

  const filteredData = data.filter(item => {
    const matchSearch = item.orderId.includes(searchText) || item.username.includes(searchText)
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <PermissionGuard permission={Permission.ORDER_VIEW}>
      <div>
        <Card
          title="订单管理"
          extra={
            <Space>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                options={[
                  { label: '全部状态', value: 'all' },
                  { label: '处理中', value: 'pending' },
                  { label: '已完成', value: 'completed' },
                  { label: '已取消', value: 'cancelled' },
                ]}
              />
              <Input
                placeholder="搜索订单"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: total => `共 ${total} 条`,
            }}
          />
        </Card>
      </div>
    </PermissionGuard>
  )
}

export default OrderManagement
