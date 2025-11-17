/**
 * 客服绩效页面
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  DatePicker,
  Space,
  Select,
  Progress,
  message
} from 'antd';
import {
  TrophyOutlined,
  UserOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiService from '../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface TeamStats {
  totalAgents: number;
  activeAgents: number;
  totalSessions: number;
  avgSatisfactionRating: number;
  avgQualityScore: number;
  avgResponseTime: number;
  totalOnlineHours: number;
}

interface AgentRanking {
  agentId: number;
  displayName: string;
  rank: number;
  value: number;
  totalSessions: number;
}

const CSPerformance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [ranking, setRanking] = useState<AgentRanking[]>([]);
  const [rankBy, setRankBy] = useState<'sessions' | 'satisfaction' | 'quality' | 'response_time'>('sessions');
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]);

  useEffect(() => {
    fetchTeamStatistics();
    fetchRanking();
  }, [dateRange, rankBy]);

  const fetchTeamStatistics = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/cs/performance/team', {
        params: {
          startDate: dateRange[0],
          endDate: dateRange[1]
        }
      });
      setTeamStats(response.data.data || null);
    } catch (error) {
      message.error('加载团队统计失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/cs/performance/ranking', {
        params: {
          startDate: dateRange[0],
          endDate: dateRange[1],
          orderBy: rankBy
        }
      });
      setRanking(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      message.error('加载排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD')
      ]);
    }
  };

  const rankingColumns: ColumnsType<AgentRanking> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => {
        const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
        const icons = ['🥇', '🥈', '🥉'];
        return (
          <Space>
            {rank <= 3 && <span style={{ fontSize: '20px' }}>{icons[rank - 1]}</span>}
            <Tag color={rank <= 3 ? colors[rank - 1] : 'default'}>
              #{rank}
            </Tag>
          </Space>
        );
      }
    },
    {
      title: '客服',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <strong>{name}</strong>
        </Space>
      )
    },
    {
      title: getValueColumnTitle(),
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => (
        <strong style={{ color: '#1890ff', fontSize: '16px' }}>
          {formatValue(value)}
        </strong>
      )
    },
    {
      title: '总会话数',
      dataIndex: 'totalSessions',
      key: 'totalSessions'
    },
    {
      title: '绩效进度',
      key: 'progress',
      render: (record: AgentRanking) => {
        const maxValue = ranking[0]?.value || 1;
        const percent = Math.round((record.value / maxValue) * 100);
        return (
          <Progress
            percent={percent}
            size="small"
            status={record.rank <= 3 ? 'success' : 'normal'}
          />
        );
      }
    }
  ];

  function getValueColumnTitle() {
    switch (rankBy) {
      case 'sessions':
        return '接待量';
      case 'satisfaction':
        return '满意度';
      case 'quality':
        return '质检分数';
      case 'response_time':
        return '响应时间';
      default:
        return '指标值';
    }
  }

  function formatValue(value: number) {
    switch (rankBy) {
      case 'sessions':
        return `${value} 会话`;
      case 'satisfaction':
        return `${value.toFixed(2)} 星`;
      case 'quality':
        return `${value.toFixed(1)} 分`;
      case 'response_time':
        return `${Math.round(value)}秒`;
      default:
        return value;
    }
  }

  if (!teamStats) {
    return <Card loading={loading}>加载中...</Card>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 筛选条件 */}
        <Card>
          <Space size="large" wrap>
            <Space>
              <span>时间范围:</span>
              <RangePicker
                value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                presets={[
                  { label: '今天', value: [dayjs().startOf('day'), dayjs()] },
                  { label: '近7天', value: [dayjs().subtract(7, 'days'), dayjs()] },
                  { label: '近30天', value: [dayjs().subtract(30, 'days'), dayjs()] },
                  { label: '本月', value: [dayjs().startOf('month'), dayjs()] }
                ]}
              />
            </Space>
            <Space>
              <span>排行维度:</span>
              <Select value={rankBy} onChange={setRankBy} style={{ width: 150 }}>
                <Option value="sessions">接待量</Option>
                <Option value="satisfaction">满意度</Option>
                <Option value="quality">质检分数</Option>
                <Option value="response_time">响应时间</Option>
              </Select>
            </Space>
          </Space>
        </Card>

        {/* 团队总体数据 */}
        <Card title="团队总体数据">
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="总客服数"
                value={teamStats.totalAgents}
                prefix={<UserOutlined />}
                suffix={`(活跃 ${teamStats.activeAgents})`}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="总会话数"
                value={teamStats.totalSessions}
                prefix={<MessageOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="平均满意度"
                value={(teamStats.avgSatisfactionRating || 0).toFixed(2)}
                prefix={<StarOutlined />}
                suffix="/ 5.0"
                valueStyle={{ color: (teamStats.avgSatisfactionRating || 0) >= 4 ? '#52c41a' : '#faad14' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="平均响应时间"
                value={Math.round(teamStats.avgResponseTime || 0)}
                prefix={<ClockCircleOutlined />}
                suffix="秒"
                valueStyle={{ color: (teamStats.avgResponseTime || 0) <= 30 ? '#52c41a' : '#faad14' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 绩效排行榜 */}
        <Card
          title={
            <Space>
              <TrophyOutlined style={{ color: '#faad14', fontSize: '20px' }} />
              <span>客服绩效排行榜</span>
              <Tag color="blue">{getValueColumnTitle()}</Tag>
            </Space>
          }
        >
          <Table
            columns={rankingColumns}
            dataSource={ranking}
            rowKey="agentId"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`
            }}
            loading={loading}
          />
        </Card>

        {/* KPI达成情况 */}
        <Card title="KPI指标达成情况">
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card type="inner" title="满意度达标率">
                <Progress
                  type="circle"
                  percent={Math.round(((teamStats.avgSatisfactionRating || 0) / 5) * 100)}
                  format={(percent) => `${percent}%`}
                  strokeColor={(teamStats.avgSatisfactionRating || 0) >= 4 ? '#52c41a' : '#faad14'}
                />
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <div>目标: 4.0分以上</div>
                  <div>当前: {(teamStats.avgSatisfactionRating || 0).toFixed(2)}分</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card type="inner" title="质检合格率">
                <Progress
                  type="circle"
                  percent={Math.round(teamStats.avgQualityScore || 0)}
                  format={(percent) => `${percent}%`}
                  strokeColor={(teamStats.avgQualityScore || 0) >= 80 ? '#52c41a' : '#faad14'}
                />
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <div>目标: 80分以上</div>
                  <div>当前: {(teamStats.avgQualityScore || 0).toFixed(1)}分</div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default CSPerformance;
