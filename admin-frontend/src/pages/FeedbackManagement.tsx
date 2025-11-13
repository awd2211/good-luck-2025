import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, message, Tag, Badge, Descriptions, Rate } from 'antd'
import { MessageOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'
import dayjs from 'dayjs'
import api from '../services/apiService'

const { TextArea } = Input

interface Feedback {
  id: number
  user_id: string
  username: string
  type: 'feedback' | 'complaint' | 'suggestion' | 'bug'
  category?: string
  title: string
  content: string
  contact?: string
  images?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  handler_id?: string
  handler_name?: string
  handler_comment?: string
  satisfaction_score?: number
  created_at: string
  updated_at: string
  resolved_at?: string
}

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isHandleModalOpen, setIsHandleModalOpen] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null)
  const [form] = Form.useForm()
  const checkPermission = usePermission()

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async () => {
    setLoading(true)
    try {
      const response = await api.get('/feedbacks')
      setFeedbacks(response.data.data || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载反馈失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (feedback: Feedback) => {
    setCurrentFeedback(feedback)
    setIsDetailModalOpen(true)
  }

  const handleProcess = (feedback: Feedback) => {
    setCurrentFeedback(feedback)
    form.resetFields()
    form.setFieldsValue({
      status: feedback.status,
      handler_comment: feedback.handler_comment || '',
    })
    setIsHandleModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await api.put(`/feedbacks/${currentFeedback?.id}`, {
        status: values.status,
        handler_comment: values.handler_comment,
      })
      message.success('处理成功')
      setIsHandleModalOpen(false)
      loadFeedbacks()
    } catch (error: any) {
      message.error(error.response?.data?.message || '处理失败')
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      feedback: 'blue',
      complaint: 'red',
      suggestion: 'green',
      bug: 'orange',
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  const getTypeText = (type: string) => {
    const texts = {
      feedback: '反馈',
      complaint: '投诉',
      suggestion: '建议',
      bug: '故障',
    }
    return texts[type as keyof typeof texts] || type
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'default',
      normal: 'blue',
      high: 'orange',
      urgent: 'red',
    }
    return colors[priority as keyof typeof colors] || 'default'
  }

  const getPriorityText = (priority: string) => {
    const texts = {
      low: '低',
      normal: '普通',
      high: '重要',
      urgent: '紧急',
    }
    return texts[priority as keyof typeof texts] || priority
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'orange',
      processing: 'blue',
      resolved: 'green',
      closed: 'default',
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭',
    }
    return texts[status as keyof typeof texts] || status
  }

  const getCategoryText = (category?: string) => {
    if (!category) return '-'
    const texts = {
      product: '产品',
      service: '服务',
      technical: '技术',
      other: '其他',
    }
    return texts[category as keyof typeof texts] || category
  }

  const columns: ColumnsType<Feedback> = [
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{getPriorityText(priority)}</Tag>
      ),
      sorter: (a, b) => {
        const order = { urgent: 4, high: 3, normal: 2, low: 1 }
        return order[a.priority] - order[b.priority]
      },
      filters: [
        { text: '紧急', value: 'urgent' },
        { text: '重要', value: 'high' },
        { text: '普通', value: 'normal' },
        { text: '低', value: 'low' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{getTypeText(type)}</Tag>
      ),
      filters: [
        { text: '反馈', value: 'feedback' },
        { text: '投诉', value: 'complaint' },
        { text: '建议', value: 'suggestion' },
        { text: '故障', value: 'bug' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (category?: string) => getCategoryText(category),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 250,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: '待处理', value: 'pending' },
        { text: '处理中', value: 'processing' },
        { text: '已解决', value: 'resolved' },
        { text: '已关闭', value: 'closed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '处理人',
      dataIndex: 'handler_name',
      key: 'handler_name',
      width: 100,
      render: (name?: string) => name || '-',
    },
    {
      title: '满意度',
      dataIndex: 'satisfaction_score',
      key: 'satisfaction_score',
      width: 120,
      render: (score?: number) => score ? <Rate disabled value={score} /> : '-',
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {checkPermission.has(Permission.FEEDBACK_HANDLE) && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleProcess(record)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <PermissionGuard permission={Permission.FEEDBACK_VIEW}>
      <Card
        title={
          <Space>
            <MessageOutlined />
            <span>用户反馈</span>
          </Space>
        }
        extra={
          <Space>
            <Badge count={feedbacks.filter(f => f.status === 'pending').length} showZero>
              <Tag color="orange">待处理</Tag>
            </Badge>
            <Badge count={feedbacks.filter(f => f.priority === 'urgent').length} showZero>
              <Tag color="red">紧急</Tag>
            </Badge>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={feedbacks}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
          }}
          scroll={{ x: 1600 }}
        />

        {/* 详情弹窗 */}
        <Modal
          title="反馈详情"
          open={isDetailModalOpen}
          onCancel={() => setIsDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
              关闭
            </Button>,
          ]}
          width={700}
        >
          {currentFeedback && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="反馈ID">
                #{currentFeedback.id}
              </Descriptions.Item>
              <Descriptions.Item label="用户">
                {currentFeedback.username}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color={getTypeColor(currentFeedback.type)}>
                  {getTypeText(currentFeedback.type)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="分类">
                {getCategoryText(currentFeedback.category)}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={getPriorityColor(currentFeedback.priority)}>
                  {getPriorityText(currentFeedback.priority)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(currentFeedback.status)}>
                  {getStatusText(currentFeedback.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>
                {currentFeedback.title}
              </Descriptions.Item>
              <Descriptions.Item label="内容" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{currentFeedback.content}</div>
              </Descriptions.Item>
              {currentFeedback.contact && (
                <Descriptions.Item label="联系方式" span={2}>
                  {currentFeedback.contact}
                </Descriptions.Item>
              )}
              {currentFeedback.handler_name && (
                <>
                  <Descriptions.Item label="处理人">
                    {currentFeedback.handler_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理时间">
                    {dayjs(currentFeedback.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </>
              )}
              {currentFeedback.handler_comment && (
                <Descriptions.Item label="处理意见" span={2}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{currentFeedback.handler_comment}</div>
                </Descriptions.Item>
              )}
              {currentFeedback.satisfaction_score && (
                <Descriptions.Item label="用户满意度" span={2}>
                  <Rate disabled value={currentFeedback.satisfaction_score} />
                </Descriptions.Item>
              )}
              <Descriptions.Item label="提交时间">
                {dayjs(currentFeedback.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {currentFeedback.resolved_at && (
                <Descriptions.Item label="解决时间">
                  {dayjs(currentFeedback.resolved_at).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* 处理弹窗 */}
        <Modal
          title="处理反馈"
          open={isHandleModalOpen}
          onOk={handleSubmit}
          onCancel={() => setIsHandleModalOpen(false)}
          okText="保存"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="处理状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                <Select.Option value="pending">待处理</Select.Option>
                <Select.Option value="processing">处理中</Select.Option>
                <Select.Option value="resolved">已解决</Select.Option>
                <Select.Option value="closed">已关闭</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="处理意见"
              name="handler_comment"
              rules={[{ required: true, message: '请输入处理意见' }]}
            >
              <TextArea
                placeholder="请输入处理意见和解决方案"
                rows={5}
                maxLength={1000}
                showCount
              />
            </Form.Item>
          </Form>
          {currentFeedback && (
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div><strong>标题：</strong>{currentFeedback.title}</div>
              <div style={{ marginTop: 8 }}><strong>内容：</strong></div>
              <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{currentFeedback.content}</div>
            </div>
          )}
        </Modal>
      </Card>
    </PermissionGuard>
  )
}

export default FeedbackManagement
