import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, DatePicker, Space, Button, message, Spin } from 'antd'
import {
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PermissionGuard from '../components/PermissionGuard'
import { Permission } from '../config/permissions'
import { getFinancialStats, getFinancialData } from '../services/apiService'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface FinancialStats {
  total_revenue: string
  today_revenue: string
  total_orders: string
  today_orders: string
  avg_order_value: number
  total_users: number
}

interface OrderFinancial {
  date: string
  revenue: string
  order_count: string
}

const FinancialManagement = () => {
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [financialData, setFinancialData] = useState<OrderFinancial[]>([])
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    loadFinancialData(pagination.current, pagination.pageSize)
  }, [dateRange])

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const response = await getFinancialStats()
      setStats(response.data)
    } catch (error: any) {
      message.error('加载财务统计失败')
      console.error('加载财务统计失败:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadFinancialData = async (page = 1, pageSize = 15) => {
    setLoading(true)
    try {
      const response = await getFinancialData({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        page,
        limit: pageSize
      })
      const data = response.data || []
      setFinancialData(Array.isArray(data) ? data : data.list || [])
      setPagination({
        current: page,
        pageSize,
        total: data.total || (Array.isArray(data) ? data.length : data.list?.length || 0),
      })
    } catch (error: any) {
      message.error('加载财务明细失败')
      console.error('加载财务明细失败:', error)
      setFinancialData([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    try {
      message.loading('正在导出...', 0)

      const csv = [
        ['日期', '收入金额', '订单数'].join(','),
        ...financialData.map((item) =>
          [
            item.date,
            Number(item.revenue).toFixed(2),
            item.order_count
          ].join(',')
        )
      ].join('\n')

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `financial_data_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
      link.click()

      message.destroy()
      message.success('导出成功')
    } catch (error) {
      message.destroy()
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<OrderFinancial> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      fixed: 'left',
    },
    {
      title: '收入金额',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 150,
      render: (value: string) => `¥${Number(value || 0).toFixed(2)}`,
      sorter: (a, b) => Number(a.revenue || 0) - Number(b.revenue || 0),
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 120,
      sorter: (a, b) => Number(a.order_count || 0) - Number(b.order_count || 0),
    },
    {
      title: '平均订单价值',
      key: 'avgValue',
      width: 150,
      render: (_, record) => {
        const revenue = Number(record.revenue || 0)
        const count = Number(record.order_count || 0)
        const avg = count > 0 ? revenue / count : 0
        return `¥${avg.toFixed(2)}`
      },
    },
  ]

  if (statsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!stats) {
    return <div>加载失败</div>
  }

  return (
    <PermissionGuard permission={Permission.STATS_VIEW}>
      <div>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总收入"
                value={Number(stats.total_revenue || 0)}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#3f8600' }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                今日：¥{Number(stats.today_revenue || 0).toFixed(2)}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总订单数"
                value={Number(stats.total_orders || 0)}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                今日：{Number(stats.today_orders || 0)} 单
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均订单价值"
                value={stats.avg_order_value || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats.total_users || 0}
                prefix={<UserOutlined />}
              />
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
              <Button icon={<ReloadOutlined />} onClick={() => {
                loadStats()
                loadFinancialData()
              }}>
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
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 条`,
              onChange: (page, pageSize) => {
                loadFinancialData(page, pageSize)
              },
              onShowSizeChange: (_, size) => {
                loadFinancialData(1, size)
              },
            }}
            scroll={{ x: 800 }}
            summary={(pageData) => {
              let totalRevenue = 0
              let totalOrders = 0

              pageData.forEach(({ revenue, order_count }) => {
                totalRevenue += Number(revenue || 0)
                totalOrders += Number(order_count || 0)
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
                      <strong>¥{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )
            }}
          />
        </Card>
      </div>
    </PermissionGuard>
  )
}

export default FinancialManagement
