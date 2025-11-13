import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker,
  message, InputNumber, Tabs, Row, Col, Statistic, Calendar, Badge, Drawer,
  Descriptions, Checkbox, Popconfirm
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined,
  CopyOutlined, BarChartOutlined, FilterOutlined, ThunderboltOutlined,
  EyeOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Dayjs } from 'dayjs'
import api from '../services/apiService'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs
const { RangePicker } = DatePicker

interface DailyHoroscope {
  id: number
  date: string
  type: 'zodiac' | 'birth_animal'
  type_value: string
  overall_score: number
  love_score: number
  career_score: number
  wealth_score: number
  health_score: number
  overall_content?: string
  love_content?: string
  career_content?: string
  wealth_content?: string
  health_content?: string
  lucky_color: string
  lucky_number: string
  lucky_direction?: string
  created_at: string
  updated_at: string
}

const DailyHoroscopeManagement = () => {
  const [horoscopes, setHoroscopes] = useState<DailyHoroscope[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [batchGenModalVisible, setBatchGenModalVisible] = useState(false)
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [editingHoroscope, setEditingHoroscope] = useState<DailyHoroscope | null>(null)
  const [selectedHoroscope, setSelectedHoroscope] = useState<DailyHoroscope | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()
  const [batchGenForm] = Form.useForm()

  // 筛选条件
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [valueFilter, setValueFilter] = useState<string>('')

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  // 星座列表
  const zodiacSigns = [
    '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
    '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'
  ]

  // 生肖列表
  const birthAnimals = [
    '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'
  ]

  const [allHoroscopes, setAllHoroscopes] = useState<DailyHoroscope[]>([])  // 所有数据（用于日历和统计）

  const fetchHoroscopes = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params: any = {
        page: 1,
        limit: 10000  // 加载所有数据
      }

      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }

      if (typeFilter) {
        params.type = typeFilter
      }

      if (valueFilter) {
        params.type_value = valueFilter
      }

      const res = await api.get('/daily-horoscopes', { params })
      if (res.data.success) {
        const horoscopeData = res.data.data
        let allData: DailyHoroscope[] = []

        if (Array.isArray(horoscopeData)) {
          allData = horoscopeData
        } else if (horoscopeData && Array.isArray(horoscopeData.list)) {
          allData = horoscopeData.list
        }

        // 保存所有数据
        setAllHoroscopes(allData)

        // 计算分页后的数据用于列表显示
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const pagedData = allData.slice(startIndex, endIndex)

        setHoroscopes(pagedData)
        setPagination({
          current: page,
          pageSize,
          total: allData.length
        })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取运势列表失败')
      setHoroscopes([])
      setAllHoroscopes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHoroscopes(1, pagination.pageSize)
  }, [dateRange, typeFilter, valueFilter])

  const handleOpenModal = (horoscope?: DailyHoroscope) => {
    if (horoscope) {
      setEditingHoroscope(horoscope)
      form.setFieldsValue({
        ...horoscope,
        date: dayjs(horoscope.date)
      })
    } else {
      setEditingHoroscope(null)
      form.resetFields()
      form.setFieldsValue({
        date: dayjs(),
        overall_score: 3,
        love_score: 3,
        career_score: 3,
        wealth_score: 3,
        health_score: 3
      })
    }
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD')
      }

      if (editingHoroscope) {
        await api.put(`/daily-horoscopes/${editingHoroscope.id}`, payload)
        message.success('更新成功')
      } else {
        await api.post('/daily-horoscopes', payload)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchHoroscopes(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条运势吗？',
      onOk: async () => {
        try {
          await api.delete(`/daily-horoscopes/${id}`)
          message.success('删除成功')
          fetchHoroscopes()
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      }
    })
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的记录')
      return
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条运势吗？`,
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map(id => api.delete(`/daily-horoscopes/${id}`))
          )
          message.success('批量删除成功')
          setSelectedRowKeys([])
          fetchHoroscopes()
        } catch (error: any) {
          message.error(error.response?.data?.message || '批量删除失败')
        }
      }
    })
  }

  // 复制运势
  const handleCopy = async (horoscope: DailyHoroscope) => {
    Modal.confirm({
      title: '复制运势',
      content: '是否将此运势复制到明天？',
      onOk: async () => {
        try {
          const newHoroscope = {
            ...horoscope,
            date: dayjs(horoscope.date).add(1, 'day').format('YYYY-MM-DD')
          }
          delete (newHoroscope as any).id
          delete (newHoroscope as any).created_at
          delete (newHoroscope as any).updated_at

          await api.post('/daily-horoscopes', newHoroscope)
          message.success('复制成功')
          fetchHoroscopes()
        } catch (error: any) {
          message.error(error.response?.data?.message || '复制失败')
        }
      }
    })
  }

  // 批量生成运势
  const handleBatchGenerate = async () => {
    try {
      const values = await batchGenForm.validateFields()

      const startDate = values.dateRange[0]
      const endDate = values.dateRange[1]
      const types = values.types || ['zodiac', 'birth_animal']

      const payload = {
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        types
      }

      await api.post('/daily-horoscopes/batch-generate', payload)
      message.success('批量生成成功')
      setBatchGenModalVisible(false)
      batchGenForm.resetFields()
      fetchHoroscopes()
    } catch (error: any) {
      message.error(error.response?.data?.message || '批量生成失败')
    }
  }

  // 查看详情
  const handleViewDetail = (horoscope: DailyHoroscope) => {
    setSelectedHoroscope(horoscope)
    setDetailDrawerVisible(true)
  }

  const getFortuneColor = (score: number) => {
    if (score >= 4) return 'success'
    if (score >= 3) return 'warning'
    return 'error'
  }

  const getFortuneStars = (score: number) => {
    return '★'.repeat(score) + '☆'.repeat(5 - score)
  }

  // 统计数据
  const getStatistics = () => {
    const total = allHoroscopes.length
    const zodiacCount = allHoroscopes.filter(h => h.type === 'zodiac').length
    const animalCount = allHoroscopes.filter(h => h.type === 'birth_animal').length

    const avgOverall = allHoroscopes.length > 0
      ? (allHoroscopes.reduce((sum, h) => sum + h.overall_score, 0) / allHoroscopes.length).toFixed(1)
      : '0.0'

    const uniqueDates = new Set(allHoroscopes.map(h => h.date)).size

    return { total, zodiacCount, animalCount, avgOverall, uniqueDates }
  }

  // 日历视图的日期单元格
  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    const dayHoroscopes = allHoroscopes.filter(h => h.date === dateStr)

    if (dayHoroscopes.length === 0) return null

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayHoroscopes.slice(0, 3).map(h => (
          <li key={h.id}>
            <Badge
              status={h.type === 'zodiac' ? 'processing' : 'success'}
              text={`${h.type_value} ${getFortuneStars(h.overall_score)}`}
              style={{ fontSize: '12px' }}
            />
          </li>
        ))}
        {dayHoroscopes.length > 3 && (
          <li style={{ fontSize: '12px', color: '#999' }}>
            +{dayHoroscopes.length - 3} 更多
          </li>
        )}
      </ul>
    )
  }

  const columns: ColumnsType<DailyHoroscope> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color={type === 'zodiac' ? 'blue' : 'green'}>
          {type === 'zodiac' ? '星座' : '生肖'}
        </Tag>
      )
    },
    {
      title: '对象',
      dataIndex: 'type_value',
      key: 'type_value',
      width: 100
    },
    {
      title: '综合',
      dataIndex: 'overall_score',
      key: 'overall_score',
      width: 100,
      render: (score) => (
        <Tag color={getFortuneColor(score)}>
          {getFortuneStars(score)}
        </Tag>
      )
    },
    {
      title: '爱情',
      dataIndex: 'love_score',
      key: 'love_score',
      width: 80,
      render: (score) => getFortuneStars(score)
    },
    {
      title: '事业',
      dataIndex: 'career_score',
      key: 'career_score',
      width: 80,
      render: (score) => getFortuneStars(score)
    },
    {
      title: '财运',
      dataIndex: 'wealth_score',
      key: 'wealth_score',
      width: 80,
      render: (score) => getFortuneStars(score)
    },
    {
      title: '健康',
      dataIndex: 'health_score',
      key: 'health_score',
      width: 80,
      render: (score) => getFortuneStars(score)
    },
    {
      title: '幸运色',
      dataIndex: 'lucky_color',
      key: 'lucky_color',
      width: 80
    },
    {
      title: '幸运数字',
      dataIndex: 'lucky_number',
      key: 'lucky_number',
      width: 90
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
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
            onClick={() => handleCopy(record)}
          >
            复制
          </Button>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys)
    }
  }

  const stats = getStatistics()

  return (
    <div>
      <Tabs defaultActiveKey="list">
        <TabPane tab="列表视图" key="list">
          <Card
            title="每日运势管理"
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => setBatchGenModalVisible(true)}
                >
                  批量生成
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenModal()}
                >
                  创建运势
                </Button>
              </Space>
            }
          >
            {/* 筛选区 */}
            <Space style={{ marginBottom: 16 }} wrap>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                placeholder={['开始日期', '结束日期']}
              />

              <Select
                style={{ width: 120 }}
                placeholder="类型"
                allowClear
                value={typeFilter || undefined}
                onChange={setTypeFilter}
              >
                <Option value="zodiac">星座</Option>
                <Option value="birth_animal">生肖</Option>
              </Select>

              <Select
                style={{ width: 120 }}
                placeholder="对象"
                allowClear
                value={valueFilter || undefined}
                onChange={setValueFilter}
                disabled={!typeFilter}
              >
                {(typeFilter === 'zodiac' ? zodiacSigns : birthAnimals).map(item => (
                  <Option key={item} value={item}>{item}</Option>
                ))}
              </Select>

              {selectedRowKeys.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                >
                  批量删除 ({selectedRowKeys.length})
                </Button>
              )}
            </Space>

            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={horoscopes}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1500 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (page, pageSize) => {
                  fetchHoroscopes(page, pageSize)
                },
                onShowSizeChange: (current, size) => {
                  fetchHoroscopes(1, size)
                }
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="日历视图" key="calendar">
          <Card
            title="日历视图"
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenModal()}
                >
                  快速创建
                </Button>
              </Space>
            }
          >
            <Calendar
              cellRender={dateCellRender}
              onSelect={(date) => {
                const dateStr = date.format('YYYY-MM-DD')
                const dayHoroscopes = allHoroscopes.filter(h => h.date === dateStr)

                Modal.confirm({
                  title: `${dateStr} 运势管理`,
                  width: 800,
                  icon: <CalendarOutlined />,
                  content: (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Space>
                          <Tag color="blue">星座: {dayHoroscopes.filter(h => h.type === 'zodiac').length}/12</Tag>
                          <Tag color="green">生肖: {dayHoroscopes.filter(h => h.type === 'birth_animal').length}/12</Tag>
                        </Space>
                      </div>

                      {dayHoroscopes.length > 0 ? (
                        <Table
                          size="small"
                          dataSource={dayHoroscopes}
                          rowKey="id"
                          pagination={false}
                          scroll={{ y: 400 }}
                          columns={[
                            {
                              title: '类型',
                              dataIndex: 'type',
                              width: 80,
                              render: (type) => (
                                <Tag color={type === 'zodiac' ? 'blue' : 'green'}>
                                  {type === 'zodiac' ? '星座' : '生肖'}
                                </Tag>
                              )
                            },
                            {
                              title: '对象',
                              dataIndex: 'type_value',
                              width: 100
                            },
                            {
                              title: '综合运势',
                              dataIndex: 'overall_score',
                              width: 120,
                              render: (score) => (
                                <Tag color={getFortuneColor(score)}>
                                  {getFortuneStars(score)}
                                </Tag>
                              )
                            },
                            {
                              title: '操作',
                              width: 120,
                              render: (_, record) => (
                                <Space size="small">
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                      Modal.destroyAll()
                                      handleOpenModal(record)
                                    }}
                                  >
                                    编辑
                                  </Button>
                                  <Button
                                    type="link"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      Modal.destroyAll()
                                      handleDelete(record.id)
                                    }}
                                  >
                                    删除
                                  </Button>
                                </Space>
                              )
                            }
                          ]}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                          <CalendarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                          <div>该日期暂无运势数据</div>
                        </div>
                      )}
                    </div>
                  ),
                  okText: dayHoroscopes.length < 24 ? '批量生成该日运势' : '关闭',
                  cancelText: '添加单条运势',
                  onOk: () => {
                    if (dayHoroscopes.length < 24) {
                      // 打开批量生成弹窗，预填充当前日期
                      batchGenForm.setFieldsValue({
                        dateRange: [date, date],
                        types: ['zodiac', 'birth_animal']
                      })
                      setBatchGenModalVisible(true)
                    }
                  },
                  onCancel: () => {
                    // 打开创建弹窗，预填充当前日期
                    form.resetFields()
                    form.setFieldsValue({
                      date: date,
                      overall_score: 3,
                      love_score: 3,
                      career_score: 3,
                      wealth_score: 3,
                      health_score: 3
                    })
                    setModalVisible(true)
                  }
                })
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="数据统计" key="statistics">
          <Card title="数据统计仪表盘">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="总记录数" value={stats.total} />
              </Col>
              <Col span={6}>
                <Statistic title="星座运势" value={stats.zodiacCount} />
              </Col>
              <Col span={6}>
                <Statistic title="生肖运势" value={stats.animalCount} />
              </Col>
              <Col span={6}>
                <Statistic title="平均运势分" value={stats.avgOverall} suffix="/ 5" />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={6}>
                <Statistic title="覆盖日期数" value={stats.uniqueDates} suffix="天" />
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingHoroscope ? '编辑运势' : '创建运势'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Option value="zodiac">星座</Option>
              <Option value="birth_animal">生肖</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type')
              return (
                <Form.Item
                  name="type_value"
                  label={type === 'zodiac' ? '星座' : '生肖'}
                  rules={[{ required: true, message: '请选择对象' }]}
                >
                  <Select placeholder="请选择">
                    {(type === 'zodiac' ? zodiacSigns : birthAnimals).map(item => (
                      <Option key={item} value={item}>{item}</Option>
                    ))}
                  </Select>
                </Form.Item>
              )
            }}
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="overall_score"
              label="综合运势"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={5} style={{ width: 120 }} />
            </Form.Item>

            <Form.Item
              name="love_score"
              label="爱情运势"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={5} style={{ width: 120 }} />
            </Form.Item>

            <Form.Item
              name="career_score"
              label="事业运势"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={5} style={{ width: 120 }} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="wealth_score"
              label="财运"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={5} style={{ width: 120 }} />
            </Form.Item>

            <Form.Item
              name="health_score"
              label="健康运势"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={5} style={{ width: 120 }} />
            </Form.Item>
          </Space>

          <Form.Item name="overall_content" label="综合运势说明">
            <TextArea rows={2} placeholder="综合运势详细说明" />
          </Form.Item>

          <Form.Item name="love_content" label="爱情运势说明">
            <TextArea rows={2} placeholder="爱情运势详细说明" />
          </Form.Item>

          <Form.Item name="career_content" label="事业运势说明">
            <TextArea rows={2} placeholder="事业运势详细说明" />
          </Form.Item>

          <Form.Item name="wealth_content" label="财运说明">
            <TextArea rows={2} placeholder="财运详细说明" />
          </Form.Item>

          <Form.Item name="health_content" label="健康运势说明">
            <TextArea rows={2} placeholder="健康运势详细说明" />
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item name="lucky_color" label="幸运颜色">
              <Input placeholder="如：红色" style={{ width: 150 }} />
            </Form.Item>

            <Form.Item name="lucky_number" label="幸运数字">
              <Input placeholder="如：8" style={{ width: 150 }} />
            </Form.Item>

            <Form.Item name="lucky_direction" label="幸运方位">
              <Input placeholder="如：东南方" style={{ width: 150 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* 批量生成弹窗 */}
      <Modal
        title="批量生成运势"
        open={batchGenModalVisible}
        onOk={handleBatchGenerate}
        onCancel={() => setBatchGenModalVisible(false)}
        width={600}
      >
        <Form form={batchGenForm} layout="vertical">
          <Form.Item
            name="dateRange"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="types"
            label="生成类型"
            initialValue={['zodiac', 'birth_animal']}
          >
            <Checkbox.Group>
              <Checkbox value="zodiac">星座（12个）</Checkbox>
              <Checkbox value="birth_animal">生肖（12个）</Checkbox>
            </Checkbox.Group>
          </Form.Item>

          <div style={{ color: '#999', fontSize: '12px' }}>
            提示：系统将为选定日期范围内的每一天生成所选类型的运势数据，运势评分为随机3-5分。
          </div>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="运势详情"
        placement="right"
        width={600}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedHoroscope && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="日期">
              {dayjs(selectedHoroscope.date).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color={selectedHoroscope.type === 'zodiac' ? 'blue' : 'green'}>
                {selectedHoroscope.type === 'zodiac' ? '星座' : '生肖'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="对象">
              {selectedHoroscope.type_value}
            </Descriptions.Item>

            <Descriptions.Item label="综合运势">
              <Tag color={getFortuneColor(selectedHoroscope.overall_score)}>
                {getFortuneStars(selectedHoroscope.overall_score)}
              </Tag>
              <div style={{ marginTop: 8 }}>{selectedHoroscope.overall_content}</div>
            </Descriptions.Item>

            <Descriptions.Item label="爱情运势">
              {getFortuneStars(selectedHoroscope.love_score)}
              <div style={{ marginTop: 8 }}>{selectedHoroscope.love_content}</div>
            </Descriptions.Item>

            <Descriptions.Item label="事业运势">
              {getFortuneStars(selectedHoroscope.career_score)}
              <div style={{ marginTop: 8 }}>{selectedHoroscope.career_content}</div>
            </Descriptions.Item>

            <Descriptions.Item label="财运">
              {getFortuneStars(selectedHoroscope.wealth_score)}
              <div style={{ marginTop: 8 }}>{selectedHoroscope.wealth_content}</div>
            </Descriptions.Item>

            <Descriptions.Item label="健康运势">
              {getFortuneStars(selectedHoroscope.health_score)}
              <div style={{ marginTop: 8 }}>{selectedHoroscope.health_content}</div>
            </Descriptions.Item>

            <Descriptions.Item label="幸运颜色">
              {selectedHoroscope.lucky_color}
            </Descriptions.Item>

            <Descriptions.Item label="幸运数字">
              {selectedHoroscope.lucky_number}
            </Descriptions.Item>

            <Descriptions.Item label="幸运方位">
              {selectedHoroscope.lucky_direction}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default DailyHoroscopeManagement
