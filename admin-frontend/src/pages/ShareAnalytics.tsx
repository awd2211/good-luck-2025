import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Table,
  Tag,
  Spin,
  message,
  Tabs
} from 'antd';
import {
  ShareAltOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  GlobalOutlined,
  MobileOutlined,
  ClockCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import * as echarts from 'echarts';
import api from '../services/api';
import { getUsers } from '../services/userService';
import type { EChartsOption } from 'echarts';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface OverviewStats {
  total_shares: number;
  total_share_events: number;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
}

interface ChannelData {
  platform: string;
  share_count: number;
  unique_sharers: number;
}

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  percentage: number;
  dropRate: number;
}

interface GeoData {
  country: string;
  city: string;
  click_count: number;
  unique_visitors: number;
  avg_lat: number;
  avg_lng: number;
}

interface DeviceData {
  devices: Array<{ device_type: string; count: number; percentage: number }>;
  browsers: Array<{ browser: string; count: number; percentage: number }>;
  os: Array<{ os: string; count: number; percentage: number }>;
}

interface TrendData {
  date: string;
  shares: number;
  clicks: number;
  conversions: number;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_shares: number;
  total_clicks: number;
  total_conversions: number;
  rank: number;
}

const ShareAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [funnel, setFunnel] = useState<{ funnel: FunnelStage[]; totalConversionRate: number } | null>(null);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [userList, setUserList] = useState<Array<{ id: string; username: string; phone: string }>>([]);

  // 加载总览数据
  const loadOverview = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedUser) params.append('userId', selectedUser);
      if (dateRange) {
        params.append('startDate', dateRange[0]);
        params.append('endDate', dateRange[1]);
      }

      const response = await api.get(`/share-analytics/overview?${params}`);
      setOverview(response.data.overview || null);
      setChannels(Array.isArray(response.data.channels) ? response.data.channels : []);
    } catch (error) {
      message.error('加载总览数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载转化漏斗
  const loadFunnel = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedUser) params.append('userId', selectedUser);
      if (dateRange) {
        params.append('startDate', dateRange[0]);
        params.append('endDate', dateRange[1]);
      }

      const response = await api.get(`/share-analytics/funnel?${params}`);
      setFunnel(response.data || null);
    } catch (error) {
      console.error('加载转化漏斗失败:', error);
    }
  };

  // 加载地理位置数据
  const loadGeoData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedUser) params.append('userId', selectedUser);

      const response = await api.get(`/share-analytics/geo?${params}`);
      setGeoData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('加载地理数据失败:', error);
    }
  };

  // 加载设备数据
  const loadDeviceData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedUser) params.append('userId', selectedUser);

      const response = await api.get(`/share-analytics/devices?${params}`);
      setDeviceData(response.data || null);
    } catch (error) {
      console.error('加载设备数据失败:', error);
    }
  };

  // 加载时间趋势
  const loadTrends = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedUser) params.append('userId', selectedUser);
      params.append('days', '30');

      const response = await api.get(`/share-analytics/trends?${params}`);
      setTrends(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    }
  };

  // 加载排行榜
  const loadLeaderboard = async () => {
    try {
      const response = await api.get('/share-analytics/leaderboard?limit=100');
      setLeaderboard(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('加载排行榜失败:', error);
    }
  };

  // 加载用户列表（用于筛选）
  const loadUserList = async () => {
    try {
      const response = await getUsers({ page: 1, limit: 1000 });
      const users = response.data.data || [];
      setUserList(users.map((u: any) => ({
        id: u.id,
        username: u.username || u.phone,
        phone: u.phone
      })));
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  };

  useEffect(() => {
    loadOverview();
    loadFunnel();
    loadGeoData();
    loadDeviceData();
    loadTrends();
    loadLeaderboard();
    loadUserList(); // 加载用户列表
  }, [dateRange, selectedUser]);

  // 渲染渠道分布图表
  useEffect(() => {
    if (channels.length > 0) {
      const chartDom = document.getElementById('channel-chart');
      if (!chartDom) return;

      const myChart = echarts.init(chartDom);
      const option: EChartsOption = {
        title: {
          text: '分享渠道分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '分享次数',
            type: 'pie',
            radius: '50%',
            data: channels.map(c => ({
              value: c.share_count,
              name: c.platform
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
      };

      myChart.setOption(option);

      return () => {
        myChart.dispose();
      };
    }
  }, [channels]);

  // 渲染转化漏斗图表
  useEffect(() => {
    if (funnel) {
      const chartDom = document.getElementById('funnel-chart');
      if (!chartDom) return;

      const myChart = echarts.init(chartDom);
      const option: EChartsOption = {
        title: {
          text: '转化漏斗',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        series: [
          {
            name: '转化漏斗',
            type: 'funnel',
            left: '10%',
            top: 60,
            bottom: 60,
            width: '80%',
            min: 0,
            max: 100,
            minSize: '0%',
            maxSize: '100%',
            sort: 'descending',
            gap: 2,
            label: {
              show: true,
              position: 'inside',
              formatter: '{b}: {c}\n({d}%)'
            },
            labelLine: {
              length: 10,
              lineStyle: {
                width: 1,
                type: 'solid'
              }
            },
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 1
            },
            emphasis: {
              label: {
                fontSize: 20
              }
            },
            data: (funnel.funnel || []).map(stage => ({
              value: stage.count,
              name: stage.label
            }))
          }
        ]
      };

      myChart.setOption(option);

      return () => {
        myChart.dispose();
      };
    }
  }, [funnel]);

  // 渲染时间趋势图表
  useEffect(() => {
    if (trends.length > 0) {
      const chartDom = document.getElementById('trend-chart');
      if (!chartDom) return;

      const myChart = echarts.init(chartDom);
      const option: EChartsOption = {
        title: {
          text: '分享趋势（近30天）',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['分享', '点击', '转化'],
          top: 30
        },
        xAxis: {
          type: 'category',
          data: trends.map(t => t.date),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '分享',
            type: 'line',
            data: trends.map(t => t.shares),
            smooth: true
          },
          {
            name: '点击',
            type: 'line',
            data: trends.map(t => t.clicks),
            smooth: true
          },
          {
            name: '转化',
            type: 'line',
            data: trends.map(t => t.conversions),
            smooth: true
          }
        ]
      };

      myChart.setOption(option);

      return () => {
        myChart.dispose();
      };
    }
  }, [trends]);

  // 渲染设备分布图表
  useEffect(() => {
    if (deviceData) {
      const chartDom = document.getElementById('device-chart');
      if (!chartDom) return;

      const myChart = echarts.init(chartDom);
      const option: EChartsOption = {
        title: {
          text: '设备类型分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        series: [
          {
            name: '设备类型',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: (deviceData.devices || []).map(d => ({
              value: d.count,
              name: d.device_type
            }))
          }
        ]
      };

      myChart.setOption(option);

      return () => {
        myChart.dispose();
      };
    }
  }, [deviceData]);

  // 排行榜列
  const leaderboardColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => {
        if (rank === 1) return <Tag color="gold">🥇 {rank}</Tag>;
        if (rank === 2) return <Tag color="silver">🥈 {rank}</Tag>;
        if (rank === 3) return <Tag color="bronze">🥉 {rank}</Tag>;
        return rank;
      }
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '分享次数',
      dataIndex: 'total_shares',
      key: 'total_shares',
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => a.total_shares - b.total_shares
    },
    {
      title: '点击次数',
      dataIndex: 'total_clicks',
      key: 'total_clicks',
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => a.total_clicks - b.total_clicks
    },
    {
      title: '转化次数',
      dataIndex: 'total_conversions',
      key: 'total_conversions',
      sorter: (a: LeaderboardEntry, b: LeaderboardEntry) => a.total_conversions - b.total_conversions
    },
    {
      title: '转化率',
      key: 'conversion_rate',
      render: (record: LeaderboardEntry) => {
        const rate = record.total_clicks > 0
          ? ((record.total_conversions / record.total_clicks) * 100).toFixed(2)
          : 0;
        return `${rate}%`;
      }
    }
  ];

  // 地理位置列
  const geoColumns = [
    {
      title: '国家',
      dataIndex: 'country',
      key: 'country'
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city'
    },
    {
      title: '点击次数',
      dataIndex: 'click_count',
      key: 'click_count',
      sorter: (a: GeoData, b: GeoData) => a.click_count - b.click_count
    },
    {
      title: '独立访客',
      dataIndex: 'unique_visitors',
      key: 'unique_visitors',
      sorter: (a: GeoData, b: GeoData) => a.unique_visitors - b.unique_visitors
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>
        <ShareAltOutlined /> 分享统计分析
      </h1>

      {/* 筛选条件 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={12}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates, dateStrings) => {
                if (dates) {
                  setDateRange([dateStrings[0], dateStrings[1]]);
                } else {
                  setDateRange(null);
                }
              }}
            />
          </Col>
          <Col span={12}>
            <Select
              placeholder="选择用户（可选）"
              allowClear
              showSearch
              style={{ width: '100%' }}
              onChange={(value) => setSelectedUser(value)}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={userList.map(user => ({
                value: user.id,
                label: `${user.username} (${user.phone})`
              }))}
            />
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {/* 总览统计卡片 */}
        {overview && (
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总分享次数"
                  value={overview.total_share_events}
                  prefix={<ShareAltOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总点击次数"
                  value={overview.total_clicks}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总转化次数"
                  value={overview.total_conversions}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="转化率"
                  value={overview.conversion_rate}
                  suffix="%"
                  prefix={<RiseOutlined />}
                  precision={2}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Tabs切换不同分析视图 */}
        <Tabs defaultActiveKey="1">
          {/* 渠道分析 */}
          <TabPane tab={<span><GlobalOutlined /> 渠道分析</span>} key="1">
            <Row gutter={16}>
              <Col span={12}>
                <Card>
                  <div id="channel-chart" style={{ width: '100%', height: '400px' }}></div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="渠道详情">
                  <Table
                    dataSource={channels}
                    columns={[
                      { title: '平台', dataIndex: 'platform', key: 'platform' },
                      { title: '分享次数', dataIndex: 'share_count', key: 'share_count' },
                      { title: '独立分享者', dataIndex: 'unique_sharers', key: 'unique_sharers' }
                    ]}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 转化漏斗 */}
          <TabPane tab={<span><RiseOutlined /> 转化漏斗</span>} key="2">
            <Card>
              <div id="funnel-chart" style={{ width: '100%', height: '500px' }}></div>
              {funnel && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <h3>总体转化率: {funnel.totalConversionRate || 0}%</h3>
                </div>
              )}
            </Card>
          </TabPane>

          {/* 时间趋势 */}
          <TabPane tab={<span><ClockCircleOutlined /> 时间趋势</span>} key="3">
            <Card>
              <div id="trend-chart" style={{ width: '100%', height: '400px' }}></div>
            </Card>
          </TabPane>

          {/* 设备分析 */}
          <TabPane tab={<span><MobileOutlined /> 设备分析</span>} key="4">
            <Row gutter={16}>
              <Col span={12}>
                <Card>
                  <div id="device-chart" style={{ width: '100%', height: '400px' }}></div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="浏览器分布">
                  {deviceData && (
                    <Table
                      dataSource={deviceData.browsers || []}
                      columns={[
                        { title: '浏览器', dataIndex: 'browser', key: 'browser' },
                        { title: '数量', dataIndex: 'count', key: 'count' },
                        { title: '占比', dataIndex: 'percentage', key: 'percentage', render: (val: number) => `${val}%` }
                      ]}
                      pagination={false}
                      size="small"
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 地理位置 */}
          <TabPane tab={<span><GlobalOutlined /> 地理分布</span>} key="5">
            <Card>
              <Table
                dataSource={geoData}
                columns={geoColumns}
                pagination={{ pageSize: 20 }}
              />
            </Card>
          </TabPane>

          {/* 排行榜 */}
          <TabPane tab={<span><TrophyOutlined /> 分享排行榜</span>} key="6">
            <Card>
              <Table
                dataSource={leaderboard}
                columns={leaderboardColumns}
                pagination={{ pageSize: 20 }}
                rowKey="user_id"
              />
            </Card>
          </TabPane>
        </Tabs>
      </Spin>
    </div>
  );
};

export default ShareAnalytics;
