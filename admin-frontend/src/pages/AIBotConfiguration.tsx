/**
 * AI机器人配置页面
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Space,
  Tag,
  message,
  Popconfirm,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiService from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface AIBotConfig {
  id: number;
  bot_name: string;
  provider: string;
  model_name: string;
  api_endpoint: string | null;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface AIStats {
  totalConversations: number;
  successfulConversations: number;
  failedConversations: number;
  successRate: number;
  totalTokensUsed: number;
  avgResponseTime: number;
}

const AIBotConfiguration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<AIBotConfig[]>([]);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIBotConfig | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfigs();
    fetchStats();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/cs/ai/configs');
      setConfigs(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      message.error('加载AI配置失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.get('/cs/ai/stats');
      setStats(response.data.data || null);
    } catch (error) {
      console.error('加载统计数据失败', error);
    }
  };

  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: AIBotConfig) => {
    setEditingConfig(record);
    form.setFieldsValue({
      bot_name: record.bot_name,
      provider: record.provider,
      model_name: record.model_name,
      api_endpoint: record.api_endpoint,
      system_prompt: '', // API key不回显
      temperature: record.temperature,
      max_tokens: record.max_tokens,
      priority: record.priority,
      is_active: record.is_active
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.delete(`/cs/ai/configs/${id}`);
      message.success('删除成功');
      fetchConfigs();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 转换字段名为后端期望的格式
      const payload = {
        botName: values.bot_name,
        provider: values.provider,
        modelName: values.model_name,
        apiEndpoint: values.api_endpoint,
        apiKey: values.api_key,
        systemPrompt: values.system_prompt,
        temperature: values.temperature,
        maxTokens: values.max_tokens,
        priority: values.priority
      };

      if (editingConfig) {
        await apiService.put(`/cs/ai/configs/${editingConfig.id}`, payload);
        message.success('更新成功');
      } else {
        await apiService.post('/cs/ai/configs', payload);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchConfigs();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleTest = async (record: AIBotConfig) => {
    Modal.confirm({
      title: '测试AI配置',
      content: (
        <Form>
          <Form.Item label="测试消息">
            <TextArea
              id="test-message"
              rows={3}
              defaultValue="你好,请介绍一下自己"
              placeholder="输入测试消息"
            />
          </Form.Item>
        </Form>
      ),
      okText: '发送测试',
      cancelText: '取消',
      onOk: async () => {
        const testMessage = (document.getElementById('test-message') as HTMLTextAreaElement)?.value;
        try {
          const response = await apiService.post(`/cs/ai/configs/${record.id}/test`, {
            message: testMessage
          });
          Modal.success({
            title: '测试成功',
            content: (
              <div>
                <p><strong>AI响应:</strong></p>
                <p>{response.data?.data?.response || '无响应'}</p>
                <p><strong>使用Token:</strong> {response.data?.data?.tokensUsed || 0}</p>
                <p><strong>响应时间:</strong> {response.data?.data?.responseTime || 0}ms</p>
              </div>
            ),
            width: 600
          });
        } catch (error: any) {
          Modal.error({
            title: '测试失败',
            content: error.response?.data?.message || '请检查配置是否正确'
          });
        }
      }
    });
  };

  const columns: ColumnsType<AIBotConfig> = [
    {
      title: '名称',
      dataIndex: 'bot_name',
      key: 'bot_name',
      render: (name: string) => (
        <Space>
          <RobotOutlined />
          <strong>{name}</strong>
        </Space>
      )
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => {
        const colors: Record<string, string> = {
          openai: 'green',
          anthropic: 'blue',
          claude: 'blue',
          deepseek: 'purple'
        };
        return <Tag color={colors[provider.toLowerCase()] || 'default'}>{provider}</Tag>;
      }
    },
    {
      title: '模型',
      dataIndex: 'model_name',
      key: 'model_name'
    },
    {
      title: '参数',
      key: 'params',
      render: (record: AIBotConfig) => (
        <Space direction="vertical" size="small">
          <span>温度: {record.temperature}</span>
          <span>Max Tokens: {record.max_tokens}</span>
        </Space>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => a.priority - b.priority,
      render: (priority: number) => (
        <Tag color={priority > 5 ? 'gold' : 'default'}>
          {priority}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) =>
        isActive ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            启用
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">
            禁用
          </Tag>
        )
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: AIBotConfig) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => handleTest(record)}
          >
            测试
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此配置?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 统计数据 */}
        {stats && (
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总对话数"
                  value={stats.totalConversations}
                  prefix={<RobotOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="成功率"
                  value={stats.successRate.toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: stats.successRate >= 95 ? '#52c41a' : '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总Token消耗"
                  value={stats.totalTokensUsed}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="平均响应时间"
                  value={Math.round(stats.avgResponseTime)}
                  suffix="ms"
                  valueStyle={{ color: stats.avgResponseTime <= 2000 ? '#52c41a' : '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 配置列表 */}
        <Card
          title="AI配置列表"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加配置
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={configs}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`
            }}
          />
        </Card>
      </Space>

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingConfig ? '编辑AI配置' : '添加AI配置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="配置名称"
            name="bot_name"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="如: GPT-4 客服助手" />
          </Form.Item>

          <Form.Item
            label="AI提供商"
            name="provider"
            rules={[{ required: true, message: '请选择提供商' }]}
          >
            <Select placeholder="选择AI提供商">
              <Option value="openai">OpenAI</Option>
              <Option value="anthropic">Anthropic (Claude)</Option>
              <Option value="deepseek">DeepSeek</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="模型名称"
            name="model_name"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="如: gpt-4, claude-3-sonnet-20240229, deepseek-chat" />
          </Form.Item>

          <Form.Item label="API端点" name="api_endpoint">
            <Input placeholder="留空使用默认端点" />
          </Form.Item>

          <Form.Item
            label="API Key"
            name="api_key"
            rules={[{ required: !editingConfig, message: '请输入API Key' }]}
          >
            <Input.Password placeholder={editingConfig ? '留空表示不修改' : '输入API Key'} />
          </Form.Item>

          <Form.Item label="系统提示词" name="system_prompt">
            <TextArea
              rows={4}
              placeholder="你是一个专业的客服助手,请礼貌、专业地回答用户问题。"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Temperature"
                name="temperature"
                initialValue={0.7}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Max Tokens"
                name="max_tokens"
                initialValue={500}
                rules={[{ required: true }]}
              >
                <InputNumber min={100} max={4000} step={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="优先级"
            name="priority"
            initialValue={0}
            tooltip="数字越大优先级越高"
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="启用" name="is_active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AIBotConfiguration;
