import { useState, useEffect } from 'react'
import { Card, Row, Col, Space, Button, Select, message, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import PermissionGuard from '../components/PermissionGuard'
import { Permission } from '../config/permissions'
import {
  getRevenueTrend,
  getUserGrowthTrend,
  getFortuneTypeDistribution,
  getDashboardStats
} from '../services/statsService'
import type { RevenueTrend, UserGrowthTrend, FortuneTypeDistribution } from '../services/statsService'

const Statistics = () => {
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([])
  const [userGrowth, setUserGrowth] = useState<UserGrowthTrend[]>([])
  const [fortuneDistribution, setFortuneDistribution] = useState<FortuneTypeDistribution[]>([])
  const [orderStats, setOrderStats] = useState<any>(null)

  useEffect(() => {
    loadAllData()
  }, [days])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [revenueRes, userRes, fortuneRes, statsRes] = await Promise.all([
        getRevenueTrend(days),
        getUserGrowthTrend(days),
        getFortuneTypeDistribution(),
        getDashboardStats()
      ])

      setRevenueTrend(revenueRes.data.data || [])
      setUserGrowth(userRes.data.data || [])
      setFortuneDistribution(fortuneRes.data.data || [])
      setOrderStats(statsRes.data.data?.orders || null)
    } catch (error: any) {
      message.error('加载统计数据失败')
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 收入趋势图配置
  const revenueChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['收入金额', '订单数量']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: revenueTrend.map(item => dayjs(item.date).format('MM-DD'))
    },
    yAxis: [
      {
        type: 'value',
        name: '收入(元)',
        position: 'left',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      {
        type: 'value',
        name: '订单数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '收入金额',
        type: 'line',
        yAxisIndex: 0,
        data: revenueTrend.map(item => Number(item.revenue || 0)),
        smooth: true,
        areaStyle: {
          opacity: 0.3
        },
        itemStyle: {
          color: '#1890ff'
        }
      },
      {
        name: '订单数量',
        type: 'line',
        yAxisIndex: 1,
        data: revenueTrend.map(item => Number(item.order_count || 0)),
        smooth: true,
        itemStyle: {
          color: '#52c41a'
        }
      }
    ]
  }

  // 用户增长图配置
  const userGrowthChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['新增用户', '总用户数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: userGrowth.map(item => dayjs(item.date).format('MM-DD'))
    },
    yAxis: [
      {
        type: 'value',
        name: '新增用户',
        position: 'left'
      },
      {
        type: 'value',
        name: '总用户数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '新增用户',
        type: 'bar',
        yAxisIndex: 0,
        data: userGrowth.map(item => Number(item.new_users || 0)),
        itemStyle: {
          color: '#faad14'
        }
      },
      {
        name: '总用户数',
        type: 'line',
        yAxisIndex: 1,
        data: userGrowth.map(item => Number(item.total_users || 0)),
        smooth: true,
        itemStyle: {
          color: '#722ed1'
        }
      }
    ]
  }

  // 功能使用占比饼图配置
  const fortunePieChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '使用次数',
        type: 'pie',
        radius: '50%',
        data: fortuneDistribution.map(item => ({
          value: Number(item.count || 0),
          name: item.type
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  // 订单状态分布柱状图配置
  const orderStatusChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['总订单', '已完成', '待处理', '已取消']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: [
          { value: orderStats?.total || 0, itemStyle: { color: '#1890ff' } },
          { value: orderStats?.completed || 0, itemStyle: { color: '#52c41a' } },
          { value: orderStats?.pending || 0, itemStyle: { color: '#faad14' } },
          { value: orderStats?.cancelled || 0, itemStyle: { color: '#f5222d' } }
        ],
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <PermissionGuard permission={Permission.STATS_VIEW}>
      <div>
        <Card
          title="统计分析"
          extra={
            <Space>
              <Select
                value={days}
                onChange={setDays}
                style={{ width: 120 }}
              >
                <Select.Option value={7}>最近7天</Select.Option>
                <Select.Option value={15}>最近15天</Select.Option>
                <Select.Option value={30}>最近30天</Select.Option>
                <Select.Option value={90}>最近90天</Select.Option>
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadAllData}
              >
                刷新
              </Button>
            </Space>
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <Card type="inner" title="收入趋势">
                <ReactECharts
                  option={revenueChartOption}
                  style={{ height: 300 }}
                  notMerge={true}
                  lazyUpdate={true}
                  opts={{ renderer: 'svg' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card type="inner" title="用户增长">
                <ReactECharts
                  option={userGrowthChartOption}
                  style={{ height: 300 }}
                  notMerge={true}
                  lazyUpdate={true}
                  opts={{ renderer: 'svg' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Card type="inner" title="功能使用占比">
                {fortuneDistribution.length > 0 ? (
                  <ReactECharts
                    option={fortunePieChartOption}
                    style={{ height: 300 }}
                    notMerge={true}
                    lazyUpdate={true}
                    opts={{ renderer: 'svg' }}
                  />
                ) : (
                  <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    暂无数据
                  </div>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card type="inner" title="订单状态分布">
                {orderStats ? (
                  <ReactECharts
                    option={orderStatusChartOption}
                    style={{ height: 300 }}
                    notMerge={true}
                    lazyUpdate={true}
                    opts={{ renderer: 'svg' }}
                  />
                ) : (
                  <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    暂无数据
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </PermissionGuard>
  )
}

export default Statistics
