/**
 * 邮件通知配置管理页面
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Switch,
  Button,
  message,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Statistic,
  Row,
  Col,
  Tabs,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  MailOutlined,
  SettingOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import api from '../services/api';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface EmailNotificationConfig {
  id: number;
  scenario_key: string;
  scenario_name: string;
  scenario_category: string;
  is_enabled: boolean;
  config_data: Record<string, any>;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ConfigStats {
  total: string;
  enabled: string;
  disabled: string;
  auth_count: string;
  order_count: string;
  fortune_count: string;
  coupon_count: string;
  scheduled_count: string;
}

const EmailNotificationConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<EmailNotificationConfig[]>([]);
  const [stats, setStats] = useState<ConfigStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<EmailNotificationConfig | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [form] = Form.useForm();

  // 加载配置列表
  const loadConfigs = async (category?: string) => {
    setLoading(true);
    try {
      const params = category && category !== 'all' ? { category } : {};
      const response = await api.get<{
        success: boolean;
        data: EmailNotificationConfig[];
      }>('/email-notification-configs', { params });

      if (response.data.success) {
        setConfigs(response.data.data);
      }
    } catch (error: any) {
      message.error('加载配置失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await api.get<{
        success: boolean;
        data: ConfigStats;
      }>('/email-notification-configs/stats');

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('加载统计失败:', error);
    }
  };

  useEffect(() => {
    loadConfigs(activeCategory === 'all' ? undefined : activeCategory);
    loadStats();
  }, [activeCategory]);

  // 切换启用状态
  const handleToggleEnabled = async (record: EmailNotificationConfig, enabled: boolean) => {
    try {
      const response = await api.put<{
        success: boolean;
        message: string;
      }>(`/manage/email-notification-configs/${record.scenario_key}`, {
        is_enabled: enabled,
      });

      if (response.data.success) {
        message.success(enabled ? '已启用' : '已禁用');
        loadConfigs(activeCategory === 'all' ? undefined : activeCategory);
        loadStats();
      }
    } catch (error: any) {
      message.error('更新失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 批量启用/禁用
  const handleBatchUpdate = async (enabled: boolean) => {
    const selectedKeys = configs
      .filter(c => activeCategory === 'all' || c.scenario_category === activeCategory)
      .map(c => c.scenario_key);

    if (selectedKeys.length === 0) {
      message.warning('没有可操作的配置');
      return;
    }

    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>('/email-notification-configs/batch-enable', {
        scenario_keys: selectedKeys,
        is_enabled: enabled,
      });

      if (response.data.success) {
        message.success(response.data.message);
        loadConfigs(activeCategory === 'all' ? undefined : activeCategory);
        loadStats();
      }
    } catch (error: any) {
      message.error('批量更新失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 编辑配置
  const handleEdit = (record: EmailNotificationConfig) => {
    setCurrentConfig(record);
    form.setFieldsValue({
      scenario_name: record.scenario_name,
      description: record.description,
      config_data: JSON.stringify(record.config_data, null, 2),
    });
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!currentConfig) return;

    try {
      const values = await form.validateFields();
      let configData = {};
      try {
        configData = JSON.parse(values.config_data);
      } catch (e) {
        message.error('配置数据格式错误，请输入有效的 JSON');
        return;
      }

      const response = await api.put<{
        success: boolean;
        message: string;
      }>(`/manage/email-notification-configs/${currentConfig.scenario_key}`, {
        scenario_name: values.scenario_name,
        description: values.description,
        config_data: configData,
      });

      if (response.data.success) {
        message.success('保存成功');
        setEditModalVisible(false);
        form.resetFields();
        loadConfigs(activeCategory === 'all' ? undefined : activeCategory);
      }
    } catch (error: any) {
      message.error('保存失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 重置为默认
  const handleResetDefaults = async () => {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>('/email-notification-configs/reset');

      if (response.data.success) {
        message.success(response.data.message);
        loadConfigs(activeCategory === 'all' ? undefined : activeCategory);
        loadStats();
      }
    } catch (error: any) {
      message.error('重置失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 分类标签颜色
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      authentication: 'blue',
      order: 'green',
      fortune: 'purple',
      coupon: 'orange',
      scheduled: 'cyan',
    };
    return colorMap[category] || 'default';
  };

  // 分类名称映射
  const getCategoryName = (category: string) => {
    const nameMap: Record<string, string> = {
      authentication: '认证安全',
      order: '订单支付',
      fortune: '算命服务',
      coupon: '优惠券',
      scheduled: '定时任务',
    };
    return nameMap[category] || category;
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '场景名称',
      dataIndex: 'scenario_name',
      key: 'scenario_name',
      width: 150,
      render: (text: string, record: EmailNotificationConfig) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <span style={{ fontSize: '12px', color: '#999' }}>{record.scenario_key}</span>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'scenario_category',
      key: 'scenario_category',
      width: 100,
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>{getCategoryName(category)}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '配置数据',
      dataIndex: 'config_data',
      key: 'config_data',
      width: 200,
      render: (data: Record<string, any>) => {
        const keys = Object.keys(data);
        if (keys.length === 0) return <span style={{ color: '#999' }}>-</span>;

        return (
          <Tooltip title={<pre>{JSON.stringify(data, null, 2)}</pre>}>
            <Tag icon={<InfoCircleOutlined />}>
              {keys.length} 个配置项
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      width: 100,
      render: (enabled: boolean, record: EmailNotificationConfig) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleEnabled(record, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record: EmailNotificationConfig) => (
        <Button
          type="link"
          icon={<SettingOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
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
                title="总配置数"
                value={stats.total}
                prefix={<MailOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已启用"
                value={stats.enabled}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已禁用"
                value={stats.disabled}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="定时任务"
                value={stats.scheduled_count}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 主内容卡片 */}
      <Card
        title={
          <Space>
            <MailOutlined />
            <span>邮件通知配置</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadConfigs(activeCategory === 'all' ? undefined : activeCategory)}
            >
              刷新
            </Button>
            <Button
              type="primary"
              onClick={() => handleBatchUpdate(true)}
            >
              批量启用
            </Button>
            <Button
              onClick={() => handleBatchUpdate(false)}
            >
              批量禁用
            </Button>
            <Popconfirm
              title="确定要重置所有配置为默认值吗？"
              onConfirm={handleResetDefaults}
              okText="确定"
              cancelText="取消"
            >
              <Button danger>重置为默认</Button>
            </Popconfirm>
          </Space>
        }
      >
        <Tabs activeKey={activeCategory} onChange={setActiveCategory}>
          <TabPane tab="全部" key="all" />
          <TabPane tab={`认证安全 (${stats?.auth_count || 0})`} key="authentication" />
          <TabPane tab={`订单支付 (${stats?.order_count || 0})`} key="order" />
          <TabPane tab={`算命服务 (${stats?.fortune_count || 0})`} key="fortune" />
          <TabPane tab={`优惠券 (${stats?.coupon_count || 0})`} key="coupon" />
          <TabPane tab={`定时任务 (${stats?.scheduled_count || 0})`} key="scheduled" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title="编辑邮件通知配置"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="场景名称"
            name="scenario_name"
            rules={[{ required: true, message: '请输入场景名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={3} placeholder="请输入场景描述" />
          </Form.Item>

          <Form.Item
            label="配置数据 (JSON 格式)"
            name="config_data"
            extra="定时任务需要配置 cron 表达式，如: {&quot;cron&quot;: &quot;0 8 * * *&quot;}"
          >
            <TextArea
              rows={8}
              placeholder='{"cron": "0 8 * * *", "description": "每天早上8点"}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmailNotificationConfigPage;
