import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/apiService'

const { TextArea } = Input
const { Option } = Select

interface Category {
  id: number
  name: string
  code: string
  icon: string
  description: string
  sort_order: number
  status: string
  created_at: string
}

const FortuneCategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form] = Form.useForm()

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  const fetchCategories = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: pageSize
      }

      const res = await api.get('/fortune-categories', { params })
      if (res.data.success) {
        const categoriesData = res.data.data
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData)
          setPagination({
            current: page,
            pageSize,
            total: categoriesData.length
          })
        } else if (categoriesData && Array.isArray(categoriesData.list)) {
          setCategories(categoriesData.list)
          setPagination({
            current: page,
            pageSize,
            total: categoriesData.pagination?.total || categoriesData.list.length
          })
        } else {
          setCategories([])
          setPagination({
            current: page,
            pageSize,
            total: 0
          })
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取分类列表失败')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories(1, pagination.pageSize)
  }, [])

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      form.setFieldsValue(category)
    } else {
      setEditingCategory(null)
      form.resetFields()
      form.setFieldsValue({ status: 'active', sort_order: 0 })
    }
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingCategory) {
        await api.put(`/fortune-categories/${editingCategory.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/fortune-categories', values)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchCategories()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个分类吗？如果该分类下有服务，将无法删除。',
      onOk: async () => {
        try {
          await api.delete(`/fortune-categories/${id}`)
          message.success('删除成功')
          fetchCategories()
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      }
    })
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/fortune-categories/${id}`, { status })
      message.success('状态更新成功')
      fetchCategories()
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败')
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return

    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    // 交换位置
    const temp = newCategories[index]
    newCategories[index] = newCategories[targetIndex]
    newCategories[targetIndex] = temp

    // 更新sort_order
    const orders = newCategories.map((cat, idx) => ({
      id: cat.id,
      sort_order: idx
    }))

    try {
      await api.patch('/fortune-categories/order/batch', { orders })
      message.success('排序更新成功')
      fetchCategories()
    } catch (error: any) {
      message.error(error.response?.data?.message || '排序更新失败')
    }
  }

  const columns: ColumnsType<Category> = [
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      render: (_, __, index) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => handleMove(index, 'up')}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === categories.length - 1}
            onClick={() => handleMove(index, 'down')}
          />
        </Space>
      )
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 80,
      render: (icon) => <span style={{ fontSize: 24 }}>{icon}</span>
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: '100%' }}
          onChange={(value) => handleUpdateStatus(record.id, value)}
        >
          <Option value="active">启用</Option>
          <Option value="inactive">禁用</Option>
        </Select>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => new Date(time).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card
        title="算命分类管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            创建分类
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => {
              fetchCategories(page, pageSize)
            },
            onShowSizeChange: (current, size) => {
              fetchCategories(1, size)
            }
          }}
        />
      </Card>

      <Modal
        title={editingCategory ? '编辑分类' : '创建分类'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
            name="code"
            label="分类代码"
            rules={[{ required: true, message: '请输入分类代码' }]}
          >
            <Input placeholder="请输入唯一的分类代码（如：bazi, zodiac）" />
          </Form.Item>

          <Form.Item
            name="icon"
            label="图标"
            help="请输入Emoji图标"
          >
            <Input placeholder="🔮" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入分类描述" />
          </Form.Item>

          <Form.Item
            name="sort_order"
            label="排序"
            help="数字越小越靠前"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FortuneCategoryManagement
