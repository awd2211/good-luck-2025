import { useState } from 'react'
import { Table, Button, Tag, Space, Input, Card } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'

interface UserType {
  key: string
  id: string
  username: string
  phone: string
  registerDate: string
  status: 'active' | 'inactive'
  orderCount: number
}

const UserManagement = () => {
  const [searchText, setSearchText] = useState('')
  const checkPermission = usePermission()

  const columns: ColumnsType<UserType> = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '注册时间',
      dataIndex: 'registerDate',
      key: 'registerDate',
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      key: 'orderCount',
      sorter: (a, b) => a.orderCount - b.orderCount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
      filters: [
        { text: '正常', value: 'active' },
        { text: '禁用', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small">查看</Button>
          {checkPermission.has(Permission.USER_EDIT) && (
            <Button type="link" size="small">编辑</Button>
          )}
          {checkPermission.has(Permission.USER_DELETE) && (
            <Button type="link" size="small" danger>
              {record.status === 'active' ? '禁用' : '启用'}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const data: UserType[] = Array.from({ length: 50 }, (_, i) => ({
    key: `user-${i}`,
    id: `U${1000 + i}`,
    username: `用户${i + 1}`,
    phone: `138****${String(1000 + i).slice(-4)}`,
    registerDate: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    status: Math.random() > 0.2 ? 'active' : 'inactive',
    orderCount: Math.floor(Math.random() * 20),
  }))

  const filteredData = data.filter(item =>
    item.username.includes(searchText) ||
    item.phone.includes(searchText) ||
    item.id.includes(searchText)
  )

  return (
    <PermissionGuard permission={Permission.USER_VIEW}>
      <div>
        <Card
          title="用户管理"
          extra={
            <Space>
              <Input
                placeholder="搜索用户"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
              {checkPermission.has(Permission.USER_CREATE) && (
                <Button type="primary" icon={<PlusOutlined />}>
                  添加用户
                </Button>
              )}
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

export default UserManagement
