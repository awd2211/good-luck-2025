import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Drawer } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/api'
import JsonView from '@uiw/react-json-view'

const { TextArea } = Input
const { Option } = Select

interface FortuneService {
  id: number
  name: string
}

interface FortuneTemplate {
  id: number
  service_id: number
  service_name: string
  name: string
  template_type: string
  content: any
  rules: any
  status: string
  version: string
  created_by: string
  created_at: string
  updated_at: string
}

const FortuneTemplateManagement = () => {
  const [templates, setTemplates] = useState<FortuneTemplate[]>([])
  const [services, setServices] = useState<FortuneService[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<FortuneTemplate | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<FortuneTemplate | null>(null)
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  const fetchTemplates = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const res = await api.get('/fortune-templates', {
        params: { page, limit: pageSize }
      })
      if (res.data.success) {
        // 确保返回的是数组
        const templateData = (res.data.data || res.data)
        if (Array.isArray(templateData)) {
          setTemplates(templateData)
          setPagination({
            current: page,
            pageSize,
            total: templateData.length
          })
        } else if (templateData && Array.isArray(templateData.list)) {
          setTemplates(templateData.list)
          setPagination({
            current: page,
            pageSize,
            total: templateData.pagination?.total || templateData.list.length
          })
        } else {
          setTemplates([])
          setPagination({ current: page, pageSize, total: 0 })
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取模板列表失败')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const res = await api.get('/fortune-services', {
        params: { page: 1, limit: 100 }
      })
      if (res.data.success) {
        // 确保返回的是数组
        const serviceData = (res.data.data || res.data)
        if (Array.isArray(serviceData)) {
          setServices(serviceData)
        } else if (serviceData && Array.isArray(serviceData.list)) {
          setServices(serviceData.list)
        } else {
          setServices([])
        }
      }
    } catch (error: any) {
      console.error('获取服务列表失败:', error)
      setServices([])
    }
  }

  const fetchTypes = async () => {
    try {
      const res = await api.get('/fortune-templates/types')
      if (res.data.success) {
        setTypes((res.data.data || res.data))
      }
    } catch (error: any) {
      console.error('获取类型失败:', error)
    }
  }

  useEffect(() => {
    fetchTemplates()
    fetchServices()
    fetchTypes()
  }, [])

  const handleOpenModal = (template?: FortuneTemplate) => {
    if (template) {
      setEditingTemplate(template)
      form.setFieldsValue({
        ...template,
        content: JSON.stringify(template.content, null, 2),
        rules: template.rules ? JSON.stringify(template.rules, null, 2) : ''
      })
    } else {
      setEditingTemplate(null)
      form.resetFields()
    }
    setModalVisible(true)
  }

  const handleView = (template: FortuneTemplate) => {
    setViewingTemplate(template)
    setViewDrawerVisible(true)
  }

  const handleDuplicate = async (id: number) => {
    try {
      await api.post(`/fortune-templates/${id}/duplicate`)
      message.success('模板复制成功')
      fetchTemplates()
    } catch (error: any) {
      message.error(error.response?.data?.message || '复制失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 解析JSON
      let content, rules
      try {
        content = JSON.parse(values.content)
        rules = values.rules ? JSON.parse(values.rules) : null
      } catch {
        message.error('内容或规则必须是有效的JSON格式')
        return
      }

      const payload = {
        ...values,
        content,
        rules
      }

      if (editingTemplate) {
        await api.put(`/fortune-templates/${editingTemplate.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/fortune-templates', payload)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchTemplates()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模板吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await api.delete(`/fortune-templates/${id}`)
          message.success('删除成功')
          fetchTemplates()
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      }
    })
  }

  const columns: ColumnsType<FortuneTemplate> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend'
    },
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN')
    },
    {
      title: '关联服务',
      dataIndex: 'service_name',
      key: 'service_name',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>,
      sorter: (a, b) => (a.service_name || '').localeCompare(b.service_name || '', 'zh-CN')
    },
    {
      title: '模板类型',
      dataIndex: 'template_type',
      key: 'template_type',
      width: 120,
      render: (type) => <Tag color="green">{type}</Tag>,
      sorter: (a, b) => a.template_type.localeCompare(b.template_type, 'zh-CN')
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      sorter: (a, b) => (a.version || '').localeCompare(b.version || '', 'zh-CN')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建人',
      dataIndex: 'created_by',
      key: 'created_by',
      width: 120,
      sorter: (a, b) => (a.created_by || '').localeCompare(b.created_by || '', 'zh-CN')
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (time) => new Date(time).toLocaleString('zh-CN'),
      sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
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
            icon={<CopyOutlined />}
            onClick={() => handleDuplicate(record.id)}
          >
            复制
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
        title="运势模板管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            创建模板
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
          }}
          scroll={{ x: 1400 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              fetchTemplates(page, pageSize)
            },
            onShowSizeChange: (_, size) => {
              fetchTemplates(1, size)
            }
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingTemplate ? '编辑模板' : '创建模板'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="service_id"
            label="关联服务"
            rules={[{ required: true, message: '请选择关联服务' }]}
          >
            <Select placeholder="请选择服务">
              {services.map(service => (
                <Option key={service.id} value={service.id}>
                  {service.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>

          <Form.Item
            name="template_type"
            label="模板类型"
            rules={[{ required: true, message: '请选择模板类型' }]}
          >
            <Select placeholder="请选择模板类型">
              {types.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
              <Option value="basic">basic</Option>
              <Option value="detailed">detailed</Option>
              <Option value="premium">premium</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="模板内容（JSON格式）"
            rules={[{ required: true, message: '请输入模板内容' }]}
            help="请输入有效的JSON格式数据"
          >
            <TextArea
              rows={10}
              placeholder='{"title": "标题", "description": "描述", "sections": []}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="rules"
            label="规则配置（JSON格式，可选）"
            help="用于定义模板的使用规则"
          >
            <TextArea
              rows={5}
              placeholder='{"conditions": [], "filters": []}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="version"
            label="版本号"
            initialValue="1.0"
          >
            <Input placeholder="请输入版本号" />
          </Form.Item>

          <Form.Item name="created_by" label="创建人">
            <Input placeholder="请输入创建人" />
          </Form.Item>

          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情抽屉 */}
      <Drawer
        title={`查看模板：${viewingTemplate?.name}`}
        open={viewDrawerVisible}
        onClose={() => setViewDrawerVisible(false)}
        width={800}
      >
        {viewingTemplate && (
          <div>
            <p><strong>服务：</strong>{viewingTemplate.service_name}</p>
            <p><strong>类型：</strong>{viewingTemplate.template_type}</p>
            <p><strong>版本：</strong>{viewingTemplate.version}</p>
            <p><strong>状态：</strong>{viewingTemplate.status === 'active' ? '启用' : '禁用'}</p>
            <p><strong>创建人：</strong>{viewingTemplate.created_by || '无'}</p>

            <h3 style={{ marginTop: 24 }}>模板内容：</h3>
            <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 4, overflow: 'auto' }}>
              <JsonView
                value={viewingTemplate.content}
                collapsed={1}
                displayDataTypes={false}
                style={{
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {viewingTemplate.rules && (
              <>
                <h3 style={{ marginTop: 24 }}>规则配置：</h3>
                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 4, overflow: 'auto' }}>
                  <JsonView
                    value={viewingTemplate.rules}
                    collapsed={1}
                    displayDataTypes={false}
                    style={{
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default FortuneTemplateManagement
