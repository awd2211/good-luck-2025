import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Tag, Popconfirm, Badge, Switch, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, BellOutlined, ClockCircleOutlined, SendOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'
import dayjs from 'dayjs'
import api from '../services/apiService'

const { RangePicker } = DatePicker
const { TextArea } = Input

interface Notification {
  id: number
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success'
  priority: number
  status: 'active' | 'inactive'
  target: string
  start_date?: string
  end_date?: string
  is_scheduled?: boolean
  scheduled_time?: string
  sent_at?: string
  read_count?: number
  total_sent?: number
  created_by?: string
  created_at: string
  updated_at: string
}

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [form] = Form.useForm()
  const checkPermission = usePermission()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const response = await api.get('/notifications', {
        params: { page, limit: pageSize }
      })
      const data = response.data.data || []
      setNotifications(Array.isArray(data) ? data : data.list || [])
      setPagination({
        current: page,
        pageSize,
        total: data.pagination?.total || (Array.isArray(data) ? data.length : data.list?.length || 0)
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载通知失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingNotification(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'info',
      priority: 0,
      target: 'all',
      status: 'active',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification)
    form.setFieldsValue({
      title: notification.title,
      content: notification.content,
      type: notification.type,
      priority: notification.priority,
      target: notification.target,
      status: notification.status,
      dateRange: notification.start_date && notification.end_date
        ? [dayjs(notification.start_date), dayjs(notification.end_date)]
        : undefined,
      is_scheduled: notification.is_scheduled || false,
      scheduled_time: notification.scheduled_time ? dayjs(notification.scheduled_time) : undefined,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`)
      message.success('删除成功')
      loadNotifications()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        title: values.title,
        content: values.content,
        type: values.type,
        priority: values.priority,
        target: values.target,
        status: values.status,
        start_date: values.dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
        end_date: values.dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
        is_scheduled: values.is_scheduled || false,
        scheduled_time: values.is_scheduled && values.scheduled_time
          ? values.scheduled_time.format('YYYY-MM-DD HH:mm:ss')
          : null,
      }

      if (editingNotification) {
        await api.put(`/notifications/${editingNotification.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/notifications', payload)
        message.success('创建成功')
      }

      setIsModalOpen(false)
      loadNotifications()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleBatchStatus = async (status: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的通知')
      return
    }

    try {
      await api.post('/notifications/batch/status', {
        ids: selectedRowKeys,
        status
      })
      message.success('批量操作成功')
      setSelectedRowKeys([])
      loadNotifications()
    } catch (error: any) {
      message.error(error.response?.data?.message || '批量操作失败')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的通知')
      return
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条通知吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          // 批量删除需要逐个调用删除API（如果后端没有批量删除接口）
          await Promise.all(selectedRowKeys.map(id => api.delete(`/notifications/${id}`)))
          message.success('批量删除成功')
          setSelectedRowKeys([])
          loadNotifications()
        } catch (error: any) {
          message.error(error.response?.data?.message || '批量删除失败')
        }
      }
    })
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    },
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

  const getTypeIcon = (type: string) => {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅',
    }
    return icons[type as keyof typeof icons] || '📢'
  }

  const columns: ColumnsType<Notification> = [
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      sorter: (a, b) => b.priority - a.priority,
      render: (priority: number) => (
        <Badge count={priority} style={{ backgroundColor: priority > 0 ? '#ff4d4f' : '#52c41a' }} />
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={getTypeColor(type)} icon={<span>{getTypeIcon(type)}</span>}>
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
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
    },
    {
      title: '目标用户',
      dataIndex: 'target',
      key: 'target',
      width: 120,
      render: (target: string) => (
        <Tag color="cyan">{target === 'all' ? '全部用户' : target}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
      filters: [
        { text: '启用', value: 'active' },
        { text: '禁用', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '生效时间',
      key: 'dateRange',
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          {record.start_date && <div>开始：{dayjs(record.start_date).format('YYYY-MM-DD')}</div>}
          {record.end_date && <div>结束：{dayjs(record.end_date).format('YYYY-MM-DD')}</div>}
          {!record.start_date && !record.end_date && <span style={{ color: '#999' }}>永久有效</span>}
        </div>
      ),
    },
    {
      title: '发送状态',
      key: 'sendStatus',
      width: 180,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          {record.is_scheduled && !record.sent_at && (
            <Tag icon={<ClockCircleOutlined />} color="warning">
              定时发送 {record.scheduled_time && dayjs(record.scheduled_time).format('MM-DD HH:mm')}
            </Tag>
          )}
          {record.sent_at && (
            <Tooltip title={`已发送: ${record.total_sent || 0}人 | 已读: ${record.read_count || 0}人`}>
              <Tag icon={<SendOutlined />} color="success">
                已发送 {dayjs(record.sent_at).format('MM-DD HH:mm')}
              </Tag>
            </Tooltip>
          )}
          {!record.is_scheduled && !record.sent_at && (
            <Tag color="default">立即生效</Tag>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {checkPermission.has(Permission.NOTIFICATION_EDIT) && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {checkPermission.has(Permission.NOTIFICATION_DELETE) && (
            <Popconfirm
              title="确定删除此通知？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
            <BellOutlined />
            <span>通知管理</span>
          </Space>
        }
        extra={
          <Space>
            {checkPermission.has(Permission.NOTIFICATION_CREATE) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                添加通知
              </Button>
            )}
          </Space>
        }
      >
        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>已选择 {selectedRowKeys.length} 项</span>
              {checkPermission.has(Permission.NOTIFICATION_EDIT) && (
                <>
                  <Button size="small" onClick={() => handleBatchStatus('active')}>
                    批量启用
                  </Button>
                  <Button size="small" onClick={() => handleBatchStatus('inactive')}>
                    批量禁用
                  </Button>
                </>
              )}
              {checkPermission.has(Permission.NOTIFICATION_DELETE) && (
                <Button size="small" danger onClick={handleBatchDelete}>
                  批量删除
                </Button>
              )}
              <Button size="small" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </Space>
          </div>
        )}
        <Table
          columns={columns}
          dataSource={notifications}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              loadNotifications(page, pageSize)
            },
            onShowSizeChange: (_, size) => {
              loadNotifications(1, size)
            }
          }}
          scroll={{ x: 1200 }}
        />

        <Modal
          title={editingNotification ? '编辑通知' : '添加通知'}
          open={isModalOpen}
          onOk={handleModalOk}
          onCancel={() => setIsModalOpen(false)}
          width={700}
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
              status: 'active',
            }}
          >
            <Form.Item
              label="标题"
              name="title"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="例如：系统维护通知" maxLength={200} />
            </Form.Item>

            <Form.Item
              label="内容"
              name="content"
              rules={[{ required: true, message: '请输入内容' }]}
            >
              <TextArea
                placeholder="请输入通知内容"
                rows={4}
                maxLength={1000}
                showCount
              />
            </Form.Item>

            <Space size="large" style={{ width: '100%' }}>
              <Form.Item
                label="类型"
                name="type"
                rules={[{ required: true }]}
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
              >
                <Select style={{ width: 120 }}>
                  <Select.Option value="all">全部用户</Select.Option>
                  <Select.Option value="vip">VIP用户</Select.Option>
                  <Select.Option value="new">新用户</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true }]}
              >
                <Select style={{ width: 120 }}>
                  <Select.Option value="active">启用</Select.Option>
                  <Select.Option value="inactive">禁用</Select.Option>
                </Select>
              </Form.Item>
            </Space>

            <Form.Item label="生效时间" name="dateRange">
              <RangePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <span>定时发送</span>
                  <Tooltip title="开启后通知将在指定时间自动发送给目标用户">
                    <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </Space>
              }
              name="is_scheduled"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.is_scheduled !== currentValues.is_scheduled
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('is_scheduled') ? (
                  <Form.Item
                    label="发送时间"
                    name="scheduled_time"
                    rules={[{ required: true, message: '请选择发送时间' }]}
                  >
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      style={{ width: '100%' }}
                      placeholder="选择通知发送时间"
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </PermissionGuard>
  )
}

export default NotificationManagement
