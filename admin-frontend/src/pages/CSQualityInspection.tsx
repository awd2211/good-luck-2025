import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Statistic,
  Row,
  Col,
  Progress,
  List,
  Badge
} from 'antd';
import {
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiService from '../services/api';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

interface QualityInspection {
  id: number;
  sessionId: number;
  inspectorId: number;
  agentId: number;
  inspectionDate: string;
  qualityScore: number;
  categories: {
    serviceAttitude: number;
    responseSpeed: number;
    problemSolving: number;
    compliance: number;
    communication: number;
  };
  issues: string[];
  suggestions: string;
  status: string;
  createdAt: string;
}

interface Statistics {
  totalInspections: number;
  avgQualityScore: number;
  scoreDistribution: Array<{ range: string; count: number }>;
  categoryScores: {
    serviceAttitude: number;
    responseSpeed: number;
    problemSolving: number;
    compliance: number;
    communication: number;
  };
  topIssues: Array<{ issue: string; count: number }>;
  passRate: number;
  excellentRate: number;
}

const CSQualityInspection: React.FC = () => {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    fetchInspections();
    fetchStatistics();
  }, [pagination.current, filters]);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      const response = await apiService.get('/cs/quality', { params });
      setInspections(response.data.data || response.data);
      setPagination(prev => ({ ...prev, total: (response.data as any).pagination?.total || 0 }));
    } catch (error) {
      message.error('获取质检记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = filters.startDate && filters.endDate ? {
        startDate: filters.startDate,
        endDate: filters.endDate
      } : {};
      const response = await apiService.get('/cs/quality/statistics', { params });
      setStatistics(response.data || null);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await apiService.post('/cs/quality', values);
      message.success('质检记录已创建');
      setModalVisible(false);
      form.resetFields();
      fetchInspections();
      fetchStatistics();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条质检记录吗?',
      onOk: async () => {
        try {
          await apiService.delete(`/cs/quality/${id}`);
          message.success('已删除');
          fetchInspections();
          fetchStatistics();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSearch = (values: any) => {
    const newFilters: any = {};
    if (values.agentId) newFilters.agentId = values.agentId;
    if (values.status) newFilters.status = values.status;
    if (values.dateRange) {
      newFilters.startDate = values.dateRange[0].format('YYYY-MM-DD');
      newFilters.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    if (values.minScore) newFilters.minScore = values.minScore;
    if (values.maxScore) newFilters.maxScore = values.maxScore;

    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    if (score >= 60) return '#fa8c16';
    return '#f5222d';
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待审核' },
      completed: { color: 'success', text: '已完成' },
      appealing: { color: 'warning', text: '申诉中' },
      closed: { color: 'default', text: '已关闭' }
    };
    const config = statusMap[status] || statusMap.completed;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<QualityInspection> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80
    },
    {
      title: '会话ID',
      dataIndex: 'sessionId',
      width: 100
    },
    {
      title: '客服ID',
      dataIndex: 'agentId',
      width: 100
    },
    {
      title: '总分',
      dataIndex: 'qualityScore',
      width: 100,
      render: (score: number) => (
        <Badge count={score} style={{ backgroundColor: getScoreColor(score) }} />
      ),
      sorter: (a, b) => a.qualityScore - b.qualityScore
    },
    {
      title: '各项评分',
      key: 'categories',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>服务态度: {record.categories.serviceAttitude}/20</div>
          <div>响应速度: {record.categories.responseSpeed}/20</div>
          <div>问题解决: {record.categories.problemSolving}/30</div>
          <div>合规性: {record.categories.compliance}/15</div>
          <div>沟通能力: {record.categories.communication}/15</div>
        </Space>
      )
    },
    {
      title: '发现问题',
      dataIndex: 'issues',
      width: 200,
      render: (issues: string[]) => (
        <div>
          {issues?.slice(0, 3).map((issue, index) => (
            <Tag key={index} color="red" style={{ marginBottom: 4 }}>{issue}</Tag>
          ))}
          {issues?.length > 3 && <Tag>+{issues.length - 3}个</Tag>}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => {
              Modal.info({
                title: '质检详情',
                width: 600,
                content: (
                  <div>
                    <p><strong>改进建议:</strong> {record.suggestions}</p>
                    <p><strong>发现的问题:</strong></p>
                    <ul>
                      {record.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )
              });
            }}
          >
            详情
          </Button>
          <Button
            type="link"
            danger
            size="small"
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="质检统计" style={{ marginBottom: 24 }}>
        {statistics && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Statistic
                  title="总质检数"
                  value={statistics.totalInspections}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均分"
                  value={Number(statistics.avgQualityScore || 0).toFixed(1)}
                  suffix="/ 100"
                  valueStyle={{ color: getScoreColor(statistics.avgQualityScore || 0) }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="及格率"
                  value={Number(statistics.passRate || 0).toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: (statistics.passRate || 0) >= 80 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="优秀率"
                  value={Number(statistics.excellentRate || 0).toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: (statistics.excellentRate || 0) >= 50 ? '#3f8600' : '#faad14' }}
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="评分分布" size="small">
                  <List
                    dataSource={statistics?.scoreDistribution || []}
                    renderItem={(item) => (
                      <List.Item>
                        <div style={{ width: '100%' }}>
                          <div style={{ marginBottom: 8 }}>{item.range}</div>
                          <Progress
                            percent={(item.count / statistics.totalInspections) * 100}
                            format={() => `${item.count}次`}
                          />
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="常见问题 TOP 10" size="small">
                  <List
                    dataSource={statistics?.topIssues || []}
                    renderItem={(item, index) => (
                      <List.Item>
                        <Space>
                          <Badge count={index + 1} style={{ backgroundColor: '#1890ff' }} />
                          <span>{item.issue}</span>
                          <Tag>{item.count}次</Tag>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Card>

      <Card
        title="质检记录"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            新建质检
          </Button>
        }
      >
        <Form layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="agentId">
            <InputNumber placeholder="客服ID" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="pending">待审核</Option>
              <Option value="completed">已完成</Option>
              <Option value="appealing">申诉中</Option>
              <Option value="closed">已关闭</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker />
          </Form.Item>
          <Form.Item name="minScore">
            <InputNumber placeholder="最低分" min={0} max={100} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="maxScore">
            <InputNumber placeholder="最高分" min={0} max={100} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={inspections}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          onChange={(newPagination) => {
            setPagination({
              current: newPagination.current || 1,
              pageSize: newPagination.pageSize || 20,
              total: pagination.total
            });
          }}
        />
      </Card>

      <Modal
        title="新建质检记录"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sessionId"
                label="会话ID"
                rules={[{ required: true, message: '请输入会话ID' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="会话ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="agentId"
                label="客服ID"
                rules={[{ required: true, message: '请输入客服ID' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="客服ID" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="评分项 (总分100)" required>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="serviceAttitude"
                  label="服务态度 (0-20)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="responseSpeed"
                  label="响应速度 (0-20)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="problemSolving"
                  label="问题解决 (0-30)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} max={30} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="compliance"
                  label="合规性 (0-15)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} max={15} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="communication"
                  label="沟通能力 (0-15)"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} max={15} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item
            name="qualityScore"
            label="总分"
            rules={[{ required: true, message: '请输入总分' }]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              placeholder="总分 (0-100)"
            />
          </Form.Item>

          <Form.Item name="issues" label="发现的问题">
            <Select mode="tags" placeholder="输入问题并按回车添加" />
          </Form.Item>

          <Form.Item name="suggestions" label="改进建议">
            <TextArea rows={4} placeholder="输入改进建议..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CSQualityInspection;
