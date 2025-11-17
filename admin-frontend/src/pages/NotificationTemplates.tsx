import api from '../services/api'
import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, FileTextOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission, Role } from '../config/permissions'
import { useAuth } from '../contexts/AuthContext'

const { TextArea } = Input

interface NotificationTemplate {
  id: number
  name: string
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success'
  priority: number
  target: string
  variables: string[]
  description: string
  is_system: boolean
  created_at: string
  updated_at: string
}

const NotificationTemplates = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [form] = Form.useForm()
  const checkPermission = usePermission()
  const { user } = useAuth()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 检查是否可以编辑系统模板（只有超级管理员和管理员可以）
  const canEditSystemTemplate = user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const response = await api.get('/notification-templates', {
        params: { page, limit: pageSize }
      })
      const data = response.data.data || []
      setTemplates(Array.isArray(data) ? data : data?.list || [])
      setPagination({
        current: page,
        pageSize,
        total: data?.pagination?.total || (Array.isArray(data) ? data.length : data?.list?.length || 0)
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'info',
      priority: 0,
      target: 'all',
      variables: [],
    })
    setIsModalOpen(true)
  }

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    form.setFieldsValue({
      name: template.name,
      title: template.title,
      content: template.content,
      type: template.type,
      priority: template.priority,
      target: template.target,
      variables: template.variables?.join(', ') || '',
      description: template.description,
    })
    setIsModalOpen(true)
  }

  const handleCopy = (template: NotificationTemplate) => {
    setEditingTemplate(null)
    form.setFieldsValue({
      name: `${template.name}_copy`,
      title: template.title,
      content: template.content,
      type: template.type,
      priority: template.priority,
      target: template.target,
      variables: template.variables?.join(', ') || '',
      description: `${template.description}（副本）`,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notification-templates/${id}`)
      message.success('删除成功')
      loadTemplates()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      // 处理变量字符串
      const variablesArray = values.variables
        ? values.variables.split(',').map((v: string) => v.trim()).filter((v: string) => v)
        : []

      const payload = {
        name: values.name,
        title: values.title,
        content: values.content,
        type: values.type,
        priority: values.priority,
        target: values.target,
        variables: JSON.stringify(variablesArray),
        description: values.description,
      }

      if (editingTemplate) {
        await api.put(`/notification-templates/${editingTemplate.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/notification-templates', payload)
        message.success('创建成功')
      }

      setIsModalOpen(false)
      loadTemplates()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      info: 'blue',
      warning: 'orange',
      error: 'red',
      success: 'green',
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  const columns: ColumnsType<NotificationTemplate> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {record.is_system && <Tag color="purple">系统</Tag>}
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN'),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => a.title.localeCompare(b.title, 'zh-CN'),
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
      render: (content: string) => (
        <div style={{
          maxWidth: '300px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#666'
        }}>
          {content}
        </div>
      ),
      sorter: (a, b) => a.content.localeCompare(b.content, 'zh-CN'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>
          {type === 'info' && '信息'}
          {type === 'warning' && '警告'}
          {type === 'error' && '错误'}
          {type === 'success' && '成功'}
        </Tag>
      ),
      filters: [
        { text: '信息', value: 'info' },
        { text: '警告', value: 'warning' },
        { text: '错误', value: 'error' },
        { text: '成功', value: 'success' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: number) => (
        <Tag color={priority === 2 ? 'red' : priority === 1 ? 'orange' : 'default'}>
          {priority === 2 ? '紧急' : priority === 1 ? '重要' : '普通'}
        </Tag>
      ),
      sorter: (a, b) => b.priority - a.priority,
    },
    {
      title: '变量',
      dataIndex: 'variables',
      key: 'variables',
      width: 200,
      render: (variables: string[]) => (
        <Space size={[0, 4]} wrap>
          {variables?.length > 0 ? (
            variables.map((v: string, i: number) => (
              <Tag key={i} style={{ fontSize: '11px' }}>
                {`{${v}}`}
              </Tag>
            ))
          ) : (
            <span style={{ color: '#999' }}>无变量</span>
          )}
        </Space>
      ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => (a.description || '').localeCompare(b.description || '', 'zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {checkPermission.has(Permission.NOTIFICATION_EDIT) && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.is_system && !canEditSystemTemplate}
            >
              编辑
            </Button>
          )}
          {checkPermission.has(Permission.NOTIFICATION_CREATE) && (
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(record)}
            >
              复制
            </Button>
          )}
          {checkPermission.has(Permission.NOTIFICATION_DELETE) && (
            <Popconfirm
              title="确定删除此模板？"
              onConfirm={() => handleDelete(record.id)}
              disabled={record.is_system && !canEditSystemTemplate}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={record.is_system && !canEditSystemTemplate}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <PermissionGuard permission={Permission.NOTIFICATION_VIEW}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>通知模板管理</span>
          </Space>
        }
        extra={
          checkPermission.has(Permission.NOTIFICATION_CREATE) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建模板
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={templates}
          loading={loading}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
            getCheckboxProps: (record) => ({
              disabled: record.is_system && !canEditSystemTemplate,
            }),
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 个模板`,
            onChange: (page, pageSize) => {
              loadTemplates(page, pageSize)
            },
            onShowSizeChange: (_, size) => {
              loadTemplates(1, size)
            }
          }}
          scroll={{ x: 1400 }}
        />

        <Modal
          title={editingTemplate ? '编辑模板' : '新建模板'}
          open={isModalOpen}
          onOk={handleModalOk}
          onCancel={() => setIsModalOpen(false)}
          width={800}
          okText="保存"
          cancelText="取消"
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              type: 'info',
              priority: 0,
              target: 'all',
            }}
          >
            <Form.Item
              label="模板名称"
              name="name"
              rules={[
                { required: true, message: '请输入模板名称' },
                { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线' }
              ]}
              extra="用于程序调用，只能包含小写字母和下划线"
            >
              <Input placeholder="例如：system_maintenance" maxLength={100} />
            </Form.Item>

            <Form.Item
              label="通知标题"
              name="title"
              rules={[{ required: true, message: '请输入通知标题' }]}
            >
              <Input placeholder="可使用变量 {variable_name}" maxLength={200} />
            </Form.Item>

            <Form.Item
              label="通知内容"
              name="content"
              rules={[{ required: true, message: '请输入通知内容' }]}
            >
              <TextArea
                placeholder="可使用变量 {variable_name}，例如：尊敬的{username}，系统将于{time}进行维护"
                rows={4}
                maxLength={1000}
                showCount
              />
            </Form.Item>

            <Space size="large" style={{ width: '100%', marginBottom: 16 }}>
              <Form.Item
                label="类型"
                name="type"
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
                <Select style={{ width: 120 }}>
                  <Select.Option value="info">信息</Select.Option>
                  <Select.Option value="warning">警告</Select.Option>
                  <Select.Option value="error">错误</Select.Option>
                  <Select.Option value="success">成功</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="优先级"
                name="priority"
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
                <Select style={{ width: 120 }}>
                  <Select.Option value={0}>普通</Select.Option>
                  <Select.Option value={1}>重要</Select.Option>
                  <Select.Option value={2}>紧急</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="目标用户"
                name="target"
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
                <Select style={{ width: 120 }}>
                  <Select.Option value="all">全部用户</Select.Option>
                  <Select.Option value="vip">VIP用户</Select.Option>
                  <Select.Option value="new">新用户</Select.Option>
                </Select>
              </Form.Item>
            </Space>

            <Form.Item
              label="变量列表"
              name="variables"
              extra="多个变量用逗号分隔，例如：username, time, action"
            >
              <Input placeholder="username, time, action" />
            </Form.Item>

            <Form.Item
              label="模板说明"
              name="description"
            >
              <TextArea
                placeholder="描述此模板的用途"
                rows={2}
                maxLength={500}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </PermissionGuard>
  )
}

export default NotificationTemplates
