import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, message, Tag, Rate, Avatar, Popconfirm } from 'antd'
import { StarOutlined, EyeOutlined, EyeInvisibleOutlined, MessageOutlined, LikeOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'
import dayjs from 'dayjs'
import { getReviews, replyReview, updateReviewStatus, deleteReview } from '../services/reviewService'

const { TextArea } = Input

interface Review {
  id: number
  order_id: string
  user_id: string
  username: string
  fortune_type: string
  rating: number
  content?: string
  images?: string
  tags?: string
  is_anonymous: boolean
  status: 'published' | 'hidden' | 'deleted'
  helpful_count: number
  reply_content?: string
  reply_at?: string
  created_at: string
  updated_at: string
}

const ReviewManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)
  const [currentReview, setCurrentReview] = useState<Review | null>(null)
  const [form] = Form.useForm()
  const checkPermission = usePermission()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  })

  useEffect(() => {
    loadReviews(pagination.current, pagination.pageSize)
  }, [])

  const loadReviews = async (page = 1, pageSize = 15) => {
    setLoading(true)
    try {
      const response = await getReviews({ page, limit: pageSize })
      setReviews(response.data.data || [])
      setPagination({
        current: page,
        pageSize,
        total: response.data.pagination?.total || 0,
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载评价失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = (review: Review) => {
    setCurrentReview(review)
    form.resetFields()
    form.setFieldsValue({
      reply_content: review.reply_content || '',
    })
    setIsReplyModalOpen(true)
  }

  const handleReplySubmit = async () => {
    try {
      const values = await form.validateFields()
      await replyReview(currentReview!.id, {
        reply_content: values.reply_content,
      })
      message.success('回复成功')
      setIsReplyModalOpen(false)
      loadReviews()
    } catch (error: any) {
      message.error(error.response?.data?.message || '回复失败')
    }
  }

  const handleChangeStatus = async (id: number, status: string) => {
    try {
      await updateReviewStatus(id, status)
      message.success('状态更新成功')
      loadReviews()
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteReview(id)
      message.success('删除成功')
      loadReviews()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      published: 'success',
      hidden: 'warning',
      deleted: 'default',
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts = {
      published: '已发布',
      hidden: '已隐藏',
      deleted: '已删除',
    }
    return texts[status as keyof typeof texts] || status
  }

  const parseTags = (tagsStr?: string): string[] => {
    if (!tagsStr) return []
    try {
      return JSON.parse(tagsStr)
    } catch {
      return []
    }
  }

  const columns: ColumnsType<Review> = [
    {
      title: '用户',
      key: 'user',
      width: 150,
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff' }}>
            {record.is_anonymous ? '匿' : record.username[0]}
          </Avatar>
          <span>{record.is_anonymous ? '匿名用户' : record.username}</span>
        </Space>
      ),
    },
    {
      title: '运势类型',
      dataIndex: 'fortune_type',
      key: 'fortune_type',
      width: 120,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (rating: number) => <Rate disabled value={rating} />,
      sorter: (a, b) => a.rating - b.rating,
      filters: [
        { text: '5星', value: 5 },
        { text: '4星', value: 4 },
        { text: '3星', value: 3 },
        { text: '2星', value: 2 },
        { text: '1星', value: 1 },
      ],
      onFilter: (value, record) => record.rating === value,
    },
    {
      title: '评价内容',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
      render: (content?: string) => content || <span style={{ color: '#999' }}>未填写</span>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags?: string) => {
        const tagList = parseTags(tags)
        return tagList.length > 0 ? (
          <Space size="small" wrap>
            {tagList.map((tag, index) => (
              <Tag key={index} color="cyan">{tag}</Tag>
            ))}
          </Space>
        ) : '-'
      },
    },
    {
      title: '有用',
      dataIndex: 'helpful_count',
      key: 'helpful_count',
      width: 80,
      render: (count: number) => (
        <Space>
          <LikeOutlined />
          <span>{count}</span>
        </Space>
      ),
      sorter: (a, b) => a.helpful_count - b.helpful_count,
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
        { text: '已发布', value: 'published' },
        { text: '已隐藏', value: 'hidden' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '回复',
      key: 'reply',
      width: 80,
      render: (_, record) => (
        record.reply_content ? (
          <Tag color="green">已回复</Tag>
        ) : (
          <Tag>未回复</Tag>
        )
      ),
      filters: [
        { text: '已回复', value: 'replied' },
        { text: '未回复', value: 'unreplied' },
      ],
      onFilter: (value, record) => {
        if (value === 'replied') return !!record.reply_content
        return !record.reply_content
      },
    },
    {
      title: '评价时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {checkPermission.has(Permission.REVIEW_REPLY) && (
            <Button
              type="link"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => handleReply(record)}
            >
              回复
            </Button>
          )}
          {checkPermission.has(Permission.REVIEW_EDIT) && (
            <>
              {record.status === 'published' ? (
                <Button
                  type="link"
                  size="small"
                  icon={<EyeInvisibleOutlined />}
                  onClick={() => handleChangeStatus(record.id, 'hidden')}
                >
                  隐藏
                </Button>
              ) : (
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleChangeStatus(record.id, 'published')}
                >
                  显示
                </Button>
              )}
            </>
          )}
          {checkPermission.has(Permission.REVIEW_DELETE) && (
            <Popconfirm
              title="确定删除此评价？"
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
    <PermissionGuard permission={Permission.REVIEW_VIEW}>
      <Card
        title={
          <Space>
            <StarOutlined />
            <span>评价管理</span>
          </Space>
        }
        extra={
          <Space>
            <Tag color="gold">
              平均评分: {reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '0.0'}
            </Tag>
            <Tag>总评价数: {reviews.length}</Tag>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={reviews}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              loadReviews(page, pageSize)
            },
            onShowSizeChange: (_, size) => {
              loadReviews(1, size)
            },
          }}
          scroll={{ x: 1600 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '16px', background: '#fafafa' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <strong>订单号：</strong>
                    {record.order_id}
                  </div>
                  {record.content && (
                    <div>
                      <strong>评价内容：</strong>
                      <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{record.content}</div>
                    </div>
                  )}
                  {record.reply_content && (
                    <div style={{ marginTop: 12, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
                      <div><strong>商家回复：</strong></div>
                      <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{record.reply_content}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                        回复时间：{record.reply_at ? dayjs(record.reply_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                      </div>
                    </div>
                  )}
                </Space>
              </div>
            ),
          }}
        />

        {/* 回复弹窗 */}
        <Modal
          title="回复评价"
          open={isReplyModalOpen}
          onOk={handleReplySubmit}
          onCancel={() => setIsReplyModalOpen(false)}
          okText="发送"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="回复内容"
              name="reply_content"
              rules={[{ required: true, message: '请输入回复内容' }]}
            >
              <TextArea
                placeholder="请输入回复内容，将对用户可见"
                rows={5}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
          {currentReview && (
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div>
                <strong>{currentReview.is_anonymous ? '匿名用户' : currentReview.username}</strong>
                <Rate disabled value={currentReview.rating} style={{ marginLeft: 12 }} />
              </div>
              <div style={{ marginTop: 8 }}>{currentReview.content || '无评价内容'}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                {dayjs(currentReview.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </div>
            </div>
          )}
        </Modal>
      </Card>
    </PermissionGuard>
  )
}

export default ReviewManagement
