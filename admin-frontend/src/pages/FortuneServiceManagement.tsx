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
  Upload,
  Image,
  Drawer,
  Checkbox,
  Slider,
  Descriptions,
  Badge,
  Divider,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  UploadOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  FireOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd/es/upload/interface'
import SunEditor from 'suneditor-react'
import 'suneditor/dist/css/suneditor.min.css'
import api from '../services/api'
import AnimationPreview from '../components/animations/AnimationPreview'


const { Option } = Select


interface Category {
  id: number
  name: string
  code: string
  icon: string
  description: string
  status: string
}

interface FortuneService {
  id: number
  category_id: number
  category_name: string
  name: string
  code: string
  subtitle: string
  description?: string
  original_price: number
  current_price: number
  vip_price: number
  status: string
  is_hot: boolean
  is_new: boolean
  is_recommended: boolean
  view_count: number
  order_count: number
  rating: number
  images?: string[]
  animation_template?: string  // 3D动画模板
  created_at: string
}

interface FilterParams {
  category_id?: number
  status?: string
  is_hot?: boolean
  is_new?: boolean
  is_recommended?: boolean
  min_price?: number
  max_price?: number
  keyword?: string
}

const FortuneServiceManagement = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<FortuneService[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [animationPreviewVisible, setAnimationPreviewVisible] = useState(false)
  const [previewAnimationTemplate, setPreviewAnimationTemplate] = useState<string>('')
  const [editingService, setEditingService] = useState<FortuneService | null>(null)
  const [previewService, setPreviewService] = useState<FortuneService | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [form] = Form.useForm()
  const [batchForm] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [description, setDescription] = useState('')
  const [filters, setFilters] = useState<FilterParams>({})
  const [stats, setStats] = useState({
    total: 0,
    hot_count: 0,
    new_count: 0,
    recommended_count: 0,
    total_sales: 0,
    avg_rating: 0,
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  // 3D动画模板选项
  const animationTemplates = [
    { value: 'BaziEnhancedAnimation', label: '🌟 八字增强版', category: '八字命理' },
    { value: 'TarotThreeAnimation', label: '🃏 塔罗牌', category: '塔罗占卜' },
    { value: 'ZodiacThreeAnimation', label: '🐉 生肖/星座', category: '生肖星座' },
    { value: 'TimeFlowThreeAnimation', label: '⏰ 时间流', category: '流年运势' },
    { value: 'TaijiThreeAnimation', label: '☯️ 太极', category: '命理测算' },
    { value: 'LotteryThreeAnimation', label: '🎋 抽签', category: '灵签占卜' },
    { value: 'WealthThreeAnimation', label: '💰 财富流', category: '财运分析' },
    { value: 'LoveThreeAnimation', label: '💕 爱情', category: '婚恋姻缘' },
    { value: 'CareerThreeAnimation', label: '🚀 事业阶梯', category: '事业发展' },
    { value: 'HealthThreeAnimation', label: '⚕️ 健康能量', category: '健康养生' },
    { value: 'DreamThreeAnimation', label: '💭 解梦云雾', category: '周公解梦' },
    { value: 'PhysiognomyThreeAnimation', label: '👤 相学扫描', category: '面相手相' },
    { value: 'NumberThreeAnimation', label: '🔢 号码矩阵', category: '号码吉凶' },
    { value: 'NameThreeAnimation', label: '📝 姓名书法', category: '起名改名' },
    { value: 'FengshuiThreeAnimation', label: '🏠 风水房屋', category: '风水布局' },
    { value: 'BabyCradleThreeAnimation', label: '👶 婴儿摇篮', category: '宝宝起名' },
    { value: 'PoetryScrollThreeAnimation', label: '📜 诗词卷轴', category: '诗词解析' },
    { value: 'AIBrainThreeAnimation', label: '🤖 AI大脑', category: 'AI分析' },
    { value: 'ExamThreeAnimation', label: '📝 考试场景', category: '考试择吉' },
    { value: 'LuckTransformThreeAnimation', label: '🌈 转运彩虹', category: '转运开运' },
    { value: 'BlessingLightThreeAnimation', label: '💫 开光圣光', category: '开光祈福' },
    { value: 'BloodThreeAnimation', label: '🩸 血型', category: '血型分析' },
  ]


  // 获取统计数据
  const fetchStats = async () => {
    try {
      const res = await api.get('/fortune-services/stats')
      if (res.data.success) {
        setStats((res.data.data || res.data))
      }
    } catch (error: any) {
      console.error('获取统计数据失败:', error)
    }
  }

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const res = await api.get('/fortune-categories')
      if (res.data.success) {
        const categoriesData = (res.data.data || res.data)
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData)
        } else if (categoriesData && Array.isArray(categoriesData.list)) {
          setCategories(categoriesData.list)
        } else {
          setCategories([])
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取分类失败')
      setCategories([])
    }
  }

  // 获取服务列表
  const fetchServices = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const res = await api.get('/fortune-services', {
        params: { page, limit: pageSize, ...filters },
      })
      if (res.data.success) {
        const servicesData = (res.data.data || res.data)
        if (Array.isArray(servicesData)) {
          setServices(servicesData)
          setPagination({
            current: page,
            pageSize,
            total: servicesData.length,
          })
        } else if (servicesData && Array.isArray(servicesData.list)) {
          setServices(servicesData.list)
          setPagination({
            current: page,
            pageSize,
            total: servicesData.pagination?.total || servicesData.list.length,
          })
        } else {
          setServices([])
          setPagination({ current: page, pageSize, total: 0 })
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取服务列表失败')
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchServices()
    fetchStats()
  }, [])

  useEffect(() => {
    fetchServices(1, pagination.pageSize)
  }, [filters])

  // 打开创建/编辑弹窗
  const handleOpenModal = (service?: FortuneService) => {
    if (service) {
      setEditingService(service)
      form.setFieldsValue(service)
      setDescription(service.description || '')
      // 设置图片文件列表
      if ((service.images?.length ?? 0) > 0) {
        setFileList(
          service.images!.map((url, index) => ({
            uid: String(index),
            name: `image-${index}`,
            status: 'done',
            url: url,
          }))
        )
      } else {
        setFileList([])
      }
    } else {
      setEditingService(null)
      form.resetFields()
      setDescription('')
      setFileList([])
    }
    setModalVisible(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 添加富文本内容和图片
      values.description = description
      values.images = fileList.map((file) => file.url || file.response?.url).filter(Boolean)

      if (editingService) {
        // 更新
        await api.put(`/fortune-services/${editingService.id}`, values)
        message.success('更新成功')
      } else {
        // 创建
        await api.post('/fortune-services', values)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchServices()
      fetchStats()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  // 删除服务
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个服务吗？',
      onOk: async () => {
        try {
          await api.delete(`/fortune-services/${id}`)
          message.success('删除成功')
          fetchServices()
          fetchStats()
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      },
    })
  }

  // 快速复制服务
  const handleCopy = async (service: FortuneService) => {
    try {
      const { id, created_at, updated_at, ...copyData } = service as any
      copyData.name = `${copyData.name}_副本`
      copyData.code = `${copyData.code}_copy_${Date.now()}`

      await api.post('/fortune-services', copyData)
      message.success('复制成功')
      fetchServices()
      fetchStats()
    } catch (error: any) {
      message.error(error.response?.data?.message || '复制失败')
    }
  }

  // 服务预览
  const handlePreview = (service: FortuneService) => {
    setPreviewService(service)
    setPreviewVisible(true)
  }

  // 更新状态
  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/fortune-services/${id}`, { status })
      message.success('状态更新成功')
      fetchServices()
      fetchStats()
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败')
    }
  }

  // 批量操作
  const handleBatchOperation = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的服务')
      return
    }
    batchForm.resetFields()
    setBatchModalVisible(true)
  }

  const handleBatchSubmit = async () => {
    try {
      const values = await batchForm.validateFields()

      // 过滤掉未填写的字段
      const updateData: any = {}
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          updateData[key] = values[key]
        }
      })

      if (Object.keys(updateData).length === 0) {
        message.warning('请至少填写一个要更新的字段')
        return
      }

      await api.post('/fortune-services/batch-update', {
        ids: selectedRowKeys,
        data: updateData,
      })

      message.success(`成功更新 ${selectedRowKeys.length} 个服务`)
      setBatchModalVisible(false)
      setSelectedRowKeys([])
      fetchServices()
      fetchStats()
    } catch (error: any) {
      message.error(error.response?.data?.message || '批量操作失败')
    }
  }

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的服务')
      return
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个服务吗？`,
      onOk: async () => {
        try {
          await api.post('/fortune-services/batch-delete', {
            ids: selectedRowKeys,
          })
          message.success(`成功删除 ${selectedRowKeys.length} 个服务`)
          setSelectedRowKeys([])
          fetchServices()
          fetchStats()
        } catch (error: any) {
          message.error(error.response?.data?.message || '批量删除失败')
        }
      },
    })
  }

  // 高级筛选
  const handleFilter = async () => {
    try {
      const values = await filterForm.validateFields()

      // 过滤掉未填写的字段
      const filterData: FilterParams = {}
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
          filterData[key as keyof FilterParams] = values[key]
        }
      })

      setFilters(filterData)
      setFilterDrawerVisible(false)
    } catch (error) {
      console.error('筛选失败:', error)
    }
  }

  const handleResetFilter = () => {
    filterForm.resetFields()
    setFilters({})
    setFilterDrawerVisible(false)
  }

  // 导出数据
  const handleExport = async () => {
    try {
      const res = await api.get('/fortune-services/export', {
        params: filters,
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `fortune_services_${Date.now()}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      message.success('导出成功')
    } catch (error: any) {
      message.error('导出失败')
    }
  }

  // 导入数据
  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        await api.post('/fortune-services/import', { data })
        message.success('导入成功')
        fetchServices()
        fetchStats()
      } catch (error: any) {
        message.error(error.response?.data?.message || '导入失败')
      }
    }
    reader.readAsText(file)
    return false
  }

  // 图片上传前的处理
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件!')
      return false
    }
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB!')
      return false
    }
    return true
  }

  const handleUploadChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList)
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: any[]) => setSelectedRowKeys(keys),
  }

  const columns: ColumnsType<FortuneService> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend',
    },
    {
      title: '图片',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images: string[]) => {
        if (images?.length > 0) {
          return <Image width={50} height={50} src={images[0]} />
        }
        return <div style={{ width: 50, height: 50, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>无</div>
      },
    },
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN'),
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 100,
      sorter: (a, b) => a.category_name.localeCompare(b.category_name, 'zh-CN'),
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '3D模板',
      dataIndex: 'animation_template',
      key: 'animation_template',
      width: 200,
      render: (template) => {
        const found = animationTemplates.find((t) => t.value === template)
        return (
          <Space>
            {found ? (
              <Tag color="purple">{found.label}</Tag>
            ) : template ? (
              <Tag>{template}</Tag>
            ) : (
              <Tag color="default">未设置</Tag>
            )}
            {template && (
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  setPreviewAnimationTemplate(template)
                  setAnimationPreviewVisible(true)
                }}
              >
                预览
              </Button>
            )}
          </Space>
        )
      },
    },
    {
      title: '价格',
      key: 'price',
      width: 150,
      sorter: (a, b) => a.current_price - b.current_price,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span style={{ textDecoration: 'line-through', color: '#999' }}>¥{record.original_price}</span>
          <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{record.current_price}</span>
          {record.vip_price && <span style={{ color: '#faad14' }}>VIP: ¥{record.vip_price}</span>}
        </Space>
      ),
    },
    {
      title: '标签',
      key: 'tags',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.is_hot && <Tag color="red">热门</Tag>}
          {record.is_new && <Tag color="green">新品</Tag>}
          {record.is_recommended && <Tag color="gold">推荐</Tag>}
        </Space>
      ),
    },
    {
      title: '统计',
      key: 'stats',
      width: 150,
      sorter: (a, b) => a.order_count - b.order_count,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <span>浏览: {record.view_count}</span>
          <span>订单: {record.order_count}</span>
          <span>评分: {record.rating ? Number(record.rating).toFixed(1) : '0.0'}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: '100%' }}
          onChange={(value) => handleUpdateStatus(record.id, value)}
        >
          <Option value="draft">草稿</Option>
          <Option value="active">上架</Option>
          <Option value="inactive">下架</Option>
        </Select>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
          >
            复制
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
      ),
    },
  ]

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总服务数"
              value={stats.total}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="热门服务"
              value={stats.hot_count}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="新品服务"
              value={stats.new_count}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="推荐服务"
              value={stats.recommended_count}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总销售额"
              value={stats.total_sales}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="平均评分"
              value={stats.avg_rating}
              prefix={<StarOutlined />}
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="运势服务管理"
        extra={
          <Space>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerVisible(true)}
            >
              高级筛选
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
            <Upload
              beforeUpload={handleImport}
              showUploadList={false}
              accept=".json"
            >
              <Button icon={<UploadOutlined />}>导入</Button>
            </Upload>
            <Button
              onClick={handleBatchOperation}
              disabled={selectedRowKeys.length === 0}
            >
              批量操作 ({selectedRowKeys.length})
            </Button>
            <Button
              danger
              onClick={handleBatchDelete}
              disabled={selectedRowKeys.length === 0}
            >
              批量删除
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              创建服务
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1600 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              fetchServices(page, pageSize)
            },
            onShowSizeChange: (_, size) => {
              fetchServices(1, size)
            },
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingService ? '编辑服务' : '创建服务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category_id"
                label="服务分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类">
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="服务代码"
                rules={[{ required: true, message: '请输入服务代码' }]}
              >
                <Input placeholder="请输入唯一的服务代码" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="name"
            label="服务名称"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input placeholder="请输入服务名称" />
          </Form.Item>

          <Form.Item name="subtitle" label="副标题">
            <Input placeholder="请输入副标题" />
          </Form.Item>

          <Form.Item label="3D动画模板">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="animation_template" noStyle>
                <Select
                  placeholder="选择3D动画效果"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  style={{ width: '100%' }}
                >
                  {animationTemplates.map((template) => (
                    <Option key={template.value} value={template.value}>
                      <Space>
                        <span>{template.label}</span>
                        <Tag color="blue" style={{ fontSize: '12px' }}>{template.category}</Tag>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  const selectedTemplate = form.getFieldValue('animation_template')
                  if (selectedTemplate) {
                    setPreviewAnimationTemplate(selectedTemplate)
                    setAnimationPreviewVisible(true)
                  } else {
                    message.warning('请先选择一个3D模板')
                  }
                }}
              >
                预览
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item label="服务简介">
            <SunEditor
              height="200"
              defaultValue={description}
              onChange={setDescription}
              setOptions={{
                buttonList: [
                  ['undo', 'redo'],
                  ['bold', 'underline', 'italic', 'strike'],
                  ['fontColor', 'hiliteColor'],
                  ['removeFormat'],
                  ['outdent', 'indent'],
                  ['align', 'horizontalRule', 'list', 'lineHeight'],
                  ['table', 'link', 'image'],
                  ['fullScreen', 'showBlocks', 'codeView']
                ]
              }}
            />
          </Form.Item>

          <Form.Item label="服务图片">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={beforeUpload}
              maxCount={5}
            >
              {fileList.length < 5 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="original_price"
                label="原价"
                rules={[{ required: true, message: '请输入原价' }]}
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="current_price"
                label="现价"
                rules={[{ required: true, message: '请输入现价' }]}
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="vip_price" label="VIP价格">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="is_hot" label="热门推荐" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_new" label="新品标签" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_recommended" label="首页推荐" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="status" label="状态" initialValue="draft">
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="active">上架</Option>
              <Option value="inactive">下架</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量操作弹窗 */}
      <Modal
        title={`批量操作 (已选择 ${selectedRowKeys.length} 个服务)`}
        open={batchModalVisible}
        onOk={handleBatchSubmit}
        onCancel={() => setBatchModalVisible(false)}
        width={600}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item name="status" label="更新状态">
            <Select placeholder="选择状态" allowClear>
              <Option value="draft">草稿</Option>
              <Option value="active">上架</Option>
              <Option value="inactive">下架</Option>
            </Select>
          </Form.Item>

          <Form.Item label="更新标签">
            <Space>
              <Form.Item name="is_hot" valuePropName="checked" noStyle>
                <Checkbox>热门</Checkbox>
              </Form.Item>
              <Form.Item name="is_new" valuePropName="checked" noStyle>
                <Checkbox>新品</Checkbox>
              </Form.Item>
              <Form.Item name="is_recommended" valuePropName="checked" noStyle>
                <Checkbox>推荐</Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item name="discount_rate" label="统一折扣率 (%)">
            <Slider min={0} max={100} marks={{ 0: '0%', 50: '50%', 100: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 高级筛选抽屉 */}
      <Drawer
        title="高级筛选"
        placement="right"
        width={400}
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        extra={
          <Space>
            <Button onClick={handleResetFilter}>重置</Button>
            <Button type="primary" onClick={handleFilter}>
              应用筛选
            </Button>
          </Space>
        }
      >
        <Form form={filterForm} layout="vertical">
          <Form.Item name="keyword" label="关键词搜索">
            <Input placeholder="搜索服务名称或代码" prefix={<SearchOutlined />} />
          </Form.Item>

          <Form.Item name="category_id" label="服务分类">
            <Select placeholder="选择分类" allowClear>
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select placeholder="选择状态" allowClear>
              <Option value="draft">草稿</Option>
              <Option value="active">上架</Option>
              <Option value="inactive">下架</Option>
            </Select>
          </Form.Item>

          <Form.Item label="价格范围">
            <Input.Group compact>
              <Form.Item name="min_price" noStyle>
                <InputNumber placeholder="最低价" style={{ width: '50%' }} />
              </Form.Item>
              <Form.Item name="max_price" noStyle>
                <InputNumber placeholder="最高价" style={{ width: '50%' }} />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item label="标签筛选">
            <Space direction="vertical">
              <Form.Item name="is_hot" valuePropName="checked" noStyle>
                <Checkbox>热门</Checkbox>
              </Form.Item>
              <Form.Item name="is_new" valuePropName="checked" noStyle>
                <Checkbox>新品</Checkbox>
              </Form.Item>
              <Form.Item name="is_recommended" valuePropName="checked" noStyle>
                <Checkbox>推荐</Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 服务预览抽屉 */}
      <Drawer
        title="服务预览"
        placement="right"
        width={600}
        onClose={() => setPreviewVisible(false)}
        open={previewVisible}
      >
        {previewService && (
          <div>
            {/* 图片轮播 */}
            {(previewService.images?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Image.PreviewGroup>
                  {previewService.images!.map((img, index) => (
                    <Image key={index} width="100%" src={img} />
                  ))}
                </Image.PreviewGroup>
              </div>
            )}

            {/* 服务信息 */}
            <Descriptions column={1} bordered>
              <Descriptions.Item label="服务名称">
                <strong style={{ fontSize: 18 }}>{previewService.name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="副标题">{previewService.subtitle}</Descriptions.Item>
              <Descriptions.Item label="分类">
                <Tag color="blue">{previewService.category_name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="3D动画模板">
                {previewService.animation_template ? (
                  (() => {
                    const found = animationTemplates.find((t) => t.value === previewService.animation_template)
                    return found ? (
                      <Space>
                        <Tag color="purple">{found.label}</Tag>
                        <Tag color="blue">{found.category}</Tag>
                      </Space>
                    ) : (
                      <Tag>{previewService.animation_template}</Tag>
                    )
                  })()
                ) : (
                  <Tag color="default">未设置</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="价格">
                <Space direction="vertical">
                  <span style={{ textDecoration: 'line-through', color: '#999' }}>
                    原价: ¥{previewService.original_price}
                  </span>
                  <span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: 20 }}>
                    现价: ¥{previewService.current_price}
                  </span>
                  {previewService.vip_price && (
                    <span style={{ color: '#faad14' }}>VIP价: ¥{previewService.vip_price}</span>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="标签">
                <Space>
                  {previewService.is_hot && <Tag color="red">热门</Tag>}
                  {previewService.is_new && <Tag color="green">新品</Tag>}
                  {previewService.is_recommended && <Tag color="gold">推荐</Tag>}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge
                  status={
                    previewService.status === 'active'
                      ? 'success'
                      : previewService.status === 'draft'
                      ? 'default'
                      : 'error'
                  }
                  text={
                    previewService.status === 'active'
                      ? '上架'
                      : previewService.status === 'draft'
                      ? '草稿'
                      : '下架'
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label="浏览量">{previewService.view_count}</Descriptions.Item>
              <Descriptions.Item label="订单量">{previewService.order_count}</Descriptions.Item>
              <Descriptions.Item label="评分">
                {previewService.rating ? Number(previewService.rating).toFixed(1) : '0.0'} ⭐
              </Descriptions.Item>
            </Descriptions>

            <Divider>服务详情</Divider>
            <div
              dangerouslySetInnerHTML={{ __html: previewService.description || '暂无详情' }}
              style={{
                padding: 16,
                background: '#fafafa',
                borderRadius: 4,
                minHeight: 200,
              }}
            />
          </div>
        )}
      </Drawer>

      {/* 3D动画预览模态框 */}
      <Modal
        title="3D动画效果预览"
        open={animationPreviewVisible}
        onCancel={() => setAnimationPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAnimationPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
        centered
      >
        {previewAnimationTemplate && (() => {
          const found = animationTemplates.find((t) => t.value === previewAnimationTemplate)
          return (
            <div>
              {/* 模板信息 */}
              <Alert
                message={
                  <Space>
                    <span style={{ fontSize: 16, fontWeight: 'bold' }}>
                      {found?.label || previewAnimationTemplate}
                    </span>
                    <Tag color="blue">{found?.category}</Tag>
                  </Space>
                }
                description={
                  <div style={{ marginTop: 12 }}>
                    <p><strong>组件名称：</strong>{previewAnimationTemplate}</p>
                    <p><strong>适用场景：</strong>{found?.category}</p>
                    <p><strong>说明：</strong>此为真实的3D动画效果预览，可使用鼠标拖拽旋转、滚轮缩放</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 20 }}
              />

              {/* 真实的3D动画预览 */}
              <div style={{
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <AnimationPreview animationType={previewAnimationTemplate} />
              </div>

              {/* 操作提示 */}
              <Alert
                message="交互提示"
                description={
                  <div>
                    <p>• 🖱️ 拖拽鼠标左键旋转视角</p>
                    <p>• 🎡 滚动鼠标滚轮缩放画面</p>
                    <p>• 🎨 动画会自动旋转播放</p>
                    <p>• ⚡ 实时渲染，流畅交互</p>
                  </div>
                }
                type="success"
                showIcon
                style={{ marginTop: 20 }}
              />
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

export default FortuneServiceManagement
