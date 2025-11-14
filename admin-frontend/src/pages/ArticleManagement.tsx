import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Switch, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/apiService'

const { TextArea } = Input
const { Option } = Select

interface Article {
  id: number
  title: string
  summary: string
  content: string
  cover_image: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  author: string
  sort_order: number
  view_count: number
  like_count: number
  seo_title: string
  seo_keywords: string
  seo_description: string
  is_featured: boolean
  is_hot: boolean
  created_at: string
  updated_at: string
}

const ArticleManagement = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: ''
  })
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const fetchArticles = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const params: any = {
        page,
        limit: pageSize,
        ...filters
      }

      const res = await api.get('/articles', { params })
      if (res.data.success) {
        setArticles(res.data.data.list)
        setPagination({
          current: page,
          pageSize,
          total: res.data.data.total
        })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取文章列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/articles/categories')
      if (res.data.success) {
        const categoriesData = res.data.data
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData)
        } else if (categoriesData && Array.isArray(categoriesData.list)) {
          setCategories(categoriesData.list)
        } else {
          setCategories([])
        }
      }
    } catch (error: any) {
      console.error('获取分类失败:', error)
      setCategories([])
    }
  }

  const fetchTags = async () => {
    try {
      const res = await api.get('/articles/tags')
      if (res.data.success) {
        const tagsData = res.data.data
        if (Array.isArray(tagsData)) {
          setTags(tagsData)
        } else if (tagsData && Array.isArray(tagsData.list)) {
          setTags(tagsData.list)
        } else {
          setTags([])
        }
      }
    } catch (error: any) {
      console.error('获取标签失败:', error)
      setTags([])
    }
  }

  useEffect(() => {
    fetchArticles()
    fetchCategories()
    fetchTags()
  }, [])

  useEffect(() => {
    fetchArticles(1, pagination.pageSize)
  }, [filters])

  const handleOpenModal = (article?: Article) => {
    if (article) {
      setEditingArticle(article)
      form.setFieldsValue(article)
    } else {
      setEditingArticle(null)
      form.resetFields()
      form.setFieldsValue({
        status: 'draft',
        sort_order: 0,
        is_featured: false,
        is_hot: false
      })
    }
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingArticle) {
        await api.put(`/articles/${editingArticle.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/articles', values)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchArticles(pagination.current, pagination.pageSize)
      fetchCategories()
      fetchTags()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这篇文章吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await api.delete(`/articles/${id}`)
          message.success('删除成功')
          fetchArticles(pagination.current, pagination.pageSize)
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      }
    })
  }

  const handleBatchUpdateStatus = async (status: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的文章')
      return
    }

    try {
      await api.patch('/articles/batch/status', {
        ids: selectedRowKeys,
        status
      })
      message.success('批量更新成功')
      setSelectedRowKeys([])
      fetchArticles(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error.response?.data?.message || '批量更新失败')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的文章')
      return
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 篇文章吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          // 批量删除需要逐个调用删除API
          await Promise.all(selectedRowKeys.map(id => api.delete(`/articles/${id}`)))
          message.success('批量删除成功')
          setSelectedRowKeys([])
          fetchArticles(pagination.current, pagination.pageSize)
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

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'default',
      published: 'success',
      archived: 'warning'
    }
    return colors[status as keyof typeof colors] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts = {
      draft: '草稿',
      published: '已发布',
      archived: '已归档'
    }
    return texts[status as keyof typeof texts] || status
  }

  const columns: ColumnsType<Article> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags?.map(tag => (
            <Tag key={tag} color="cyan">{tag}</Tag>
          ))}
        </>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    {
      title: '标记',
      key: 'marks',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.is_featured && <Tag color="gold">精选</Tag>}
          {record.is_hot && <Tag color="red">热门</Tag>}
        </Space>
      )
    },
    {
      title: '统计',
      key: 'stats',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span>浏览: {record.view_count}</span>
          <span>点赞: {record.like_count}</span>
        </Space>
      )
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 100
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (time) => new Date(time).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: record.title,
                width: 800,
                content: (
                  <div>
                    <p><strong>摘要：</strong>{record.summary}</p>
                    <p><strong>内容：</strong></p>
                    <div style={{ maxHeight: 400, overflow: 'auto' }}>
                      {record.content}
                    </div>
                  </div>
                )
              })
            }}
          >
            查看
          </Button>
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
        title={
          <Space>
            <FileTextOutlined />
            <span>文章管理</span>
          </Space>
        }
        extra={
          <Space>
            <Input.Search
              placeholder="搜索标题或摘要"
              style={{ width: 200 }}
              onSearch={(value) => setFilters({ ...filters, search: value })}
              allowClear
            />
            <Select
              placeholder="选择分类"
              style={{ width: 150 }}
              onChange={(value) => setFilters({ ...filters, category: value })}
              allowClear
            >
              {categories.map(cat => (
                <Option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </Option>
              ))}
            </Select>
            <Select
              placeholder="选择状态"
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, status: value })}
              allowClear
            >
              <Option value="draft">草稿</Option>
              <Option value="published">已发布</Option>
              <Option value="archived">已归档</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              创建文章
            </Button>
          </Space>
        }
      >
        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>已选择 {selectedRowKeys.length} 项</span>
              <Button size="small" onClick={() => handleBatchUpdateStatus('published')}>
                批量发布
              </Button>
              <Button size="small" onClick={() => handleBatchUpdateStatus('draft')}>
                批量转为草稿
              </Button>
              <Button size="small" onClick={() => handleBatchUpdateStatus('archived')}>
                批量归档
              </Button>
              <Button size="small" danger onClick={handleBatchDelete}>
                批量删除
              </Button>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </Space>
          </div>
        )}
        <Table
          columns={columns}
          dataSource={articles}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1600 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              fetchArticles(page, pageSize)
            }
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingArticle ? '编辑文章' : '创建文章'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="文章标题"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input placeholder="请输入文章标题" />
          </Form.Item>

          <Form.Item
            name="summary"
            label="文章摘要"
          >
            <TextArea rows={3} placeholder="请输入文章摘要" />
          </Form.Item>

          <Form.Item
            name="content"
            label="文章内容"
            rules={[{ required: true, message: '请输入文章内容' }]}
          >
            <TextArea rows={10} placeholder="请输入文章内容" />
          </Form.Item>

          <Form.Item
            name="cover_image"
            label="封面图片URL"
          >
            <Input placeholder="请输入封面图片URL" />
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="category"
              label="文章分类"
              rules={[{ required: true, message: '请输入分类' }]}
            >
              <Input placeholder="如：算命知识" style={{ width: 150 }} />
            </Form.Item>

            <Form.Item
              name="tags"
              label="文章标签"
            >
              <Select
                mode="tags"
                style={{ width: 300 }}
                placeholder="输入标签后按回车"
              >
                {tags.map(tag => (
                  <Option key={tag.tag} value={tag.tag}>{tag.tag}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="author"
              label="作者"
            >
              <Input placeholder="作者名称" style={{ width: 150 }} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true }]}
            >
              <Select style={{ width: 120 }}>
                <Option value="draft">草稿</Option>
                <Option value="published">已发布</Option>
                <Option value="archived">已归档</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="sort_order"
              label="排序"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: 120 }} />
            </Form.Item>

            <Form.Item name="is_featured" label="精选文章" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="is_hot" label="热门文章" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item
            name="seo_title"
            label="SEO标题"
          >
            <Input placeholder="用于搜索引擎优化的标题" />
          </Form.Item>

          <Form.Item
            name="seo_keywords"
            label="SEO关键词"
          >
            <Input placeholder="多个关键词用逗号分隔" />
          </Form.Item>

          <Form.Item
            name="seo_description"
            label="SEO描述"
          >
            <TextArea rows={2} placeholder="用于搜索引擎显示的描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ArticleManagement
