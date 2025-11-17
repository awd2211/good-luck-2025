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
  Switch,
  message,
  Statistic,
  Row,
  Col,
  Badge,
  Tabs,
  List,
  Select,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  TagsOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiService from '../services/api';

const { TabPane } = Tabs;
const { Option } = Select;

interface CustomerTag {
  id: number;
  tag_name: string;
  tag_color: string;
  description?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface Statistics {
  totalTags: number;
  activeTags: number;
  totalAssignments: number;
  topUsedTags: Array<{
    tagId: number;
    tagName: string;
    tagColor: string;
    usageCount: number;
  }>;
  tagsByCategory: Array<{
    category: string;
    count: number;
  }>;
  recentAssignments: Array<{
    userId: string;
    userName: string;
    tagName: string;
    assignedBy: string;
    assignedAt: string;
  }>;
}

const PRESET_COLORS = [
  { name: '红色', value: '#f5222d' },
  { name: '橙色', value: '#fa8c16' },
  { name: '金色', value: '#faad14' },
  { name: '绿色', value: '#52c41a' },
  { name: '青色', value: '#13c2c2' },
  { name: '蓝色', value: '#1890ff' },
  { name: '紫色', value: '#722ed1' },
  { name: '粉色', value: '#eb2f96' },
  { name: '灰色', value: '#8c8c8c' },
  { name: '金黄', value: '#FFD700' }
];

const CustomerTagManagement: React.FC = () => {
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomerTag | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    fetchTags();
    fetchStatistics();
  }, [pagination.current, filters]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      const response = await apiService.get('/customer-tags', { params });
      setTags(response.data.data || response.data);
      setPagination(prev => ({ ...prev, total: (response.data as any).pagination?.total || 0 }));
    } catch (error) {
      message.error('获取标签列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiService.get('/customer-tags/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      if (editingTag) {
        await apiService.put(`/customer-tags/${editingTag.id}`, {
          tagName: values.tagName,
          tagColor: values.tagColor,
          description: values.description,
          isActive: values.isActive
        });
        message.success('标签已更新');
      } else {
        await apiService.post('/customer-tags', {
          tagName: values.tagName,
          tagColor: values.tagColor,
          description: values.description,
          isActive: values.isActive
        });
        message.success('标签已添加');
      }
      setModalVisible(false);
      setEditingTag(null);
      form.resetFields();
      fetchTags();
      fetchStatistics();
    } catch (error) {
      message.error(editingTag ? '更新失败' : '添加失败');
    }
  };

  const handleEdit = (record: CustomerTag) => {
    setEditingTag(record);
    form.setFieldsValue({
      tagName: record.tag_name,
      tagColor: record.tag_color,
      description: record.description,
      isActive: record.is_active
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.delete(`/customer-tags/${id}`);
      message.success('已删除');
      fetchTags();
      fetchStatistics();
    } catch (error: any) {
      if (error?.response?.data?.message?.includes('currently assigned')) {
        message.error('无法删除正在使用的标签');
      } else {
        message.error('删除失败');
      }
    }
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    try {
      await apiService.put(`/customer-tags/${id}`, { isActive });
      message.success(isActive ? '已启用' : '已禁用');
      fetchTags();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSearch = (values: any) => {
    const newFilters: any = {};
    if (values.keyword) newFilters.keyword = values.keyword;
    if (values.isActive !== undefined) newFilters.isActive = values.isActive;

    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns: ColumnsType<CustomerTag> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80
    },
    {
      title: '标签名称',
      dataIndex: 'tag_name',
      width: 150,
      render: (name: string, record) => (
        <Tag color={record.tag_color} style={{ fontSize: 14 }}>
          {name}
        </Tag>
      )
    },
    {
      title: '颜色',
      dataIndex: 'tag_color',
      width: 120,
      render: (color: string) => (
        <Space>
          <div style={{
            width: 20,
            height: 20,
            backgroundColor: color,
            borderRadius: 4,
            border: '1px solid #d9d9d9'
          }} />
          <span>{color}</span>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 200,
      render: (desc: string) => desc || '-'
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      width: 100,
      sorter: (a, b) => a.usage_count - b.usage_count,
      render: (count: number) => (
        <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
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
      dataIndex: 'created_at',
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
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除标签"${record.tag_name}"吗？${record.usage_count > 0 ? '该标签正被使用，删除可能失败。' : ''}`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="标签统计" style={{ marginBottom: 24 }}>
        {statistics && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Statistic
                  title="总标签数"
                  value={statistics.totalTags}
                  prefix={<TagsOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="启用中"
                  value={statistics.activeTags}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="总使用次数"
                  value={statistics.totalAssignments}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均使用率"
                  value={statistics.totalTags > 0 ? ((statistics.totalAssignments / statistics.totalTags) * 100).toFixed(1) : 0}
                  suffix="%"
                />
              </Col>
            </Row>

            <Tabs defaultActiveKey="1">
              <TabPane tab="最常用标签 TOP 10" key="1">
                <List
                  dataSource={statistics.topUsedTags}
                  renderItem={(item, index) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Badge count={index + 1} style={{ backgroundColor: '#1890ff' }} />
                          <Tag color={item.tagColor} style={{ fontSize: 14 }}>
                            {item.tagName}
                          </Tag>
                        </Space>
                        <Tag color="orange">{item.usageCount}次使用</Tag>
                      </Space>
                    </List.Item>
                  )}
                />
              </TabPane>
              <TabPane tab="按颜色分类" key="2">
                <List
                  dataSource={statistics.tagsByCategory}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <div style={{
                            width: 20,
                            height: 20,
                            backgroundColor: item.category,
                            borderRadius: 4,
                            border: '1px solid #d9d9d9'
                          }} />
                          <span>{item.category}</span>
                        </Space>
                        <Tag>{item.count}个标签</Tag>
                      </Space>
                    </List.Item>
                  )}
                />
              </TabPane>
              <TabPane tab="最近分配记录" key="3">
                <List
                  dataSource={statistics.recentAssignments}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                          <UserOutlined />
                          <span>{item.userName}</span>
                          <span>→</span>
                          <Tag color="blue">{item.tagName}</Tag>
                        </Space>
                        <Space style={{ fontSize: 12, color: '#8c8c8c' }}>
                          <span>分配人: {item.assignedBy}</span>
                          <span>时间: {dayjs(item.assignedAt).format('YYYY-MM-DD HH:mm')}</span>
                        </Space>
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
        title="标签管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTag(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            添加标签
          </Button>
        }
      >
        <Form layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="keyword">
            <Input placeholder="搜索标签名或描述" style={{ width: 200 }} />
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
          dataSource={tags}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
          }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
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
        title={editingTag ? '编辑标签' : '添加标签'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTag(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="tagName"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="例如: VIP客户、潜在客户等" />
          </Form.Item>

          <Form.Item
            name="tagColor"
            label="标签颜色"
            rules={[{ required: true, message: '请选择标签颜色' }]}
          >
            <Select
              placeholder="选择颜色"
              showSearch
              optionFilterProp="children"
            >
              {PRESET_COLORS.map((color) => (
                <Option key={color.value} value={color.value}>
                  <Space>
                    <div style={{
                      width: 16,
                      height: 16,
                      backgroundColor: color.value,
                      borderRadius: 4,
                      border: '1px solid #d9d9d9',
                      display: 'inline-block'
                    }} />
                    <span>{color.name} ({color.value})</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea
              rows={3}
              placeholder="输入标签的用途说明..."
            />
          </Form.Item>

          <Form.Item name="isActive" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerTagManagement;
