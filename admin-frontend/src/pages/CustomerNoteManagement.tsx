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
  Tabs,
  List,
  Select,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
  StarOutlined,
  StarFilled,
  EditOutlined,
  DeleteOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiService from '../services/api';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

interface CustomerNote {
  id: number;
  user_id: string;
  content: string;
  is_important: boolean;
  created_by: string;
  creator_name: string;
  creator_role: string;
  created_at: string;
  updated_at: string;
}

interface Statistics {
  totalNotes: number;
  importantNotes: number;
  notesThisWeek: number;
  notesThisMonth: number;
  topUsers: Array<{
    userId: string;
    userName: string;
    noteCount: number;
  }>;
  recentNotes: Array<{
    id: number;
    userId: string;
    userName: string;
    content: string;
    isImportant: boolean;
    createdBy: string;
    createdAt: string;
  }>;
}

const CustomerNoteManagement: React.FC = () => {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    fetchNotes();
    fetchStatistics();
  }, [pagination.current, filters]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      const response = await apiService.get('/customer-notes', { params });
      setNotes(response.data.data || response.data);
      setPagination(prev => ({ ...prev, total: (response.data as any).pagination?.total || 0 }));
    } catch (error) {
      message.error('获取备注列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiService.get('/customer-notes/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      if (editingNote) {
        await apiService.put(`/customer-notes/${editingNote.id}`, {
          content: values.content,
          isImportant: values.isImportant
        });
        message.success('备注已更新');
      } else {
        await apiService.post('/customer-notes', {
          userId: values.userId,
          content: values.content,
          isImportant: values.isImportant
        });
        message.success('备注已添加');
      }
      setModalVisible(false);
      setEditingNote(null);
      form.resetFields();
      fetchNotes();
      fetchStatistics();
    } catch (error) {
      message.error(editingNote ? '更新失败' : '添加失败');
    }
  };

  const handleEdit = (record: CustomerNote) => {
    setEditingNote(record);
    form.setFieldsValue({
      userId: record.user_id,
      content: record.content,
      isImportant: record.is_important
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.delete(`/customer-notes/${id}`);
      message.success('已删除');
      fetchNotes();
      fetchStatistics();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggleImportant = async (id: number) => {
    try {
      await apiService.patch(`/customer-notes/${id}/toggle-important`);
      message.success('已切换重要状态');
      fetchNotes();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的备注');
      return;
    }

    try {
      await apiService.post('/customer-notes/batch-delete', {
        noteIds: selectedRowKeys
      });
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      fetchNotes();
      fetchStatistics();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  const handleSearch = (values: any) => {
    const newFilters: any = {};
    if (values.userId) newFilters.userId = values.userId;
    if (values.keyword) newFilters.keyword = values.keyword;
    if (values.isImportant !== undefined) newFilters.isImportant = values.isImportant;

    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns: ColumnsType<CustomerNote> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend'
    },
    {
      title: '客户ID',
      dataIndex: 'user_id',
      width: 150,
      render: (userId: string) => (
        <Tooltip title={userId}>
          <UserOutlined /> {userId.substring(0, 8)}...
        </Tooltip>
      ),
      sorter: (a, b) => a.user_id.localeCompare(b.user_id, 'zh-CN')
    },
    {
      title: '备注内容',
      dataIndex: 'content',
      width: 300,
      ellipsis: true,
      render: (content: string) => (
        <Tooltip title={content}>
          <span>{content}</span>
        </Tooltip>
      ),
      sorter: (a, b) => a.content.localeCompare(b.content, 'zh-CN')
    },
    {
      title: '重要',
      dataIndex: 'is_important',
      width: 80,
      render: (isImportant: boolean, record) => (
        <Button
          type="text"
          icon={isImportant ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
          onClick={() => handleToggleImportant(record.id)}
        />
      )
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      width: 120,
      render: (name: string, record) => (
        <Space direction="vertical" size="small">
          <span>{name || '未知'}</span>
          <Tag>{record.creator_role}</Tag>
        </Space>
      ),
      sorter: (a, b) => (a.creator_name || '').localeCompare(b.creator_name || '', 'zh-CN')
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
            description="确定要删除这条备注吗？"
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="备注统计" style={{ marginBottom: 24 }}>
        {statistics && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Statistic
                  title="总备注数"
                  value={statistics.totalNotes}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="重要备注"
                  value={statistics.importantNotes}
                  prefix={<StarFilled />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="本周新增"
                  value={statistics.notesThisWeek}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="本月新增"
                  value={statistics.notesThisMonth}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>

            <Tabs defaultActiveKey="1">
              <TabPane tab="备注最多的客户 TOP 10" key="1">
                <List
                  dataSource={statistics.topUsers}
                  renderItem={(item, index) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Tag color="blue">{index + 1}</Tag>
                          <UserOutlined />
                          <span>{item.userName}</span>
                        </Space>
                        <Tag color="orange">{item.noteCount}条备注</Tag>
                      </Space>
                    </List.Item>
                  )}
                />
              </TabPane>
              <TabPane tab="最近备注" key="2">
                <List
                  dataSource={statistics.recentNotes}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                          <UserOutlined />
                          <span>{item.userName}</span>
                          {item.isImportant && <StarFilled style={{ color: '#faad14' }} />}
                        </Space>
                        <div style={{ color: '#666' }}>{item.content}</div>
                        <Space style={{ fontSize: 12, color: '#8c8c8c' }}>
                          <span>创建人: {item.createdBy}</span>
                          <span>时间: {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</span>
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
        title="备注管理"
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title="批量删除"
                description={`确定要删除选中的 ${selectedRowKeys.length} 条备注吗？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger>
                  批量删除 ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingNote(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              添加备注
            </Button>
          </Space>
        }
      >
        <Form layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="userId">
            <Input placeholder="客户ID" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="备注内容关键词" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="isImportant">
            <Select placeholder="重要性" style={{ width: 120 }} allowClear>
              <Option value="true">重要</Option>
              <Option value="false">普通</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
        </Form>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={notes}
          rowKey="id"
          loading={loading}
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
        title={editingNote ? '编辑备注' : '添加备注'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingNote(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="userId"
            label="客户ID"
            rules={[{ required: !editingNote, message: '请输入客户ID' }]}
          >
            <Input
              placeholder="输入客户ID"
              disabled={!!editingNote}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="备注内容"
            rules={[{ required: true, message: '请输入备注内容' }]}
          >
            <TextArea
              rows={4}
              placeholder="输入备注内容..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="isImportant"
            label="标记为重要"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="重要" unCheckedChildren="普通" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerNoteManagement;
