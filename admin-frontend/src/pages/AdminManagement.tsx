import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import api from '../services/apiService'
import { useAuth } from '../contexts/AuthContext'

const { Option } = Select

interface Admin {
  id: string
  username: string
  role: string
  email: string
  created_at: string
  updated_at: string
}

const AdminManagement = () => {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [stats, setStats] = useState<any>({})
  const { user } = useAuth()

  const fetchStats = async () => {
    try {
      const response = await api.get('/admins/stats')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  const fetchAdmins = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true)
      const response = await api.get('/admins', {
        params: {
          page,
          pageSize,
          role: roleFilter || undefined,
          search: searchText || undefined,
        },
      })

      if (response.data.success) {
        setAdmins(response.data.data.data)
        setPagination({
          current: page,
          pageSize,
          total: response.data.data.total,
        })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取管理员列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins(1, pagination.pageSize)
    fetchStats()
  }, [roleFilter, searchText])

  const handleAdd = () => {
    setEditingAdmin(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Admin) => {
    setEditingAdmin(record)
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      role: record.role,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await api.delete(`/admins/${id}`)
      if (response.data.success) {
        message.success('删除成功')
        fetchAdmins()
        fetchStats()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingAdmin) {
        // 更新
        const response = await api.put(
          `/admins/${editingAdmin.id}`,
          values
        )
        if (response.data.success) {
          message.success('更新成功')
          setModalVisible(false)
          fetchAdmins()
        }
      } else {
        // 创建
        const response = await api.post('/admins', values)
        if (response.data.success) {
          message.success('创建成功，默认密码为 123456')
          setModalVisible(false)
          fetchAdmins()
          fetchStats()
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const getRoleTag = (role: string) => {
    const roleConfig: Record<string, { color: string; icon: any; text: string }> = {
      super_admin: { color: 'red', icon: <CrownOutlined />, text: '超级管理员' },
      manager: { color: 'blue', icon: <TeamOutlined />, text: '管理员' },
      editor: { color: 'green', icon: <FileTextOutlined />, text: '编辑员' },
      viewer: { color: 'default', icon: <EyeOutlined />, text: '查看员' },
    }
    const config = roleConfig[role] || roleConfig.viewer
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => getRoleTag(role),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Admin) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={user?.id === record.id && user?.role !== 'super_admin'}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个管理员吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={user?.id === record.id || record.role === 'super_admin'}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={user?.id === record.id || record.role === 'super_admin'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总管理员"
              value={stats.total || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="超级管理员"
              value={stats.super_admin_count || 0}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="管理员"
              value={stats.manager_count || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="编辑员"
              value={stats.editor_count || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索用户名或邮箱"
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="选择角色"
            onChange={setRoleFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="super_admin">超级管理员</Option>
            <Option value="manager">管理员</Option>
            <Option value="editor">编辑员</Option>
            <Option value="viewer">查看员</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加管理员
          </Button>
        </Space>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={admins}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              fetchAdmins(page, pageSize)
            },
            onShowSizeChange: (current, size) => {
              fetchAdmins(1, size)
            }
          }}
        />
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingAdmin ? '编辑管理员' : '添加管理员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色">
              <Option value="super_admin">超级管理员</Option>
              <Option value="manager">管理员</Option>
              <Option value="editor">编辑员</Option>
              <Option value="viewer">查看员</Option>
            </Select>
          </Form.Item>
          {!editingAdmin && (
            <Form.Item name="password" label="密码">
              <Input.Password placeholder="留空则使用默认密码 123456" />
            </Form.Item>
          )}
          {editingAdmin && (
            <Form.Item name="password" label="新密码">
              <Input.Password placeholder="留空表示不修改密码" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default AdminManagement
