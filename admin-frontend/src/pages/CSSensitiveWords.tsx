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
  Select,
  Switch,
  message,
  Statistic,
  Row,
  Col,
  Badge,
  Tabs,
  List
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiService from '../services/api';

const { Option } = Select;
const { TabPane } = Tabs;

interface SensitiveWord {
  id: number;
  word: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'warn' | 'replace' | 'block';
  replacement?: string;
  isActive: boolean;
  createdAt: string;
}

interface Statistics {
  totalWords: number;
  activeWords: number;
  totalHits: number;
  topHitWords: Array<{ word: string; category: string; hitCount: number }>;
  hitsBySeverity: Array<{ severity: string; count: number }>;
  hitsByCategory: Array<{ category: string; count: number }>;
}

const CSSensitiveWords: React.FC = () => {
  const [words, setWords] = useState<SensitiveWord[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState<SensitiveWord | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    fetchWords();
    fetchStatistics();
  }, [pagination.current, filters]);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      const response = await apiService.get('/cs/sensitive-words', { params });
      setWords(response.data.data || response.data);
      setPagination(prev => ({ ...prev, total: (response.data as any).pagination?.total || 0 }));
    } catch (error) {
      message.error('获取敏感词列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiService.get('/cs/sensitive-words/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      if (editingWord) {
        await apiService.put(`/cs/sensitive-words/${editingWord.id}`, values);
        message.success('敏感词已更新');
      } else {
        await apiService.post('/cs/sensitive-words', values);
        message.success('敏感词已添加');
      }
      setModalVisible(false);
      setEditingWord(null);
      form.resetFields();
      fetchWords();
      fetchStatistics();
    } catch (error) {
      message.error(editingWord ? '更新失败' : '添加失败');
    }
  };

  const handleEdit = (record: SensitiveWord) => {
    setEditingWord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个敏感词吗?',
      onOk: async () => {
        try {
          await apiService.delete(`/cs/sensitive-words/${id}`);
          message.success('已删除');
          fetchWords();
          fetchStatistics();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    try {
      await apiService.put(`/cs/sensitive-words/${id}`, { isActive });
      message.success(isActive ? '已启用' : '已禁用');
      fetchWords();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getSeverityTag = (severity: string) => {
    const severityMap: Record<string, { color: string; text: string }> = {
      low: { color: 'default', text: '低' },
      medium: { color: 'warning', text: '中' },
      high: { color: 'error', text: '高' },
      critical: { color: 'red', text: '严重' }
    };
    const config = severityMap[severity] || severityMap.low;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getActionTag = (action: string) => {
    const actionMap: Record<string, { color: string; text: string }> = {
      warn: { color: 'warning', text: '警告' },
      replace: { color: 'processing', text: '替换' },
      block: { color: 'error', text: '拦截' }
    };
    const config = actionMap[action] || actionMap.warn;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<SensitiveWord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80
    },
    {
      title: '敏感词',
      dataIndex: 'word',
      width: 150,
      render: (word: string) => <Tag color="red">{word}</Tag>
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      width: 100,
      render: (severity: string) => getSeverityTag(severity)
    },
    {
      title: '处理动作',
      dataIndex: 'action',
      width: 100,
      render: (action: string) => getActionTag(action)
    },
    {
      title: '替换词',
      dataIndex: 'replacement',
      width: 120,
      render: (replacement: string) => replacement || '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={(checked) => handleToggleStatus(record.id, checked)}
        />
      )
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
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
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
      <Card title="敏感词统计" style={{ marginBottom: 24 }}>
        {statistics && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Statistic
                  title="总敏感词数"
                  value={statistics.totalWords}
                  prefix={<WarningOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="启用中"
                  value={statistics.activeWords}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="总命中次数"
                  value={statistics.totalHits}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="命中率"
                  value={statistics.totalWords > 0 ? ((statistics.totalHits / statistics.totalWords) * 100).toFixed(1) : 0}
                  suffix="%"
                />
              </Col>
            </Row>

            <Tabs defaultActiveKey="1">
              <TabPane tab="命中最多的词" key="1">
                <List
                  dataSource={statistics.topHitWords}
                  renderItem={(item, index) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Badge count={index + 1} style={{ backgroundColor: '#1890ff' }} />
                          <Tag color="red">{item.word}</Tag>
                          <Tag color="blue">{item.category}</Tag>
                        </Space>
                        <Tag color="orange">{item.hitCount}次</Tag>
                      </Space>
                    </List.Item>
                  )}
                />
              </TabPane>
              <TabPane tab="按严重程度" key="2">
                <List
                  dataSource={statistics.hitsBySeverity}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        {getSeverityTag(item.severity)}
                        <Tag>{item.count}次</Tag>
                      </Space>
                    </List.Item>
                  )}
                />
              </TabPane>
              <TabPane tab="按分类" key="3">
                <List
                  dataSource={statistics.hitsByCategory}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Tag color="blue">{item.category}</Tag>
                        <Tag>{item.count}次</Tag>
                      </Space>
                    </List.Item>
                  )}
                />
              </TabPane>
            </Tabs>
          </>
        )}
      </Card>

      <Card
        title="敏感词管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingWord(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            添加敏感词
          </Button>
        }
      >
        <Form layout="inline" onFinish={setFilters} style={{ marginBottom: 16 }}>
          <Form.Item name="category">
            <Select placeholder="分类" style={{ width: 150 }} allowClear>
              <Option value="辱骂">辱骂</Option>
              <Option value="政治">政治</Option>
              <Option value="色情">色情</Option>
              <Option value="暴力">暴力</Option>
              <Option value="广告">广告</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="severity">
            <Select placeholder="严重程度" style={{ width: 150 }} allowClear>
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
              <Option value="critical">严重</Option>
            </Select>
          </Form.Item>
          <Form.Item name="isActive">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Option value="true">启用</Option>
              <Option value="false">禁用</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={words}
          rowKey="id"
          loading={loading}
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
        title={editingWord ? '编辑敏感词' : '添加敏感词'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingWord(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="word"
            label="敏感词"
            rules={[{ required: true, message: '请输入敏感词' }]}
          >
            <Input placeholder="输入敏感词" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="选择分类">
                  <Option value="辱骂">辱骂</Option>
                  <Option value="政治">政治</Option>
                  <Option value="色情">色情</Option>
                  <Option value="暴力">暴力</Option>
                  <Option value="广告">广告</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="severity"
                label="严重程度"
                rules={[{ required: true, message: '请选择严重程度' }]}
              >
                <Select placeholder="选择严重程度">
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                  <Option value="critical">严重</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="action"
            label="处理动作"
            rules={[{ required: true, message: '请选择处理动作' }]}
          >
            <Select placeholder="选择处理动作">
              <Option value="warn">警告 (记录但允许发送)</Option>
              <Option value="replace">替换 (用替换词替代)</Option>
              <Option value="block">拦截 (禁止发送)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.action !== currentValues.action}
          >
            {({ getFieldValue }) =>
              getFieldValue('action') === 'replace' ? (
                <Form.Item
                  name="replacement"
                  label="替换词"
                  rules={[{ required: true, message: '请输入替换词' }]}
                >
                  <Input placeholder="例如: ***" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="isActive" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CSSensitiveWords;
