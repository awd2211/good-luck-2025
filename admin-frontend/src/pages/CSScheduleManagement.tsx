import React, { useState, useEffect } from 'react';
import { Card, Calendar, Badge, Modal, Form, Select, Input, Button, message, Statistic, Row, Col, Table, Space, Tabs } from 'antd';
import { ClockCircleOutlined, UserOutlined, CheckCircleOutlined, SwapOutlined, BarChartOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface Schedule {
  id: number;
  agent_id: number;
  agent_name: string;
  schedule_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  notes?: string;
}

interface Agent {
  id: number;
  name: string;
}

interface SwapRequest {
  id: number;
  requester_name: string;
  target_name: string;
  status: string;
  reason?: string;
  created_at: string;
}

const CSScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [form] = Form.useForm();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // 判断是否为客服主管
  const isManager = user?.role === 'cs_manager';

  useEffect(() => {
    loadSchedules();
    // 只有主管需要加载客服列表
    if (isManager) {
      loadAgents();
      loadSwapRequests();
    }
    loadStatistics();
  }, [isManager]);

  const loadSchedules = async () => {
    try {
      const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
      const response = await apiService.get('/cs-schedule/schedules', {
        params: { startDate, endDate, limit: 500 }
      });
      setSchedules((response.data as any).data || response.data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await apiService.get('/cs/agents', { params: { limit: 100 } });
      setAgents((response.data as any).data || response.data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
      const response = await apiService.get('/cs-schedule/statistics', {
        params: { startDate, endDate }
      });
      setStatistics(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadSwapRequests = async () => {
    try {
      const response = await apiService.get('/cs-schedule/swap-requests', {
        params: { status: 'pending' }
      });
      setSwapRequests((response.data as any).data || response.data);
    } catch (error) {
      console.error('Failed to load swap requests:', error);
    }
  };

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    return schedules.filter(s => s.schedule_date === dateStr && s.is_active);
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, fontSize: '12px' }}>
        {listData.map((item) => (
          <li key={item.id}>
            <Badge
              status={
                item.shift_type === 'morning' ? 'processing' :
                item.shift_type === 'afternoon' ? 'success' :
                item.shift_type === 'night' ? 'warning' : 'default'
              }
              text={`${item.agent_name} ${item.start_time.substring(0, 5)}-${item.end_time.substring(0, 5)}`}
            />
          </li>
        ))}
      </ul>
    );
  };

  const handleDateSelect = (date: Dayjs) => {
    // 只有主管可以创建排班
    if (!isManager) {
      return;
    }
    setSelectedDate(date);
    setModalVisible(true);
    form.setFieldsValue({
      scheduleDate: date.format('YYYY-MM-DD')
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const shiftTimes: { [key: string]: { start: string; end: string } } = {
        morning: { start: '08:00:00', end: '12:00:00' },
        afternoon: { start: '13:00:00', end: '18:00:00' },
        night: { start: '18:00:00', end: '22:00:00' },
        full_day: { start: '08:00:00', end: '18:00:00' }
      };

      const times = shiftTimes[values.shiftType];

      await apiService.post('/cs-schedule/schedules', {
        agentId: values.agentId,
        scheduleDate: selectedDate.format('YYYY-MM-DD'),
        shiftType: values.shiftType,
        startTime: times.start,
        endTime: times.end,
        notes: values.notes,
        createdBy: user?.username
      });

      message.success('排班创建成功');
      setModalVisible(false);
      form.resetFields();
      loadSchedules();
      loadStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSwap = async (id: number, status: string) => {
    try {
      await apiService.post(`/cs-schedule/swap-requests/${id}/review`, {
        status,
        reviewedBy: user?.username
      });
      message.success(status === 'approved' ? '已批准调班' : '已拒绝调班');
      loadSwapRequests();
      loadSchedules();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const swapColumns = [
    {
      title: '申请人',
      dataIndex: 'requester_name',
      key: 'requester_name',
    },
    {
      title: '目标客服',
      dataIndex: 'target_name',
      key: 'target_name',
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => new Date(val).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SwapRequest) => (
        <Space>
          <Button type="primary" size="small" onClick={() => handleReviewSwap(record.id, 'approved')}>
            批准
          </Button>
          <Button danger size="small" onClick={() => handleReviewSwap(record.id, 'rejected')}>
            拒绝
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <h2><ClockCircleOutlined /> 客服排班管理</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={isManager ? 6 : 12}>
          <Card>
            <Statistic
              title={isManager ? "本月排班总数" : "我的本月排班"}
              value={statistics.totalSchedules || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={isManager ? 6 : 12}>
          <Card>
            <Statistic
              title="活跃排班"
              value={statistics.activeSchedules || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        {isManager && (
          <>
            <Col span={6}>
              <Card>
                <Statistic
                  title="客服人数"
                  value={agents.length}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="待审批调班"
                  value={swapRequests.length}
                  prefix={<SwapOutlined />}
                  valueStyle={{ color: swapRequests.length > 0 ? '#cf1322' : undefined }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      <Tabs defaultActiveKey="calendar">
        <TabPane tab={<span><ClockCircleOutlined />{isManager ? '排班日历' : '我的排班'}</span>} key="calendar">
          <Card>
            <Calendar
              dateCellRender={dateCellRender}
              onSelect={handleDateSelect}
            />
            {!isManager && (
              <div style={{ marginTop: 16, padding: 16, background: '#f0f2f5', borderRadius: 4 }}>
                <p style={{ margin: 0, color: '#666' }}>
                  💡 提示：日历中显示的是您的个人排班信息。如需调班，请联系客服主管。
                </p>
              </div>
            )}
          </Card>
        </TabPane>

        {isManager && (
          <TabPane tab={<span><SwapOutlined />调班申请</span>} key="swaps">
            <Card>
              <Table
                columns={swapColumns}
                dataSource={swapRequests}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </TabPane>
        )}

        {isManager && (
          <TabPane tab={<span><BarChartOutlined />统计分析</span>} key="stats">
            <Card title="班次分布">
              <Table
                dataSource={statistics.byShiftType || []}
                columns={[
                  { title: '班次类型', dataIndex: 'shift_type', key: 'shift_type' },
                  { title: '排班数量', dataIndex: 'count', key: 'count' }
                ]}
                pagination={false}
              />
            </Card>
            <Card title="客服排班统计" style={{ marginTop: 16 }}>
              <Table
                dataSource={statistics.byAgent || []}
                columns={[
                  { title: '客服', dataIndex: 'name', key: 'name' },
                  { title: '排班次数', dataIndex: 'schedule_count', key: 'schedule_count' }
                ]}
                pagination={false}
              />
            </Card>
          </TabPane>
        )}
      </Tabs>

      <Modal
        title={`安排排班 - ${selectedDate.format('YYYY-MM-DD')}`}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="agentId" label="客服人员" rules={[{ required: true, message: '请选择客服人员' }]}>
            <Select placeholder="选择客服" showSearch filterOption={(input, option) =>
              (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
            }>
              {agents.map(agent => (
                <Option key={agent.id} value={agent.id}>{agent.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="shiftType" label="班次" rules={[{ required: true, message: '请选择班次' }]}>
            <Select>
              <Option value="morning">早班 (08:00-12:00)</Option>
              <Option value="afternoon">午班 (13:00-18:00)</Option>
              <Option value="night">晚班 (18:00-22:00)</Option>
              <Option value="full_day">全天 (08:00-18:00)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="输入排班备注信息..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CSScheduleManagement;
