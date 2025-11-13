import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Popconfirm,
  Tabs,
  Descriptions,
  Collapse,
  Upload,
  Checkbox,
  Divider,
  Radio,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilterOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/apiService'

const { TextArea } = Input
const { Option } = Select

interface AIModel {
  id: number
  name: string
  provider: string
  model_name: string
  api_key: string
  api_base_url: string
  max_tokens: number
  temperature: number
  top_p: number
  frequency_penalty: number
  presence_penalty: number
  system_prompt: string
  is_active: boolean
  is_default: boolean
  priority: number
  daily_limit: number
  monthly_limit: number
  usage_count: number
  last_used_at: string
  status: string
  error_message: string
  created_at: string
  updated_at: string
}

interface ModelStats {
  total_requests: number
  success_count: number
  error_count: number
  total_tokens_used: number
  total_cost: number
  avg_duration_ms: number
}

const AIModelManagement = () => {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [testModalVisible, setTestModalVisible] = useState(false)
  const [statsModalVisible, setStatsModalVisible] = useState(false)
  const [editingModel, setEditingModel] = useState<AIModel | null>(null)
  const [testingModel, setTestingModel] = useState<AIModel | null>(null)
  const [modelStats, setModelStats] = useState<ModelStats | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [batchActionModalVisible, setBatchActionModalVisible] = useState(false)
  const [batchActionType, setBatchActionType] = useState<string>('')
  const [form] = Form.useForm()
  const [testForm] = Form.useForm()
  const [batchForm] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  // 筛选条件
  const [filters, setFilters] = useState<{
    providers?: string[]
    statuses?: string[]
    is_active?: string
    is_default?: string
    search?: string
    priorityRange?: [number, number]
  }>({})

  // 视图模式
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')

  // 统计数据
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    todayCalls: 0,
    successRate: 0,
  })

  // 列自定义
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'name', 'provider', 'model_name', 'status', 'is_active', 'priority', 'usage_count', 'actions'
  ])

  // 高级筛选展开
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false)

  // 列自定义Modal
  const [columnSettingVisible, setColumnSettingVisible] = useState(false)

  const providerOptions = [
    { value: 'openai', label: 'OpenAI', color: 'green' },
    { value: 'grok', label: 'Grok (X.AI)', color: 'blue' },
    { value: 'qwen', label: 'Qwen (通义千问)', color: 'orange' },
  ]

  const statusOptions = [
    { value: 'active', label: '活跃', color: 'success' },
    { value: 'error', label: '错误', color: 'error' },
    { value: 'inactive', label: '未激活', color: 'default' },
  ]

  const allColumns = [
    { key: 'name', label: '模型名称' },
    { key: 'provider', label: '供应商' },
    { key: 'model_name', label: '模型标识' },
    { key: 'status', label: '状态' },
    { key: 'is_active', label: '启用状态' },
    { key: 'is_default', label: '默认模型' },
    { key: 'priority', label: '优先级' },
    { key: 'usage_count', label: '使用次数' },
    { key: 'last_used_at', label: '最后使用' },
    { key: 'created_at', label: '创建时间' },
    { key: 'actions', label: '操作' },
  ]

  const modelPresets: Record<string, any> = {
    'openai': {
      'gpt-4': { api_base_url: 'https://api.openai.com/v1', max_tokens: 4000 },
      'gpt-4-turbo': { api_base_url: 'https://api.openai.com/v1', max_tokens: 4000 },
      'gpt-3.5-turbo': { api_base_url: 'https://api.openai.com/v1', max_tokens: 4000 },
    },
    'grok': {
      'grok-beta': { api_base_url: 'https://api.x.ai/v1', max_tokens: 4000 },
    },
    'qwen': {
      'qwen-plus': { api_base_url: 'https://dashscope.aliyuncs.com/api/v1', max_tokens: 6000 },
      'qwen-turbo': { api_base_url: 'https://dashscope.aliyuncs.com/api/v1', max_tokens: 6000 },
      'qwen-max': { api_base_url: 'https://dashscope.aliyuncs.com/api/v1', max_tokens: 6000 },
    },
  }

  const fetchModels = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      // 构建查询参数
      const params: any = { page, limit: pageSize }

      // 添加筛选条件
      if (filters.providers && filters.providers.length > 0) {
        params.provider = filters.providers
      }
      if (filters.statuses && filters.statuses.length > 0) {
        params.status = filters.statuses
      }
      if (filters.is_active) {
        params.is_active = filters.is_active
      }
      if (filters.is_default) {
        params.is_default = filters.is_default
      }
      if (filters.search) {
        params.search = filters.search
      }

      const res = await api.get('/ai-models', { params })

      if (res.data.success) {
        const modelsData = res.data.data
        if (modelsData && Array.isArray(modelsData.list)) {
          // 本地筛选(针对优先级范围等前端特有筛选)
          let filteredModels = modelsData.list
          if (filters.priorityRange) {
            filteredModels = filteredModels.filter((m: AIModel) =>
              m.priority >= filters.priorityRange![0] && m.priority <= filters.priorityRange![1]
            )
          }

          setModels(filteredModels)
          setPagination({
            current: page,
            pageSize,
            total: modelsData.pagination?.total || filteredModels.length,
          })

          // 更新统计数据
          setStatistics({
            total: filteredModels.length,
            active: filteredModels.filter((m: AIModel) => m.is_active).length,
            todayCalls: filteredModels.reduce((sum: number, m: AIModel) => sum + (m.usage_count || 0), 0),
            successRate: 95.5, // 这里应该从后端API获取
          })
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取AI模型列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [filters])

  const handleOpenModal = (model?: AIModel) => {
    if (model) {
      setEditingModel(model)
      form.setFieldsValue(model)
    } else {
      setEditingModel(null)
      form.resetFields()
      // 设置默认值
      form.setFieldsValue({
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        max_tokens: 2000,
        is_active: true,
        is_default: false,
        priority: 50,
      })
    }
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingModel) {
        await api.put(`/ai-models/${editingModel.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/ai-models', values)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchModels()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个AI模型吗？',
      onOk: async () => {
        try {
          await api.delete(`/ai-models/${id}`)
          message.success('删除成功')
          fetchModels()
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      },
    })
  }

  const handleTest = (model: AIModel) => {
    setTestingModel(model)
    setTestResult(null)
    testForm.resetFields()
    testForm.setFieldsValue({
      test_prompt: '你好，请简单介绍一下你自己。',
    })
    setTestModalVisible(true)
  }

  const handleRunTest = async () => {
    if (!testingModel) return

    try {
      const values = await testForm.validateFields()
      setTestLoading(true)

      const res = await api.post(`/ai-models/${testingModel.id}/test`, values)

      if (res.data.success) {
        setTestResult(res.data.data)
        message.success('测试成功')
        fetchModels() // 刷新状态
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '测试失败')
      setTestResult({ error: error.response?.data?.error || error.message })
    } finally {
      setTestLoading(false)
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await api.post(`/ai-models/${id}/set-default`)
      message.success('默认模型设置成功')
      fetchModels()
    } catch (error: any) {
      message.error(error.response?.data?.message || '设置失败')
    }
  }

  const handleViewStats = async (model: AIModel) => {
    try {
      const res = await api.get(`/ai-models/${model.id}/stats`)
      if (res.data.success) {
        setModelStats(res.data.data)
        setTestingModel(model)
        setStatsModalVisible(true)
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取统计失败')
    }
  }

  // 批量操作函数
  const handleBatchAction = (actionType: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的模型')
      return
    }
    setBatchActionType(actionType)
    batchForm.resetFields()
    setBatchActionModalVisible(true)
  }

  const handleBatchSubmit = async () => {
    try {
      const values = await batchForm.validateFields()

      if (batchActionType === 'activate') {
        // 批量启用
        await api.post('/ai-models/batch-update', {
          ids: selectedRowKeys,
          data: { is_active: true },
        })
        message.success(`成功启用 ${selectedRowKeys.length} 个模型`)
      } else if (batchActionType === 'deactivate') {
        // 批量停用
        await api.post('/ai-models/batch-update', {
          ids: selectedRowKeys,
          data: { is_active: false },
        })
        message.success(`成功停用 ${selectedRowKeys.length} 个模型`)
      } else if (batchActionType === 'update') {
        // 批量更新配置
        const updateData: any = {}
        if (values.max_tokens !== undefined) updateData.max_tokens = values.max_tokens
        if (values.temperature !== undefined) updateData.temperature = values.temperature
        if (values.top_p !== undefined) updateData.top_p = values.top_p
        if (values.priority !== undefined) updateData.priority = values.priority

        await api.post('/ai-models/batch-update', {
          ids: selectedRowKeys,
          data: updateData,
        })
        message.success(`成功更新 ${selectedRowKeys.length} 个模型`)
      } else if (batchActionType === 'delete') {
        // 批量删除
        await api.post('/ai-models/batch-delete', {
          ids: selectedRowKeys,
        })
        message.success(`成功删除 ${selectedRowKeys.length} 个模型`)
      }

      setBatchActionModalVisible(false)
      setSelectedRowKeys([])
      fetchModels()
    } catch (error: any) {
      message.error(error.response?.data?.message || '批量操作失败')
    }
  }

  const handleProviderChange = (provider: string) => {
    // 清空model_name和api_base_url
    form.setFieldsValue({
      model_name: undefined,
      api_base_url: modelPresets[provider]?.[Object.keys(modelPresets[provider])[0]]?.api_base_url || '',
    })
  }

  const handleModelNameChange = (modelName: string) => {
    const provider = form.getFieldValue('provider')
    const preset = modelPresets[provider]?.[modelName]

    if (preset) {
      form.setFieldsValue({
        api_base_url: preset.api_base_url,
        max_tokens: preset.max_tokens,
      })
    }
  }

  const getProviderTag = (provider: string) => {
    const option = providerOptions.find((p) => p.value === provider)
    return <Tag color={option?.color}>{option?.label || provider}</Tag>
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { status: any; text: string }> = {
      active: { status: 'success', text: '正常' },
      inactive: { status: 'default', text: '未激活' },
      error: { status: 'error', text: '错误' },
    }
    const config = statusMap[status] || statusMap.inactive
    return <Badge status={config.status} text={config.text} />
  }

  // 快速切换启用状态
  const handleQuickToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await api.put(`/ai-models/${id}`, { is_active: !currentStatus })
      message.success(currentStatus ? '已停用' : '已启用')
      fetchModels()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  // 导出JSON
  const handleExportJSON = () => {
    if (models.length === 0) {
      message.warning('没有数据可导出')
      return
    }

    const dataStr = JSON.stringify(models, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-models-${new Date().getTime()}.json`
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  // 导入JSON
  const handleImportJSON = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)

        if (!Array.isArray(json)) {
          message.error('JSON格式错误,需要数组格式')
          return
        }

        // 批量导入
        await api.post('/ai-models/batch-import', { models: json })
        message.success(`成功导入 ${json.length} 个模型`)
        fetchModels()
      } catch (error: any) {
        message.error(error.response?.data?.message || 'JSON解析失败或导入失败')
      }
    }
    reader.readAsText(file)
    return false // 阻止自动上传
  }

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({})
    message.info('已重置筛选条件')
  }

  // 应用高级筛选
  const handleApplyAdvancedFilter = (values: any) => {
    // 处理优先级范围
    let priorityRange: [number, number] | undefined = undefined
    if (values.priorityMin !== undefined && values.priorityMax !== undefined) {
      priorityRange = [values.priorityMin, values.priorityMax]
    }

    setFilters((prev) => ({
      ...prev,
      is_active: values.is_active,
      is_default: values.is_default,
      priorityRange,
    }))
  }

  const columns: ColumnsType<AIModel> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <Space>
          {text}
          {record.is_default && (
            <Tooltip title="默认模型">
              <StarOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'provider',
      key: 'provider',
      width: 150,
      render: (provider) => getProviderTag(provider),
    },
    {
      title: '模型标识',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusBadge(status),
    },
    {
      title: '激活状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (is_active, record) => (
        <Space>
          <Switch
            checked={is_active}
            onChange={() => handleQuickToggleActive(record.id, is_active)}
            checkedChildren="启用"
            unCheckedChildren="停用"
          />
        </Space>
      ),
    },
    {
      title: '默认模型',
      dataIndex: 'is_default',
      key: 'is_default',
      width: 100,
      render: (is_default) =>
        is_default ? (
          <Tag color="gold" icon={<StarOutlined />}>
            默认
          </Tag>
        ) : (
          <Tag color="default">-</Tag>
        ),
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 100,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
    },
    {
      title: '最后使用',
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      width: 160,
      render: (text) => (text ? new Date(text).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="测试连接">
            <Button
              type="link"
              size="small"
              icon={<ApiOutlined />}
              onClick={() => handleTest(record)}
            >
              测试
            </Button>
          </Tooltip>
          <Tooltip title="查看统计">
            <Button
              type="link"
              size="small"
              icon={<LineChartOutlined />}
              onClick={() => handleViewStats(record)}
            >
              统计
            </Button>
          </Tooltip>
          {!record.is_default && (
            <Tooltip title="设为默认">
              <Button
                type="link"
                size="small"
                icon={<StarOutlined />}
                onClick={() => handleSetDefault(record.id)}
              >
                默认
              </Button>
            </Tooltip>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个模型吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys as number[])
    },
  }

  // 根据visibleColumns过滤列
  const filteredColumns = columns.filter((col) => {
    const key = col.key as string
    return visibleColumns.includes(key)
  })

  // 渲染卡片视图
  const renderCardView = () => (
    <Row gutter={[16, 16]}>
      {models.map((model) => (
        <Col key={model.id} xs={24} sm={12} lg={8} xl={6}>
          <Card
            hoverable
            actions={[
              <Tooltip title="测试">
                <ApiOutlined key="test" onClick={() => handleTest(model)} />
              </Tooltip>,
              <Tooltip title="编辑">
                <EditOutlined key="edit" onClick={() => handleOpenModal(model)} />
              </Tooltip>,
              <Tooltip title="统计">
                <LineChartOutlined key="stats" onClick={() => handleViewStats(model)} />
              </Tooltip>,
              <Popconfirm
                title="确定删除?"
                onConfirm={() => handleDelete(model.id)}
              >
                <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} />
              </Popconfirm>,
            ]}
          >
            <Card.Meta
              title={
                <Space>
                  {model.name}
                  {model.is_default && <StarOutlined style={{ color: '#faad14' }} />}
                </Space>
              }
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>{getProviderTag(model.provider)}</div>
                  <div>{getStatusBadge(model.status)}</div>
                  <div>
                    <Switch
                      checked={model.is_active}
                      onChange={() => handleQuickToggleActive(model.id, model.is_active)}
                      checkedChildren="启用"
                      unCheckedChildren="停用"
                      size="small"
                    />
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space>
                    <span>优先级: {model.priority}</span>
                    <span>调用: {model.usage_count}</span>
                  </Space>
                </Space>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  )

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总模型数"
              value={statistics.total}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃模型"
              value={statistics.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日调用"
              value={statistics.todayCalls}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成功率"
              value={statistics.successRate}
              suffix="%"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="AI模型管理"
        extra={
          <Space>
            <Upload
              accept=".json"
              beforeUpload={handleImportJSON}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>导入JSON</Button>
            </Upload>
            <Button icon={<DownloadOutlined />} onClick={handleExportJSON}>
              导出JSON
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              添加模型
            </Button>
          </Space>
        }
      >
        {/* 筛选条件区域 */}
        <div style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* 基础筛选 */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Select
                  mode="multiple"
                  placeholder="选择供应商"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.providers || []}
                  onChange={(values) => setFilters({ ...filters, providers: values })}
                >
                  {providerOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  mode="multiple"
                  placeholder="选择状态"
                  style={{ width: '100%' }}
                  allowClear
                  value={filters.statuses || []}
                  onChange={(values) => setFilters({ ...filters, statuses: values })}
                >
                  {statusOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Input.Search
                  placeholder="搜索模型名称或标识"
                  allowClear
                  onSearch={(value) => setFilters({ ...filters, search: value })}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Space>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setAdvancedFilterVisible(!advancedFilterVisible)}
                  >
                    高级筛选
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* 高级筛选 */}
            <Collapse activeKey={advancedFilterVisible ? ['1'] : []}>
              <Collapse.Panel header="高级筛选选项" key="1">
                <Form
                  layout="inline"
                  onFinish={handleApplyAdvancedFilter}
                  initialValues={{
                    is_active: filters.is_active,
                    is_default: filters.is_default,
                    priorityMin: filters.priorityRange?.[0],
                    priorityMax: filters.priorityRange?.[1],
                  }}
                >
                  <Form.Item name="is_active" label="启用状态">
                    <Radio.Group>
                      <Radio value={undefined}>全部</Radio>
                      <Radio value="true">已启用</Radio>
                      <Radio value="false">已停用</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item name="is_default" label="默认模型">
                    <Radio.Group>
                      <Radio value={undefined}>全部</Radio>
                      <Radio value="true">是</Radio>
                      <Radio value="false">否</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label="优先级范围">
                    <Space>
                      <Form.Item name="priorityMin" noStyle>
                        <InputNumber min={0} max={100} placeholder="最小" style={{ width: 80 }} />
                      </Form.Item>
                      -
                      <Form.Item name="priorityMax" noStyle>
                        <InputNumber min={0} max={100} placeholder="最大" style={{ width: 80 }} />
                      </Form.Item>
                    </Space>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      应用筛选
                    </Button>
                  </Form.Item>
                </Form>
              </Collapse.Panel>
            </Collapse>
          </Space>
        </div>

        {/* 视图切换和列自定义 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {/* 批量操作按钮 */}
            {selectedRowKeys.length > 0 && (
              <Space>
                <span>已选择 {selectedRowKeys.length} 项</span>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleBatchAction('activate')}
                >
                  批量启用
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBatchAction('deactivate')}
                >
                  批量停用
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBatchAction('update')}
                >
                  批量更新
                </Button>
                <Popconfirm
                  title={`确定要删除选中的 ${selectedRowKeys.length} 个模型吗？`}
                  onConfirm={() => handleBatchAction('delete')}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button size="small" danger>
                    批量删除
                  </Button>
                </Popconfirm>
                <Button size="small" onClick={() => setSelectedRowKeys([])}>
                  取消选择
                </Button>
              </Space>
            )}
          </div>
          <Space>
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <Radio.Button value="table">
                <UnorderedListOutlined /> 表格
              </Radio.Button>
              <Radio.Button value="card">
                <AppstoreOutlined /> 卡片
              </Radio.Button>
            </Radio.Group>
            {viewMode === 'table' && (
              <Button
                icon={<SettingOutlined />}
                onClick={() => setColumnSettingVisible(true)}
              >
                列设置
              </Button>
            )}
          </Space>
        </div>

        {/* 表格或卡片视图 */}
        {viewMode === 'table' ? (
          <Table
            rowSelection={rowSelection}
            columns={filteredColumns}
            dataSource={models}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1600 }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => {
                fetchModels(page, pageSize)
              },
              onShowSizeChange: (_current, size) => {
                fetchModels(1, size)
              },
            }}
          />
        ) : (
          <>
            {renderCardView()}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              {/* 卡片视图的分页 */}
              {pagination.total > pagination.pageSize && (
                <Space>
                  <Button
                    disabled={pagination.current === 1}
                    onClick={() => fetchModels(pagination.current - 1, pagination.pageSize)}
                  >
                    上一页
                  </Button>
                  <span>
                    第 {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)} 页
                  </span>
                  <Button
                    disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                    onClick={() => fetchModels(pagination.current + 1, pagination.pageSize)}
                  >
                    下一页
                  </Button>
                </Space>
              )}
            </div>
          </>
        )}
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingModel ? '编辑AI模型' : '添加AI模型'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="模型名称"
                rules={[{ required: true, message: '请输入模型名称' }]}
              >
                <Input placeholder="例如: GPT-4" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="provider"
                label="供应商"
                rules={[{ required: true, message: '请选择供应商' }]}
              >
                <Select placeholder="选择供应商" onChange={handleProviderChange}>
                  {providerOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="model_name"
                label="模型标识"
                rules={[{ required: true, message: '请输入模型标识' }]}
              >
                <Input placeholder="例如: gpt-4" onChange={(e) => handleModelNameChange(e.target.value)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请输入优先级' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="api_key"
            label="API Key"
            rules={[{ required: true, message: '请输入API Key' }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Form.Item
            name="api_base_url"
            label="API Base URL"
            rules={[{ required: true, message: '请输入API Base URL' }]}
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item name="system_prompt" label="系统提示词">
            <TextArea
              rows={3}
              placeholder="你是一位专业的算命大师..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="max_tokens" label="最大Token数">
                <InputNumber min={100} max={32000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="temperature" label="Temperature">
                <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="top_p" label="Top P">
                <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="frequency_penalty" label="Frequency Penalty">
                <InputNumber min={-2} max={2} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="daily_limit" label="每日限制">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0表示无限制" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="monthly_limit" label="每月限制">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0表示无限制" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_active" label="是否激活" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_default" label="设为默认" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 测试连接弹窗 */}
      <Modal
        title={`测试 ${testingModel?.name}`}
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setTestModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="test"
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={testLoading}
            onClick={handleRunTest}
          >
            运行测试
          </Button>,
        ]}
      >
        <Form form={testForm} layout="vertical">
          <Form.Item
            name="test_prompt"
            label="测试提示词"
            rules={[{ required: true, message: '请输入测试提示词' }]}
          >
            <TextArea rows={3} placeholder="输入测试内容..." />
          </Form.Item>
        </Form>

        {testResult && (
          <Card title="测试结果" style={{ marginTop: 16 }}>
            {testResult.error ? (
              <div style={{ color: 'red' }}>
                <p><strong>错误:</strong></p>
                <p>{testResult.error}</p>
              </div>
            ) : (
              <div>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="响应时间">
                    {testResult.duration_ms}ms
                  </Descriptions.Item>
                  <Descriptions.Item label="模型">
                    {testResult.model_info?.model_name}
                  </Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 16 }}>
                  <p><strong>响应内容:</strong></p>
                  <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                    {testResult.response?.content}
                  </div>
                </div>
                {testResult.response?.usage && (
                  <div style={{ marginTop: 16 }}>
                    <p><strong>Token使用:</strong></p>
                    <Descriptions size="small" column={3}>
                      <Descriptions.Item label="Prompt Tokens">
                        {testResult.response.usage.prompt_tokens}
                      </Descriptions.Item>
                      <Descriptions.Item label="Completion Tokens">
                        {testResult.response.usage.completion_tokens}
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Tokens">
                        {testResult.response.usage.total_tokens}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </Modal>

      {/* 统计数据弹窗 */}
      <Modal
        title={`${testingModel?.name} - 使用统计`}
        open={statsModalVisible}
        onCancel={() => setStatsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setStatsModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {modelStats && (
          <Row gutter={16}>
            <Col span={12}>
              <Card>
                <Statistic
                  title="总请求数"
                  value={modelStats.total_requests}
                  prefix={<LineChartOutlined />}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="成功率"
                  value={
                    modelStats.total_requests > 0
                      ? ((modelStats.success_count / modelStats.total_requests) * 100).toFixed(2)
                      : 0
                  }
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={12} style={{ marginTop: 16 }}>
              <Card>
                <Statistic
                  title="Token使用总量"
                  value={modelStats.total_tokens_used}
                  prefix={<ApiOutlined />}
                />
              </Card>
            </Col>
            <Col span={12} style={{ marginTop: 16 }}>
              <Card>
                <Statistic
                  title="平均响应时间"
                  value={modelStats.avg_duration_ms.toFixed(0)}
                  suffix="ms"
                  prefix={<ThunderboltOutlined />}
                />
              </Card>
            </Col>
            <Col span={12} style={{ marginTop: 16 }}>
              <Card>
                <Statistic
                  title="总成本"
                  value={modelStats.total_cost}
                  precision={4}
                  prefix="$"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={12} style={{ marginTop: 16 }}>
              <Card>
                <Statistic
                  title="错误次数"
                  value={modelStats.error_count}
                  valueStyle={{ color: modelStats.error_count > 0 ? '#cf1322' : '#3f8600' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Modal>

      {/* 批量操作弹窗 */}
      <Modal
        title={
          batchActionType === 'activate'
            ? '批量启用模型'
            : batchActionType === 'deactivate'
            ? '批量停用模型'
            : batchActionType === 'update'
            ? '批量更新配置'
            : '批量删除模型'
        }
        open={batchActionModalVisible}
        onCancel={() => setBatchActionModalVisible(false)}
        onOk={handleBatchSubmit}
        width={600}
      >
        {batchActionType === 'update' ? (
          <Form form={batchForm} layout="vertical">
            <p>将更新选中的 {selectedRowKeys.length} 个模型，只填写需要更新的字段：</p>
            <Form.Item label="最大Token数" name="max_tokens">
              <InputNumber min={1} max={100000} style={{ width: '100%' }} placeholder="不修改请留空" />
            </Form.Item>
            <Form.Item
              label="温度系数 (Temperature)"
              name="temperature"
            >
              <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} placeholder="不修改请留空" />
            </Form.Item>
            <Form.Item
              label="Top P"
              name="top_p"
            >
              <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} placeholder="不修改请留空" />
            </Form.Item>
            <Form.Item label="优先级" name="priority">
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="不修改请留空" />
            </Form.Item>
          </Form>
        ) : batchActionType === 'delete' ? (
          <div>
            <p style={{ color: '#ff4d4f' }}>⚠️ 警告：确定要删除选中的 {selectedRowKeys.length} 个模型吗？此操作不可恢复！</p>
          </div>
        ) : (
          <p>
            将{batchActionType === 'activate' ? '启用' : '停用'}选中的 {selectedRowKeys.length} 个模型
          </p>
        )}
      </Modal>

      {/* 列自定义Modal */}
      <Modal
        title="自定义表格列"
        open={columnSettingVisible}
        onCancel={() => setColumnSettingVisible(false)}
        onOk={() => {
          setColumnSettingVisible(false)
          message.success('列设置已保存')
        }}
        width={500}
      >
        <div>
          <p style={{ marginBottom: 16 }}>选择要显示的列：</p>
          <Checkbox.Group
            value={visibleColumns}
            onChange={(checkedValues) => setVisibleColumns(checkedValues as string[])}
            style={{ width: '100%' }}
          >
            <Row>
              {allColumns.map((col) => (
                <Col span={12} key={col.key} style={{ marginBottom: 8 }}>
                  <Checkbox
                    value={col.key}
                    disabled={col.key === 'actions'} // 操作列始终显示
                  >
                    {col.label}
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
          <Divider />
          <Space>
            <Button
              size="small"
              onClick={() => {
                setVisibleColumns(allColumns.map(col => col.key))
                message.info('已全选所有列')
              }}
            >
              全选
            </Button>
            <Button
              size="small"
              onClick={() => {
                setVisibleColumns(['name', 'provider', 'status', 'actions'])
                message.info('已恢复默认列')
              }}
            >
              恢复默认
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  )
}

export default AIModelManagement
