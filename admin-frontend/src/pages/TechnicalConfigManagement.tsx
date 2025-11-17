import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Tag,
  Tooltip,
  Row,
  Col,
  Statistic,
  Typography,
  Alert,
  Descriptions,
  Timeline
} from 'antd';
import {
  ReloadOutlined,
  EditOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../services/api';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface ConfigItem {
  config_key: string;
  config_value: string | number;
  value_type: string;
  category: string;
  description: string;
  is_public: boolean;
  is_editable: boolean;
}

interface ConfigHistory {
  id: number;
  config_key: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: string;
  change_reason: string;
  description: string;
}

interface ConfigStats {
  totalConfigs: number;
  byCategory: Record<string, number>;
  cacheSize: number;
  lastLoadTime: string;
}

const TechnicalConfigManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<ConfigItem[]>([]);
  const [stats, setStats] = useState<ConfigStats | null>(null);
  const [history, setHistory] = useState<ConfigHistory[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ConfigItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // 加载配置统计
  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/configs');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      message.error('加载配置统计失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 加载所有配置详情
  const loadAllConfigs = async () => {
    if (!stats) return;

    try {
      setLoading(true);
      const allConfigs: ConfigItem[] = [];

      // 获取每个配置的详情
      // 由于当前API设计，我们需要知道所有配置键，这里列出常用的参数配置
      const configKeys = [
        // 缓存配置
        'cache.articles.ttl',
        'cache.horoscopes.ttl',
        'cache.systemConfigs.ttl',
        'cache.fortuneTemplates.ttl',
        'cache.fortuneServices.ttl',
        'cache.fortuneCategories.ttl',
        // 客服配置
        'cs.maxConcurrentChats',
        'cs.inactiveTimeoutMinutes',
        'cs.cleanupIntervalMinutes',
        'cs.sessionTimeoutMinutes',
        // WebSocket配置
        'websocket.pingTimeout',
        'websocket.pingInterval',
        'websocket.timeoutCleanerInterval',
        // 安全配置
        'security.bcryptSaltRounds',
        // 限流配置
        'rateLimit.window',
        'rateLimit.api.max',
        'rateLimit.strict.max',
        'rateLimit.loose.max'
      ];

      for (const key of configKeys) {
        try {
          const response = await api.get(`/configs/${key}`);
          if (response.data.success) {
            const data = response.data.data;
            allConfigs.push({
              config_key: data.key,
              config_value: data.value,
              value_type: typeof data.value === 'number' ? 'number' : 'string',
              category: key.split('.')[0],
              description: getConfigDescription(key),
              is_public: false,
              is_editable: true
            });
          }
        } catch (error) {
          console.warn(`加载配置 ${key} 失败:`, error);
        }
      }

      setConfigs(allConfigs);
      filterConfigs(allConfigs, selectedCategory, searchText);
    } catch (error: any) {
      message.error('加载配置详情失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 获取配置描述
  const getConfigDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'cache.articles.ttl': '文章缓存过期时间（秒）',
      'cache.horoscopes.ttl': '运势缓存过期时间（秒）',
      'cache.systemConfigs.ttl': '系统配置缓存过期时间（秒）',
      'cache.fortuneTemplates.ttl': '算命模板缓存过期时间（秒）',
      'cache.fortuneServices.ttl': '算命服务缓存过期时间（秒）',
      'cache.fortuneCategories.ttl': '算命分类缓存过期时间（秒）',
      'cs.maxConcurrentChats': '客服最大并发聊天数',
      'cs.inactiveTimeoutMinutes': '客服不活跃超时（分钟）',
      'cs.cleanupIntervalMinutes': '客服状态清理间隔（分钟）',
      'cs.sessionTimeoutMinutes': '会话超时时间（分钟）',
      'websocket.pingTimeout': 'WebSocket ping 超时（毫秒）',
      'websocket.pingInterval': 'WebSocket ping 间隔（毫秒）',
      'websocket.timeoutCleanerInterval': '超时会话清理间隔（分钟）',
      'security.bcryptSaltRounds': 'bcrypt 密码加密轮数',
      'rateLimit.window': '限流时间窗口（毫秒）',
      'rateLimit.api.max': 'API 通用限流次数',
      'rateLimit.strict.max': '严格限流次数',
      'rateLimit.loose.max': '宽松限流次数'
    };
    return descriptions[key] || key;
  };

  // 过滤配置
  const filterConfigs = (configList: ConfigItem[], category: string, search: string) => {
    let filtered = configList;

    if (category !== 'all') {
      filtered = filtered.filter(c => c.category === category);
    }

    if (search) {
      filtered = filtered.filter(c =>
        c.config_key.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredConfigs(filtered);
  };

  // 加载配置历史
  const loadHistory = async (configKey?: string) => {
    try {
      const url = configKey
        ? `/configs/history?configKey=${configKey}&limit=20`
        : '/configs/history?limit=20';
      const response = await api.get(url);
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error: any) {
      message.error('加载历史失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 热更新配置
  const handleReload = async () => {
    try {
      setLoading(true);
      const response = await api.post('/configs/reload');
      if (response.data.success) {
        message.success('配置已重新加载！所有配置已从数据库刷新到内存缓存。');
        await loadStats();
        await loadAllConfigs();
      }
    } catch (error: any) {
      message.error('重新加载失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 编辑配置
  const handleEdit = (config: ConfigItem) => {
    setSelectedConfig(config);
    form.setFieldsValue({
      config_key: config.config_key,
      config_value: String(config.config_value),
      description: config.description
    });
    setEditModalVisible(true);
  };

  // 保存配置
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const response = await api.put(`/configs/${selectedConfig?.config_key}`, {
        value: values.config_value
      });

      if (response.data.success) {
        message.success('配置更新成功！建议点击"热更新配置"按钮使配置立即生效。');
        setEditModalVisible(false);
        form.resetFields();
        await loadAllConfigs();
      }
    } catch (error: any) {
      message.error('保存失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 查看历史
  const handleViewHistory = async (config: ConfigItem) => {
    setSelectedConfig(config);
    await loadHistory(config.config_key);
    setHistoryModalVisible(true);
  };

  // 分类变更
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterConfigs(configs, category, searchText);
  };

  // 搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    filterConfigs(configs, selectedCategory, value);
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (stats) {
      loadAllConfigs();
    }
  }, [stats]);

  // 表格列定义
  const columns: ColumnsType<ConfigItem> = [
    {
      title: '配置键',
      dataIndex: 'config_key',
      key: 'config_key',
      width: 280,
      fixed: 'left',
      render: (text) => <Text strong copyable={{ text }}>{text}</Text>
    },
    {
      title: '当前值',
      dataIndex: 'config_value',
      key: 'config_value',
      width: 150,
      render: (text) => <Text code style={{ fontSize: 14 }}>{text}</Text>
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (text) => {
        const colors: Record<string, string> = {
          cache: 'blue',
          cs: 'green',
          websocket: 'purple',
          security: 'red',
          rateLimit: 'orange'
        };
        return <Tag color={colors[text] || 'default'}>{text}</Tag>;
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<HistoryOutlined />}
            size="small"
            onClick={() => handleViewHistory(record)}
          >
            历史
          </Button>
        </Space>
      )
    }
  ];

  // 分类标签
  const categoryTabs = stats ? [
    { key: 'all', label: '全部', count: configs.length },
    ...Object.entries(stats.byCategory)
      .filter(([cat]) => ['cache', 'cs', 'websocket', 'security', 'rateLimit'].includes(cat))
      .map(([cat, count]) => ({
        key: cat,
        label: cat,
        count: count
      }))
  ] : [];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DatabaseOutlined /> 参数配置管理
      </Title>
      <Paragraph type="secondary">
        管理系统的参数配置，包括缓存、限流、WebSocket、客服系统和安全配置等。
      </Paragraph>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总配置数"
                value={stats.totalConfigs}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix="项"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="缓存配置"
                value={configs.length}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#52c41a' }}
                suffix="项已加载"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="配置分类"
                value={Object.keys(stats.byCategory).length}
                prefix={<InfoCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ fontSize: 14, color: '#999', marginBottom: 8 }}>最后加载时间</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>
                {new Date(stats.lastLoadTime).toLocaleString('zh-CN')}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 功能说明 */}
      <Alert
        message="配置热更新说明"
        description={
          <>
            <div>• 修改配置后，点击"热更新配置"按钮可以立即生效，无需重启服务</div>
            <div>• 部分配置（如限流器）需要重启应用才能完全生效</div>
            <div>• 所有配置变更都会自动记录到历史，可以通过"历史"按钮查看</div>
          </>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleReload}
            loading={loading}
            size="large"
          >
            热更新配置
          </Button>
          <Input.Search
            placeholder="搜索配置键或描述"
            style={{ width: 300 }}
            onSearch={handleSearch}
            allowClear
          />
        </Space>
      </Card>

      {/* 分类标签 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          {categoryTabs.map(tab => (
            <Tag
              key={tab.key}
              color={selectedCategory === tab.key ? 'blue' : 'default'}
              style={{
                cursor: 'pointer',
                padding: '4px 12px',
                fontSize: 14
              }}
              onClick={() => handleCategoryChange(tab.key)}
            >
              {tab.label} ({tab.count})
            </Tag>
          ))}
        </Space>
      </Card>

      {/* 配置表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredConfigs}
          rowKey="config_key"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条配置`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 编辑配置对话框 */}
      <Modal
        title={<><EditOutlined /> 编辑配置</>}
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="配置键" name="config_key">
            <Input disabled style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item
            label="配置值"
            name="config_value"
            rules={[
              { required: true, message: '请输入配置值' },
              {
                pattern: /^[0-9]+$/,
                message: '大部分参数配置为数字类型，请输入数字'
              }
            ]}
          >
            <Input
              placeholder="请输入新的配置值"
              style={{ fontFamily: 'monospace', fontSize: 14 }}
            />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea rows={2} disabled />
          </Form.Item>
          <Alert
            message="温馨提示"
            description="修改配置后，建议点击顶部的'热更新配置'按钮使配置立即生效。部分配置可能需要重启服务才能完全生效。"
            type="warning"
            showIcon
          />
        </Form>
      </Modal>

      {/* 历史记录对话框 */}
      <Modal
        title={
          <>
            <HistoryOutlined /> 配置历史
            {selectedConfig && <Text type="secondary" style={{ marginLeft: 8, fontSize: 14 }}>
              ({selectedConfig.config_key})
            </Text>}
          </>
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={800}
      >
        {history.length > 0 ? (
          <Timeline mode="left">
            {history.map((item, index) => (
              <Timeline.Item
                key={item.id}
                color={index === 0 ? 'green' : 'blue'}
                label={
                  <div style={{ width: 160, textAlign: 'right' }}>
                    {new Date(item.changed_at).toLocaleString('zh-CN')}
                  </div>
                }
              >
                <Card size="small" style={{ marginBottom: 8 }}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="旧值" span={1}>
                      <Text code delete type="secondary">{item.old_value || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="新值" span={1}>
                      <Text code strong style={{ color: '#52c41a' }}>{item.new_value}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="修改人" span={1}>
                      {item.changed_by}
                    </Descriptions.Item>
                    <Descriptions.Item label="原因" span={1}>
                      {item.change_reason}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 0',
            color: '#999',
            fontSize: 14
          }}>
            <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
            暂无历史记录
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TechnicalConfigManagement;
