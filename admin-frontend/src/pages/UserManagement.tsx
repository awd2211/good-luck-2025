import { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Input, Card, Modal, Form, Select, message, Popconfirm, Statistic, Row, Col } from 'antd'
import { SearchOutlined, EditOutlined, DeleteOutlined, ExportOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'
import api from '../services/apiService'
import dayjs from 'dayjs'

interface User {
  id: string
  username: string
  phone: string
  email?: string
  nickname?: string
  avatar?: string
  register_date: string
  status: string
  order_count: number
  total_spent: number
  balance: number
  last_login_date?: string
  created_at: string
}

interface Stats {
  total_users: number
  active_users: number
  inactive_users: number
  today_new_users: number
  week_new_users: number
  month_new_users: number
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [stats, setStats] = useState<Stats | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const checkPermission = usePermission()

  // 加载用户列表
  const loadUsers = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params: any = {
        page,
        limit: pageSize,
        search: searchText || undefined,
        status: statusFilter || undefined
      }

      const response = await api.get('/users', { params })
      const data = response.data.data

      setUsers(data.list || [])
      setPagination({
        current: page,
        pageSize,
        total: data.pagination?.total || 0
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await api.get('/users/stats')
      setStats(response.data.data)
    } catch (error: any) {
      console.error('加载统计失败:', error)
    }
  }

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [])

  // 搜索
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    loadUsers(1, pagination.pageSize)
  }

  // 编辑用户
  const handleEdit = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      status: user.status,
      balance: user.balance
    })
    setIsModalOpen(true)
  }

  // 保存用户
  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, values)
        message.success('用户信息更新成功')
      }

      setIsModalOpen(false)
      form.resetFields()
      setEditingUser(null)
      loadUsers()
      loadStats()
    } catch (error: any) {
      if (error.response) {
        message.error(error.response.data?.message || '操作失败')
      }
    }
  }

  // 更新用户状态
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/users/${id}`, { status: newStatus })
      message.success('状态更新成功')
      loadUsers()
      loadStats()
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败')
    }
  }

  // 删除用户
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`)
      message.success('用户已删除')
      loadUsers()
      loadStats()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  // 导出用户
  const handleExport = async () => {
    try {
      message.loading('正在导出...', 0)
      const params: any = {
        search: searchText || undefined,
        status: statusFilter || undefined
      }

      const response = await api.get('/users/export', {
        params,
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users_${new Date().getTime()}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      message.destroy()
      message.success('导出成功')
    } catch (error: any) {
      message.destroy()
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ellipsis: true
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 100,
      render: (balance) => `¥${Number(balance || 0).toFixed(2)}`,
      sorter: (a, b) => Number(a.balance || 0) - Number(b.balance || 0)
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 90,
      sorter: (a, b) => a.order_count - b.order_count
    },
    {
      title: '消费金额',
      dataIndex: 'total_spent',
      key: 'total_spent',
      width: 110,
      render: (spent) => `¥${Number(spent || 0).toFixed(2)}`,
      sorter: (a, b) => Number(a.total_spent || 0) - Number(b.total_spent || 0)
    },
    {
      title: '注册时间',
      dataIndex: 'register_date',
      key: 'register_date',
      width: 110,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_date',
      key: 'last_login_date',
      width: 160,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '未登录'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      fixed: 'right',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: 'success',
          inactive: 'default',
          banned: 'error',
          deleted: 'error'
        }
        const textMap: Record<string, string> = {
          active: '正常',
          inactive: '禁用',
          banned: '封禁',
          deleted: '已删除'
        }
        return (
          <Tag color={colorMap[status] || 'default'}>
            {textMap[status] || status}
          </Tag>
        )
      },
      filters: [
        { text: '正常', value: 'active' },
        { text: '禁用', value: 'inactive' },
        { text: '封禁', value: 'banned' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {checkPermission.has(Permission.USER_EDIT) && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {checkPermission.has(Permission.USER_DELETE) && record.status === 'active' && (
            <Popconfirm
              title="确定禁用此用户？"
              onConfirm={() => handleUpdateStatus(record.id, 'inactive')}
            >
              <Button type="link" size="small" danger>
                禁用
              </Button>
            </Popconfirm>
          )}
          {checkPermission.has(Permission.USER_DELETE) && record.status === 'inactive' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleUpdateStatus(record.id, 'active')}
            >
              启用
            </Button>
          )}
          {checkPermission.has(Permission.USER_DELETE) && (
            <Popconfirm
              title="确定删除此用户？此操作不可恢复！"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <PermissionGuard permission={Permission.USER_VIEW}>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats?.total_users || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={stats?.active_users || 0}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日新增"
                value={stats?.today_new_users || 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="本月新增"
                value={stats?.month_new_users || 0}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Card
        title={
          <Space>
            <UserOutlined />
            <span>用户管理</span>
          </Space>
        }
        extra={
          <Space>
            {checkPermission.has(Permission.USER_EXPORT) && (
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadUsers()}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索用户名/手机号/ID"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="用户状态"
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
          >
            <Select.Option value="active">正常</Select.Option>
            <Select.Option value="inactive">禁用</Select.Option>
            <Select.Option value="banned">封禁</Select.Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个用户`,
            onChange: (page, pageSize) => loadUsers(page, pageSize)
          }}
          scroll={{ x: 1600 }}
        />

        <Modal
          title="编辑用户"
          open={isModalOpen}
          onOk={handleSave}
          onCancel={() => {
            setIsModalOpen(false)
            form.resetFields()
            setEditingUser(null)
          }}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="昵称" name="nickname">
              <Input />
            </Form.Item>
            <Form.Item label="邮箱" name="email">
              <Input type="email" />
            </Form.Item>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                <Select.Option value="active">正常</Select.Option>
                <Select.Option value="inactive">禁用</Select.Option>
                <Select.Option value="banned">封禁</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="余额"
              name="balance"
              rules={[{ required: true, message: '请输入余额' }]}
            >
              <Input type="number" prefix="¥" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </PermissionGuard>
  )
}

export default UserManagement
