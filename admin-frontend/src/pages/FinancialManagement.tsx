import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, DatePicker, Select, Space, Button } from 'antd'
import {
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  RiseOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { Permission } from '../config/permissions'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface FinancialStats {
  totalRevenue: number
  todayRevenue: number
  totalOrders: number
  todayOrders: number
  avgOrderValue: number
  totalUsers: number
}

interface OrderFinancial {
  date: string
  revenue: number
  orderCount: number
  refundAmount: number
  refundCount: number
}

const FinancialManagement = () => {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 156789.50,
    todayRevenue: 3245.80,
    totalOrders: 4523,
    todayOrders: 78,
    avgOrderValue: 34.67,
    totalUsers: 2341,
  })

  const [financialData, setFinancialData] = useState<OrderFinancial[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])

  useEffect(() => {
    loadFinancialData()
  }, [dateRange])

  const loadFinancialData = () => {
    setLoading(true)
    // Mock data - replace with actual API call
    const mockData: OrderFinancial[] = []
    for (let i = 29; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day')
      mockData.push({
        date: date.format('YYYY-MM-DD'),
        revenue: Math.random() * 5000 + 1000,
        orderCount: Math.floor(Math.random() * 100 + 20),
        refundAmount: Math.random() * 300,
        refundCount: Math.floor(Math.random() * 5),
      })
    }
    setFinancialData(mockData)
    setLoading(false)
  }

  const handleExport = () => {
    // Export logic
    console.log('Exporting financial data...')
  }

  const columns: ColumnsType<OrderFinancial> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      fixed: 'left',
    },
    {
      title: '收入金额',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 100,
      sorter: (a, b) => a.orderCount - b.orderCount,
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 120,
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a, b) => a.refundAmount - b.refundAmount,
    },
    {
      title: '退款笔数',
      dataIndex: 'refundCount',
      key: 'refundCount',
      width: 100,
      sorter: (a, b) => a.refundCount - b.refundCount,
    },
    {
      title: '净收入',
      key: 'netRevenue',
      width: 120,
      render: (_, record) => `¥${(record.revenue - record.refundAmount).toFixed(2)}`,
      sorter: (a, b) => (a.revenue - a.refundAmount) - (b.revenue - b.refundAmount),
    },
    {
      title: '平均订单价值',
      key: 'avgValue',
      width: 120,
      render: (_, record) => `¥${(record.revenue / record.orderCount).toFixed(2)}`,
    },
  ]

  return (
    <PermissionGuard permission={Permission.STATS_VIEW}>
      <div>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总收入"
                value={stats.totalRevenue}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#3f8600' }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                今日：¥{stats.todayRevenue.toFixed(2)}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总订单数"
                value={stats.totalOrders}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                今日：{stats.todayOrders} 单
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均订单价值"
                value={stats.avgOrderValue}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#cf1322' }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                <RiseOutlined /> 较昨日 +5.2%
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                今日新增：23 人
              </div>
            </Card>
          </Col>
        </Row>

        {/* 财务明细表 */}
        <Card
          title="财务明细"
          extra={
            <Space>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]])
                  }
                }}
              />
              <Button icon={<ReloadOutlined />} onClick={loadFinancialData}>
                刷新
              </Button>
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                导出
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={financialData}
            loading={loading}
            rowKey="date"
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: total => `共 ${total} 条`,
            }}
            scroll={{ x: 800 }}
            summary={(pageData) => {
              let totalRevenue = 0
              let totalOrders = 0
              let totalRefund = 0

              pageData.forEach(({ revenue, orderCount, refundAmount }) => {
                totalRevenue += revenue
                totalOrders += orderCount
                totalRefund += refundAmount
              })

              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <strong>¥{totalRevenue.toFixed(2)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <strong>{totalOrders}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <strong>¥{totalRefund.toFixed(2)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                    <Table.Summary.Cell index={5}>
                      <strong>¥{(totalRevenue - totalRefund).toFixed(2)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} />
                  </Table.Summary.Row>
                </Table.Summary>
              )
            }}
          />
        </Card>

        {/* 分类收入统计 */}
        <Card title="算命类型收入占比" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="八字精批" value={45620} prefix="¥" suffix="(29.1%)" />
            </Col>
            <Col span={8}>
              <Statistic title="生肖运势" value={38450} prefix="¥" suffix="(24.5%)" />
            </Col>
            <Col span={8}>
              <Statistic title="流年运势" value={32890} prefix="¥" suffix="(21.0%)" />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Statistic title="姓名详批" value={25430} prefix="¥" suffix="(16.2%)" />
            </Col>
            <Col span={8}>
              <Statistic title="婚姻分析" value={14399} prefix="¥" suffix="(9.2%)" />
            </Col>
          </Row>
        </Card>
      </div>
    </PermissionGuard>
  )
}

export default FinancialManagement
