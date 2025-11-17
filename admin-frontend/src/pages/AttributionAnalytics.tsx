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
  DatePicker,
  message,
  Tag,
  Statistic,
  Row,
  Col,
  InputNumber,
  Popconfirm,
  Switch,
  Typography,
  Tooltip,
  Divider,
  Drawer,
  Breadcrumb,
  Spin,
  Badge,
} from 'antd'
import {
  DashboardOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  LinkOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  FunnelPlotOutlined,
  RiseOutlined,
  DollarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SaveOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import ReactECharts from 'echarts-for-react'
import PermissionGuard from '../components/PermissionGuard'
import { Permission } from '../config/permissions'
import dayjs, { Dayjs } from 'dayjs'
import api from '../services/api'

const { RangePicker } = DatePicker
const { Text } = Typography
const { TextArea } = Input

// ==================== 类型定义 ====================

// 渠道类型
interface Channel {
  id: number
  name: string
  display_name: string
  channel_type: 'paid' | 'organic' | 'referral' | 'direct' | 'social' | 'email' | 'search'
  icon?: string | null
  color: string
  is_active: boolean
  sort_order: number
  description?: string | null
  created_at: string
  updated_at: string
}

// UTM模板类型
interface UtmTemplate {
  id: number
  name: string
  base_url: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term?: string
  utm_content?: string
  generated_url: string
  description?: string
  created_at: string
  updated_at: string
}

// 推广码类型
interface PromotionCode {
  id: number
  code: string
  channel_id: number
  channel_name?: string
  description?: string
  usage_count: number
  valid_from: string
  valid_until: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// 转化事件类型
interface ConversionEvent {
  id: number
  name: string
  display_name: string
  event_type: 'registration' | 'first_payment' | 'repeat_purchase' | 'custom'
  value_calculation: 'fixed' | 'order_amount'
  fixed_value?: number | null
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Dashboard数据类型
interface DashboardStats {
  summary: {
    total_visits: number
    total_conversions: number
    conversion_rate: number
    total_revenue: number
    total_cost: number
    roi: number
  }
  channels: {
    id: number
    name: string
    channel_type: string
    visits: string | number
    conversions: string | number
    revenue: string | number
    cost: string | number
    conversion_rate: string | number
    roi: string | number
  }[]
}

// 漏斗数据类型
interface FunnelData {
  step: string
  name: string
  count: number
  rate: number | string
}

// 触点数据类型
interface TouchpointData {
  user_id: string
  touchpoints: {
    timestamp: string
    channel: string
    action: string
  }[]
}

// 归因模型对比数据类型
interface ModelComparisonData {
  channel: string
  first_click: number
  last_click: number
  linear: number
}

// ROI数据类型
interface RoiData {
  channel_id: number
  channel_name: string
  channel: string  // 映射自 channel_name
  revenue: number
  cost: number
  conversions: number
  roi: number
  roas: number
  cpa: number
}

// 渠道对比数据类型
interface ChannelComparisonData {
  id: number
  name: string
  channel: string  // 映射自 name
  channel_type: string
  visits: number
  unique_visitors: number
  conversions: number
  revenue: number
  cost: number
  avg_time_to_convert_hours: number
  conversion_rate: number
  roi: number
  cpa: number
}

// 趋势数据类型
interface TrendData {
  date: string
  visits: number
  conversions: number
}

// 用户质量数据类型
interface UserQualityData {
  channel: string
  repeat_rate: number
  ltv: number
  avg_order_value: number
}

// 自定义报表类型
interface CustomReport {
  id: number
  name: string
  config: any
  created_at: string
  updated_at: string
}

// ==================== 主组件 ====================

const AttributionAnalytics = () => {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ])
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [recentModules, setRecentModules] = useState<string[]>([])

  // 功能模块配置（分组）
  const moduleGroups = [
    {
      title: '数据概览',
      icon: <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      items: [
        { key: 'overview', label: '数据概览', icon: <DashboardOutlined />, description: '查看整体数据指标和趋势' },
      ],
    },
    {
      title: '转化管理',
      icon: <ThunderboltOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      items: [
        { key: 'events', label: '转化事件', icon: <CheckCircleOutlined />, description: '管理转化事件定义' },
        { key: 'funnel', label: '转化漏斗', icon: <FunnelPlotOutlined />, description: '分析转化漏斗流失' },
      ],
    },
    {
      title: '渠道管理',
      icon: <TagsOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      items: [
        { key: 'channels', label: '渠道管理', icon: <TagsOutlined />, description: '管理推广渠道' },
        { key: 'utm', label: 'UTM模板', icon: <LinkOutlined />, description: '创建UTM跟踪链接' },
        { key: 'promo', label: '推广码', icon: <CopyOutlined />, description: '管理推广码' },
      ],
    },
    {
      title: '归因分析',
      icon: <BarChartOutlined style={{ fontSize: '24px', color: '#f5222d' }} />,
      items: [
        { key: 'touchpoints', label: '多触点归因', icon: <FolderOpenOutlined />, description: '分析用户触点路径' },
        { key: 'models', label: '归因模型对比', icon: <BarChartOutlined />, description: '对比不同归因模型' },
        { key: 'roi', label: 'ROI分析', icon: <DollarOutlined />, description: '分析渠道投资回报率' },
        { key: 'comparison', label: '渠道对比', icon: <PieChartOutlined />, description: '多维度对比渠道' },
      ],
    },
    {
      title: '分析报表',
      icon: <LineChartOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      items: [
        { key: 'trends', label: '时间趋势', icon: <LineChartOutlined />, description: '查看时间趋势变化' },
        { key: 'quality', label: '用户质量', icon: <RiseOutlined />, description: '分析用户质量指标' },
        { key: 'custom', label: '自定义报表', icon: <SaveOutlined />, description: '创建自定义分析报表' },
      ],
    },
  ]

  // 打开模块抽屉
  const openModule = (key: string) => {
    setSelectedModule(key)
    setDrawerVisible(true)
    setDrawerLoading(true)

    // 模拟加载延迟
    setTimeout(() => {
      setDrawerLoading(false)
    }, 300)

    // 更新最近使用
    setRecentModules(prev => {
      const newRecent = [key, ...prev.filter(k => k !== key)].slice(0, 5)
      return newRecent
    })
  }

  // 快捷键支持
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ESC关闭抽屉
      if (e.key === 'Escape' && drawerVisible) {
        setDrawerVisible(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [drawerVisible])

  // 获取当前模块信息及其分组
  const getCurrentModule = () => {
    for (const group of moduleGroups) {
      const item = group.items.find(item => item.key === selectedModule)
      if (item) {
        return {
          item,
          group: { title: group.title, icon: group.icon }
        }
      }
    }
    return null
  }

  const currentModule = getCurrentModule()

  // 获取最近使用的模块信息
  const getRecentModuleItems = () => {
    const items = []
    for (const key of recentModules) {
      for (const group of moduleGroups) {
        const item = group.items.find(item => item.key === key)
        if (item) {
          items.push(item)
          break
        }
      }
    }
    return items
  }

  // 渲染抽屉内容
  const renderDrawerContent = () => {
    switch (selectedModule) {
      case 'overview':
        return <OverviewTab dateRange={dateRange} />
      case 'events':
        return <ConversionEventsTab />
      case 'funnel':
        return <FunnelAnalysisTab dateRange={dateRange} />
      case 'channels':
        return <ChannelsTab />
      case 'utm':
        return <UTMTemplatesTab />
      case 'promo':
        return <PromotionCodesTab />
      case 'touchpoints':
        return <TouchpointAnalysisTab dateRange={dateRange} />
      case 'models':
        return <ModelComparisonTab dateRange={dateRange} />
      case 'roi':
        return <RoiAnalysisTab dateRange={dateRange} />
      case 'comparison':
        return <ChannelComparisonTab dateRange={dateRange} />
      case 'trends':
        return <TrendAnalysisTab dateRange={dateRange} />
      case 'quality':
        return <UserQualityTab dateRange={dateRange} />
      case 'custom':
        return <CustomReportsTab dateRange={dateRange} />
      default:
        return null
    }
  }

  return (
    <PermissionGuard permission={Permission.STATS_VIEW}>
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <span>归因统计系统</span>
          </Space>
        }
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0]!, dates[1]!])
                }
              }}
            />
          </Space>
        }
      >
        <div style={{ padding: '24px 0' }}>
          {/* 最近使用 */}
          {recentModules.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #f0f0f0'
              }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  ⚡ 最近使用
                </Typography.Title>
              </div>
              <Row gutter={[16, 16]}>
                {getRecentModuleItems().map(item => (
                  <Col key={item.key} xs={24} sm={12} md={8} lg={6}>
                    <Badge.Ribbon text="最近" color="blue">
                      <Card
                        hoverable
                        onClick={() => openModule(item.key)}
                        style={{
                          height: '120px',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                        bodyStyle={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ fontSize: '32px', marginBottom: '8px', color: '#1890ff' }}>
                          {item.icon}
                        </div>
                        <Typography.Text strong style={{ fontSize: '16px' }}>
                          {item.label}
                        </Typography.Text>
                      </Card>
                    </Badge.Ribbon>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* 功能分组列表 */}
          {moduleGroups.map((group, index) => (
            <div key={index} style={{ marginBottom: '32px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #f0f0f0'
              }}>
                {group.icon}
                <Typography.Title level={4} style={{ margin: '0 0 0 12px' }}>
                  {group.title}
                </Typography.Title>
              </div>

              <Row gutter={[16, 16]}>
                {group.items.map(item => (
                  <Col key={item.key} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      onClick={() => openModule(item.key)}
                      style={{
                        height: '140px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: '1px solid #f0f0f0',
                        borderRadius: '8px',
                      }}
                      bodyStyle={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '20px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(24,144,255,0.2)'
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.borderColor = '#1890ff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.transform = ''
                        e.currentTarget.style.borderColor = '#f0f0f0'
                      }}
                    >
                      <div style={{
                        fontSize: '36px',
                        marginBottom: '12px',
                        color: '#1890ff',
                        transition: 'all 0.3s'
                      }}>
                        {item.icon}
                      </div>
                      <Typography.Text strong style={{
                        fontSize: '16px',
                        marginBottom: '6px',
                        textAlign: 'center'
                      }}>
                        {item.label}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{
                        fontSize: '12px',
                        textAlign: 'center',
                        lineHeight: '1.5'
                      }}>
                        {item.description}
                      </Typography.Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </div>
      </Card>

      {/* 右侧抽屉 */}
      <Drawer
        title={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {/* 面包屑导航 */}
            <Breadcrumb
              items={[
                {
                  title: (
                    <Space>
                      <BarChartOutlined />
                      <span>归因统计</span>
                    </Space>
                  ),
                },
                ...(currentModule ? [
                  {
                    title: (
                      <Space>
                        {currentModule.group.icon}
                        <span>{currentModule.group.title}</span>
                      </Space>
                    ),
                  },
                  {
                    title: (
                      <Space>
                        {currentModule.item.icon}
                        <span>{currentModule.item.label}</span>
                      </Space>
                    ),
                  }
                ] : [])
              ]}
            />
            {/* 模块标题 */}
            <Space style={{ marginTop: '4px' }}>
              {currentModule && (
                <>
                  <span style={{ fontSize: '20px', color: '#1890ff' }}>
                    {currentModule.item.icon}
                  </span>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {currentModule.item.label}
                  </Typography.Title>
                </>
              )}
            </Space>
          </Space>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width="80%"
        styles={{
          body: { padding: '24px' }
        }}
      >
        {/* 加载状态 */}
        {drawerLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <Spin size="large" tip="加载中..." />
          </div>
        ) : (
          renderDrawerContent()
        )}
      </Drawer>
    </PermissionGuard>
  )
}

// ==================== 1. 数据概览Tab ====================

const OverviewTab = ({ dateRange }: { dateRange: [Dayjs, Dayjs] }) => {
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [dateRange])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/dashboard', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      setDashboardData(response.data.data)
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 渠道表现图表配置
  const getChannelPerformanceChartOption = () => {
    if (!dashboardData || !dashboardData.channels) return {}

    return {
      title: {
        text: '各渠道表现',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['访问量', '转化数'],
        bottom: 10,
      },
      xAxis: {
        type: 'category',
        data: dashboardData.channels.map((item: any) => item.name),
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '访问量',
          type: 'bar',
          data: dashboardData.channels.map((item: any) => parseFloat(item.visits) || 0),
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '转化数',
          type: 'bar',
          data: dashboardData.channels.map((item: any) => parseFloat(item.conversions) || 0),
          itemStyle: { color: '#52c41a' },
        },
      ],
    }
  }

  return (
    <div>
      {/* 关键指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="访问量"
              value={dashboardData?.summary?.total_visits || 0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="转化数"
              value={dashboardData?.summary?.total_conversions || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="转化率"
              value={dashboardData?.summary?.conversion_rate || 0}
              suffix="%"
              precision={2}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="收入"
              value={dashboardData?.summary?.total_revenue || 0}
              prefix={<DollarOutlined />}
              suffix="元"
              precision={2}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="成本"
              value={dashboardData?.summary?.total_cost || 0}
              prefix={<DollarOutlined />}
              suffix="元"
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="ROI"
              value={dashboardData?.summary?.roi || 0}
              suffix="%"
              precision={2}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 渠道表现图表 */}
      <Card title="各渠道访问量与转化情况" loading={loading}>
        <ReactECharts
          option={getChannelPerformanceChartOption()}
          style={{ height: 400 }}
          notMerge={true}
          lazyUpdate={true}
        />
      </Card>
    </div>
  )
}

// ==================== 2. 渠道管理Tab ====================

const ChannelsTab = () => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/channels')
      setChannels(response.data.data || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载渠道失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingChannel(null)
    form.resetFields()
    form.setFieldsValue({
      channel_type: 'paid',
      color: '#1890ff',
      is_active: true,
      sort_order: 1,
    })
    setIsModalOpen(true)
  }

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel)
    form.setFieldsValue(channel)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/attribution/channels/${id}`)
      message.success('删除成功')
      loadChannels()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleToggleStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/attribution/channels/${id}/status`, { status })
      message.success('状态更新成功')
      loadChannels()
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingChannel) {
        await api.put(`/attribution/channels/${editingChannel.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/attribution/channels', values)
        message.success('创建成功')
      }

      setIsModalOpen(false)
      loadChannels()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const getChannelTypeText = (type: string) => {
    const texts = {
      paid: '付费推广',
      organic: '自然流量',
      referral: '推荐流量',
      direct: '直接访问',
      social: '社交媒体',
      email: '邮件营销',
      search: '搜索引擎',
    }
    return texts[type as keyof typeof texts] || type
  }

  const getChannelTypeColor = (type: string) => {
    const colors = {
      paid: 'red',
      organic: 'green',
      referral: 'blue',
      direct: 'purple',
      search: 'cyan',
      social: 'cyan',
      email: 'orange',
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  const columns: ColumnsType<Channel> = [
    {
      title: '渠道标识',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN'),
    },
    {
      title: '显示名称',
      dataIndex: 'display_name',
      key: 'display_name',
      width: 150,
      sorter: (a, b) => a.display_name.localeCompare(b.display_name, 'zh-CN'),
    },
    {
      title: '渠道类型',
      dataIndex: 'channel_type',
      key: 'channel_type',
      width: 120,
      render: (type: string) => (
        <Tag color={getChannelTypeColor(type)}>{getChannelTypeText(type)}</Tag>
      ),
      sorter: (a, b) => a.channel_type.localeCompare(b.channel_type, 'zh-CN'),
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: (a, b) => a.sort_order - b.sort_order,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: color,
              border: '1px solid #d9d9d9',
              borderRadius: 4,
            }}
          />
          <span>{color}</span>
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      sorter: (a, b) => (a.description || '').localeCompare(b.description || '', 'zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active: boolean, record: Channel) => (
        <Switch
          checked={is_active}
          onChange={(checked) =>
            handleToggleStatus(record.id, checked ? 'active' : 'inactive')
          }
        />
      ),
      sorter: (a, b) => Number(a.is_active) - Number(b.is_active),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: Channel) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此渠道吗？"
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

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建渠道
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={channels}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingChannel ? '编辑渠道' : '新建渠道'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="渠道标识"
            name="name"
            rules={[
              { required: true, message: '请输入渠道标识（英文）' },
              {
                pattern: /^[a-z0-9_-]+$/,
                message: '只能包含小写字母、数字、下划线和短横线',
              },
            ]}
          >
            <Input placeholder="例如：baidu_ads" />
          </Form.Item>

          <Form.Item
            label="显示名称"
            name="display_name"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="例如：百度广告" />
          </Form.Item>

          <Form.Item
            label="渠道类型"
            name="channel_type"
            rules={[{ required: true, message: '请选择渠道类型' }]}
          >
            <Select>
              <Select.Option value="paid">付费推广</Select.Option>
              <Select.Option value="organic">自然流量</Select.Option>
              <Select.Option value="referral">推荐流量</Select.Option>
              <Select.Option value="direct">直接访问</Select.Option>
              <Select.Option value="social">社交媒体</Select.Option>
              <Select.Option value="email">邮件营销</Select.Option>
              <Select.Option value="search">搜索引擎</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="颜色"
            name="color"
            rules={[{ required: true, message: '请输入颜色代码' }]}
          >
            <Input type="color" style={{ width: 100 }} />
          </Form.Item>

          <Form.Item
            label="排序"
            name="sort_order"
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="数值越小越靠前" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="渠道描述信息" />
          </Form.Item>

          <Form.Item label="状态" name="is_active" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ==================== 3. 渠道和转化管理 ====================

// ==================== 3.1 UTM模板管理 ====================

const UTMTemplatesTab = () => {
  const [templates, setTemplates] = useState<UtmTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<UtmTemplate | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadTemplates()
  }, [])

  // 监听表单字段变化，自动生成URL
  const handleFormChange = () => {
    const values = form.getFieldsValue()
    if (values.base_url) {
      const url = generateUtmUrl(values)
      form.setFieldsValue({ generated_url: url })
    }
  }

  const generateUtmUrl = (values: any) => {
    const { base_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content } =
      values
    const params = new URLSearchParams()

    if (utm_source) params.append('utm_source', utm_source)
    if (utm_medium) params.append('utm_medium', utm_medium)
    if (utm_campaign) params.append('utm_campaign', utm_campaign)
    if (utm_term) params.append('utm_term', utm_term)
    if (utm_content) params.append('utm_content', utm_content)

    return `${base_url}?${params.toString()}`
  }

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/utm-templates')
      setTemplates(response.data.data || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载UTM模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (template: UtmTemplate) => {
    setEditingTemplate(template)
    form.setFieldsValue(template)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/attribution/utm-templates/${id}`)
      message.success('删除成功')
      loadTemplates()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingTemplate) {
        await api.put(`/attribution/utm-templates/${editingTemplate.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/attribution/utm-templates', values)
        message.success('创建成功')
      }

      setIsModalOpen(false)
      loadTemplates()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    message.success('链接已复制到剪贴板')
  }

  const columns: ColumnsType<UtmTemplate> = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN'),
    },
    {
      title: '基础URL',
      dataIndex: 'base_url',
      key: 'base_url',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => a.base_url.localeCompare(b.base_url, 'zh-CN'),
    },
    {
      title: 'UTM Source',
      dataIndex: 'utm_source',
      key: 'utm_source',
      width: 120,
      sorter: (a, b) => (a.utm_source || '').localeCompare(b.utm_source || '', 'zh-CN'),
    },
    {
      title: 'UTM Medium',
      dataIndex: 'utm_medium',
      key: 'utm_medium',
      width: 120,
      sorter: (a, b) => (a.utm_medium || '').localeCompare(b.utm_medium || '', 'zh-CN'),
    },
    {
      title: 'UTM Campaign',
      dataIndex: 'utm_campaign',
      key: 'utm_campaign',
      width: 150,
      sorter: (a, b) => (a.utm_campaign || '').localeCompare(b.utm_campaign || '', 'zh-CN'),
    },
    {
      title: '生成的URL',
      dataIndex: 'generated_url',
      key: 'generated_url',
      ellipsis: true,
      render: (url: string) => (
        <Space>
          <Tooltip title={url}>
            <Text ellipsis style={{ maxWidth: 300 }}>
              {url}
            </Text>
          </Tooltip>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyUrl(url)}
          >
            复制
          </Button>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: UtmTemplate) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此模板吗？"
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

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建UTM模板
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={templates}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1400 }}
      />

      <Modal
        title={editingTemplate ? '编辑UTM模板' : '新建UTM模板'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={800}
      >
        <Form form={form} layout="vertical" onValuesChange={handleFormChange}>
          <Form.Item
            label="模板名称"
            name="name"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="例如：双十一活动" />
          </Form.Item>

          <Form.Item
            label="基础URL"
            name="base_url"
            rules={[
              { required: true, message: '请输入基础URL' },
              { type: 'url', message: '请输入有效的URL' },
            ]}
          >
            <Input placeholder="https://example.com/landing-page" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="UTM Source（流量来源）"
                name="utm_source"
                rules={[{ required: true, message: '请输入UTM Source' }]}
              >
                <Input placeholder="例如：baidu, google, wechat" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="UTM Medium（营销媒介）"
                name="utm_medium"
                rules={[{ required: true, message: '请输入UTM Medium' }]}
              >
                <Input placeholder="例如：cpc, banner, email" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="UTM Campaign（营销活动）"
            name="utm_campaign"
            rules={[{ required: true, message: '请输入UTM Campaign' }]}
          >
            <Input placeholder="例如：double11_sale" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="UTM Term（关键词）" name="utm_term">
                <Input placeholder="付费搜索关键词（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="UTM Content（内容）" name="utm_content">
                <Input placeholder="区分相似内容或链接（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="生成的URL" name="generated_url">
            <TextArea
              rows={3}
              readOnly
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea rows={2} placeholder="模板描述信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ==================== 3.2 推广码管理 ====================

const PromotionCodesTab = () => {
  const [codes, setCodes] = useState<PromotionCode[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<PromotionCode | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCodes()
    loadChannels()
  }, [])

  const loadCodes = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/promotion-codes')
      setCodes(response.data.data || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载推广码失败')
    } finally {
      setLoading(false)
    }
  }

  const loadChannels = async () => {
    try {
      const response = await api.get('/attribution/channels')
      setChannels(response.data.data || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载渠道失败')
    }
  }

  const handleCreate = () => {
    setEditingCode(null)
    form.resetFields()
    form.setFieldsValue({
      status: 'active',
      valid_from: dayjs(),
      valid_until: dayjs().add(30, 'day'),
    })
    setIsModalOpen(true)
  }

  const handleEdit = (code: PromotionCode) => {
    setEditingCode(code)
    form.setFieldsValue({
      ...code,
      valid_from: dayjs(code.valid_from),
      valid_until: dayjs(code.valid_until),
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/attribution/promotion-codes/${id}`)
      message.success('删除成功')
      loadCodes()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleToggleStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/attribution/promotion-codes/${id}/status`, { status })
      message.success('状态更新成功')
      loadCodes()
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        valid_from: values.valid_from.format('YYYY-MM-DD HH:mm:ss'),
        valid_until: values.valid_until.format('YYYY-MM-DD HH:mm:ss'),
      }

      if (editingCode) {
        await api.put(`/attribution/promotion-codes/${editingCode.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/attribution/promotion-codes', payload)
        message.success('创建成功')
      }

      setIsModalOpen(false)
      loadCodes()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const columns: ColumnsType<PromotionCode> = [
    {
      title: '推广码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
      sorter: (a, b) => a.code.localeCompare(b.code, 'zh-CN'),
    },
    {
      title: '关联渠道',
      dataIndex: 'channel_name',
      key: 'channel_name',
      width: 150,
      sorter: (a, b) => (a.channel_name || '').localeCompare(b.channel_name || '', 'zh-CN'),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      sorter: (a, b) => (a.description || '').localeCompare(b.description || '', 'zh-CN'),
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 100,
      render: (count: number) => (
        <Text style={{ color: count > 0 ? '#52c41a' : '#999' }}>{count}</Text>
      ),
      sorter: (a, b) => a.usage_count - b.usage_count,
    },
    {
      title: '有效期',
      key: 'validity',
      width: 200,
      render: (_: any, record: PromotionCode) => (
        <div>
          <div>{dayjs(record.valid_from).format('YYYY-MM-DD')}</div>
          <div style={{ color: '#999' }}>
            至 {dayjs(record.valid_until).format('YYYY-MM-DD')}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: PromotionCode) => (
        <Switch
          checked={status === 'active'}
          onChange={(checked) =>
            handleToggleStatus(record.id, checked ? 'active' : 'inactive')
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: PromotionCode) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此推广码吗？"
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

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建推广码
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={codes}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingCode ? '编辑推广码' : '新建推广码'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="推广码"
            name="code"
            rules={[
              { required: true, message: '请输入推广码' },
              {
                pattern: /^[A-Z0-9_-]+$/,
                message: '只能包含大写字母、数字、下划线和短横线',
              },
            ]}
          >
            <Input placeholder="例如：NEWYEAR2024" />
          </Form.Item>

          <Form.Item
            label="关联渠道"
            name="channel_id"
            rules={[{ required: true, message: '请选择关联渠道' }]}
          >
            <Select placeholder="选择渠道">
              {channels.map((channel) => (
                <Select.Option key={channel.id} value={channel.id}>
                  {channel.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="推广码描述信息" />
          </Form.Item>

          <Form.Item
            label="有效期"
            name="valid_from"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="结束时间"
            name="valid_until"
            rules={[{ required: true, message: '请选择结束时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="状态" name="status">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ==================== 3.3 转化事件定义 ====================

const ConversionEventsTab = () => {
  const [events, setEvents] = useState<ConversionEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ConversionEvent | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/conversion-events')
      setEvents(response.data.data || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载转化事件失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingEvent(null)
    form.resetFields()
    form.setFieldsValue({
      event_type: 'registration',
      value_calculation: 'fixed',
      fixed_value: 0,
      is_active: true,
      sort_order: 1,
    })
    setIsModalOpen(true)
  }

  const handleEdit = (event: ConversionEvent) => {
    setEditingEvent(event)
    form.setFieldsValue(event)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/attribution/conversion-events/${id}`)
      message.success('删除成功')
      loadEvents()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleToggleStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/attribution/conversion-events/${id}/status`, { status })
      message.success('状态更新成功')
      loadEvents()
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingEvent) {
        await api.put(`/attribution/conversion-events/${editingEvent.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/attribution/conversion-events', values)
        message.success('创建成功')
      }

      setIsModalOpen(false)
      loadEvents()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const getEventTypeText = (type: string) => {
    const texts = {
      registration: '用户注册',
      first_payment: '首次付费',
      repeat_purchase: '复购',
      custom: '自定义',
    }
    return texts[type as keyof typeof texts] || type
  }

  const getEventTypeColor = (type: string) => {
    const colors = {
      registration: 'green',
      first_payment: 'orange',
      repeat_purchase: 'purple',
      custom: 'cyan',
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  const getValueCalculationText = (type: string) => {
    const texts = {
      fixed: '固定值',
      order_amount: '订单金额',
    }
    return texts[type as keyof typeof texts] || type
  }

  const columns: ColumnsType<ConversionEvent> = [
    {
      title: '显示名称',
      dataIndex: 'display_name',
      key: 'display_name',
      width: 150,
      sorter: (a, b) => a.display_name.localeCompare(b.display_name, 'zh-CN'),
    },
    {
      title: '事件标识',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN'),
    },
    {
      title: '事件类型',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 120,
      render: (type: string) => (
        <Tag color={getEventTypeColor(type)}>{getEventTypeText(type)}</Tag>
      ),
      sorter: (a, b) => a.event_type.localeCompare(b.event_type, 'zh-CN'),
    },
    {
      title: '价值计算方式',
      dataIndex: 'value_calculation',
      key: 'value_calculation',
      width: 150,
      render: (type: string) => getValueCalculationText(type),
      sorter: (a, b) => a.value_calculation.localeCompare(b.value_calculation, 'zh-CN'),
    },
    {
      title: '固定价值',
      dataIndex: 'fixed_value',
      key: 'fixed_value',
      width: 100,
      render: (value: number | null) => {
        if (value === null || value === undefined) {
          return '-'
        }
        return `¥${value}`
      },
      sorter: (a, b) => (a.fixed_value || 0) - (b.fixed_value || 0),
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      sorter: (a, b) => a.sort_order - b.sort_order,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      sorter: (a, b) => (a.description || '').localeCompare(b.description || '', 'zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active: boolean, record: ConversionEvent) => (
        <Switch
          checked={is_active}
          onChange={(checked) =>
            handleToggleStatus(record.id, checked ? 'active' : 'inactive')
          }
        />
      ),
      sorter: (a, b) => Number(a.is_active) - Number(b.is_active),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: ConversionEvent) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此事件吗？"
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

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建转化事件
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={events}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingEvent ? '编辑转化事件' : '新建转化事件'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="事件标识"
            name="name"
            rules={[{ required: true, message: '请输入事件标识（英文）' }]}
          >
            <Input placeholder="例如：user_registration" />
          </Form.Item>

          <Form.Item
            label="显示名称"
            name="display_name"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="例如：用户注册" />
          </Form.Item>

          <Form.Item
            label="事件类型"
            name="event_type"
            rules={[{ required: true, message: '请选择事件类型' }]}
          >
            <Select>
              <Select.Option value="registration">用户注册</Select.Option>
              <Select.Option value="first_payment">首次付费</Select.Option>
              <Select.Option value="repeat_purchase">复购</Select.Option>
              <Select.Option value="custom">自定义</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="价值计算方式"
            name="value_calculation"
            rules={[{ required: true, message: '请选择价值计算方式' }]}
          >
            <Select>
              <Select.Option value="fixed">固定值</Select.Option>
              <Select.Option value="order_amount">订单金额</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="固定价值"
            name="fixed_value"
            tooltip="仅当价值计算方式为固定值时需要填写"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="输入数值（可选）"
            />
          </Form.Item>

          <Form.Item
            label="排序"
            name="sort_order"
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="数值越小越靠前"
            />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="事件描述信息" />
          </Form.Item>

          <Form.Item label="状态" name="is_active" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ==================== 4. 归因分析和报表 ====================

// ==================== 4.1 转化漏斗分析 ====================

const FunnelAnalysisTab = ({ dateRange }: { dateRange: [Dayjs, Dayjs] }) => {
  const [loading, setLoading] = useState(false)
  const [funnelData, setFunnelData] = useState<FunnelData[]>([])

  useEffect(() => {
    loadFunnelData()
  }, [dateRange])

  const loadFunnelData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/funnel', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      setFunnelData(response.data.data?.funnel || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载漏斗数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getFunnelChartOption = () => {
    if (!funnelData || funnelData.length === 0) {
      return {
        title: {
          text: '转化漏斗分析',
          left: 'center',
        },
      }
    }

    return {
      title: {
        text: '转化漏斗分析',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b} : {c} ({d}%)',
      },
      series: [
        {
          name: '转化漏斗',
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: (params: any) => {
              const item = funnelData[params.dataIndex]
              const rate = typeof item.rate === 'string' ? parseFloat(item.rate) : item.rate
              return `${item.name}\n${item.count}人\n${rate.toFixed(2)}%`
            },
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid',
            },
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
          },
          emphasis: {
            label: {
              fontSize: 16,
            },
          },
          data: funnelData.map((item) => ({
            value: item.count,
            name: item.name,
          })),
        },
      ],
    }
  }

  return (
    <Card loading={loading}>
      <ReactECharts
        option={getFunnelChartOption()}
        style={{ height: 500 }}
        notMerge={true}
        lazyUpdate={true}
      />

      <Divider />

      <Table
        dataSource={funnelData}
        columns={[
          {
            title: '阶段',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: '人数',
            dataIndex: 'count',
            key: 'count',
            render: (count: number) => count.toLocaleString(),
          },
          {
            title: '转化率',
            dataIndex: 'rate',
            key: 'rate',
            render: (rate: number | string) => {
              const numRate = typeof rate === 'string' ? parseFloat(rate) : rate
              return `${numRate.toFixed(2)}%`
            },
          },
        ]}
        pagination={false}
        rowKey="step"
      />
    </Card>
  )
}

// ==================== 4.2 多触点归因 ====================

const TouchpointAnalysisTab = ({ dateRange }: { dateRange: [Dayjs, Dayjs] }) => {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [touchpointData, setTouchpointData] = useState<TouchpointData[]>([])

  const loadTouchpointData = async () => {
    if (!userId) {
      message.warning('请输入用户ID')
      return
    }

    setLoading(true)
    try {
      const response = await api.get('/attribution/touchpoints', {
        params: {
          user_id: userId,
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      setTouchpointData(response.data.data || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载触点数据失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="输入用户ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ width: 200 }}
        />
        <Button type="primary" onClick={loadTouchpointData} loading={loading}>
          查询
        </Button>
      </Space>

      {touchpointData.length > 0 ? (
        <div>
          {touchpointData.map((userData, index) => (
            <Card key={index} type="inner" title={`用户ID: ${userData.user_id}`} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {userData.touchpoints.map((touchpoint, tIndex) => (
                  <div
                    key={tIndex}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 16,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <Text strong>{touchpoint.channel}</Text>
                      <div style={{ color: '#999', fontSize: 12 }}>
                        {dayjs(touchpoint.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                    </div>
                    <Tag color="blue">{touchpoint.action}</Tag>
                    {tIndex < userData.touchpoints.length - 1 && (
                      <div style={{ fontSize: 20 }}>→</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          请输入用户ID查询触点历史
        </div>
      )}
    </Card>
  )
}

// ==================== 4.3 归因模型对比 ====================

const ModelComparisonTab = ({ dateRange }: { dateRange: [Dayjs, Dayjs] }) => {
  const [loading, setLoading] = useState(false)
  const [comparisonData, setComparisonData] = useState<ModelComparisonData[]>([])

  useEffect(() => {
    loadComparisonData()
  }, [dateRange])

  const loadComparisonData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/model-comparison', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })

      // API返回的是 {first_touch: [], last_touch: [], linear: []} 格式
      // 需要转换为数组格式 [{channel, first_click, last_click, linear}]
      const apiData = response.data.data || {}
      const firstTouch = apiData.first_touch || []
      const lastTouch = apiData.last_touch || []
      const linear = apiData.linear || []

      // 假设所有数组长度相同，以第一个为准
      const transformedData: ModelComparisonData[] = firstTouch.map((item: any, index: number) => ({
        channel: item.channel || item.channel_name || '未知渠道',
        first_click: parseFloat(item.conversions || item.value || '0') || 0,
        last_click: parseFloat(lastTouch[index]?.conversions || lastTouch[index]?.value || '0') || 0,
        linear: parseFloat(linear[index]?.conversions || linear[index]?.value || '0') || 0,
      }))

      setComparisonData(transformedData)
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载归因模型数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getComparisonChartOption = () => {
    if (!comparisonData || comparisonData.length === 0) {
      return {
        title: {
          text: '归因模型对比',
          left: 'center',
        },
      }
    }

    return {
      title: {
        text: '归因模型对比',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['首次点击', '末次点击', '线性归因'],
        bottom: 10,
      },
      xAxis: {
        type: 'category',
        data: comparisonData.map((item) => item.channel),
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '首次点击',
          type: 'bar',
          data: comparisonData.map((item) => item.first_click),
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '末次点击',
          type: 'bar',
          data: comparisonData.map((item) => item.last_click),
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '线性归因',
          type: 'bar',
          data: comparisonData.map((item) => item.linear),
          itemStyle: { color: '#faad14' },
        },
      ],
    }
  }

  const columns: ColumnsType<ModelComparisonData> = [
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      sorter: (a, b) => a.channel.localeCompare(b.channel, 'zh-CN'),
    },
    {
      title: '首次点击',
      dataIndex: 'first_click',
      key: 'first_click',
      render: (value: number) => value.toLocaleString(),
      sorter: (a, b) => a.first_click - b.first_click,
    },
    {
      title: '末次点击',
      dataIndex: 'last_click',
      key: 'last_click',
      render: (value: number) => value.toLocaleString(),
      sorter: (a, b) => a.last_click - b.last_click,
    },
    {
      title: '线性归因',
      dataIndex: 'linear',
      key: 'linear',
      render: (value: number) => value.toLocaleString(),
      sorter: (a, b) => a.linear - b.linear,
    },
  ]

  return (
    <Card loading={loading}>
      <ReactECharts
        option={getComparisonChartOption()}
        style={{ height: 400, marginBottom: 24 }}
        notMerge={true}
        lazyUpdate={true}
      />

      <Table
        dataSource={comparisonData}
        columns={columns}
        pagination={false}
        rowKey="channel"
      />
    </Card>
  )
}

// ==================== 4.4 ROI分析 ====================

const RoiAnalysisTab = ({ dateRange }: { dateRange: [Dayjs, Dayjs] }) => {
  const [loading, setLoading] = useState(false)
  const [roiData, setRoiData] = useState<RoiData[]>([])

  useEffect(() => {
    loadRoiData()
  }, [dateRange])

  const loadRoiData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/roi', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      // 转换字符串为数字，并映射字段
      const data = (response.data.data || []).map((item: any) => ({
        ...item,
        channel: item.channel_name || item.channel || '未知渠道',  // 映射 channel_name 到 channel
        revenue: parseFloat(item.revenue) || 0,
        cost: parseFloat(item.cost) || 0,
        conversions: parseFloat(item.conversions) || 0,
        roi: parseFloat(item.roi) || 0,
        roas: parseFloat(item.roas) || 0,
        cpa: parseFloat(item.cpa) || 0,
      }))
      setRoiData(data)
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载ROI数据失败')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<RoiData> = [
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      fixed: 'left',
      width: 150,
      sorter: (a, b) => a.channel.localeCompare(b.channel, 'zh-CN'),
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 120,
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a, b) => a.cost - b.cost,
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      width: 120,
      render: (value: number) => (
        <Text style={{ color: value > 0 ? '#52c41a' : '#f5222d' }}>
          {value.toFixed(2)}%
        </Text>
      ),
      sorter: (a, b) => a.roi - b.roi,
    },
    {
      title: 'ROAS',
      dataIndex: 'roas',
      key: 'roas',
      width: 120,
      render: (value: number) => value.toFixed(2),
      sorter: (a, b) => a.roas - b.roas,
    },
    {
      title: 'CPA',
      dataIndex: 'cpa',
      key: 'cpa',
      width: 120,
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a, b) => a.cpa - b.cpa,
    },
  ]

  return (
    <Card loading={loading}>
      <Table
        dataSource={roiData}
        columns={columns}
        pagination={false}
        rowKey="channel"
        scroll={{ x: 800 }}
      />
    </Card>
  )
}

// ==================== 4.5 渠道对比 ====================

const ChannelComparisonTab = ({ dateRange }: { dateRange: [Dayjs, Dayjs] }) => {
  const [loading, setLoading] = useState(false)
  const [comparisonData, setComparisonData] = useState<ChannelComparisonData[]>([])
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'radar'>('bar')

  useEffect(() => {
    loadComparisonData()
  }, [dateRange])

  const loadComparisonData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/channel-comparison', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      // 转换字符串为数字，并映射字段
      const data = (response.data.data || []).map((item: any) => ({
        ...item,
        channel: item.name || item.channel || '未知渠道',  // 映射 name 到 channel
        visits: parseFloat(item.visits) || 0,
        unique_visitors: parseFloat(item.unique_visitors) || 0,
        conversions: parseFloat(item.conversions) || 0,
        revenue: parseFloat(item.revenue) || 0,
        cost: parseFloat(item.cost) || 0,
        avg_time_to_convert_hours: parseFloat(item.avg_time_to_convert_hours) || 0,
        conversion_rate: parseFloat(item.conversion_rate) || 0,
        roi: parseFloat(item.roi) || 0,
        cpa: parseFloat(item.cpa) || 0,
      }))
      setComparisonData(data)
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载对比数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getBarChartOption = () => {
    if (!comparisonData || comparisonData.length === 0) {
      return {
        title: {
          text: '渠道对比 - 柱状图',
          left: 'center',
        },
      }
    }

    return {
      title: {
        text: '渠道对比 - 柱状图',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['访问量', '转化数', '收入', '成本'],
        bottom: 10,
      },
      xAxis: {
        type: 'category',
        data: comparisonData.map((item) => item.channel),
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '访问量',
          type: 'bar',
          data: comparisonData.map((item) => item.visits),
        },
        {
          name: '转化数',
          type: 'bar',
          data: comparisonData.map((item) => item.conversions),
        },
        {
          name: '收入',
          type: 'bar',
          data: comparisonData.map((item) => item.revenue),
        },
        {
          name: '成本',
          type: 'bar',
          data: comparisonData.map((item) => item.cost),
        },
      ],
    }
  }

  const getPieChartOption = () => {
    if (!comparisonData || comparisonData.length === 0) {
      return {
        title: {
          text: '渠道访问量占比 - 饼图',
          left: 'center',
        },
      }
    }

    return {
      title: {
        text: '渠道访问量占比 - 饼图',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: '访问量',
          type: 'pie',
          radius: '50%',
          data: comparisonData.map((item) => ({
            value: item.visits,
            name: item.channel,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    }
  }

  const getRadarChartOption = () => {
    if (!comparisonData || comparisonData.length === 0) {
      return {
        title: {
          text: '渠道对比 - 雷达图',
          left: 'center',
        },
      }
    }

    const maxValues = {
      visits: Math.max(...comparisonData.map((item) => item.visits)),
      conversions: Math.max(...comparisonData.map((item) => item.conversions)),
      revenue: Math.max(...comparisonData.map((item) => item.revenue)),
      cost: Math.max(...comparisonData.map((item) => item.cost)),
    }

    return {
      title: {
        text: '渠道对比 - 雷达图',
        left: 'center',
      },
      tooltip: {},
      legend: {
        data: comparisonData.map((item) => item.channel),
        bottom: 10,
      },
      radar: {
        indicator: [
          { name: '访问量', max: maxValues.visits },
          { name: '转化数', max: maxValues.conversions },
          { name: '收入', max: maxValues.revenue },
          { name: '成本', max: maxValues.cost },
        ],
      },
      series: [
        {
          name: '渠道对比',
          type: 'radar',
          data: comparisonData.map((item) => ({
            value: [item.visits, item.conversions, item.revenue, item.cost],
            name: item.channel,
          })),
        },
      ],
    }
  }

  const getChartOption = () => {
    if (!comparisonData || comparisonData.length === 0) {
      return {
        title: {
          text: '渠道对比',
          left: 'center',
        },
      }
    }

    switch (chartType) {
      case 'bar':
        return getBarChartOption()
      case 'pie':
        return getPieChartOption()
      case 'radar':
        return getRadarChartOption()
      default:
        return {}
    }
  }

  return (
    <Card
      loading={loading}
      extra={
        <Select value={chartType} onChange={setChartType} style={{ width: 120 }}>
          <Select.Option value="bar">柱状图</Select.Option>
          <Select.Option value="pie">饼图</Select.Option>
          <Select.Option value="radar">雷达图</Select.Option>
        </Select>
      }
    >
      <ReactECharts
        option={getChartOption()}
        style={{ height: 500 }}
        notMerge={true}
        lazyUpdate={true}
      />
    </Card>
  )
}

// ==================== 4.6 时间趋势分析 ====================

const TrendAnalysisTab = ({ dateRange }: { dateRange: [Dayjs, Dayjs] }) => {
  const [loading, setLoading] = useState(false)
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week' | 'month'>('day')

  useEffect(() => {
    loadTrendData()
  }, [dateRange, groupBy])

  const loadTrendData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/trends', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
          group_by: groupBy,
        },
      })
      // 转换字符串为数字
      const data = (response.data.data || []).map((item: any) => ({
        ...item,
        visits: parseFloat(item.visits) || 0,
        conversions: parseFloat(item.conversions) || 0,
      }))
      setTrendData(data)
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载趋势数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getTrendChartOption = () => {
    if (!trendData || trendData.length === 0) {
      return {
        title: {
          text: '访问量与转化数趋势',
          left: 'center',
        },
      }
    }

    return {
      title: {
        text: '访问量与转化数趋势',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['访问量', '转化数'],
        bottom: 10,
      },
      xAxis: {
        type: 'category',
        data: trendData.map((item) => item.date),
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '访问量',
          type: 'line',
          data: trendData.map((item) => item.visits),
          smooth: true,
          itemStyle: { color: '#1890ff' },
          areaStyle: { opacity: 0.3 },
        },
        {
          name: '转化数',
          type: 'line',
          data: trendData.map((item) => item.conversions),
          smooth: true,
          itemStyle: { color: '#52c41a' },
          areaStyle: { opacity: 0.3 },
        },
      ],
    }
  }

  return (
    <Card
      loading={loading}
      extra={
        <Select value={groupBy} onChange={setGroupBy} style={{ width: 120 }}>
          <Select.Option value="hour">按小时</Select.Option>
          <Select.Option value="day">按天</Select.Option>
          <Select.Option value="week">按周</Select.Option>
          <Select.Option value="month">按月</Select.Option>
        </Select>
      }
    >
      <ReactECharts
        option={getTrendChartOption()}
        style={{ height: 500 }}
        notMerge={true}
        lazyUpdate={true}
      />
    </Card>
  )
}

// ==================== 4.7 用户质量分析 ====================

const UserQualityTab = ({ dateRange }: { dateRange: [Dayjs, Dayjs] }) => {
  const [loading, setLoading] = useState(false)
  const [qualityData, setQualityData] = useState<UserQualityData[]>([])

  useEffect(() => {
    loadQualityData()
  }, [dateRange])

  const loadQualityData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/user-quality', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      // 转换字符串为数字
      const data = (response.data.data || []).map((item: any) => ({
        ...item,
        repeat_rate: parseFloat(item.repeat_rate) || 0,
        ltv: parseFloat(item.ltv) || 0,
        avg_order_value: parseFloat(item.avg_order_value) || 0,
      }))
      setQualityData(data)
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载用户质量数据失败')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<UserQualityData> = [
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      fixed: 'left',
      width: 150,
      sorter: (a, b) => a.channel.localeCompare(b.channel, 'zh-CN'),
    },
    {
      title: '复购率',
      dataIndex: 'repeat_rate',
      key: 'repeat_rate',
      width: 120,
      render: (value: number) => (
        <Text style={{ color: value > 30 ? '#52c41a' : '#999' }}>
          {value.toFixed(2)}%
        </Text>
      ),
      sorter: (a, b) => a.repeat_rate - b.repeat_rate,
    },
    {
      title: 'LTV（生命周期价值）',
      dataIndex: 'ltv',
      key: 'ltv',
      width: 180,
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a, b) => a.ltv - b.ltv,
    },
    {
      title: '平均订单金额',
      dataIndex: 'avg_order_value',
      key: 'avg_order_value',
      width: 150,
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a, b) => a.avg_order_value - b.avg_order_value,
    },
  ]

  return (
    <Card loading={loading}>
      <Table
        dataSource={qualityData}
        columns={columns}
        pagination={false}
        rowKey="channel"
        scroll={{ x: 600 }}
      />
    </Card>
  )
}

// ==================== 4.8 自定义报表 ====================

const CustomReportsTab = ({ dateRange }: { dateRange: [Dayjs, Dayjs] }) => {
  const [reports, setReports] = useState<CustomReport[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const response = await api.get('/attribution/custom-reports')
      setReports(response.data.data || [])
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载报表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingReport(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (report: CustomReport) => {
    setEditingReport(report)
    form.setFieldsValue({
      name: report.name,
      config: JSON.stringify(report.config, null, 2),
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/attribution/custom-reports/${id}`)
      message.success('删除成功')
      loadReports()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        name: values.name,
        config: JSON.parse(values.config),
      }

      if (editingReport) {
        await api.put(`/attribution/custom-reports/${editingReport.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/attribution/custom-reports', payload)
        message.success('创建成功')
      }

      setIsModalOpen(false)
      loadReports()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      message.loading(`正在导出${format.toUpperCase()}文件...`, 0)
      const response = await api.get('/attribution/export', {
        params: {
          format,
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `attribution_report_${dayjs().format('YYYYMMDD')}.${format}`
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      message.destroy()
      message.success('导出成功')
    } catch (error: any) {
      message.destroy()
      message.error(error.response?.data?.message || '导出失败')
    }
  }

  const handleLoadReport = async (id: number) => {
    try {
      const response = await api.get(`/attribution/custom-reports/${id}/data`, {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD'),
        },
      })
      message.success('报表加载成功')
      console.log('报表数据:', response.data)
      // 这里可以进一步处理报表数据，例如展示在一个新的Modal中
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载报表数据失败')
    }
  }

  const columns: ColumnsType<CustomReport> = [
    {
      title: '报表名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN'),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_: any, record: CustomReport) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={() => handleLoadReport(record.id)}
          >
            加载
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此报表吗？"
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

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleCreate}>
          保存自定义报表
        </Button>
        <Button icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>
          导出CSV
        </Button>
        <Button icon={<DownloadOutlined />} onClick={() => handleExport('excel')}>
          导出Excel
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={reports}
        loading={loading}
        rowKey="id"
        scroll={{ x: 900 }}
      />

      <Modal
        title={editingReport ? '编辑报表' : '保存自定义报表'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="报表名称"
            name="name"
            rules={[{ required: true, message: '请输入报表名称' }]}
          >
            <Input placeholder="例如：Q1营销活动效果分析" />
          </Form.Item>

          <Form.Item
            label="配置（JSON格式）"
            name="config"
            rules={[
              { required: true, message: '请输入配置' },
              {
                validator: (_, value) => {
                  try {
                    JSON.parse(value)
                    return Promise.resolve()
                  } catch {
                    return Promise.reject(new Error('请输入有效的JSON格式'))
                  }
                },
              },
            ]}
          >
            <TextArea
              rows={10}
              placeholder={`{
  "metrics": ["visits", "conversions", "revenue"],
  "dimensions": ["channel", "date"],
  "filters": {}
}`}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AttributionAnalytics
