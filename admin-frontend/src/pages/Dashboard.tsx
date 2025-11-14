import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Spin, message } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  RiseOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { getDashboardStats } from '../services/apiService'

interface DashboardStats {
  users: {
    total: number
    active: number
    inactive: number
  }
  orders: {
    total: number
    today: number
    completed: number
    pending: number
    cancelled: number
  }
  revenue: {
    total: number
    today: number
    average: number
    growthRate: number
  }
  fortuneTypes: Record<string, {
    count: number
    revenue: number
  }>
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await getDashboardStats()
      setStats(response.data)
    } catch (error: any) {
      message.error('加载统计数据失败')
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!stats) {
    return <div>加载失败</div>
  }

  // 计算热门功能数据（按订单数排序）
  const fortuneTypesArray = Object.entries(stats.fortuneTypes)
    .map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.count - a.count)

  const maxCount = fortuneTypesArray[0]?.count || 1

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>数据概览</h1>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.users.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              活跃: {stats.users.active} | 禁用: {stats.users.inactive}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={stats.orders.today}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              总订单: {stats.orders.total}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日收入"
              value={stats.revenue.today}
              prefix={<DollarOutlined />}
              suffix="元"
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              总收入: ¥{stats.revenue.total.toFixed(2)}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="增长率"
              value={stats.revenue.growthRate}
              prefix={<RiseOutlined />}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              平均订单: ¥{stats.revenue.average.toFixed(2)}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="热门功能" style={{ height: 400 }}>
            <div style={{ padding: 20 }}>
              {fortuneTypesArray.length > 0 ? (
                fortuneTypesArray.map((item, index) => {
                  const percentage = (item.count / maxCount) * 100
                  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
                  const color = colors[index % colors.length]

                  return (
                    <div key={item.name} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>{item.name}</span>
                        <span style={{ fontWeight: 'bold' }}>
                          {item.count}次 (¥{item.revenue.toFixed(2)})
                        </span>
                      </div>
                      <div style={{ background: '#f0f0f0', height: 8, borderRadius: 4 }}>
                        <div
                          style={{
                            background: color,
                            width: `${percentage}%`,
                            height: 8,
                            borderRadius: 4,
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '50px 0' }}>
                  暂无数据
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="订单统计" style={{ height: 400 }}>
            <Row gutter={16} style={{ padding: 20 }}>
              <Col span={12}>
                <Statistic
                  title="总订单"
                  value={stats.orders.total}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="已完成"
                  value={stats.orders.completed}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ padding: 20, marginTop: 20 }}>
              <Col span={12}>
                <Statistic
                  title="待处理"
                  value={stats.orders.pending}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="已取消"
                  value={stats.orders.cancelled}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 30, padding: '0 20px' }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>订单完成率</div>
              <div style={{ background: '#f0f0f0', height: 20, borderRadius: 10 }}>
                <div
                  style={{
                    background: '#52c41a',
                    width: `${stats.orders.total > 0 ? (stats.orders.completed / stats.orders.total) * 100 : 0}%`,
                    height: 20,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 12,
                  }}
                >
                  {stats.orders.total > 0
                    ? `${((stats.orders.completed / stats.orders.total) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
