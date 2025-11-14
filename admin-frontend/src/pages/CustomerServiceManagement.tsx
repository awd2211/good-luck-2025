import React, { useState, useEffect } from 'react';
import {
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
  Card,
  Statistic,
  Row,
  Col,
  Badge,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiService from '../services/apiService';

interface CSAgent {
  id: number;
  admin_id: string;
  display_name: string;
  avatar_url?: string;
  role: 'manager' | 'agent';
  status: 'online' | 'busy' | 'offline';
  max_concurrent_chats: number;
  current_chat_count: number;
  specialty_tags?: string[];
  manager_id?: number;
  is_active: boolean;
  last_online_at?: string;
  created_at: string;
  updated_at: string;
}

interface OnlineStatistics {
  total: number;
  online: number;
  busy: number;
  offline: number;
  avgLoad: number;
}

const CustomerServiceManagement: React.FC = () => {
  const [agents, setAgents] = useState<CSAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [statistics, setStatistics] = useState<OnlineStatistics | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CSAgent | null>(null);
  const [form] = Form.useForm();

  // 筛选条件
  const [filters] = useState({
    role: undefined as string | undefined,
    status: undefined as string | undefined,
    isActive: undefined as boolean | undefined
  });

  // 加载客服列表
  const loadAgents = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
        ...filters
      };

      const response = await apiService.get('/cs/agents', params);

      if (response.data.success && response.data.data) {
        setAgents(Array.isArray(response.data.data) ? response.data.data : []);
        setPagination({
          current: page,
          pageSize,
          total: response.data.pagination?.total || 0
        });
      }
    } catch (error: any) {
      message.error(error.message || '加载客服列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      const response = await apiService.get('/cs/stats/online');
      if (response.data.success && response.data.data) {
        // 将后端返回的数据转换为前端期望的格式
        const backendData = response.data.data;
        setStatistics({
          total: backendData.onlineAgents + backendData.busyAgents || 0,
          online: backendData.onlineAgents || 0,
          busy: backendData.busyAgents || 0,
          offline: 0,
          avgLoad: backendData.avgWaitTime || 0
        });
      }
    } catch (error: any) {
      console.error('加载统计数据失败:', error);
    }
  };

  useEffect(() => {
    loadAgents();
    loadStatistics();

    // 每30秒刷新统计数据
    const interval = setInterval(loadStatistics, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  // 创建/编辑客服
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingAgent) {
        // 编辑
        const response = await apiService.put(`/cs/agents/${editingAgent.id}`, values);
        if (response.data.success) {
          message.success('客服信息更新成功');
          setModalVisible(false);
          loadAgents(pagination.current, pagination.pageSize);
        }
      } else {
        // 创建
        const response = await apiService.post('/cs/agents', values);
        if (response.data.success) {
          message.success('客服创建成功');
          setModalVisible(false);
          loadAgents(pagination.current, pagination.pageSize);
        }
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 删除客服
  const handleDelete = async (id: number) => {
    try {
      const response = await apiService.delete(`/cs/agents/${id}`);
      if (response.data.success) {
        message.success('客服删除成功');
        loadAgents(pagination.current, pagination.pageSize);
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 更新客服状态
  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await apiService.put(`/cs/agents/${id}/status`, { status });
      if (response.data.success) {
        message.success('状态更新成功');
        loadAgents(pagination.current, pagination.pageSize);
        loadStatistics();
      }
    } catch (error: any) {
      message.error(error.message || '状态更新失败');
    }
  };

  // 打开编辑对话框
  const handleEdit = (agent: CSAgent) => {
    setEditingAgent(agent);
    form.setFieldsValue({
      ...agent,
      specialty_tags: agent.specialty_tags?.join(',') || ''
    });
    setModalVisible(true);
  };

  // 打开新建对话框
  const handleCreate = () => {
    setEditingAgent(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 状态标签颜色
  // @ts-ignore - 保留供未来使用
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'busy':
        return 'warning';
      case 'offline':
        return 'default';
      default:
        return 'default';
    }
  };

  // 状态文本
  // @ts-ignore - 保留供未来使用
  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return '在线';
      case 'busy':
        return '忙碌';
      case 'offline':
        return '离线';
      default:
        return status;
    }
  };

  // 表格列定义
  const columns: ColumnsType<CSAgent> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '姓名',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (text, record) => (
        <Space>
          {record.avatar_url ? (
            <img
              src={record.avatar_url}
              alt={text}
              style={{ width: 32, height: 32, borderRadius: '50%' }}
            />
          ) : (
            <UserOutlined style={{ fontSize: 32 }} />
          )}
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'manager' ? 'blue' : 'default'}>
          {role === 'manager' ? '客服经理' : '客服'}
        </Tag>
      ),
      filters: [
        { text: '客服经理', value: 'manager' },
        { text: '客服', value: 'agent' }
      ]
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 100 }}
          onChange={(value) => handleUpdateStatus(record.id, value)}
          size="small"
        >
          <Select.Option value="online">
            <Badge status="success" text="在线" />
          </Select.Option>
          <Select.Option value="busy">
            <Badge status="warning" text="忙碌" />
          </Select.Option>
          <Select.Option value="offline">
            <Badge status="default" text="离线" />
          </Select.Option>
        </Select>
      ),
      filters: [
        { text: '在线', value: 'online' },
        { text: '忙碌', value: 'busy' },
        { text: '离线', value: 'offline' }
      ]
    },
    {
      title: '当前接待',
      key: 'load',
      render: (_, record) => (
        <span>
          {record.current_chat_count} / {record.max_concurrent_chats}
        </span>
      ),
      sorter: (a, b) => a.current_chat_count - b.current_chat_count
    },
    {
      title: '负载率',
      key: 'utilization',
      render: (_, record) => {
        const rate = record.max_concurrent_chats > 0
          ? (record.current_chat_count / record.max_concurrent_chats * 100).toFixed(0)
          : 0;
        return <span>{rate}%</span>;
      },
      sorter: (a, b) => {
        const rateA = a.max_concurrent_chats > 0 ? a.current_chat_count / a.max_concurrent_chats : 0;
        const rateB = b.max_concurrent_chats > 0 ? b.current_chat_count / b.max_concurrent_chats : 0;
        return rateA - rateB;
      }
    },
    {
      title: '专长标签',
      dataIndex: 'specialty_tags',
      key: 'specialty_tags',
      render: (tags: string[]) =>
        tags?.map((tag, index) => (
          <Tag key={index} color="blue">
            {tag}
          </Tag>
        ))
    },
    {
      title: '最后在线',
      dataIndex: 'last_online_at',
      key: 'last_online_at',
      render: (time) => (time ? new Date(time).toLocaleString() : '-')
    },
    {
      title: '启用状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '启用' : '停用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="查看统计">
            <Button
              type="link"
              icon={<BarChartOutlined />}
              onClick={() => message.info('统计功能开发中')}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除该客服吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>客服管理</h2>

      {/* 统计卡片 */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总客服数"
                value={statistics.total}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="在线客服"
                value={statistics.online}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="忙碌客服"
                value={statistics.busy}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均负载"
                value={statistics.avgLoad.toFixed(2)}
                suffix="会话/人"
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 操作按钮 */}
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          新建客服
        </Button>
        <Button onClick={() => loadAgents(pagination.current, pagination.pageSize)}>
          刷新
        </Button>
      </Space>

      {/* 客服表格 */}
      <Table
        columns={columns}
        dataSource={agents}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadAgents(page, pageSize)
        }}
        scroll={{ x: 1200 }}
      />

      {/* 新建/编辑对话框 */}
      <Modal
        title={editingAgent ? '编辑客服' : '新建客服'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {!editingAgent && (
            <Form.Item
              label="管理员ID"
              name="adminId"
              rules={[{ required: true, message: '请输入管理员ID' }]}
            >
              <Input placeholder="关联的管理员账号ID" />
            </Form.Item>
          )}

          <Form.Item
            label="显示名称"
            name="display_name"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="客服显示名称" />
          </Form.Item>

          <Form.Item label="头像URL" name="avatar_url">
            <Input placeholder="头像图片URL" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色">
              <Select.Option value="agent">客服</Select.Option>
              <Select.Option value="manager">客服经理</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="上级经理ID" name="manager_id">
            <Input type="number" placeholder="上级客服经理的ID(可选)" />
          </Form.Item>

          <Form.Item
            label="最大并发接待数"
            name="max_concurrent_chats"
            initialValue={5}
          >
            <Input type="number" min={1} max={20} />
          </Form.Item>

          <Form.Item label="专长标签" name="specialty_tags">
            <Input placeholder="用逗号分隔,如: 算命,占卜,风水" />
          </Form.Item>

          <Form.Item label="启用状态" name="is_active" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerServiceManagement;
