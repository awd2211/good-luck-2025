/**
 * 邮件模板管理页面
 */
import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Switch,
  Tooltip,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/api'

const { TextArea } = Input
const { Option } = Select

interface EmailTemplate {
  id: number
  template_key: string
  name: string
  category: string
  subject: string
  html_content: string
  variables: string[]
  description: string
  is_system: boolean
  enabled: boolean
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

const EmailTemplateManagement = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 邮件模板类型
  const templateCategories = [
    { value: 'admin', label: '管理员' },
    { value: 'user', label: '用户' },
    { value: 'system', label: '系统' },
    { value: 'marketing', label: '营销' },
  ]

  // 可用变量说明
  const variableDescriptions: Record<string, string> = {
    username: '用户名',
    email: '邮箱地址',
    resetUrl: '密码重置链接',
    token: '验证码或令牌',
    testTime: '测试时间',
    siteName: '网站名称',
    siteUrl: '网站地址',
  }

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await api.get('/email-templates')
      if (res.data.success) {
        // API 返回格式: { success: true, data: { templates: [...], total, page, limit } }
        const data = res.data.data
        setTemplates(data?.templates || [])
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取邮件模板列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleOpenModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template)
      form.setFieldsValue({
        ...template,
        variables: template.variables?.join(', ') || '',
      })
    } else {
      setEditingTemplate(null)
      form.resetFields()
    }
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 处理变量字段
      const variables = values.variables
        ? values.variables.split(',').map((v: string) => v.trim()).filter(Boolean)
        : []

      const payload = {
        ...values,
        variables,
      }

      if (editingTemplate) {
        await api.put(`/email-templates/${editingTemplate.template_key}`, payload)
        message.success('邮件模板更新成功')
      } else {
        await api.post('/email-templates', payload)
        message.success('邮件模板创建成功')
      }

      setModalVisible(false)
      fetchTemplates()
    } catch (error: any) {
      console.error('提交失败:', error)
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = (templateKey: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个邮件模板吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/email-templates/${templateKey}`)
          message.success('删除成功')
          fetchTemplates()
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      },
    })
  }

  const handlePreview = async (template: EmailTemplate) => {
    try {
      const res = await api.post('/email-templates/preview', {
        html_content: template.html_content,
        variables: template.variables,
      })

      if (res.data.success) {
        setPreviewHtml(res.data?.data?.html || '')
        setPreviewModalVisible(true)
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '预览失败')
    }
  }

  const handleCopy = (template: EmailTemplate) => {
    form.setFieldsValue({
      template_key: `${template.template_key}_copy`,
      name: `${template.name}（副本）`,
      category: template.category,
      subject: template.subject,
      html_content: template.html_content,
      variables: template.variables?.join(', ') || '',
      description: template.description,
      enabled: true,
    })
    setEditingTemplate(null)
    setModalVisible(true)
  }

  const columns: ColumnsType<EmailTemplate> = [
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
      sorter: (a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN')
    },
    {
      title: '模板键',
      dataIndex: 'template_key',
      key: 'template_key',
      width: 180,
      render: (key, record) => (
        <Space>
          <Tag color="blue">{key}</Tag>
          {record.is_system && <Tag color="orange">系统</Tag>}
        </Space>
      ),
      sorter: (a, b) => (a.template_key || '').localeCompare(b.template_key || '', 'zh-CN')
    },
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const found = templateCategories.find((t) => t.value === category)
        return <Tag color="green">{found?.label || category}</Tag>
      },
      sorter: (a, b) => (a.category || '').localeCompare(b.category || '', 'zh-CN')
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '主题',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      width: 200,
      sorter: (a, b) => (a.subject || '').localeCompare(b.subject || '', 'zh-CN')
    },
    {
      title: '变量',
      dataIndex: 'variables',
      key: 'variables',
      width: 120,
      render: (variables: string[]) =>
        variables?.length > 0 ? (
          <Tooltip title={variables.join(', ')}>
            <Tag>{variables.length} 个变量</Tag>
          </Tooltip>
        ) : (
          <Tag>无</Tag>
        ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      render: (time) => new Date(time).toLocaleString('zh-CN'),
      sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    },
    {
      title: '更新人',
      dataIndex: 'updated_by',
      key: 'updated_by',
      width: 100,
      sorter: (a, b) => (a.updated_by || '').localeCompare(b.updated_by || '', 'zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
          {!record.is_system && (
            <Tooltip title="删除">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.template_key)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title="邮件模板管理"
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
          scroll={{ x: 1500 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingTemplate ? '编辑邮件模板' : '创建邮件模板'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Alert
          message="模板变量说明"
          description={
            <div>
              <p>在HTML内容中使用 {`{{变量名}}`} 来插入动态内容，例如：{`{{username}}`}</p>
              <p>
                可用变量：
                {Object.entries(variableDescriptions).map(([key, desc]) => (
                  <Tag key={key} style={{ margin: '2px' }}>
                    {key}: {desc}
                  </Tag>
                ))}
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item
            name="template_key"
            label="模板键"
            rules={[
              { required: true, message: '请输入模板键' },
              {
                pattern: /^[a-z0-9_]+$/,
                message: '只能包含小写字母、数字和下划线',
              },
            ]}
          >
            <Input
              placeholder="password_reset"
              disabled={!!editingTemplate}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="密码重置邮件" />
          </Form.Item>

          <Form.Item
            name="category"
            label="模板类型"
            rules={[{ required: true, message: '请选择模板类型' }]}
          >
            <Select
              placeholder="选择模板类型"
              disabled={editingTemplate?.is_system}
            >
              {templateCategories.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="邮件主题"
            rules={[{ required: true, message: '请输入邮件主题' }]}
          >
            <Input placeholder="密码重置请求" />
          </Form.Item>

          <Form.Item
            name="html_content"
            label="HTML内容"
            rules={[{ required: true, message: '请输入HTML内容' }]}
            help="支持完整的HTML格式，使用{{变量名}}插入动态内容"
          >
            <TextArea
              rows={12}
              placeholder='<div>您好，{{username}}！</div>'
              style={{ fontFamily: 'Consolas, Monaco, monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="variables"
            label="使用的变量"
            help="多个变量用逗号分隔，例如：username, email, resetUrl"
          >
            <Input placeholder="username, email, resetUrl" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="模板用途说明" />
          </Form.Item>

          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        title="邮件预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={800}
      >
        <div
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            padding: 16,
            background: '#fff',
            maxHeight: 600,
            overflow: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </Modal>
    </div>
  )
}

export default EmailTemplateManagement
