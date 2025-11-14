import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Switch, DatePicker, message, Tag, Popconfirm, ColorPicker } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UpOutlined, DownOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'
import dayjs from 'dayjs'
import api from '../services/apiService'

const { RangePicker } = DatePicker

interface Banner {
  id: number
  title: string
  subtitle?: string
  image_url?: string
  link_url?: string
  bg_color: string
  text_color: string
  position: number
  status: 'active' | 'inactive'
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

const BannerManagement = () => {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [form] = Form.useForm()
  const checkPermission = usePermission()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const response = await api.get('/banners', {
        params: { page, limit: pageSize }
      })
      const data = response.data.data || []
      setBanners(Array.isArray(data) ? data : data.list || [])
      setPagination({
        current: page,
        pageSize,
        total: data.pagination?.total || (Array.isArray(data) ? data.length : data.list?.length || 0)
      })
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载轮播图失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingBanner(null)
    form.resetFields()
    form.setFieldsValue({
      bg_color: '#ff6b6b',
      text_color: '#ffffff',
      status: true,
      position: banners.length + 1,
    })
    setIsModalOpen(true)
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    form.setFieldsValue({
      title: banner.title,
      subtitle: banner.subtitle,
      image_url: banner.image_url,
      link_url: banner.link_url,
      bg_color: banner.bg_color,
      text_color: banner.text_color,
      position: banner.position,
      status: banner.status === 'active',
      dateRange: banner.start_date && banner.end_date
        ? [dayjs(banner.start_date), dayjs(banner.end_date)]
        : undefined,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/banners/${id}`)
      message.success('删除成功')
      loadBanners()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        title: values.title,
        subtitle: values.subtitle,
        image_url: values.image_url,
        link_url: values.link_url,
        bg_color: typeof values.bg_color === 'string' ? values.bg_color : values.bg_color.toHexString(),
        text_color: typeof values.text_color === 'string' ? values.text_color : values.text_color.toHexString(),
        position: values.position,
        status: values.status ? 'active' : 'inactive',
        start_date: values.dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
        end_date: values.dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
      }

      if (editingBanner) {
        await api.put(`/banners/${editingBanner.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/banners', payload)
        message.success('创建成功')
      }

      setIsModalOpen(false)
      loadBanners()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleChangePosition = async (id: number, direction: 'up' | 'down') => {
    try {
      await api.patch(`/banners/${id}/position`, { direction })
      message.success('位置调整成功')
      loadBanners()
    } catch (error: any) {
      message.error(error.response?.data?.message || '位置调整失败')
    }
  }

  const columns: ColumnsType<Banner> = [
    {
      title: '顺序',
      dataIndex: 'position',
      key: 'position',
      width: 80,
      sorter: (a, b) => a.position - b.position,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '副标题',
      dataIndex: 'subtitle',
      key: 'subtitle',
      width: 200,
    },
    {
      title: '预览',
      key: 'preview',
      width: 300,
      render: (_, record) => (
        <div
          style={{
            backgroundColor: record.bg_color,
            color: record.text_color,
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{record.title}</div>
          {record.subtitle && <div style={{ fontSize: '10px', marginTop: '4px' }}>{record.subtitle}</div>}
        </div>
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
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          {checkPermission.has(Permission.BANNER_EDIT) && (
            <>
              <Button
                type="link"
                size="small"
                icon={<UpOutlined />}
                onClick={() => handleChangePosition(record.id, 'up')}
              >
                上移
              </Button>
              <Button
                type="link"
                size="small"
                icon={<DownOutlined />}
                onClick={() => handleChangePosition(record.id, 'down')}
              >
                下移
              </Button>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            </>
          )}
          {checkPermission.has(Permission.BANNER_DELETE) && (
            <Popconfirm
              title="确定删除此轮播图？"
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
    <PermissionGuard permission={Permission.BANNER_VIEW}>
      <Card
        title="轮播图管理"
        extra={
          checkPermission.has(Permission.BANNER_CREATE) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              添加轮播图
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={banners}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              loadBanners(page, pageSize)
            },
            onShowSizeChange: (_, size) => {
              loadBanners(1, size)
            }
          }}
          scroll={{ x: 1200 }}
        />

        <Modal
          title={editingBanner ? '编辑轮播图' : '添加轮播图'}
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
              status: true,
              bg_color: '#ff6b6b',
              text_color: '#ffffff',
            }}
          >
            <Form.Item
              label="标题"
              name="title"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="例如：2025蛇年运势" maxLength={200} />
            </Form.Item>

            <Form.Item label="副标题" name="subtitle">
              <Input placeholder="例如：新年大吉 运势亨通" maxLength={200} />
            </Form.Item>

            <Form.Item label="图片URL" name="image_url">
              <Input placeholder="轮播图图片地址" />
            </Form.Item>

            <Form.Item label="跳转链接" name="link_url">
              <Input placeholder="点击跳转的链接地址" />
            </Form.Item>

            <Space size="large">
              <Form.Item label="背景颜色" name="bg_color">
                <ColorPicker showText />
              </Form.Item>

              <Form.Item label="文字颜色" name="text_color">
                <ColorPicker showText />
              </Form.Item>

              <Form.Item label="显示顺序" name="position">
                <Input type="number" min={1} style={{ width: 100 }} />
              </Form.Item>
            </Space>

            <Form.Item label="生效时间" name="dateRange">
              <RangePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="状态" name="status" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </PermissionGuard>
  )
}

export default BannerManagement
