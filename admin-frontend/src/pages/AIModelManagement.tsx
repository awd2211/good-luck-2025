import { useState, useEffect, useRef } from 'react'
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
  Progress,
  Timeline,
  Alert,
  Spin,
  Drawer,
  List,
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
  SaveOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  HeartOutlined,
  DragOutlined,
  DiffOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import api from '../services/apiService'

// 注册ECharts组件
echarts.use([
  LineChart,
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

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
  health_monitoring?: boolean // 健康监控开关
  health_status?: 'healthy' | 'warning' | 'error' // 健康状态
  last_health_check?: string // 最后健康检查时间
}

interface ModelStats {
  total_requests: number
  success_count: number
  error_count: number
  total_tokens_used: number
  total_cost: number
  avg_duration_ms: number
}

// 配置模板接口
interface ConfigTemplate {
  id: string
  name: string
  description: string
  config: Partial<AIModel>
  created_at: string
}

// 版本历史接口
interface VersionHistory {
  id: string
  model_id: number
  version: number
  changes: Record<string, any>
  changed_by: string
  changed_at: string
  change_description: string
}

// 拖拽排序的行组件
const DraggableRow = ({ children, ...props }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  })

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  }

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </tr>
  )
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

  // ============ 新增状态 ============

  // 1. 数据可视化相关
  const [trendTimeRange, setTrendTimeRange] = useState<'7days' | '30days'>('7days')
  const [trendData, setTrendData] = useState<any>(null)
  const [tokenStatsData, setTokenStatsData] = useState<any>(null)
  const [realtimeData, setRealtimeData] = useState<any[]>([])

  // 2. 配置模板相关
  const [templateModalVisible, setTemplateModalVisible] = useState(false)
  const [templateListVisible, setTemplateListVisible] = useState(false)
  const [templates, setTemplates] = useState<ConfigTemplate[]>([])
  const [templateForm] = Form.useForm()

  // 3. 批量测试相关
  const [batchTestModalVisible, setBatchTestModalVisible] = useState(false)
  const [batchTestProgress, setBatchTestProgress] = useState(0)
  const [batchTestResults, setBatchTestResults] = useState<any[]>([])
  const [batchTestRunning, setBatchTestRunning] = useState(false)

  // 4. 版本历史相关
  const [versionHistoryVisible, setVersionHistoryVisible] = useState(false)
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([])
  const [versionLoading, setVersionLoading] = useState(false)
  const [compareVersions, setCompareVersions] = useState<[string?, string?]>([])

  // 5. 健康监控相关
  const [healthCheckInterval, setHealthCheckInterval] = useState<number>(300000) // 5分钟
  const healthCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [healthAlerts, setHealthAlerts] = useState<string[]>([])

  // 6. 表格列宽
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('aimodel_column_widths')
    return saved ? JSON.parse(saved) : {}
  })

  // 7. 增强批量编辑
  const [batchEditFields, setBatchEditFields] = useState<string[]>([])
  const [batchEditMode, setBatchEditMode] = useState<'replace' | 'increment'>('replace')

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
    { key: 'health_status', label: '健康状态' },
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

  // ============ 数据可视化相关函数 ============

  // 生成趋势图数据（模拟数据，后续可对接真实API）
  const generateTrendData = (days: number) => {
    const dates: string[] = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(`${date.getMonth() + 1}/${date.getDate()}`)
    }

    // 为每个活跃模型生成数据
    const activeModels = models.filter(m => m.is_active).slice(0, 5)
    const series = activeModels.map(model => ({
      name: model.name,
      type: 'line',
      smooth: true,
      data: dates.map(() => Math.floor(Math.random() * 100) + 20),
    }))

    return {
      dates,
      series,
    }
  }

  // 获取趋势图配置
  const getTrendChartOption = () => {
    if (!trendData) return {}

    return {
      title: {
        text: `最近${trendTimeRange === '7days' ? '7天' : '30天'}调用趋势`,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        bottom: 0,
        data: trendData.series.map((s: any) => s.name),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '60px',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendData.dates,
      },
      yAxis: {
        type: 'value',
        name: '调用次数',
      },
      series: trendData.series,
    }
  }

  // 获取Token统计图配置
  const getTokenStatsChartOption = () => {
    if (!tokenStatsData) return {}

    return {
      title: {
        text: 'Token使用分布',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
      },
      series: [
        {
          name: 'Token使用',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: tokenStatsData,
        },
      ],
    }
  }

  // 获取实时监控图配置
  const getRealtimeChartOption = () => {
    if (realtimeData.length === 0) return {}

    const times = realtimeData.map(d => d.time)
    const responseTimes = realtimeData.map(d => d.responseTime)

    return {
      title: {
        text: '实时响应时间监控',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0]
          return `${data.name}<br/>响应时间: ${data.value}ms`
        },
      },
      xAxis: {
        type: 'category',
        data: times,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '响应时间(ms)',
      },
      series: [
        {
          data: responseTimes,
          type: 'line',
          smooth: true,
          areaStyle: {
            color: 'rgba(24, 144, 255, 0.2)',
          },
          lineStyle: {
            color: '#1890ff',
          },
        },
      ],
    }
  }

  // 生成Token统计数据（模拟）
  const generateTokenStats = () => {
    const activeModels = models.filter(m => m.is_active)
    return activeModels.map(model => ({
      name: model.name,
      value: Math.floor(Math.random() * 10000) + 1000,
    }))
  }

  // 生成实时数据（模拟）
  const generateRealtimeData = () => {
    const data: any[] = []
    const now = new Date()

    for (let i = 29; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 2000)
      data.push({
        time: `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`,
        responseTime: Math.floor(Math.random() * 500) + 100,
      })
    }

    return data
  }

  // 更新趋势数据
  useEffect(() => {
    if (models.length > 0) {
      const days = trendTimeRange === '7days' ? 7 : 30
      setTrendData(generateTrendData(days))
      setTokenStatsData(generateTokenStats())
    }
  }, [models, trendTimeRange])

  // 实时数据更新（每5秒）
  useEffect(() => {
    setRealtimeData(generateRealtimeData())

    const timer = setInterval(() => {
      setRealtimeData(prev => {
        const newData = [...prev]
        newData.shift()
        const now = new Date()
        newData.push({
          time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
          responseTime: Math.floor(Math.random() * 500) + 100,
        })
        return newData
      })
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  // ============ 配置模板相关函数 ============

  // 从localStorage加载模板
  const loadTemplates = () => {
    const saved = localStorage.getItem('aimodel_templates')
    if (saved) {
      setTemplates(JSON.parse(saved))
    }
  }

  // 保存模板到localStorage
  const saveTemplates = (newTemplates: ConfigTemplate[]) => {
    localStorage.setItem('aimodel_templates', JSON.stringify(newTemplates))
    setTemplates(newTemplates)
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  // 保存为模板
  const handleSaveAsTemplate = async () => {
    try {
      const values = await templateForm.validateFields()
      const currentConfig = form.getFieldsValue()

      const newTemplate: ConfigTemplate = {
        id: Date.now().toString(),
        name: values.templateName,
        description: values.templateDescription || '',
        config: {
          provider: currentConfig.provider,
          model_name: currentConfig.model_name,
          api_base_url: currentConfig.api_base_url,
          max_tokens: currentConfig.max_tokens,
          temperature: currentConfig.temperature,
          top_p: currentConfig.top_p,
          frequency_penalty: currentConfig.frequency_penalty,
          presence_penalty: currentConfig.presence_penalty,
          system_prompt: currentConfig.system_prompt,
        },
        created_at: new Date().toISOString(),
      }

      saveTemplates([...templates, newTemplate])
      message.success('模板保存成功')
      setTemplateModalVisible(false)
      templateForm.resetFields()
    } catch (error) {
      console.error('保存模板失败', error)
    }
  }

  // 从模板创建
  const handleCreateFromTemplate = (template: ConfigTemplate) => {
    form.setFieldsValue({
      ...template.config,
      name: '', // 名称需要用户填写
      api_key: '', // API Key需要用户填写
      priority: 50,
      is_active: true,
      is_default: false,
    })
    setTemplateListVisible(false)
    message.success('已加载模板配置，请填写模型名称和API Key')
  }

  // 删除模板
  const handleDeleteTemplate = (templateId: string) => {
    const newTemplates = templates.filter(t => t.id !== templateId)
    saveTemplates(newTemplates)
    message.success('模板已删除')
  }

  // ============ 批量测试相关函数 ============

  // 批量测试模型
  const handleBatchTest = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要测试的模型')
      return
    }

    setBatchTestModalVisible(true)
    setBatchTestProgress(0)
    setBatchTestResults([])
    setBatchTestRunning(true)

    const selectedModels = models.filter(m => selectedRowKeys.includes(m.id))
    const testPrompt = '你好，这是一个测试消息，请简单回复。'

    for (let i = 0; i < selectedModels.length; i++) {
      const model = selectedModels[i]

      try {
        const startTime = Date.now()
        const res = await api.post(`/ai-models/${model.id}/test`, {
          test_prompt: testPrompt,
        })
        const duration = Date.now() - startTime

        setBatchTestResults(prev => [...prev, {
          model: model.name,
          status: 'success',
          duration,
          response: res.data.data?.response?.content || '成功',
        }])
      } catch (error: any) {
        setBatchTestResults(prev => [...prev, {
          model: model.name,
          status: 'error',
          error: error.response?.data?.message || error.message,
        }])
      }

      setBatchTestProgress(Math.round(((i + 1) / selectedModels.length) * 100))
    }

    setBatchTestRunning(false)
    message.success('批量测试完成')
  }

  // ============ 版本历史相关函数 ============

  // 获取版本历史（模拟数据，后续对接真实API）
  // API 格式: GET /ai-models/:id/versions
  // 返回: { success: true, data: VersionHistory[] }
  const fetchVersionHistory = async (modelId: number) => {
    setVersionLoading(true)
    try {
      // 模拟API调用
      // const res = await api.get(`/ai-models/${modelId}/versions`)
      // if (res.data.success) {
      //   setVersionHistory(res.data.data)
      // }

      // 使用模拟数据
      const mockHistory: VersionHistory[] = [
        {
          id: '1',
          model_id: modelId,
          version: 3,
          changes: {
            temperature: { old: 0.7, new: 0.8 },
            max_tokens: { old: 2000, new: 4000 },
          },
          changed_by: 'admin',
          changed_at: new Date(Date.now() - 86400000).toISOString(),
          change_description: '调整温度参数和最大token数',
        },
        {
          id: '2',
          model_id: modelId,
          version: 2,
          changes: {
            system_prompt: { old: '旧提示词', new: '新提示词' },
            priority: { old: 50, new: 60 },
          },
          changed_by: 'admin',
          changed_at: new Date(Date.now() - 172800000).toISOString(),
          change_description: '更新系统提示词和优先级',
        },
        {
          id: '3',
          model_id: modelId,
          version: 1,
          changes: {},
          changed_by: 'admin',
          changed_at: new Date(Date.now() - 259200000).toISOString(),
          change_description: '创建模型',
        },
      ]

      setVersionHistory(mockHistory)
    } catch (error: any) {
      message.error('获取版本历史失败')
    } finally {
      setVersionLoading(false)
    }
  }

  // 对比版本差异
  const renderVersionDiff = () => {
    if (compareVersions.length !== 2 || !compareVersions[0] || !compareVersions[1]) {
      return <Alert message="请选择两个版本进行对比" type="info" />
    }

    const v1 = versionHistory.find(v => v.id === compareVersions[0])
    const v2 = versionHistory.find(v => v.id === compareVersions[1])

    if (!v1 || !v2) return null

    // 简单的差异展示
    const allKeys = new Set([
      ...Object.keys(v1.changes),
      ...Object.keys(v2.changes),
    ])

    return (
      <div>
        <Descriptions title={`版本 ${v1.version} vs 版本 ${v2.version}`} bordered column={2}>
          {Array.from(allKeys).map(key => (
            <Descriptions.Item key={key} label={key} span={2}>
              <Space direction="vertical">
                <div>版本{v1.version}: {JSON.stringify(v1.changes[key]?.new || v1.changes[key])}</div>
                <div>版本{v2.version}: {JSON.stringify(v2.changes[key]?.new || v2.changes[key])}</div>
              </Space>
            </Descriptions.Item>
          ))}
        </Descriptions>
      </div>
    )
  }

  // ============ 健康监控相关函数 ============

  // 执行健康检查
  const performHealthCheck = async (model: AIModel) => {
    try {
      const res = await api.post(`/ai-models/${model.id}/test`, {
        test_prompt: 'health check',
      })

      // 更新模型健康状态
      const updatedModel = {
        ...model,
        health_status: 'healthy' as const,
        last_health_check: new Date().toISOString(),
      }

      setModels(prev => prev.map(m => m.id === model.id ? updatedModel : m))

      return true
    } catch (error: any) {
      // 健康检查失败
      const updatedModel = {
        ...model,
        health_status: 'error' as const,
        last_health_check: new Date().toISOString(),
      }

      setModels(prev => prev.map(m => m.id === model.id ? updatedModel : m))

      // 添加告警
      setHealthAlerts(prev => [
        ...prev,
        `${new Date().toLocaleTimeString()} - 模型 ${model.name} 健康检查失败: ${error.response?.data?.message || error.message}`,
      ])

      return false
    }
  }

  // 启动健康监控
  useEffect(() => {
    const monitoredModels = models.filter(m => m.health_monitoring && m.is_active)

    if (monitoredModels.length > 0) {
      // 立即执行一次检查
      monitoredModels.forEach(model => performHealthCheck(model))

      // 定时检查
      healthCheckTimerRef.current = setInterval(() => {
        const currentMonitored = models.filter(m => m.health_monitoring && m.is_active)
        currentMonitored.forEach(model => performHealthCheck(model))
      }, healthCheckInterval)
    }

    return () => {
      if (healthCheckTimerRef.current) {
        clearInterval(healthCheckTimerRef.current)
        healthCheckTimerRef.current = null
      }
    }
  }, [models.filter(m => m.health_monitoring).length, healthCheckInterval])

  // 切换健康监控
  const handleToggleHealthMonitoring = async (modelId: number, enabled: boolean) => {
    try {
      // 后续对接API
      // await api.put(`/ai-models/${modelId}`, { health_monitoring: enabled })

      setModels(prev => prev.map(m =>
        m.id === modelId ? { ...m, health_monitoring: enabled } : m
      ))

      message.success(enabled ? '已启用健康监控' : '已关闭健康监控')
    } catch (error: any) {
      message.error('操作失败')
    }
  }

  // ============ 拖拽排序相关 ============

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = models.findIndex(m => m.id === active.id)
    const newIndex = models.findIndex(m => m.id === over.id)

    const newModels = arrayMove(models, oldIndex, newIndex)

    // 更新priority字段（根据新顺序）
    const updatedModels = newModels.map((model, index) => ({
      ...model,
      priority: 100 - index, // 倒序，第一个优先级最高
    }))

    setModels(updatedModels)

    // 调用API更新后端
    try {
      const movedModel = updatedModels[newIndex]
      await api.put(`/ai-models/${movedModel.id}`, {
        priority: movedModel.priority,
      })
      message.success('排序已更新')
    } catch (error: any) {
      message.error('更新排序失败')
      // 恢复原顺序
      fetchModels()
    }
  }

  // ============ 列宽调整相关 ============

  const handleColumnResize = (key: string, width: number) => {
    const newWidths = { ...columnWidths, [key]: width }
    setColumnWidths(newWidths)
    localStorage.setItem('aimodel_column_widths', JSON.stringify(newWidths))
  }

  // ============ 增强批量编辑相关 ============

  // 获取选中项的现有值
  const getSelectedModelsValues = () => {
    const selectedModels = models.filter(m => selectedRowKeys.includes(m.id))
    if (selectedModels.length === 0) return {}

    // 统计各字段的值
    const valueStats: any = {}
    const fields = ['max_tokens', 'temperature', 'top_p', 'priority', 'is_active']

    fields.forEach(field => {
      const values = selectedModels.map(m => (m as any)[field])
      const uniqueValues = Array.from(new Set(values))
      valueStats[field] = {
        values: uniqueValues,
        allSame: uniqueValues.length === 1,
      }
    })

    return valueStats
  }

  // ============ 原有函数 ============

  const fetchModels = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params: any = { page, limit: pageSize }

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

          setStatistics({
            total: filteredModels.length,
            active: filteredModels.filter((m: AIModel) => m.is_active).length,
            todayCalls: filteredModels.reduce((sum: number, m: AIModel) => sum + (m.usage_count || 0), 0),
            successRate: 95.5,
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
      form.setFieldsValue({
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        max_tokens: 2000,
        is_active: true,
        is_default: false,
        priority: 50,
        health_monitoring: false,
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
        fetchModels()
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

  const handleBatchAction = (actionType: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的模型')
      return
    }

    if (actionType === 'test') {
      handleBatchTest()
      return
    }

    setBatchActionType(actionType)
    batchForm.resetFields()
    setBatchEditFields([])
    setBatchEditMode('replace')
    setBatchActionModalVisible(true)
  }

  const handleBatchSubmit = async () => {
    try {
      const values = await batchForm.validateFields()

      if (batchActionType === 'activate') {
        await api.post('/ai-models/batch-update', {
          ids: selectedRowKeys,
          data: { is_active: true },
        })
        message.success(`成功启用 ${selectedRowKeys.length} 个模型`)
      } else if (batchActionType === 'deactivate') {
        await api.post('/ai-models/batch-update', {
          ids: selectedRowKeys,
          data: { is_active: false },
        })
        message.success(`成功停用 ${selectedRowKeys.length} 个模型`)
      } else if (batchActionType === 'update') {
        // 增强批量编辑：只更新勾选的字段
        const updateData: any = {}

        batchEditFields.forEach(field => {
          if (values[field] !== undefined) {
            if (batchEditMode === 'increment' && (field === 'priority' || field === 'max_tokens')) {
              // 增量模式：需要逐个模型更新
              // 这里简化处理，实际应该发送特殊标记给后端
              updateData[field] = values[field]
            } else {
              updateData[field] = values[field]
            }
          }
        })

        if (Object.keys(updateData).length === 0) {
          message.warning('请至少勾选一个要修改的字段')
          return
        }

        await api.post('/ai-models/batch-update', {
          ids: selectedRowKeys,
          data: updateData,
          mode: batchEditMode, // 传递模式给后端
        })
        message.success(`成功更新 ${selectedRowKeys.length} 个模型`)
      } else if (batchActionType === 'delete') {
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

  // 健康状态渲染
  const getHealthStatusBadge = (health_status?: string) => {
    if (!health_status) return <Badge status="default" text="未监控" />

    const statusMap: Record<string, { status: any; text: string; color: string }> = {
      healthy: { status: 'success', text: '健康', color: '#52c41a' },
      warning: { status: 'warning', text: '警告', color: '#faad14' },
      error: { status: 'error', text: '异常', color: '#ff4d4f' },
    }

    const config = statusMap[health_status] || statusMap.error
    return (
      <Tooltip title={`健康状态: ${config.text}`}>
        <Badge status={config.status} text={config.text} />
      </Tooltip>
    )
  }

  const handleQuickToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await api.put(`/ai-models/${id}`, { is_active: !currentStatus })
      message.success(currentStatus ? '已停用' : '已启用')
      fetchModels()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

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

  const handleImportJSON = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)

        if (!Array.isArray(json)) {
          message.error('JSON格式错误,需要数组格式')
          return
        }

        await api.post('/ai-models/batch-import', { models: json })
        message.success(`成功导入 ${json.length} 个模型`)
        fetchModels()
      } catch (error: any) {
        message.error(error.response?.data?.message || 'JSON解析失败或导入失败')
      }
    }
    reader.readAsText(file)
    return false
  }

  const handleResetFilters = () => {
    setFilters({})
    message.info('已重置筛选条件')
  }

  const handleApplyAdvancedFilter = (values: any) => {
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
      title: '',
      key: 'drag',
      width: 40,
      render: () => <DragOutlined style={{ cursor: 'move', color: '#999' }} />,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: columnWidths['id'] || 60,
    },
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      width: columnWidths['name'] || 200,
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
      width: columnWidths['provider'] || 150,
      render: (provider) => getProviderTag(provider),
    },
    {
      title: '模型标识',
      dataIndex: 'model_name',
      key: 'model_name',
      width: columnWidths['model_name'] || 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: columnWidths['status'] || 100,
      render: (status) => getStatusBadge(status),
    },
    {
      title: '健康状态',
      dataIndex: 'health_status',
      key: 'health_status',
      width: columnWidths['health_status'] || 120,
      render: (health_status, record) => (
        <Space direction="vertical" size="small">
          {getHealthStatusBadge(health_status)}
          {record.health_monitoring && (
            <Tag color="blue" style={{ fontSize: '10px' }}>监控中</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '激活状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: columnWidths['is_active'] || 120,
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
      width: columnWidths['is_default'] || 100,
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
      width: columnWidths['usage_count'] || 100,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: columnWidths['priority'] || 80,
    },
    {
      title: '最后使用',
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      width: columnWidths['last_used_at'] || 160,
      render: (text) => (text ? new Date(text).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
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
          <Tooltip title="版本历史">
            <Button
              type="link"
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => {
                setTestingModel(record)
                fetchVersionHistory(record.id)
                setVersionHistoryVisible(true)
              }}
            >
              历史
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys as number[])
    },
  }

  const filteredColumns = columns.filter((col) => {
    const key = col.key as string
    return visibleColumns.includes(key) || key === 'drag' || !col.key
  })

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
                  {model.health_monitoring && (
                    <div>{getHealthStatusBadge(model.health_status)}</div>
                  )}
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
      {/* 健康告警 */}
      {healthAlerts.length > 0 && (
        <Alert
          message="健康监控告警"
          description={
            <div style={{ maxHeight: 100, overflow: 'auto' }}>
              {healthAlerts.slice(-5).map((alert, idx) => (
                <div key={idx}>{alert}</div>
              ))}
            </div>
          }
          type="warning"
          closable
          onClose={() => setHealthAlerts([])}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => setHealthAlerts([])}>
              清空
            </Button>
          }
        />
      )}

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

      {/* 数据可视化图表区域 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* 使用趋势图 */}
        <Col xs={24} lg={12}>
          <Card
            title="使用趋势"
            extra={
              <Radio.Group
                value={trendTimeRange}
                onChange={(e) => setTrendTimeRange(e.target.value)}
                size="small"
              >
                <Radio.Button value="7days">7天</Radio.Button>
                <Radio.Button value="30days">30天</Radio.Button>
              </Radio.Group>
            }
          >
            {trendData && (
              <ReactEChartsCore
                echarts={echarts}
                option={getTrendChartOption()}
                style={{ height: 300 }}
              />
            )}
          </Card>
        </Col>

        {/* Token使用统计图 */}
        <Col xs={24} lg={12}>
          <Card title="Token使用分布">
            {tokenStatsData && (
              <ReactEChartsCore
                echarts={echarts}
                option={getTokenStatsChartOption()}
                style={{ height: 300 }}
              />
            )}
          </Card>
        </Col>

        {/* 实时响应时间监控 */}
        <Col xs={24}>
          <Card title="实时响应时间监控">
            <ReactEChartsCore
              echarts={echarts}
              option={getRealtimeChartOption()}
              style={{ height: 250 }}
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
            {selectedRowKeys.length > 0 && (
              <Space wrap>
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
                <Button
                  size="small"
                  icon={<ExperimentOutlined />}
                  onClick={() => handleBatchAction('test')}
                >
                  批量测试
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={models.map(m => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <Table
                rowSelection={rowSelection}
                columns={filteredColumns}
                dataSource={models}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1800 }}
                components={{
                  body: {
                    row: DraggableRow,
                  },
                }}
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
            </SortableContext>
          </DndContext>
        ) : (
          <>
            {renderCardView()}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
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
        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本配置" key="basic">
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
                <Col span={8}>
                  <Form.Item name="is_active" label="是否激活" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="is_default" label="设为默认" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="health_monitoring" label="健康监控" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </TabPane>

          <TabPane tab="模板管理" key="template">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="配置模板功能"
                description="保存当前配置为模板，或从已有模板快速创建新模型"
                type="info"
                showIcon
              />
              <Space>
                <Button
                  icon={<SaveOutlined />}
                  onClick={() => setTemplateModalVisible(true)}
                >
                  保存当前配置为模板
                </Button>
                <Button
                  icon={<FolderOpenOutlined />}
                  onClick={() => setTemplateListVisible(true)}
                >
                  从模板创建
                </Button>
              </Space>
            </Space>
          </TabPane>
        </Tabs>
      </Modal>

      {/* 保存模板弹窗 */}
      <Modal
        title="保存配置模板"
        open={templateModalVisible}
        onOk={handleSaveAsTemplate}
        onCancel={() => setTemplateModalVisible(false)}
        width={500}
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item
            name="templateName"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="例如: GPT-4标准配置" />
          </Form.Item>
          <Form.Item name="templateDescription" label="模板描述">
            <TextArea rows={2} placeholder="可选，描述该模板的用途" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板列表弹窗 */}
      <Modal
        title="选择配置模板"
        open={templateListVisible}
        onCancel={() => setTemplateListVisible(false)}
        footer={null}
        width={700}
      >
        <List
          dataSource={templates}
          renderItem={(template) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  使用
                </Button>,
                <Popconfirm
                  title="确定删除此模板？"
                  onConfirm={() => handleDeleteTemplate(template.id)}
                >
                  <Button type="link" size="small" danger>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={template.name}
                description={
                  <Space direction="vertical">
                    <div>{template.description}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      创建时间: {new Date(template.created_at).toLocaleString('zh-CN')}
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无模板' }}
        />
      </Modal>

      {/* 批量测试弹窗 */}
      <Modal
        title={`批量测试 (${selectedRowKeys.length} 个模型)`}
        open={batchTestModalVisible}
        onCancel={() => setBatchTestModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBatchTestModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress percent={batchTestProgress} status={batchTestRunning ? 'active' : 'normal'} />

          {batchTestResults.length > 0 && (
            <List
              dataSource={batchTestResults}
              renderItem={(result) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      result.status === 'success' ? (
                        <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                      ) : (
                        <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                      )
                    }
                    title={
                      <Space>
                        <span>{result.model}</span>
                        {result.status === 'success' && (
                          <Tag color="success">成功 - {result.duration}ms</Tag>
                        )}
                        {result.status === 'error' && (
                          <Tag color="error">失败</Tag>
                        )}
                      </Space>
                    }
                    description={
                      result.status === 'success'
                        ? result.response?.substring(0, 100) + '...'
                        : result.error
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Space>
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

      {/* 批量操作弹窗 - 增强版 */}
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
        width={700}
      >
        {batchActionType === 'update' ? (
          <div>
            <Alert
              message={`将更新选中的 ${selectedRowKeys.length} 个模型`}
              description="只修改勾选的字段，未勾选的字段将保持不变"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {/* 显示当前选中项的值统计 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <div>
                <strong>当前选中项的现有值：</strong>
                {Object.entries(getSelectedModelsValues()).map(([field, stats]: any) => (
                  <div key={field} style={{ marginTop: 8 }}>
                    <Tag>{field}</Tag>
                    {stats.allSame ? (
                      <span>所有项的值相同: {JSON.stringify(stats.values[0])}</span>
                    ) : (
                      <span>值不一致: {stats.values.map((v: any) => JSON.stringify(v)).join(', ')}</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Radio.Group
              value={batchEditMode}
              onChange={(e) => setBatchEditMode(e.target.value)}
              style={{ marginBottom: 16 }}
            >
              <Radio value="replace">替换值</Radio>
              <Radio value="increment">增量调整（仅数值字段）</Radio>
            </Radio.Group>

            <Form form={batchForm} layout="vertical">
              <Checkbox.Group
                value={batchEditFields}
                onChange={(values) => setBatchEditFields(values as string[])}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Checkbox value="max_tokens">
                    <Form.Item
                      label={batchEditMode === 'increment' ? "最大Token数 (增量)" : "最大Token数"}
                      name="max_tokens"
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        min={batchEditMode === 'increment' ? -10000 : 1}
                        max={100000}
                        style={{ width: 200 }}
                        placeholder={batchEditMode === 'increment' ? "如: +1000 或 -500" : "新的值"}
                      />
                    </Form.Item>
                  </Checkbox>

                  <Checkbox value="temperature">
                    <Form.Item
                      label="温度系数 (Temperature)"
                      name="temperature"
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0} max={2} step={0.1} style={{ width: 200 }} />
                    </Form.Item>
                  </Checkbox>

                  <Checkbox value="top_p">
                    <Form.Item
                      label="Top P"
                      name="top_p"
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0} max={1} step={0.1} style={{ width: 200 }} />
                    </Form.Item>
                  </Checkbox>

                  <Checkbox value="priority">
                    <Form.Item
                      label={batchEditMode === 'increment' ? "优先级 (增量)" : "优先级"}
                      name="priority"
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        min={batchEditMode === 'increment' ? -100 : 0}
                        max={100}
                        style={{ width: 200 }}
                        placeholder={batchEditMode === 'increment' ? "如: +5 或 -3" : "新的值"}
                      />
                    </Form.Item>
                  </Checkbox>

                  <Checkbox value="is_active">
                    <Form.Item
                      label="启用状态"
                      name="is_active"
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Switch />
                    </Form.Item>
                  </Checkbox>
                </Space>
              </Checkbox.Group>
            </Form>
          </div>
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

      {/* 版本历史弹窗 */}
      <Drawer
        title={`${testingModel?.name} - 版本历史`}
        placement="right"
        onClose={() => {
          setVersionHistoryVisible(false)
          setCompareVersions([])
        }}
        open={versionHistoryVisible}
        width={700}
      >
        <Spin spinning={versionLoading}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 版本对比功能 */}
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>版本对比：</strong>
                </div>
                <Space>
                  <Select
                    placeholder="选择版本1"
                    style={{ width: 150 }}
                    value={compareVersions[0]}
                    onChange={(value) => setCompareVersions([value, compareVersions[1]])}
                  >
                    {versionHistory.map(v => (
                      <Option key={v.id} value={v.id}>
                        版本 {v.version}
                      </Option>
                    ))}
                  </Select>
                  <span>vs</span>
                  <Select
                    placeholder="选择版本2"
                    style={{ width: 150 }}
                    value={compareVersions[1]}
                    onChange={(value) => setCompareVersions([compareVersions[0], value])}
                  >
                    {versionHistory.map(v => (
                      <Option key={v.id} value={v.id}>
                        版本 {v.version}
                      </Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    icon={<DiffOutlined />}
                    disabled={!compareVersions[0] || !compareVersions[1]}
                  >
                    对比
                  </Button>
                </Space>

                {compareVersions[0] && compareVersions[1] && (
                  <div style={{ marginTop: 16 }}>
                    {renderVersionDiff()}
                  </div>
                )}
              </Space>
            </Card>

            {/* 版本历史时间线 */}
            <Timeline mode="left">
              {versionHistory.map((version) => (
                <Timeline.Item
                  key={version.id}
                  color={version.version === versionHistory[0]?.version ? 'green' : 'blue'}
                  label={new Date(version.changed_at).toLocaleString('zh-CN')}
                >
                  <Card size="small">
                    <Space direction="vertical">
                      <div>
                        <Tag color="blue">版本 {version.version}</Tag>
                        {version.version === versionHistory[0]?.version && (
                          <Tag color="green">当前</Tag>
                        )}
                      </div>
                      <div>
                        <strong>变更说明：</strong>
                        {version.change_description}
                      </div>
                      <div>
                        <strong>操作人：</strong>
                        {version.changed_by}
                      </div>
                      {Object.keys(version.changes).length > 0 && (
                        <div>
                          <strong>变更字段：</strong>
                          <Descriptions size="small" column={1} bordered>
                            {Object.entries(version.changes).map(([key, value]: any) => (
                              <Descriptions.Item key={key} label={key}>
                                {value.old !== undefined ? (
                                  <Space>
                                    <span style={{ color: '#999', textDecoration: 'line-through' }}>
                                      {JSON.stringify(value.old)}
                                    </span>
                                    →
                                    <span style={{ color: '#52c41a' }}>
                                      {JSON.stringify(value.new)}
                                    </span>
                                  </Space>
                                ) : (
                                  JSON.stringify(value)
                                )}
                              </Descriptions.Item>
                            ))}
                          </Descriptions>
                        </div>
                      )}
                    </Space>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </Space>
        </Spin>
      </Drawer>

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
                    disabled={col.key === 'actions'}
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
