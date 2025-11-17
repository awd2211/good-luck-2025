/**
 * 客服满意度统计页面
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
  Tooltip,
  Progress,
  message
} from 'antd';
import {
  SmileOutlined,
  FrownOutlined,
  StarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiService from '../services/api';

const { RangePicker } = DatePicker;

interface SatisfactionStats {
  totalRatings: number;
  avgRating: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  satisfactionRate: number;
  topRatedAgents: Array<{
    agentId: number;
    displayName: string;
    avgRating: number;
    count: number;
  }>;
  lowRatedSessions: Array<{
    sessionId: number;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;
}

interface TagStat {
  tag: string;
  count: number;
}

const CSSatisfactionStatistics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SatisfactionStats | null>(null);
  const [tags, setTags] = useState<TagStat[]>([]);
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]);

  useEffect(() => {
    fetchStatistics();
    fetchTagStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/cs/satisfaction/stats', {
        params: {
          startDate: dateRange[0],
          endDate: dateRange[1]
        }
      });
      setStats(response.data.data || null);
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTagStatistics = async () => {
    try {
      const response = await apiService.get('/cs/satisfaction/tags', {
        params: {
          startDate: dateRange[0],
          endDate: dateRange[1]
        }
      });
      setTags(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('加载标签统计失败', error);
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

  const topAgentsColumns: ColumnsType<any> = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => {
        const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
        return (
          <Tag color={colors[index] || 'default'}>
            {index + 1}
          </Tag>
        );
      }
    },
    {
      title: '客服',
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: (a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'zh-CN'),
    },
    {
      title: '平均评分',
      dataIndex: 'avgRating',
      key: 'avgRating',
      sorter: (a, b) => (a.avgRating || 0) - (b.avgRating || 0),
      defaultSortOrder: 'descend',
      render: (rating: number) => (
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <span>{rating.toFixed(2)}</span>
        </Space>
      )
    },
    {
      title: '评价数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => (a.count || 0) - (b.count || 0),
    },
    {
      title: '评分进度',
      key: 'progress',
      render: (record: any) => (
        <Progress
          percent={Math.round((record.avgRating / 5) * 100)}
          size="small"
          status={record.avgRating >= 4.5 ? 'success' : 'normal'}
        />
      )
    }
  ];

  const lowRatedColumns: ColumnsType<any> = [
    {
      title: '会话ID',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 100,
      sorter: (a, b) => (a.sessionId || 0) - (b.sessionId || 0),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 80,
      sorter: (a, b) => (a.rating || 0) - (b.rating || 0),
      render: (rating: number) => (
        <Tag color={rating <= 2 ? 'red' : 'orange'}>
          {rating} 星
        </Tag>
      )
    },
    {
      title: '评价内容',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: {
        showTitle: false
      },
      sorter: (a, b) => (a.comment || '').localeCompare(b.comment || '', 'zh-CN'),
      render: (comment: string) => (
        <Tooltip placement="topLeft" title={comment}>
          {comment || '无'}
        </Tooltip>
      )
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: (a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      },
      defaultSortOrder: 'descend',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    }
  ];

  if (!stats) {
    return <Card loading={loading}>加载中...</Card>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 日期筛选 */}
        <Card>
          <Space>
            <span>时间范围:</span>
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
            />
          </Space>
        </Card>

        {/* 总体统计 */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总评价数"
                value={stats.totalRatings}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="平均评分"
                value={stats.avgRating.toFixed(2)}
                prefix={<StarOutlined />}
                suffix="/ 5.0"
                valueStyle={{ color: stats.avgRating >= 4 ? '#52c41a' : '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="满意率"
                value={stats.satisfactionRate.toFixed(1)}
                prefix={<SmileOutlined />}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                (4-5星占比)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="低分评价"
                value={stats.oneStarCount + stats.twoStarCount}
                prefix={<FrownOutlined />}
                valueStyle={{ color: stats.oneStarCount + stats.twoStarCount > 0 ? '#ff4d4f' : '#999' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 评分分布 */}
        <Card title="评分分布">
          <Row gutter={16}>
            <Col span={24}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats[`${['', '', '', '', 'one', 'two', 'three', 'four', 'five'][star]}StarCount` as keyof SatisfactionStats] as number;
                  const percent = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
                  return (
                    <div key={star}>
                      <Row align="middle">
                        <Col span={2}>
                          <Tag color={star >= 4 ? 'green' : star === 3 ? 'orange' : 'red'}>
                            {star}★
                          </Tag>
                        </Col>
                        <Col span={18}>
                          <Progress
                            percent={Math.round(percent * 10) / 10}
                            strokeColor={star >= 4 ? '#52c41a' : star === 3 ? '#faad14' : '#ff4d4f'}
                          />
                        </Col>
                        <Col span={4} style={{ textAlign: 'right' }}>
                          <span>{count} 条</span>
                        </Col>
                      </Row>
                    </div>
                  );
                })}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Top客服排行 */}
        <Card title="客服评分排行榜 Top 10">
          <Table
            columns={topAgentsColumns}
            dataSource={stats.topRatedAgents}
            rowKey="agentId"
            pagination={false}
            loading={loading}
          />
        </Card>

        {/* 评价标签统计 */}
        {tags.length > 0 && (
          <Card title="热门评价标签">
            <Space size="middle" wrap>
              {tags.map((tag) => (
                <Tag
                  key={tag.tag}
                  color="blue"
                  style={{ fontSize: '14px', padding: '4px 12px' }}
                >
                  {tag.tag} ({tag.count})
                </Tag>
              ))}
            </Space>
          </Card>
        )}

        {/* 低分会话 */}
        {stats.lowRatedSessions.length > 0 && (
          <Card title="低分会话记录 (需要关注)">
            <Table
              columns={lowRatedColumns}
              dataSource={stats.lowRatedSessions}
              rowKey="sessionId"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default CSSatisfactionStatistics;
