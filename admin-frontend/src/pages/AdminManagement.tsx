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
  Tabs,
  Tooltip,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined,
  EyeOutlined,
  CustomerServiceOutlined,
  QuestionCircleOutlined,
  MailOutlined,
  SendOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  UsergroupAddOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator'
import { validatePasswordMinimum } from '../utils/passwordStrength'

const { Option } = Select
const { TextArea } = Input

interface Admin {
  id: string
  username: string
  role: string
  email: string
  created_at: string
  updated_at: string
}

interface Invitation {
  id: number
  email: string
  username: string
  role: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  invited_by: string
  token: string
  expires_at: string
  created_at: string
  accepted_at?: string
}

interface EmailInvite {
  email: string
  username: string
  role: string
}

const AdminManagement = () => {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [invitationsLoading, setInvitationsLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [form] = Form.useForm()
  const [inviteForm] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [password, setPassword] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [invitationPagination, setInvitationPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [stats, setStats] = useState<any>({})
  const [activeTab, setActiveTab] = useState('admins')
  const { user } = useAuth()

  // 批量邀请的邮箱列表
  const [emailInvites, setEmailInvites] = useState<EmailInvite[]>([
    { email: '', username: '', role: 'viewer' }
  ])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admins/stats')
      if (response.data.success) {
        setStats(response.data?.data || {})
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
        setAdmins(response.data?.data?.data || [])
        setPagination({
          current: page,
          pageSize,
          total: response.data?.data?.total || 0,
        })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取管理员列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async (page = invitationPagination.current, pageSize = invitationPagination.pageSize) => {
    try {
      setInvitationsLoading(true)
      const response = await api.get('/invitations', {
        params: {
          page,
          limit: pageSize,
        },
      })

      if (response.data.success) {
        setInvitations(response.data?.data?.invitations || [])
        setInvitationPagination({
          current: page,
          pageSize,
          total: response.data?.data?.total || 0,
        })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取邀请列表失败')
    } finally {
      setInvitationsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins(1, pagination.pageSize)
    fetchStats()
  }, [roleFilter, searchText])

  useEffect(() => {
    if (activeTab === 'invitations') {
      fetchInvitations()
    }
  }, [activeTab])

  const handleAdd = () => {
    setEditingAdmin(null)
    form.resetFields()
    setPassword('')
    setModalVisible(true)
  }

  const handleEdit = (record: Admin) => {
    setEditingAdmin(record)
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      role: record.role,
    })
    setPassword('')
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

  // 打开邮箱邀请模态框
  const handleOpenInviteModal = () => {
    setEmailInvites([{ email: '', username: '', role: 'viewer' }])
    inviteForm.resetFields()
    setInviteModalVisible(true)
  }

  // 添加邮箱邀请行
  const handleAddEmailInvite = () => {
    setEmailInvites([...emailInvites, { email: '', username: '', role: 'viewer' }])
  }

  // 删除邮箱邀请行
  const handleRemoveEmailInvite = (index: number) => {
    if (emailInvites.length > 1) {
      const newInvites = emailInvites.filter((_, i) => i !== index)
      setEmailInvites(newInvites)
    }
  }

  // 更新邮箱邀请数据
  const handleEmailInviteChange = (index: number, field: keyof EmailInvite, value: string) => {
    const newInvites = [...emailInvites]
    newInvites[index][field] = value
    setEmailInvites(newInvites)
  }

  // 发送邮箱邀请
  const handleSendInvitations = async () => {
    try {
      // 验证所有邮箱
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      for (let i = 0; i < emailInvites.length; i++) {
        const invite = emailInvites[i]
        if (!invite.email || !emailRegex.test(invite.email)) {
          message.error(`第 ${i + 1} 行邮箱格式不正确`)
          return
        }
        if (!invite.username) {
          message.error(`第 ${i + 1} 行用户名不能为空`)
          return
        }
        if (!invite.role) {
          message.error(`第 ${i + 1} 行请选择角色`)
          return
        }
      }

      // 发送所有邀请
      const promises = emailInvites.map(invite =>
        api.post('/invitations/send', invite)
      )

      const results = await Promise.allSettled(promises)

      let successCount = 0
      let failCount = 0
      const errors: string[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data.success) {
          successCount++
        } else {
          failCount++
          const errorMsg = result.status === 'rejected'
            ? result.reason?.response?.data?.message || '发送失败'
            : result.value.data.message || '发送失败'
          errors.push(`${emailInvites[index].email}: ${errorMsg}`)
        }
      })

      if (successCount > 0) {
        message.success(`成功发送 ${successCount} 个邀请`)
        setInviteModalVisible(false)
        if (activeTab === 'invitations') {
          fetchInvitations()
        }
      }

      if (failCount > 0) {
        Modal.error({
          title: `${failCount} 个邀请发送失败`,
          content: (
            <div>
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          ),
        })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '发送邀请失败')
    }
  }

  // 取消邀请
  const handleCancelInvitation = async (id: number) => {
    try {
      const response = await api.post(`/invitations/${id}/cancel`)
      if (response.data.success) {
        message.success('邀请已取消')
        fetchInvitations()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '取消邀请失败')
    }
  }

  // 重新发送邀请
  const handleResendInvitation = async (id: number) => {
    try {
      const response = await api.post(`/invitations/${id}/resend`)
      if (response.data.success) {
        message.success('邀请邮件已重新发送')
        fetchInvitations()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '重新发送失败')
    }
  }

  const getRoleTag = (role: string) => {
    const roleConfig: Record<string, { color: string; icon: any; text: string }> = {
      super_admin: { color: 'red', icon: <CrownOutlined />, text: '超级管理员' },
      admin: { color: 'blue', icon: <TeamOutlined />, text: '管理员' },
      manager: { color: 'cyan', icon: <TeamOutlined />, text: '经理' },
      viewer: { color: 'default', icon: <EyeOutlined />, text: '访客' },
      cs_manager: { color: 'purple', icon: <CustomerServiceOutlined />, text: '客服主管' },
      cs_agent: { color: 'geekblue', icon: <CustomerServiceOutlined />, text: '客服专员' },
    }
    const config = roleConfig[role] || { color: 'default', icon: <QuestionCircleOutlined />, text: role }
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      pending: { color: 'processing', text: '待接受' },
      accepted: { color: 'success', text: '已接受' },
      expired: { color: 'default', text: '已过期' },
      cancelled: { color: 'error', text: '已取消' },
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const adminColumns = [
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

  const invitationColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '邀请人',
      dataIndex: 'invited_by',
      key: 'invited_by',
    },
    {
      title: '过期时间',
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
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
      render: (_: any, record: Invitation) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Tooltip title="重新发送邀请邮件">
                <Button
                  type="link"
                  icon={<ReloadOutlined />}
                  onClick={() => handleResendInvitation(record.id)}
                >
                  重发
                </Button>
              </Tooltip>
              <Popconfirm
                title="确定要取消这个邀请吗？"
                onConfirm={() => handleCancelInvitation(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  danger
                  icon={<CloseCircleOutlined />}
                >
                  取消
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status !== 'pending' && (
            <Tag color="default">无可用操作</Tag>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总管理员"
              value={stats.total || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="超级管理员"
              value={stats.super_admin_count || 0}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="管理员"
              value={stats.admin_count || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="经理"
              value={stats.manager_count || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="访客"
              value={stats.viewer_count || 0}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="客服"
              value={(stats.cs_manager_count || 0) + (stats.cs_agent_count || 0)}
              prefix={<CustomerServiceOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'admins',
              label: (
                <span>
                  <TeamOutlined />
                  管理员列表
                </span>
              ),
              children: (
                <>
                  {/* 操作栏 */}
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
                      <Option value="admin">管理员</Option>
                      <Option value="manager">经理</Option>
                      <Option value="viewer">访客</Option>
                      <Option value="cs_manager">客服主管</Option>
                      <Option value="cs_agent">客服专员</Option>
                    </Select>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                      直接创建管理员
                    </Button>
                    <Button
                      type="default"
                      icon={<MailOutlined />}
                      onClick={handleOpenInviteModal}
                      style={{ backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a' }}
                    >
                      邮箱邀请管理员
                    </Button>
                  </Space>

                  {/* 表格 */}
                  <Table
                    columns={adminColumns}
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
                      onShowSizeChange: (_, size) => {
                        fetchAdmins(1, size)
                      }
                    }}
                  />
                </>
              ),
            },
            {
              key: 'invitations',
              label: (
                <span>
                  <MailOutlined />
                  邀请列表
                </span>
              ),
              children: (
                <>
                  <Space style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      icon={<MailOutlined />}
                      onClick={handleOpenInviteModal}
                    >
                      发送邀请
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => fetchInvitations()}
                    >
                      刷新
                    </Button>
                  </Space>

                  <Table
                    columns={invitationColumns}
                    dataSource={invitations}
                    rowKey="id"
                    loading={invitationsLoading}
                    pagination={{
                      ...invitationPagination,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                      onChange: (page, pageSize) => {
                        fetchInvitations(page, pageSize)
                      },
                      onShowSizeChange: (_, size) => {
                        fetchInvitations(1, size)
                      }
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* 添加/编辑管理员模态框 */}
      <Modal
        title={editingAdmin ? '编辑管理员' : '添加管理员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setPassword('')
        }}
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
              <Option value="admin">管理员</Option>
              <Option value="manager">经理</Option>
              <Option value="viewer">访客</Option>
              <Option value="cs_manager">客服主管</Option>
              <Option value="cs_agent">客服专员</Option>
            </Select>
          </Form.Item>
          {!editingAdmin && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve()
                    if (!validatePasswordMinimum(value)) {
                      return Promise.reject('密码强度不足，至少需要8位且包含字母和数字')
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <Input.Password
                placeholder="留空则使用默认密码 123456"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Item>
          )}
          {!editingAdmin && password && (
            <Form.Item label=" " colon={false}>
              <PasswordStrengthIndicator password={password} />
            </Form.Item>
          )}
          {editingAdmin && (
            <Form.Item
              name="password"
              label="新密码"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve()
                    if (!validatePasswordMinimum(value)) {
                      return Promise.reject('密码强度不足，至少需要8位且包含字母和数字')
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <Input.Password
                placeholder="留空表示不修改密码"
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Item>
          )}
          {editingAdmin && password && (
            <Form.Item label=" " colon={false}>
              <PasswordStrengthIndicator password={password} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 邮箱邀请模态框 */}
      <Modal
        title={
          <Space>
            <UsergroupAddOutlined />
            邮箱邀请管理员
          </Space>
        }
        open={inviteModalVisible}
        onOk={handleSendInvitations}
        onCancel={() => setInviteModalVisible(false)}
        okText="发送邀请"
        cancelText="取消"
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: 8 }}>
            💡 提示：可以一次邀请多个管理员，受邀人将收到邮件并通过邮件链接设置密码完成注册
          </div>
        </div>

        {emailInvites.map((invite, index) => (
          <Card
            key={index}
            size="small"
            style={{ marginBottom: 12 }}
            extra={
              emailInvites.length > 1 && (
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<MinusCircleOutlined />}
                  onClick={() => handleRemoveEmailInvite(index)}
                >
                  删除
                </Button>
              )
            }
          >
            <Row gutter={12}>
              <Col span={10}>
                <Input
                  placeholder="请输入邮箱地址"
                  prefix={<MailOutlined />}
                  value={invite.email}
                  onChange={(e) => handleEmailInviteChange(index, 'email', e.target.value)}
                />
              </Col>
              <Col span={7}>
                <Input
                  placeholder="请输入用户名"
                  prefix={<UserOutlined />}
                  value={invite.username}
                  onChange={(e) => handleEmailInviteChange(index, 'username', e.target.value)}
                />
              </Col>
              <Col span={7}>
                <Select
                  placeholder="选择角色"
                  value={invite.role}
                  onChange={(value) => handleEmailInviteChange(index, 'role', value)}
                  style={{ width: '100%' }}
                >
                  <Option value="super_admin">超级管理员</Option>
                  <Option value="admin">管理员</Option>
                  <Option value="manager">经理</Option>
                  <Option value="viewer">访客</Option>
                  <Option value="cs_manager">客服主管</Option>
                  <Option value="cs_agent">客服专员</Option>
                </Select>
              </Col>
            </Row>
          </Card>
        ))}

        <Button
          type="dashed"
          onClick={handleAddEmailInvite}
          icon={<PlusOutlined />}
          style={{ width: '100%', marginTop: 8 }}
        >
          添加更多邮箱
        </Button>
      </Modal>
    </div>
  )
}

export default AdminManagement
