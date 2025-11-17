import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, Switch, message, Tabs, Space, Tag, Statistic, Row, Col, Progress } from 'antd';
import { BookOutlined, TrophyOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface Course {
  id: number;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  duration_minutes?: number;
  passing_score: number;
  is_mandatory: boolean;
  is_published: boolean;
  created_by?: string;
  created_at: string;
}

interface TrainingRecord {
  id: number;
  agent_id: number;
  agent_name: string;
  course_id: number;
  course_title: string;
  status: string;
  score?: number;
  attempts: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

const TrainingManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    loadCourses();
    loadRecords();
    loadStatistics();
  }, []);

  const loadCourses = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await api.get('/training/courses', {
        params: { page, limit }
      });
      const data = (response.data as any).data || response.data;
      const paginationData = (response.data as any).pagination;
      setCourses(data);
      if (paginationData) {
        setPagination(prev => ({
          ...prev,
          current: page,
          total: paginationData.totalPages * limit
        }));
      }
    } catch (error) {
      message.error('加载课程失败');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      const response = await api.get('/training/records', {
        params: { limit: 100 }
      });
      setRecords((response.data as any).data || response.data);
    } catch (error) {
      console.error('Failed to load records:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get('/training/statistics');
      setStatistics(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    courseForm.resetFields();
    setCourseModalVisible(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    courseForm.setFieldsValue({
      title: course.title,
      description: course.description,
      content: course.content,
      category: course.category,
      durationMinutes: course.duration_minutes,
      passingScore: course.passing_score,
      isMandatory: course.is_mandatory,
      isPublished: course.is_published
    });
    setCourseModalVisible(true);
  };

  const handleCourseSubmit = async () => {
    try {
      setLoading(true);
      const values = await courseForm.validateFields();

      if (editingCourse) {
        await api.put(`/training/courses/${editingCourse.id}`, values);
        message.success('课程更新成功');
      } else {
        await api.post('/training/courses', {
          ...values,
          createdBy: user?.username
        });
        message.success('课程创建成功');
      }

      setCourseModalVisible(false);
      courseForm.resetFields();
      loadCourses();
      loadStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个课程吗？',
      onOk: async () => {
        try {
          await api.delete(`/training/courses/${id}`);
          message.success('课程已删除');
          loadCourses();
          loadStatistics();
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败');
        }
      }
    });
  };

  const courseColumns = [
    {
      title: '课程名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (val: string) => <Tag color="blue">{val || '未分类'}</Tag>
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
    },
    {
      title: '及格分',
      dataIndex: 'passing_score',
      key: 'passing_score',
    },
    {
      title: '必修',
      dataIndex: 'is_mandatory',
      key: 'is_mandatory',
      render: (val: boolean) => val ? <Tag color="red">必修</Tag> : <Tag>选修</Tag>
    },
    {
      title: '状态',
      dataIndex: 'is_published',
      key: 'is_published',
      render: (val: boolean) => val ? <Tag color="green">已发布</Tag> : <Tag color="orange">草稿</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => new Date(val).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Course) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEditCourse(record)}>
            编辑
          </Button>
          <Button type="link" danger size="small" onClick={() => handleDeleteCourse(record.id)}>
            删除
          </Button>
        </Space>
      )
    }
  ];

  const recordColumns = [
    {
      title: '客服',
      dataIndex: 'agent_name',
      key: 'agent_name',
    },
    {
      title: '课程',
      dataIndex: 'course_title',
      key: 'course_title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const statusMap: { [key: string]: { color: string; text: string } } = {
          not_started: { color: 'default', text: '未开始' },
          in_progress: { color: 'processing', text: '进行中' },
          completed: { color: 'success', text: '已完成' },
          failed: { color: 'error', text: '未通过' }
        };
        const status = statusMap[val] || { color: 'default', text: val };
        return <Tag color={status.color}>{status.text}</Tag>;
      }
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      render: (val?: number) => val !== null && val !== undefined ? val : '-'
    },
    {
      title: '尝试次数',
      dataIndex: 'attempts',
      key: 'attempts',
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (val?: string) => val ? new Date(val).toLocaleString() : '-'
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (val?: string) => val ? new Date(val).toLocaleString() : '-'
    }
  ];

  const completionRate = statistics.totalRecords > 0
    ? Math.round((statistics.completedRecords / statistics.totalRecords) * 100)
    : 0;

  return (
    <div>
      <h2><BookOutlined /> 培训系统管理</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="课程总数"
              value={statistics.totalCourses || 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发布课程"
              value={statistics.publishedCourses || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="培训记录"
              value={statistics.totalRecords || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均分"
              value={statistics.averageScore ? statistics.averageScore.toFixed(1) : 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <h4>完成率</h4>
            <Progress percent={completionRate} status="active" />
          </Col>
          <Col span={12}>
            <h4>课程统计</h4>
            <p>必修课程: {statistics.mandatoryCourses || 0}</p>
            <p>已完成培训: {statistics.completedRecords || 0}</p>
          </Col>
        </Row>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><BookOutlined />课程管理</span>} key="courses">
          <Card
            extra={
              <Button type="primary" onClick={handleCreateCourse}>
                新建课程
              </Button>
            }
          >
            <Table
              columns={courseColumns}
              dataSource={courses}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: (page, pageSize) => loadCourses(page, pageSize)
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><ClockCircleOutlined />培训记录</span>} key="records">
          <Card>
            <Table
              columns={recordColumns}
              dataSource={records}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingCourse ? '编辑课程' : '新建课程'}
        open={courseModalVisible}
        onOk={handleCourseSubmit}
        onCancel={() => setCourseModalVisible(false)}
        confirmLoading={loading}
        width={800}
      >
        <Form form={courseForm} layout="vertical">
          <Form.Item name="title" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
            <Input placeholder="输入课程名称" />
          </Form.Item>
          <Form.Item name="description" label="课程描述">
            <TextArea rows={3} placeholder="输入课程简介..." />
          </Form.Item>
          <Form.Item name="content" label="课程内容">
            <SunEditor
              height="200"
              setOptions={{
                buttonList: [
                  ['undo', 'redo'],
                  ['bold', 'underline', 'italic', 'strike'],
                  ['fontColor', 'hiliteColor'],
                  ['removeFormat'],
                  ['outdent', 'indent'],
                  ['align', 'horizontalRule', 'list', 'lineHeight'],
                  ['table', 'link'],
                  ['fullScreen', 'showBlocks', 'codeView']
                ]
              }}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Select placeholder="选择分类">
                  <Option value="basic">基础培训</Option>
                  <Option value="communication">沟通技巧</Option>
                  <Option value="system">系统操作</Option>
                  <Option value="product">产品知识</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="durationMinutes" label="时长(分钟)">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="课程时长" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="passingScore" label="及格分" initialValue={80}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isMandatory" label="必修课程" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isPublished" label="发布课程" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TrainingManagement;
