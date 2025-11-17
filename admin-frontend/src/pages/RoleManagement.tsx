import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, message, Tag, Spin } from 'antd'
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Permission, Role, roleNames, rolePermissions } from '../config/permissions'
import PermissionGuard from '../components/PermissionGuard'
import axios from 'axios'

interface RoleData {
  key: string
  role: Role
  name: string
  permissions: Permission[]
  description: string
  userCount: number
}

interface AdminStats {
  total: string
  super_admin_count: string
  admin_count: string
  manager_count: string
  editor_count: string
  operator_count: string
  viewer_count: string
  cs_manager_count?: string
  cs_agent_count?: string
}

const roleDescriptions: Record<Role, string> = {
  [Role.SUPER_ADMIN]: '拥有系统所有权限，可以管理其他管理员',
  [Role.ADMIN]: '拥有大部分管理权限，但不能管理角色',
  [Role.MANAGER]: '可以查看和编辑数据，但不能删除',
  [Role.VIEWER]: '只能查看数据，无修改权限',
  [Role.CS_MANAGER]: '客服主管，可以管理客服团队和查看统计',
  [Role.CS_AGENT]: '客服专员，只能使用客服工作台',
}

const RoleManagement = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const response = await axios.get('/api/manage/admins/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data.data)
    } catch (error: any) {
      message.error('加载角色统计失败')
      console.error('加载角色统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleUserCount = (role: Role): number => {
    if (!stats) return 0
    const countMap: Record<Role, string> = {
      [Role.SUPER_ADMIN]: stats.super_admin_count,
      [Role.ADMIN]: stats.admin_count,
      [Role.MANAGER]: stats.manager_count,
      [Role.VIEWER]: stats.viewer_count,
      [Role.CS_MANAGER]: stats.cs_manager_count || '0',
      [Role.CS_AGENT]: stats.cs_agent_count || '0',
    }
    return Number(countMap[role] || 0)
  }

  const roles: RoleData[] = Object.values(Role).map(role => ({
    key: role,
    role,
    name: roleNames[role],
    permissions: rolePermissions[role],
    description: roleDescriptions[role],
    userCount: getRoleUserCount(role)
  }))

  const columns: ColumnsType<RoleData> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record) => (
        <Space>
          <Tag color="blue">{name}</Tag>
          {record.role === Role.SUPER_ADMIN && <Tag color="gold">系统角色</Tag>}
        </Space>
      ),
    },
    {
      title: '角色标识',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: string) => <code>{role}</code>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 120,
      render: (permissions: Permission[]) => (
        <Tag color="green">{permissions.length} 项</Tag>
      ),
    },
    {
      title: '管理员数',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 120,
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>
          {count} 人
        </Tag>
      ),
      sorter: (a, b) => a.userCount - b.userCount,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => handleViewPermissions(record)}
        >
          查看权限
        </Button>
      ),
    },
  ]

  const handleViewPermissions = (role: RoleData) => {
    Modal.info({
      title: `${role.name} - 权限列表`,
      width: 700,
      content: (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12, color: '#666' }}>
            {role.description}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {role.permissions.map(p => (
              <Tag key={p} color="blue">
                {p}
              </Tag>
            ))}
          </div>
        </div>
      ),
    })
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <PermissionGuard permission={Permission.ROLE_VIEW}>
      <Card
        title="角色管理"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadStats}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
          <Space direction="vertical" size={4}>
            <div><strong>说明：</strong></div>
            <div>• 系统角色是预定义的，无法创建、编辑或删除</div>
            <div>• 可以在"管理员管理"页面为管理员分配角色</div>
            <div>• 每个角色拥有不同级别的权限，请谨慎分配</div>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={roles}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </PermissionGuard>
  )
}

export default RoleManagement
