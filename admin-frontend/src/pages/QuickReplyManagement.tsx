/**
 * 快捷回复管理页面
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
  Space,
  Tag,
  message,
  Popconfirm,
  Statistic,
  Row,
  Col,
  Switch,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  FireOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiService from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface QuickReply {
  id: number;
  agent_id: number | null;
  category: string;
  title: string;
  content: string;
  shortcut_key: string | null;
  use_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  category: string;
  count: number;
}

const QuickReplyManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topReplies, setTopReplies] = useState<QuickReply[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    fetchReplies();
    fetchCategories();
    fetchTopReplies();
  }, [page, selectedCategory, showPublicOnly]);

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/cs/quick-replies', {
        params: {
          page,
          limit,
          category: selectedCategory,
          isPublic: showPublicOnly ? true : undefined,
          isActive: true
        }
      });
      setReplies(Array.isArray(response.data.data) ? response.data.data : []);
      setTotal(response.data.pagination?.total || 0);
    } catch (error) {
      message.error('加载快捷回复失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.get('/cs/quick-replies/categories');
      setCategories(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('加载分类失败', error);
    }
  };

  const fetchTopReplies = async () => {
    try {
      const response = await apiService.get('/cs/quick-replies/top', {
        params: { limit: 5 }
      });
      setTopReplies(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('加载热门回复失败', error);
    }
  };

  const handleAdd = () => {
    setEditingReply(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: QuickReply) => {
    setEditingReply(record);
    form.setFieldsValue({
      category: record.category,
      title: record.title,
      content: record.content,
      shortcut_key: record.shortcut_key,
      is_active: record.is_active
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.delete(`/cs/quick-replies/${id}`);
      message.success('删除成功');
      fetchReplies();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingReply) {
        await apiService.put(`/cs/quick-replies/${editingReply.id}`, values);
        message.success('更新成功');
      } else {
        await apiService.post('/cs/quick-replies', {
          ...values,
          agentId: null // 默认创建公共模板
        });
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchReplies();
      fetchCategories();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns: ColumnsType<QuickReply> = [
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => {
        const colorMap: Record<string, string> = {
          greeting: 'blue',
          product: 'green',
          after_sales: 'orange',
          closing: 'purple',
          general: 'default'
        };
        const nameMap: Record<string, string> = {
          greeting: '问候语',
          product: '产品介绍',
          after_sales: '售后服务',
          closing: '结束语',
          general: '通用'
        };
        return (
          <Tag color={colorMap[category] || 'default'}>
            {nameMap[category] || category}
          </Tag>
        );
      }
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: QuickReply) => (
        <Space>
          <strong>{title}</strong>
          {record.agent_id === null && (
            <Tag color="gold" style={{ fontSize: '10px' }}>公共</Tag>
          )}
        </Space>
      )
    },
    {
      title: '回复内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string) => (
        <span style={{ color: '#666' }}>{content}</span>
      )
    },
    {
      title: '快捷键',
      dataIndex: 'shortcut_key',
      key: 'shortcut_key',
      width: 100,
      render: (key: string | null) =>
        key ? (
          <Tag icon={<ThunderboltOutlined />} color="cyan">
            {key}
          </Tag>
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        )
    },
    {
      title: '使用次数',
      dataIndex: 'use_count',
      key: 'use_count',
      width: 100,
      sorter: (a, b) => a.use_count - b.use_count,
      render: (count: number) => (
        <Badge
          count={count}
          showZero
          style={{ backgroundColor: count > 100 ? '#52c41a' : '#999' }}
        />
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (record: QuickReply) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此快捷回复?"
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
        {/* 统计卡片 */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总模板数"
                value={total}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="分类数"
                value={categories.length}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="公共模板"
                value={replies.filter(r => r.agent_id === null).length}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总使用次数"
                value={replies.reduce((sum, r) => sum + r.use_count, 0)}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 热门模板 */}
        {topReplies.length > 0 && (
          <Card title={<Space><FireOutlined style={{ color: '#ff4d4f' }} />热门快捷回复 Top 5</Space>} size="small">
            <Space wrap>
              {topReplies.map((reply) => (
                <Tag key={reply.id} color="red" style={{ fontSize: '13px', padding: '4px 10px' }}>
                  {reply.title} ({reply.use_count}次)
                </Tag>
              ))}
            </Space>
          </Card>
        )}

        {/* 主表格 */}
        <Card
          title="快捷回复列表"
          extra={
            <Space>
              <Select
                style={{ width: 150 }}
                placeholder="选择分类"
                allowClear
                value={selectedCategory}
                onChange={setSelectedCategory}
              >
                {categories.map((cat) => (
                  <Option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </Option>
                ))}
              </Select>
              <Space>
                <span>仅公共:</span>
                <Switch checked={showPublicOnly} onChange={setShowPublicOnly} />
              </Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加模板
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={replies}
            rowKey="id"
            loading={loading}
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
            }}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              onChange: setPage,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`
            }}
          />
        </Card>
      </Space>

      {/* 编辑/新增弹窗 */}
      <Modal
        title={editingReply ? '编辑快捷回复' : '添加快捷回复'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="选择分类">
              <Option value="greeting">问候语</Option>
              <Option value="product">产品介绍</Option>
              <Option value="after_sales">售后服务</Option>
              <Option value="closing">结束语</Option>
              <Option value="general">通用</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="如: 问候语-早上好" />
          </Form.Item>

          <Form.Item
            label="回复内容"
            name="content"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入快捷回复的内容"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="快捷键"
            name="shortcut_key"
            tooltip="输入快捷键后可快速调用,如 /morning"
          >
            <Input placeholder="如: /morning" prefix="/" />
          </Form.Item>

          <Form.Item label="启用" name="is_active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuickReplyManagement;
