/**
 * 邮件发送历史记录页面
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  message,
  Space,
  Modal,
  Input,
  Select,
  DatePicker,
  Statistic,
  Row,
  Col,
  Descriptions,
  Progress,
  Empty,
} from 'antd';
import {
  MailOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  BarChartOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import api from '../services/api';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface EmailSendHistory {
  id: number;
  scenario_key: string;
  scenario_name: string;
  recipient_email: string;
  subject: string;
  content: string;
  status: 'success' | 'failed';
  message_id: string | null;
  error_message: string | null;
  provider: string | null;
  sent_at: string;
  user_id: string | null;
  metadata: Record<string, any>;
}

interface HistoryStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
  byScenario: Record<string, { name: string; total: number; success: number; failed: number }>;
  byProvider: Record<string, number>;
  recentFailures: Array<{
    id: number;
    scenario_name: string;
    recipient_email: string;
    error_message: string;
    sent_at: string;
  }>;
}

const EmailSendHistoryPage: React.FC = () => {
  const [historyList, setHistoryList] = useState<EmailSendHistory[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<EmailSendHistory | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState<{
    scenarioKey?: string;
    status?: 'success' | 'failed';
    recipientEmail?: string;
    provider?: string;
    dateRange?: [Dayjs, Dayjs];
  }>({});

  // 加载历史列表
  const loadHistoryList = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
      };

      if (filters.scenarioKey) params.scenarioKey = filters.scenarioKey;
      if (filters.status) params.status = filters.status;
      if (filters.recipientEmail) params.recipientEmail = filters.recipientEmail;
      if (filters.provider) params.provider = filters.provider;
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].toISOString();
        params.endDate = filters.dateRange[1].toISOString();
      }

      const response = await api.get<{
        success: boolean;
        data: EmailSendHistory[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>('/email-send-history', { params });

      if (response.data.success) {
        setHistoryList(response.data.data);
        setPagination({
          current: response.data.pagination.page,
          pageSize: response.data.pagination.limit,
          total: response.data.pagination.total,
        });
      }
    } catch (error: any) {
      message.error('加载历史记录失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const params: any = {};
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].toISOString();
        params.endDate = filters.dateRange[1].toISOString();
      }

      const response = await api.get<{
        success: boolean;
        data: HistoryStats;
      }>('/email-send-history/stats', { params });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('加载统计失败:', error);
    }
  };

  useEffect(() => {
    loadHistoryList();
    loadStats();
  }, []);

  // 查看详情
  const handleViewDetail = async (id: number) => {
    try {
      const response = await api.get<{
        success: boolean;
        data: EmailSendHistory;
      }>(`/email-send-history/${id}`);

      if (response.data.success) {
        setCurrentRecord(response.data.data);
        setDetailModalVisible(true);
      }
    } catch (error: any) {
      message.error('加载详情失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 应用筛选
  const handleApplyFilters = () => {
    loadHistoryList(1, pagination.pageSize);
    loadStats();
  };

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({});
    setPagination({ ...pagination, current: 1 });
  };

  // 清理旧数据
  const handleCleanup = async () => {
    Modal.confirm({
      title: '清理旧数据',
      content: '确定要清理90天前的邮件发送历史吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await api.post<{
            success: boolean;
            message: string;
            data: { deletedCount: number };
          }>('/email-send-history/cleanup', {
            daysToKeep: 90,
          });

          if (response.data.success) {
            message.success(response.data.message);
            loadHistoryList();
            loadStats();
          }
        } catch (error: any) {
          message.error('清理失败: ' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  // 表格列定义
  const columns: ColumnsType<EmailSendHistory> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '场景',
      dataIndex: 'scenario_name',
      key: 'scenario_name',
      width: 120,
    },
    {
      title: '收件人',
      dataIndex: 'recipient_email',
      key: 'recipient_email',
      width: 200,
    },
    {
      title: '主题',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      width: 250,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag
          icon={status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={status === 'success' ? 'success' : 'error'}
        >
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '服务商',
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
      render: (provider: string | null) => provider || '-',
    },
    {
      title: '发送时间',
      dataIndex: 'sent_at',
      key: 'sent_at',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record: EmailSendHistory) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.id)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总发送量"
                value={stats.total}
                prefix={<MailOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="成功"
                value={stats.success}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="失败"
                value={stats.failed}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="成功率"
                value={stats.successRate}
                precision={2}
                suffix="%"
                valueStyle={{ color: stats.successRate > 90 ? '#3f8600' : '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={16}>
            <Col span={6}>
              <Input
                placeholder="收件人邮箱"
                value={filters.recipientEmail}
                onChange={(e) => setFilters({ ...filters, recipientEmail: e.target.value })}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="发送状态"
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
                allowClear
                style={{ width: '100%' }}
              >
                <Select.Option value="success">成功</Select.Option>
                <Select.Option value="failed">失败</Select.Option>
              </Select>
            </Col>
            <Col span={6}>
              <Input
                placeholder="服务商"
                value={filters.provider}
                onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
                allowClear
              />
            </Col>
            <Col span={6}>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates as [Dayjs, Dayjs] })}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
          <Row>
            <Space>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={handleApplyFilters}
              >
                应用筛选
              </Button>
              <Button onClick={handleResetFilters}>重置</Button>
            </Space>
          </Row>
        </Space>
      </Card>

      {/* 主内容卡片 */}
      <Card
        title={
          <Space>
            <MailOutlined />
            <span>邮件发送历史</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setStatsModalVisible(true)}
            >
              统计分析
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadHistoryList()}
            >
              刷新
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleCleanup}
            >
              清理旧数据
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={historyList}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              loadHistoryList(page, pageSize);
            },
          }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="邮件发送详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentRecord && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="ID">{currentRecord.id}</Descriptions.Item>
            <Descriptions.Item label="场景">{currentRecord.scenario_name}</Descriptions.Item>
            <Descriptions.Item label="场景Key">{currentRecord.scenario_key}</Descriptions.Item>
            <Descriptions.Item label="收件人">{currentRecord.recipient_email}</Descriptions.Item>
            <Descriptions.Item label="主题">{currentRecord.subject}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentRecord.status === 'success' ? 'success' : 'error'}>
                {currentRecord.status === 'success' ? '成功' : '失败'}
              </Tag>
            </Descriptions.Item>
            {currentRecord.provider && (
              <Descriptions.Item label="服务商">{currentRecord.provider}</Descriptions.Item>
            )}
            {currentRecord.message_id && (
              <Descriptions.Item label="消息ID">{currentRecord.message_id}</Descriptions.Item>
            )}
            <Descriptions.Item label="发送时间">
              {dayjs(currentRecord.sent_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {currentRecord.error_message && (
              <Descriptions.Item label="错误信息">
                <span style={{ color: '#ff4d4f' }}>{currentRecord.error_message}</span>
              </Descriptions.Item>
            )}
            {currentRecord.user_id && (
              <Descriptions.Item label="用户ID">{currentRecord.user_id}</Descriptions.Item>
            )}
            {Object.keys(currentRecord.metadata || {}).length > 0 && (
              <Descriptions.Item label="元数据">
                <pre style={{ maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(currentRecord.metadata, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="邮件内容">
              <div
                style={{
                  maxHeight: 400,
                  overflow: 'auto',
                  border: '1px solid #d9d9d9',
                  padding: '12px',
                  borderRadius: '4px',
                }}
                dangerouslySetInnerHTML={{ __html: currentRecord.content }}
              />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 统计分析模态框 */}
      <Modal
        title="邮件发送统计分析"
        open={statsModalVisible}
        onCancel={() => setStatsModalVisible(false)}
        footer={null}
        width={900}
      >
        {stats && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* 按场景统计 */}
            <Card title="按场景统计" size="small">
              {Object.keys(stats.byScenario).length > 0 ? (
                Object.entries(stats.byScenario).map(([key, data]) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                      <strong>{data.name}</strong>
                      <span style={{ float: 'right' }}>
                        成功: {data.success} / 失败: {data.failed} / 总计: {data.total}
                      </span>
                    </div>
                    <Progress
                      percent={data.total > 0 ? (data.success / data.total) * 100 : 0}
                      status={data.success === data.total ? 'success' : 'normal'}
                      format={(percent) => `${percent?.toFixed(1)}%`}
                    />
                  </div>
                ))
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>

            {/* 按服务商统计 */}
            <Card title="按服务商统计" size="small">
              {Object.keys(stats.byProvider).length > 0 ? (
                Object.entries(stats.byProvider).map(([provider, count]) => (
                  <div key={provider} style={{ marginBottom: 12 }}>
                    <strong>{provider || '未知'}:</strong> {count} 次
                  </div>
                ))
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>

            {/* 最近失败记录 */}
            <Card title="最近失败记录" size="small">
              {stats.recentFailures.length > 0 ? (
                stats.recentFailures.map((failure) => (
                  <div key={failure.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                    <div><strong>{failure.scenario_name}</strong></div>
                    <div style={{ color: '#666' }}>收件人: {failure.recipient_email}</div>
                    <div style={{ color: '#ff4d4f', fontSize: '12px' }}>错误: {failure.error_message}</div>
                    <div style={{ color: '#999', fontSize: '12px' }}>
                      时间: {dayjs(failure.sent_at).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="暂无失败记录" />
              )}
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default EmailSendHistoryPage;
