import { Row, Col, Card, Statistic } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  RiseOutlined,
  DollarOutlined,
} from '@ant-design/icons'

const Dashboard = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>数据概览</h1>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={1128}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={93}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日收入"
              value={9280}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="增长率"
              value={11.28}
              prefix={<RiseOutlined />}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="热门功能" style={{ height: 400 }}>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>🐉 生肖运势</span>
                  <span style={{ fontWeight: 'bold' }}>356次</span>
                </div>
                <div style={{ background: '#f0f0f0', height: 8, borderRadius: 4 }}>
                  <div style={{ background: '#1890ff', width: '85%', height: 8, borderRadius: 4 }} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>📖 八字精批</span>
                  <span style={{ fontWeight: 'bold' }}>298次</span>
                </div>
                <div style={{ background: '#f0f0f0', height: 8, borderRadius: 4 }}>
                  <div style={{ background: '#52c41a', width: '71%', height: 8, borderRadius: 4 }} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>📅 流年运势</span>
                  <span style={{ fontWeight: 'bold' }}>234次</span>
                </div>
                <div style={{ background: '#f0f0f0', height: 8, borderRadius: 4 }}>
                  <div style={{ background: '#faad14', width: '56%', height: 8, borderRadius: 4 }} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>✍️ 姓名详批</span>
                  <span style={{ fontWeight: 'bold' }}>187次</span>
                </div>
                <div style={{ background: '#f0f0f0', height: 8, borderRadius: 4 }}>
                  <div style={{ background: '#f5222d', width: '45%', height: 8, borderRadius: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>💑 婚姻分析</span>
                  <span style={{ fontWeight: 'bold' }}>153次</span>
                </div>
                <div style={{ background: '#f0f0f0', height: 8, borderRadius: 4 }}>
                  <div style={{ background: '#722ed1', width: '37%', height: 8, borderRadius: 4 }} />
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="最近活动" style={{ height: 400, overflow: 'auto' }}>
            {[
              { time: '10:23', user: '张三', action: '完成了生肖运势测算' },
              { time: '10:18', user: '李四', action: '完成了八字精批测算' },
              { time: '10:12', user: '王五', action: '完成了婚姻分析测算' },
              { time: '10:05', user: '赵六', action: '完成了姓名详批测算' },
              { time: '09:58', user: '孙七', action: '完成了流年运势测算' },
              { time: '09:45', user: '周八', action: '完成了生肖运势测算' },
              { time: '09:32', user: '吴九', action: '完成了八字精批测算' },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontWeight: 'bold', marginRight: 8 }}>{item.user}</span>
                  <span style={{ color: '#888' }}>{item.action}</span>
                </div>
                <span style={{ color: '#999' }}>{item.time}</span>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
