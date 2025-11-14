import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Tag, Progress, InputNumber, Popconfirm } from 'antd'
import { GiftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'
import dayjs from 'dayjs'
import api from '../services/apiService'

const { RangePicker } = DatePicker

interface Coupon {
  id: number
  code: string
  name: string
  type: 'discount' | 'amount' | 'free'
  value: number
  min_amount?: number
  max_discount?: number
  total_count: number
  used_count: number
  valid_from: string
  valid_until: string
  target_users: string
  applicable_types?: string
  status: 'active' | 'inactive' | 'expired'
  created_by?: string
  created_at: string
  updated_at: string
}

const CouponManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [form] = Form.useForm()
  const checkPermission = usePermission()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  })

  useEffect(() => {
    loadCoupons(pagination.current, pagination.pageSize)
  }, [])

  const loadCoupons = async (page = 1, pageSize = 15) => {
    setLoading(true)
    try {
      const response = await api.get('/coupons', {
        params: { page, limit: pageSize }
      })
      const data = response.data.data || []
      setCoupons(Array.isArray(data) ? data : data.list || [])
      setPagination({
        current: page,
        pageSize,
        total: data.total || (Array.isArray(data) ? data.length : data.list?.length || 0),
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载优惠券失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCoupon(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'discount',
      target_users: 'all',
      status: 'active',
      total_count: 0,
    })
    setIsModalOpen(true)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    form.setFieldsValue({
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      min_amount: coupon.min_amount,
      max_discount: coupon.max_discount,
      total_count: coupon.total_count,
      target_users: coupon.target_users,
      status: coupon.status,
      dateRange: [dayjs(coupon.valid_from), dayjs(coupon.valid_until)],
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/coupons/${id}`)
      message.success('删除成功')
      loadCoupons()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleChangeStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/coupons/${id}/status`, { status })
      message.success('状态更新成功')
      loadCoupons()
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        code: values.code,
        name: values.name,
        type: values.type,
        value: values.value,
        min_amount: values.min_amount,
        max_discount: values.max_discount,
        total_count: values.total_count,
        target_users: values.target_users,
        status: values.status,
        valid_from: values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        valid_until: values.dateRange[1].format('YYYY-MM-DD HH:mm:ss'),
      }

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/coupons', payload)
        message.success('创建成功')
      }

      setIsModalOpen(false)
      loadCoupons()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const getTypeText = (type: string) => {
    const texts = {
      discount: '折扣',
      amount: '满减',
      free: '免费',
    }
    return texts[type as keyof typeof texts] || type
  }

  const getTypeColor = (type: string) => {
    const colors = {
      discount: 'blue',
      amount: 'green',
      free: 'gold',
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      expired: 'error',
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts = {
      active: '启用',
      inactive: '禁用',
      expired: '已过期',
    }
    return texts[status as keyof typeof texts] || status
  }

  const getTargetUsersText = (target: string) => {
    const texts = {
      all: '全部用户',
      new: '新用户',
      vip: 'VIP用户',
    }
    return texts[target as keyof typeof texts] || target
  }

  const formatCouponValue = (coupon: Coupon) => {
    const value = Number(coupon.value)
    if (coupon.type === 'discount') {
      return `${(value * 10).toFixed(1)}折`
    } else if (coupon.type === 'amount') {
      return `减¥${value.toFixed(2)}`
    } else {
      return '免费'
    }
  }

  const columns: ColumnsType<Coupon> = [
    {
      title: '优惠券代码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      fixed: 'left',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{getTypeText(type)}</Tag>
      ),
      filters: [
        { text: '折扣', value: 'discount' },
        { text: '满减', value: 'amount' },
        { text: '免费', value: 'free' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '优惠',
      key: 'value',
      width: 120,
      render: (_, record) => <strong>{formatCouponValue(record)}</strong>,
    },
    {
      title: '使用条件',
      key: 'condition',
      width: 150,
      render: (_, record) => {
        if (record.min_amount) {
          return `满¥${Number(record.min_amount).toFixed(2)}`
        }
        return <span style={{ color: '#999' }}>无门槛</span>
      },
    },
    {
      title: '发放/使用',
      key: 'usage',
      width: 200,
      render: (_, record) => {
        const percentage = record.total_count > 0
          ? (record.used_count / record.total_count) * 100
          : 0
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>{record.used_count} / {record.total_count || '不限'}</div>
            {record.total_count > 0 && (
              <Progress
                percent={percentage}
                size="small"
                status={percentage >= 100 ? 'exception' : 'active'}
              />
            )}
          </Space>
        )
      },
      sorter: (a, b) => {
        const aPercent = a.total_count > 0 ? (a.used_count / a.total_count) : 0
        const bPercent = b.total_count > 0 ? (b.used_count / b.total_count) : 0
        return aPercent - bPercent
      },
    },
    {
      title: '目标用户',
      dataIndex: 'target_users',
      key: 'target_users',
      width: 100,
      render: (target: string) => (
        <Tag color="cyan">{getTargetUsersText(target)}</Tag>
      ),
    },
    {
      title: '有效期',
      key: 'validity',
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>{dayjs(record.valid_from).format('YYYY-MM-DD')}</div>
          <div>至 {dayjs(record.valid_until).format('YYYY-MM-DD')}</div>
        </div>
      ),
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
        { text: '启用', value: 'active' },
        { text: '禁用', value: 'inactive' },
        { text: '已过期', value: 'expired' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {checkPermission.has(Permission.COUPON_EDIT) && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              {record.status === 'active' ? (
                <Button
                  type="link"
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() => handleChangeStatus(record.id, 'inactive')}
                >
                  禁用
                </Button>
              ) : (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleChangeStatus(record.id, 'active')}
                >
                  启用
                </Button>
              )}
            </>
          )}
          {checkPermission.has(Permission.COUPON_DELETE) && (
            <Popconfirm
              title="确定删除此优惠券？"
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
    <PermissionGuard permission={Permission.COUPON_VIEW}>
      <Card
        title={
          <Space>
            <GiftOutlined />
            <span>优惠券管理</span>
          </Space>
        }
        extra={
          checkPermission.has(Permission.COUPON_CREATE) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建优惠券
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={coupons}
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
              loadCoupons(page, pageSize)
            },
            onShowSizeChange: (_, size) => {
              loadCoupons(1, size)
            },
          }}
          scroll={{ x: 1500 }}
        />

        <Modal
          title={editingCoupon ? '编辑优惠券' : '创建优惠券'}
          open={isModalOpen}
          onOk={handleModalOk}
          onCancel={() => setIsModalOpen(false)}
          width={700}
          okText="保存"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="优惠券代码"
              name="code"
              rules={[{ required: true, message: '请输入优惠券代码' }]}
            >
              <Input placeholder="如：NEW2025" maxLength={50} disabled={!!editingCoupon} />
            </Form.Item>

            <Form.Item
              label="优惠券名称"
              name="name"
              rules={[{ required: true, message: '请输入优惠券名称' }]}
            >
              <Input placeholder="如：新用户专享优惠券" maxLength={100} />
            </Form.Item>

            <Space size="large" style={{ width: '100%' }}>
              <Form.Item
                label="类型"
                name="type"
                rules={[{ required: true }]}
              >
                <Select style={{ width: 120 }}>
                  <Select.Option value="discount">折扣券</Select.Option>
                  <Select.Option value="amount">满减券</Select.Option>
                  <Select.Option value="free">免费券</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="优惠值"
                name="value"
                rules={[{ required: true, message: '请输入优惠值' }]}
                tooltip="折扣券输入0-1的小数(如0.8表示8折)，满减券输入减免金额"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: 150 }}
                  placeholder="如：0.8 或 10"
                />
              </Form.Item>
            </Space>

            <Space size="large" style={{ width: '100%' }}>
              <Form.Item label="最低消费" name="min_amount">
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: 150 }}
                  placeholder="0表示无门槛"
                  prefix="¥"
                />
              </Form.Item>

              <Form.Item label="最大优惠" name="max_discount">
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: 150 }}
                  placeholder="折扣券可用"
                  prefix="¥"
                />
              </Form.Item>
            </Space>

            <Space size="large" style={{ width: '100%' }}>
              <Form.Item
                label="发行数量"
                name="total_count"
                rules={[{ required: true }]}
                tooltip="0表示不限数量"
              >
                <InputNumber
                  min={0}
                  step={1}
                  style={{ width: 150 }}
                  placeholder="0表示不限"
                />
              </Form.Item>

              <Form.Item
                label="目标用户"
                name="target_users"
                rules={[{ required: true }]}
              >
                <Select style={{ width: 150 }}>
                  <Select.Option value="all">全部用户</Select.Option>
                  <Select.Option value="new">新用户</Select.Option>
                  <Select.Option value="vip">VIP用户</Select.Option>
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

            <Form.Item
              label="有效期"
              name="dateRange"
              rules={[{ required: true, message: '请选择有效期' }]}
            >
              <RangePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </PermissionGuard>
  )
}

export default CouponManagement
