import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message,
  Tabs, Row, Col, Upload, Divider, Alert, Collapse, Tooltip
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CodeOutlined,
  DownloadOutlined, UploadOutlined, CopyOutlined, SearchOutlined,
  FilterOutlined, HistoryOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/apiService'
import JsonView from '@uiw/react-json-view'

const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs
const { Panel } = Collapse

interface SystemConfig {
  id: number
  config_key: string
  config_value: any
  config_type: string
  description: string
  updated_by: string
  created_at: string
  updated_at: string
}

// 配置模板库
const CONFIG_TEMPLATES = {
  free_trial: {
    name: '免费试用配置',
    config_type: 'trial',
    description: '用户免费试用相关配置',
    config_value: {
      enabled: true,
      daily_limit: 3,
      services: ['zodiac', 'birth_animal']
    }
  },
  member_levels: {
    name: '会员等级配置',
    config_type: 'member',
    description: '会员等级和折扣配置',
    config_value: {
      levels: [
        { name: '普通会员', discount: 1.0, benefits: [] },
        { name: '银卡会员', discount: 0.95, benefits: ['优先客服'] },
        { name: '金卡会员', discount: 0.9, benefits: ['优先客服', '专属运势'] },
        { name: '钻石会员', discount: 0.85, benefits: ['优先客服', '专属运势', '免费算命次数'] }
      ]
    }
  },
  payment_settings: {
    name: '支付配置',
    config_type: 'payment',
    description: '支付渠道和参数配置',
    config_value: {
      enabled_channels: ['wechat', 'alipay'],
      min_amount: 1,
      max_amount: 10000,
      currency: 'CNY',
      wechat: {
        app_id: '',
        mch_id: '',
        notify_url: ''
      },
      alipay: {
        app_id: '',
        notify_url: ''
      }
    }
  },
  notification_settings: {
    name: '通知配置',
    config_type: 'notification',
    description: '系统通知相关配置',
    config_value: {
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      daily_limit: 100
    }
  },
  fortune_pricing: {
    name: '算命服务定价配置',
    config_type: 'pricing',
    description: '各类算命服务的价格设置',
    config_value: {
      base_prices: {
        bazi: 29.9,
        ziwei: 39.9,
        zodiac: 9.9,
        tarot: 19.9,
        name_test: 19.9,
        marriage: 49.9,
        career: 39.9
      },
      vip_discounts: {
        silver: 0.95,
        gold: 0.9,
        diamond: 0.85
      }
    }
  },
  horoscope_settings: {
    name: '每日运势配置',
    config_type: 'horoscope',
    description: '每日运势生成和展示配置',
    config_value: {
      auto_generate: true,
      generate_time: '00:00',
      zodiac_signs: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'],
      categories: ['overall', 'love', 'career', 'wealth', 'health']
    }
  },
  coupon_settings: {
    name: '优惠券配置',
    config_type: 'coupon',
    description: '优惠券发放和使用规则',
    config_value: {
      new_user_coupon: {
        enabled: true,
        discount: 5,
        min_amount: 20,
        valid_days: 7
      },
      birthday_coupon: {
        enabled: true,
        discount: 10,
        valid_days: 30
      },
      festival_coupon: {
        enabled: true,
        discount: 15,
        valid_days: 3
      }
    }
  },
  review_settings: {
    name: '内容审核配置',
    config_type: 'review',
    description: '用户反馈和内容审核规则',
    config_value: {
      auto_approve: false,
      sensitive_words: ['政治', '暴力', '色情'],
      review_timeout: 24,
      max_complaint_count: 3
    }
  },
  ai_settings: {
    name: 'AI算命配置',
    config_type: 'ai',
    description: 'AI算命服务相关配置',
    config_value: {
      enabled: true,
      api_key: '',
      model: 'gpt-3.5-turbo',
      max_tokens: 1000,
      temperature: 0.7,
      timeout: 30
    }
  },
  points_settings: {
    name: '积分系统配置',
    config_type: 'points',
    description: '用户积分获取和兑换规则',
    config_value: {
      enabled: true,
      sign_in_points: 10,
      share_points: 20,
      order_points_rate: 0.1,
      points_to_cash: 100,
      min_redeem: 1000
    }
  },
  rate_limit_settings: {
    name: '限流配置',
    config_type: 'rate_limit',
    description: 'API和服务调用频率限制',
    config_value: {
      api_rate_limit: {
        per_minute: 60,
        per_hour: 1000
      },
      fortune_rate_limit: {
        free_user: {
          daily: 3,
          monthly: 30
        },
        vip_user: {
          daily: 10,
          monthly: 100
        }
      }
    }
  },
  cache_settings: {
    name: '缓存配置',
    config_type: 'cache',
    description: '数据缓存策略配置',
    config_value: {
      enabled: true,
      ttl: {
        horoscope: 86400,
        fortune_result: 3600,
        user_info: 1800
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0
      }
    }
  }
}

const SystemConfigManagement = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [jsonModalVisible, setJsonModalVisible] = useState(false)
  const [templateModalVisible, setTemplateModalVisible] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null)
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null)
  const [form] = Form.useForm()

  // 分页和筛选状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [filters, setFilters] = useState({
    config_type: '',
    keyword: ''
  })

  // 当前视图模式
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const fetchConfigs = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params: any = {
        page,
        limit: pageSize
      }

      if (filters.config_type) {
        params.config_type = filters.config_type
      }
      if (filters.keyword) {
        params.keyword = filters.keyword
      }

      const res = await api.get('/system-configs', { params })
      if (res.data.success) {
        const configData = res.data.data
        if (Array.isArray(configData)) {
          setConfigs(configData)
          setPagination({
            current: page,
            pageSize,
            total: configData.length
          })
        } else if (configData && Array.isArray(configData.list)) {
          setConfigs(configData.list)
          setPagination({
            current: page,
            pageSize,
            total: configData.pagination?.total || configData.list.length
          })
        } else {
          setConfigs([])
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取配置列表失败')
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTypes = async () => {
    try {
      const res = await api.get('/system-configs/types')
      if (res.data.success) {
        setTypes(res.data.data || [])
      }
    } catch (error: any) {
      console.error('获取类型失败:', error)
    }
  }

  useEffect(() => {
    fetchConfigs(1, pagination.pageSize)
    fetchTypes()
  }, [filters])

  const handleOpenModal = (config?: SystemConfig) => {
    if (config) {
      setEditingConfig(config)
      form.setFieldsValue({
        ...config,
        config_value: JSON.stringify(config.config_value, null, 2)
      })
    } else {
      setEditingConfig(null)
      form.resetFields()
    }
    setModalVisible(true)
  }

  const handleViewJson = (config: SystemConfig) => {
    setSelectedConfig(config)
    setJsonModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 验证JSON
      let configValue
      try {
        configValue = JSON.parse(values.config_value)
      } catch {
        message.error('配置值必须是有效的JSON格式')
        return
      }

      const payload = {
        ...values,
        config_value: configValue
      }

      if (editingConfig) {
        await api.put(`/system-configs/${editingConfig.config_key}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/system-configs', payload)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchConfigs(pagination.current, pagination.pageSize)
      fetchTypes()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个配置吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await api.delete(`/system-configs/${key}`)
          message.success('删除成功')
          fetchConfigs(pagination.current, pagination.pageSize)
          fetchTypes()
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      }
    })
  }

  const handleCopyConfig = (config: SystemConfig) => {
    form.setFieldsValue({
      config_key: `${config.config_key}_copy`,
      config_type: config.config_type,
      config_value: JSON.stringify(config.config_value, null, 2),
      description: config.description
    })
    setEditingConfig(null)
    setModalVisible(true)
    message.info('配置已复制，请修改配置键后保存')
  }

  // 导出配置
  const handleExport = () => {
    const dataStr = JSON.stringify(configs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `system_configs_${new Date().getTime()}.json`
    link.click()
    URL.revokeObjectURL(url)
    message.success('配置导出成功')
  }

  // 导入配置
  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const configs = JSON.parse(e.target?.result as string)
        if (!Array.isArray(configs)) {
          message.error('导入文件格式错误，应为配置数组')
          return
        }

        Modal.confirm({
          title: '确认导入',
          content: `将导入 ${configs.length} 个配置，已存在的配置键将被更新。是否继续？`,
          onOk: async () => {
            let successCount = 0
            let failCount = 0

            for (const config of configs) {
              try {
                await api.post('/system-configs', {
                  config_key: config.config_key,
                  config_value: config.config_value,
                  config_type: config.config_type,
                  description: config.description
                })
                successCount++
              } catch (error) {
                // 如果创建失败（可能已存在），尝试更新
                try {
                  await api.put(`/system-configs/${config.config_key}`, {
                    config_value: config.config_value,
                    config_type: config.config_type,
                    description: config.description
                  })
                  successCount++
                } catch {
                  failCount++
                }
              }
            }

            message.success(`导入完成: 成功 ${successCount} 个，失败 ${failCount} 个`)
            fetchConfigs(1, pagination.pageSize)
            fetchTypes()
          }
        })
      } catch (error) {
        message.error('导入文件解析失败，请检查JSON格式')
      }
    }
    reader.readAsText(file)
    return false // 阻止默认上传行为
  }

  // 从模板创建配置
  const handleUseTemplate = (templateKey: string) => {
    const template = CONFIG_TEMPLATES[templateKey as keyof typeof CONFIG_TEMPLATES]
    form.setFieldsValue({
      config_key: templateKey,
      config_type: template.config_type,
      config_value: JSON.stringify(template.config_value, null, 2),
      description: template.description
    })
    setEditingConfig(null)
    setTemplateModalVisible(false)
    setModalVisible(true)
  }

  // 格式化JSON
  const handleFormatJson = () => {
    try {
      const value = form.getFieldValue('config_value')
      const formatted = JSON.stringify(JSON.parse(value), null, 2)
      form.setFieldsValue({ config_value: formatted })
      message.success('JSON格式化成功')
    } catch {
      message.error('JSON格式错误，无法格式化')
    }
  }

  const columns: ColumnsType<SystemConfig> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '配置键',
      dataIndex: 'config_key',
      key: 'config_key',
      width: 200,
      render: (key) => <Tag color="blue">{key}</Tag>
    },
    {
      title: '配置类型',
      dataIndex: 'config_type',
      key: 'config_type',
      width: 120,
      render: (type) => <Tag color="green">{type}</Tag>,
      filters: types.map(t => ({ text: t, value: t })),
      filteredValue: filters.config_type ? [filters.config_type] : null,
      onFilter: (value, record) => record.config_type === value
    },
    {
      title: '配置值',
      dataIndex: 'config_value',
      key: 'config_value',
      ellipsis: true,
      render: (value, record) => (
        <Space>
          <span style={{ maxWidth: 300, display: 'inline-block' }}>
            {JSON.stringify(value).substring(0, 50)}...
          </span>
          <Button
            type="link"
            size="small"
            icon={<CodeOutlined />}
            onClick={() => handleViewJson(record)}
          >
            查看
          </Button>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '更新人',
      dataIndex: 'updated_by',
      key: 'updated_by',
      width: 120
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
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
              onClick={() => handleCopyConfig(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.config_key)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  // 按类型分组的配置
  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.config_type]) {
      acc[config.config_type] = []
    }
    acc[config.config_type].push(config)
    return acc
  }, {} as Record<string, SystemConfig[]>)

  return (
    <div>
      <Card
        title="系统配置管理"
        extra={
          <Space>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={handleImport}
            >
              <Button icon={<UploadOutlined />}>导入配置</Button>
            </Upload>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={configs.length === 0}
            >
              导出配置
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setTemplateModalVisible(true)}
            >
              使用模板
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              创建配置
            </Button>
          </Space>
        }
      >
        {/* 筛选条件 */}
        <Space style={{ marginBottom: 16 }} size="middle">
          <Select
            placeholder="选择配置类型"
            style={{ width: 150 }}
            allowClear
            value={filters.config_type || undefined}
            onChange={(value) => setFilters({ ...filters, config_type: value || '' })}
          >
            {types.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
          <Input
            placeholder="搜索配置键或描述"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            allowClear
          />
        </Space>

        {/* 视图切换Tabs */}
        <Tabs activeKey={viewMode} onChange={(key) => setViewMode(key as any)}>
          <TabPane tab="表格视图" key="table">
            <Table
              columns={columns}
              dataSource={configs}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1400 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                pageSizeOptions: ['10', '20', '50', '100'],
                onChange: (page, pageSize) => {
                  fetchConfigs(page, pageSize)
                },
                onShowSizeChange: (current, size) => {
                  fetchConfigs(1, size)
                }
              }}
            />
          </TabPane>
          <TabPane tab="分组卡片" key="cards">
            <Collapse accordion>
              {Object.keys(groupedConfigs).map(type => (
                <Panel
                  header={
                    <Space>
                      <Tag color="green">{type}</Tag>
                      <span>{groupedConfigs[type].length} 个配置</span>
                    </Space>
                  }
                  key={type}
                >
                  <Row gutter={[16, 16]}>
                    {groupedConfigs[type].map(config => (
                      <Col span={24} key={config.id}>
                        <Card
                          size="small"
                          title={<Tag color="blue">{config.config_key}</Tag>}
                          extra={
                            <Space size="small">
                              <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleOpenModal(config)}
                              />
                              <Button
                                type="link"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyConfig(config)}
                              />
                              <Button
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(config.config_key)}
                              />
                            </Space>
                          }
                        >
                          <p><strong>描述:</strong> {config.description || '无'}</p>
                          <p><strong>更新人:</strong> {config.updated_by || '未知'}</p>
                          <p><strong>更新时间:</strong> {new Date(config.updated_at).toLocaleString('zh-CN')}</p>
                          <Divider style={{ margin: '12px 0' }} />
                          <div
                            style={{
                              maxHeight: 200,
                              overflow: 'auto',
                              background: '#f5f5f5',
                              padding: 12,
                              borderRadius: 4
                            }}
                          >
                            <JsonView
                              value={config.config_value}
                              collapsed={1}
                              displayDataTypes={false}
                              style={{ fontSize: '12px' }}
                            />
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Panel>
              ))}
            </Collapse>
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingConfig ? '编辑配置' : '创建配置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="config_key"
            label="配置键"
            rules={[{ required: true, message: '请输入配置键' }]}
          >
            <Input
              placeholder="请输入配置键（如：free_trial, member_levels）"
              disabled={!!editingConfig}
            />
          </Form.Item>

          <Form.Item
            name="config_type"
            label="配置类型"
            rules={[{ required: true, message: '请选择配置类型' }]}
          >
            <Select placeholder="请选择配置类型">
              {types.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
              <Option value="trial">trial</Option>
              <Option value="member">member</Option>
              <Option value="payment">payment</Option>
              <Option value="notification">notification</Option>
              <Option value="general">general</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="config_value"
            label={
              <Space>
                <span>配置值（JSON格式）</span>
                <Button type="link" size="small" onClick={handleFormatJson}>
                  格式化
                </Button>
              </Space>
            }
            rules={[{ required: true, message: '请输入配置值' }]}
            help="请输入有效的JSON格式数据"
          >
            <TextArea
              rows={15}
              placeholder='{"enabled": true, "daily_limit": 3}'
              style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: 13 }}
            />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="请输入配置描述" />
          </Form.Item>

          <Form.Item name="updated_by" label="更新人">
            <Input placeholder="请输入更新人" />
          </Form.Item>
        </Form>
      </Modal>

      {/* JSON查看弹窗 */}
      <Modal
        title={`查看配置：${selectedConfig?.config_key}`}
        open={jsonModalVisible}
        onCancel={() => setJsonModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedConfig && (
          <div>
            <p><strong>类型：</strong>{selectedConfig.config_type}</p>
            <p><strong>描述：</strong>{selectedConfig.description || '无'}</p>
            <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 4, overflow: 'auto', maxHeight: 600 }}>
              <JsonView
                value={selectedConfig.config_value}
                collapsed={false}
                displayDataTypes={false}
                style={{
                  fontSize: '14px',
                  fontFamily: 'Consolas, Monaco, monospace'
                }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 配置模板选择弹窗 */}
      <Modal
        title="选择配置模板"
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        footer={null}
        width={800}
      >
        <Alert
          message="配置模板库"
          description="选择一个模板快速创建常用配置，您可以在创建后进行修改"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Row gutter={[16, 16]}>
          {Object.entries(CONFIG_TEMPLATES).map(([key, template]) => (
            <Col span={12} key={key}>
              <Card
                hoverable
                size="small"
                onClick={() => handleUseTemplate(key)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Meta
                  title={template.name}
                  description={
                    <>
                      <Tag color="green">{template.config_type}</Tag>
                      <p style={{ marginTop: 8 }}>{template.description}</p>
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>
    </div>
  )
}

export default SystemConfigManagement
