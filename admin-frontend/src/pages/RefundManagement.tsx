import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm, Descriptions, Badge } from 'antd'
import { EyeOutlined, CheckOutlined, CloseOutlined, DollarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'
import dayjs from 'dayjs'
import api from '../services/apiService'

const { TextArea } = Input

interface Refund {
  id: number
  refund_no: string
  order_id: string
  user_id: string
  username?: string
  amount: number
  reason: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  refund_method?: string
  reviewer_id?: string
  reviewer_name?: string
  review_comment?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

const RefundManagement = () => {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [currentRefund, setCurrentRefund] = useState<Refund | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [form] = Form.useForm()
  const checkPermission = usePermission()

  useEffect(() => {
    loadRefunds()
  }, [])

  const loadRefunds = async () => {
    setLoading(true)
    try {
      const response = await api.get('/refunds')
      setRefunds(response.data.data || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载退款记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (refund: Refund) => {
    setCurrentRefund(refund)
    setIsDetailModalOpen(true)
  }

  const handleReview = (refund: Refund, action: 'approve' | 'reject') => {
    setCurrentRefund(refund)
    setReviewAction(action)
    form.resetFields()
    if (action === 'approve') {
      form.setFieldsValue({
        refund_method: 'original',
      })
    }
    setIsReviewModalOpen(true)
  }

  const handleReviewSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        action: reviewAction,
        review_comment: values.review_comment,
        refund_method: reviewAction === 'approve' ? values.refund_method : undefined,
      }

      await api.post(`/refunds/${currentRefund?.id}/review`, payload)
      message.success(reviewAction === 'approve' ? '退款已批准' : '退款已拒绝')
      setIsReviewModalOpen(false)
      loadRefunds()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'orange',
      approved: 'blue',
      rejected: 'red',
      completed: 'green',
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts = {
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
      completed: '已完成',
    }
    return texts[status as keyof typeof texts] || status
  }

  const getRefundMethodText = (method?: string) => {
    if (!method) return '-'
    const texts = {
      original: '原路退回',
      alipay: '支付宝',
      wechat: '微信',
      bank: '银行卡',
    }
    return texts[method as keyof typeof texts] || method
  }

  const columns: ColumnsType<Refund> = [
    {
      title: '退款单号',
      dataIndex: 'refund_no',
      key: 'refund_no',
      width: 160,
      fixed: 'left',
    },
    {
      title: '订单号',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 160,
      ellipsis: true,
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
      ellipsis: true,
    },
    {
      title: '退款金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '退款原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
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
        { text: '待审核', value: 'pending' },
        { text: '已批准', value: 'approved' },
        { text: '已拒绝', value: 'rejected' },
        { text: '已完成', value: 'completed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '退款方式',
      dataIndex: 'refund_method',
      key: 'refund_method',
      width: 100,
      render: (method?: string) => getRefundMethodText(method),
    },
    {
      title: '审核人',
      dataIndex: 'reviewer_name',
      key: 'reviewer_name',
      width: 100,
      render: (name?: string) => name || '-',
    },
    {
      title: '申请时间',
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
      width: 200,
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
          {record.status === 'pending' && checkPermission.has(Permission.REFUND_REVIEW) && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleReview(record, 'approve')}
              >
                批准
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReview(record, 'reject')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <PermissionGuard permission={Permission.REFUND_VIEW}>
      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>退款管理</span>
          </Space>
        }
        extra={
          <Space>
            <Badge count={refunds.filter(r => r.status === 'pending').length} showZero>
              <Tag color="orange">待审核</Tag>
            </Badge>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={refunds}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
          }}
          scroll={{ x: 1400 }}
        />

        {/* 详情弹窗 */}
        <Modal
          title="退款详情"
          open={isDetailModalOpen}
          onCancel={() => setIsDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
              关闭
            </Button>,
          ]}
          width={700}
        >
          {currentRefund && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="退款单号" span={2}>
                {currentRefund.refund_no}
              </Descriptions.Item>
              <Descriptions.Item label="订单号" span={2}>
                {currentRefund.order_id}
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                {currentRefund.user_id}
              </Descriptions.Item>
              <Descriptions.Item label="退款金额">
                <strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
                  ¥{currentRefund.amount.toFixed(2)}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="退款原因" span={2}>
                {currentRefund.reason}
              </Descriptions.Item>
              {currentRefund.description && (
                <Descriptions.Item label="详细描述" span={2}>
                  {currentRefund.description}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(currentRefund.status)}>
                  {getStatusText(currentRefund.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="退款方式">
                {getRefundMethodText(currentRefund.refund_method)}
              </Descriptions.Item>
              {currentRefund.reviewer_name && (
                <>
                  <Descriptions.Item label="审核人">
                    {currentRefund.reviewer_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="审核时间">
                    {currentRefund.updated_at ? dayjs(currentRefund.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                </>
              )}
              {currentRefund.review_comment && (
                <Descriptions.Item label="审核意见" span={2}>
                  {currentRefund.review_comment}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="申请时间">
                {dayjs(currentRefund.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {currentRefund.completed_at && (
                <Descriptions.Item label="完成时间">
                  {dayjs(currentRefund.completed_at).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* 审核弹窗 */}
        <Modal
          title={reviewAction === 'approve' ? '批准退款' : '拒绝退款'}
          open={isReviewModalOpen}
          onOk={handleReviewSubmit}
          onCancel={() => setIsReviewModalOpen(false)}
          okText="确认"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            {reviewAction === 'approve' && (
              <Form.Item
                label="退款方式"
                name="refund_method"
                rules={[{ required: true, message: '请选择退款方式' }]}
              >
                <Select>
                  <Select.Option value="original">原路退回</Select.Option>
                  <Select.Option value="alipay">支付宝</Select.Option>
                  <Select.Option value="wechat">微信</Select.Option>
                  <Select.Option value="bank">银行卡</Select.Option>
                </Select>
              </Form.Item>
            )}
            <Form.Item
              label="审核意见"
              name="review_comment"
              rules={[{ required: reviewAction === 'reject', message: '请输入拒绝原因' }]}
            >
              <TextArea
                placeholder={reviewAction === 'approve' ? '选填' : '请输入拒绝原因'}
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
          {currentRefund && (
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div>退款单号：{currentRefund.refund_no}</div>
              <div>退款金额：<strong style={{ color: '#ff4d4f' }}>¥{currentRefund.amount.toFixed(2)}</strong></div>
              <div>退款原因：{currentRefund.reason}</div>
            </div>
          )}
        </Modal>
      </Card>
    </PermissionGuard>
  )
}

export default RefundManagement
