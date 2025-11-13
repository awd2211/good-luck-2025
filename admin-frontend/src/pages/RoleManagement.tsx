import { useState } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Transfer, message, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Permission, Role, roleNames, permissionNames, rolePermissions } from '../config/permissions'
import PermissionGuard from '../components/PermissionGuard'
import { createAuditLog, LogAction, LogLevel } from '../utils/auditLog'

interface RoleData {
  key: string
  role: Role
  name: string
  permissions: Permission[]
  description: string
  userCount: number
}

const RoleManagement = () => {
  const [roles, setRoles] = useState<RoleData[]>([
    {
      key: '1',
      role: Role.SUPER_ADMIN,
      name: roleNames[Role.SUPER_ADMIN],
      permissions: rolePermissions[Role.SUPER_ADMIN],
      description: '拥有系统所有权限',
      userCount: 1,
    },
    {
      key: '2',
      role: Role.ADMIN,
      name: roleNames[Role.ADMIN],
      permissions: rolePermissions[Role.ADMIN],
      description: '拥有大部分管理权限',
      userCount: 3,
    },
    {
      key: '3',
      role: Role.MANAGER,
      name: roleNames[Role.MANAGER],
      permissions: rolePermissions[Role.MANAGER],
      description: '可以查看和编辑数据',
      userCount: 5,
    },
    {
      key: '4',
      role: Role.OPERATOR,
      name: roleNames[Role.OPERATOR],
      permissions: rolePermissions[Role.OPERATOR],
      description: '可以查看和创建数据',
      userCount: 8,
    },
    {
      key: '5',
      role: Role.VIEWER,
      name: roleNames[Role.VIEWER],
      permissions: rolePermissions[Role.VIEWER],
      description: '只能查看数据',
      userCount: 12,
    },
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleData | null>(null)
  const [form] = Form.useForm()

  // 所有权限列表
  const allPermissions = Object.values(Permission).map(p => ({
    key: p,
    title: permissionNames[p],
  }))

  const columns: ColumnsType<RoleData> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
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
      render: (permissions: Permission[]) => (
        <Tag color="green">{permissions.length} 项权限</Tag>
      ),
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => `${count} 人`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission={Permission.ROLE_VIEW} noFallback>
            <Button
              type="link"
              size="small"
              onClick={() => handleViewPermissions(record)}
            >
              查看权限
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={Permission.ROLE_EDIT} noFallback>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.role === Role.SUPER_ADMIN}
            >
              编辑
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={Permission.ROLE_DELETE} noFallback>
            <Popconfirm
              title="确定删除此角色？"
              description={`此角色下有 ${record.userCount} 个用户，删除后用户将失去权限`}
              onConfirm={() => handleDelete(record)}
              disabled={record.role === Role.SUPER_ADMIN || record.userCount > 0}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={record.role === Role.SUPER_ADMIN || record.userCount > 0}
              >
                删除
              </Button>
            </Popconfirm>
          </PermissionGuard>
        </Space>
      ),
    },
  ]

  const handleViewPermissions = (role: RoleData) => {
    Modal.info({
      title: `${role.name} - 权限列表`,
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          {role.permissions.map(p => (
            <Tag key={p} color="blue" style={{ marginBottom: 8 }}>
              {permissionNames[p]}
            </Tag>
          ))}
        </div>
      ),
    })
  }

  const handleEdit = (role: RoleData) => {
    setEditingRole(role)
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (role: RoleData) => {
    setRoles(roles.filter(r => r.key !== role.key))
    message.success('角色已删除')

    createAuditLog(
      LogAction.USER_DELETE,
      `删除角色：${role.name}`,
      { role: role.role },
      LogLevel.WARN
    )
  }

  const handleCreate = () => {
    setEditingRole(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingRole) {
        // 编辑角色
        setRoles(
          roles.map(r =>
            r.key === editingRole.key
              ? {
                  ...r,
                  name: values.name,
                  description: values.description,
                  permissions: values.permissions,
                }
              : r
          )
        )
        message.success('角色已更新')

        createAuditLog(
          LogAction.USER_UPDATE,
          `更新角色：${values.name}`,
          { role: editingRole.role, changes: values },
          LogLevel.SUCCESS
        )
      } else {
        // 创建角色
        const newRole: RoleData = {
          key: Date.now().toString(),
          role: `custom_${Date.now()}` as Role,
          name: values.name,
          description: values.description,
          permissions: values.permissions,
          userCount: 0,
        }
        setRoles([...roles, newRole])
        message.success('角色已创建')

        createAuditLog(
          LogAction.USER_CREATE,
          `创建角色：${values.name}`,
          newRole,
          LogLevel.SUCCESS
        )
      }

      setIsModalOpen(false)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleModalCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
  }

  return (
    <PermissionGuard permission={Permission.ROLE_VIEW}>
      <Card
        title="角色管理"
        extra={
          <PermissionGuard permission={Permission.ROLE_CREATE} noFallback>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建角色
            </Button>
          </PermissionGuard>
        }
      >
        <Table
          columns={columns}
          dataSource={roles}
          pagination={false}
        />

        <Modal
          title={editingRole ? '编辑角色' : '创建角色'}
          open={isModalOpen}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={700}
          okText="保存"
          cancelText="取消"
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              permissions: [],
            }}
          >
            <Form.Item
              label="角色名称"
              name="name"
              rules={[{ required: true, message: '请输入角色名称' }]}
            >
              <Input placeholder="例如：客服专员" />
            </Form.Item>

            <Form.Item
              label="角色描述"
              name="description"
              rules={[{ required: true, message: '请输入角色描述' }]}
            >
              <Input.TextArea
                placeholder="描述该角色的职责和权限范围"
                rows={3}
              />
            </Form.Item>

            <Form.Item
              label="权限分配"
              name="permissions"
              rules={[{ required: true, message: '请至少选择一个权限' }]}
            >
              <Transfer
                dataSource={allPermissions}
                titles={['可选权限', '已选权限']}
                targetKeys={form.getFieldValue('permissions')}
                onChange={(targetKeys) => {
                  form.setFieldsValue({ permissions: targetKeys })
                }}
                render={item => item.title}
                listStyle={{
                  width: 300,
                  height: 400,
                }}
                showSearch
                filterOption={(inputValue, item) =>
                  item.title.indexOf(inputValue) !== -1
                }
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </PermissionGuard>
  )
}

export default RoleManagement
