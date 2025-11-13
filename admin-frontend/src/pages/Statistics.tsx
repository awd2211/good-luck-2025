import { Card, Row, Col, DatePicker, Space } from 'antd'
import dayjs from 'dayjs'
import PermissionGuard from '../components/PermissionGuard'
import { Permission } from '../config/permissions'

const { RangePicker } = DatePicker

const Statistics = () => {
  return (
    <PermissionGuard permission={Permission.STATS_VIEW}>
      <div>
        <Card
        title="统计分析"
        extra={
          <Space>
            <RangePicker
              defaultValue={[dayjs().subtract(7, 'day'), dayjs()]}
            />
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card type="inner" title="收入趋势">
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                图表区域（可集成 ECharts 或 Recharts）
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card type="inner" title="用户增长">
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                图表区域（可集成 ECharts 或 Recharts）
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card type="inner" title="功能使用占比">
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                饼图区域（可集成 ECharts 或 Recharts）
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card type="inner" title="订单状态分布">
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                柱状图区域（可集成 ECharts 或 Recharts）
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
    </PermissionGuard>
  )
}

export default Statistics
