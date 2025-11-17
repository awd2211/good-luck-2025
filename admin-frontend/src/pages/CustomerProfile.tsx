import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Select, Button, Modal, Descriptions, Tag, Timeline, Statistic, Row, Col, Progress, Badge, Tabs, Space, message } from 'antd';
import { UserOutlined, CrownOutlined, WarningOutlined, SearchOutlined, StarOutlined } from '@ant-design/icons';
import apiService from '../services/api';

const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

interface CustomerProfile {
  user_id: string;
  total_sessions: number;
  total_messages: number;
  avg_satisfaction_rating?: number;
  last_contact_at?: string;
  preferred_agent_name?: string;
  vip_level: number;
  risk_score: number;
  lifetime_value: number;
  notes_count: number;
  created_at: string;
}

const CustomerProfile: React.FC = () => {
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [vipFilter, setVipFilter] = useState<number | undefined>(undefined);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    loadProfiles();
    loadStatistics();
  }, [vipFilter]);

  const loadProfiles = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (vipFilter !== undefined) {
        params.vipLevel = vipFilter;
      }

      const response = await apiService.get('/customer-profiles', { params });
      const data = (response.data as any).data || response.data;
      const paginationData = (response.data as any).pagination;

      setProfiles(data);
      if (paginationData) {
        setPagination(prev => ({
          ...prev,
          current: page,
          total: paginationData.totalPages * limit
        }));
      }
    } catch (error) {
      message.error('加载客户画像失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await apiService.get('/customer-profiles/statistics/overview');
      setStatistics(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadProfileDetail = async (userId: string) => {
    try {
      setLoading(true);
      const response = await apiService.get(`/customer-profiles/${userId}`);
      setSelectedProfile(response.data.data || response.data);
      setDetailModalVisible(true);
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      loadProfiles();
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.get('/customer-profiles/search/query', {
        params: { keyword }
      });
      setProfiles(response.data.data || response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const getVipTag = (level: number) => {
    const vipColors = ['default', 'blue', 'cyan', 'green', 'gold', 'red'];
    const vipNames = ['普通', 'VIP1', 'VIP2', 'VIP3', 'VIP4', 'VIP5'];
    return (
      <Tag color={vipColors[level]} icon={level > 0 ? <CrownOutlined /> : undefined}>
        {vipNames[level] || '普通'}
      </Tag>
    );
  };

  const getRiskTag = (score: number) => {
    if (score < 30) return <Tag color="green">低风险</Tag>;
    if (score < 60) return <Tag color="orange">中风险</Tag>;
    return <Tag color="red">高风险</Tag>;
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (val: string) => (
        <Button type="link" onClick={() => loadProfileDetail(val)}>
          {val}
        </Button>
      )
    },
    {
      title: 'VIP等级',
      dataIndex: 'vip_level',
      key: 'vip_level',
      render: (val: number) => getVipTag(val)
    },
    {
      title: '风险评分',
      dataIndex: 'risk_score',
      key: 'risk_score',
      render: (val: number) => (
        <Space>
          <span>{val}</span>
          {getRiskTag(val)}
        </Space>
      )
    },
    {
      title: '终身价值',
      dataIndex: 'lifetime_value',
      key: 'lifetime_value',
      render: (val: number) => `¥${Number(val || 0).toFixed(2)}`
    },
    {
      title: '会话数',
      dataIndex: 'total_sessions',
      key: 'total_sessions',
    },
    {
      title: '满意度',
      dataIndex: 'avg_satisfaction_rating',
      key: 'avg_satisfaction_rating',
      render: (val?: number) => {
        if (!val) return '-';
        return <Space>
          {Number(val || 0).toFixed(1)}
          <StarOutlined style={{ color: '#faad14' }} />
        </Space>;
      }
    },
    {
      title: '最后联系',
      dataIndex: 'last_contact_at',
      key: 'last_contact_at',
      render: (val?: string) => val ? new Date(val).toLocaleString() : '-'
    }
  ];

  const vipDistPercent = statistics.totalProfiles > 0
    ? Math.round((statistics.vipProfiles / statistics.totalProfiles) * 100)
    : 0;

  return (
    <div>
      <h2><UserOutlined /> 客户画像管理</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={statistics.totalProfiles || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="VIP客户"
              value={statistics.vipProfiles || 0}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高风险客户"
              value={statistics.highRiskProfiles || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均满意度"
              value={statistics.averageSatisfaction ? statistics.averageSatisfaction.toFixed(2) : 0}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <h4>VIP客户占比</h4>
            <Progress percent={vipDistPercent} status="active" />
          </Col>
          <Col span={12}>
            <h4>平均终身价值</h4>
            <Statistic
              value={statistics.averageLifetimeValue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: '24px' }}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索用户ID"
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
          />
          <Select
            placeholder="筛选VIP等级"
            style={{ width: 150 }}
            allowClear
            onChange={(val) => setVipFilter(val)}
          >
            <Option value={0}>普通用户</Option>
            <Option value={1}>VIP1</Option>
            <Option value={2}>VIP2</Option>
            <Option value={3}>VIP3</Option>
            <Option value={4}>VIP4</Option>
            <Option value={5}>VIP5</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={profiles}
          rowKey="user_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => loadProfiles(page, pageSize)
          }}
        />
      </Card>

      <Modal
        title={`客户画像详情 - ${selectedProfile?.profile?.user_id}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedProfile && (
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="用户ID">{selectedProfile.profile.user_id}</Descriptions.Item>
                <Descriptions.Item label="VIP等级">{getVipTag(selectedProfile.profile.vip_level)}</Descriptions.Item>
                <Descriptions.Item label="风险评分">
                  <Progress percent={selectedProfile.profile.risk_score} status={selectedProfile.profile.risk_score > 60 ? 'exception' : 'active'} />
                </Descriptions.Item>
                <Descriptions.Item label="终身价值">¥{selectedProfile.profile.lifetime_value?.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="会话总数">{selectedProfile.profile.total_sessions}</Descriptions.Item>
                <Descriptions.Item label="消息总数">{selectedProfile.profile.total_messages}</Descriptions.Item>
                <Descriptions.Item label="平均满意度">{selectedProfile.profile.avg_satisfaction_rating?.toFixed(2) || '-'}</Descriptions.Item>
                <Descriptions.Item label="备注数量">{selectedProfile.profile.notes_count}</Descriptions.Item>
                <Descriptions.Item label="首选客服">{selectedProfile.profile.preferred_agent_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="最后联系">
                  {selectedProfile.profile.last_contact_at ? new Date(selectedProfile.profile.last_contact_at).toLocaleString() : '-'}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab={`标签 (${selectedProfile.tags?.length || 0})`} key="tags">
              <Space wrap>
                {selectedProfile.tags?.map((tag: any) => (
                  <Tag key={tag.id} color={tag.tag_color}>
                    {tag.tag_name}
                  </Tag>
                ))}
                {selectedProfile.tags?.length === 0 && <span>暂无标签</span>}
              </Space>
            </TabPane>

            <TabPane tab={`备注 (${selectedProfile.notes?.length || 0})`} key="notes">
              <Timeline>
                {selectedProfile.notes?.map((note: any) => (
                  <Timeline.Item key={note.id}>
                    <p>{note.content}</p>
                    <p style={{ fontSize: '12px', color: '#999' }}>
                      {note.created_by} - {new Date(note.created_at).toLocaleString()}
                    </p>
                  </Timeline.Item>
                ))}
                {selectedProfile.notes?.length === 0 && <span>暂无备注</span>}
              </Timeline>
            </TabPane>

            <TabPane tab={`会话历史 (${selectedProfile.recentSessions?.length || 0})`} key="sessions">
              <Table
                dataSource={selectedProfile.recentSessions}
                columns={[
                  { title: '会话ID', dataIndex: 'id', key: 'id' },
                  { title: '客服', dataIndex: 'agent_name', key: 'agent_name', render: (val: string) => val || '未分配' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (val: string) => {
                      const statusMap: { [key: string]: string } = {
                        waiting: 'orange',
                        active: 'green',
                        closed: 'default'
                      };
                      return <Badge status={statusMap[val] as any} text={val} />;
                    }
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    render: (val: string) => new Date(val).toLocaleString()
                  }
                ]}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </TabPane>

            <TabPane tab={`行为日志 (${selectedProfile.recentBehaviors?.length || 0})`} key="behaviors">
              <Timeline>
                {selectedProfile.recentBehaviors?.map((behavior: any) => (
                  <Timeline.Item key={behavior.id}>
                    <p><Tag>{behavior.action_type}</Tag></p>
                    <p style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(behavior.created_at).toLocaleString()}
                    </p>
                  </Timeline.Item>
                ))}
                {selectedProfile.recentBehaviors?.length === 0 && <span>暂无行为记录</span>}
              </Timeline>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default CustomerProfile;
