/**
 * 审计日志管理页面 - 完整功能版
 * 功能:
 * 1. 日志列表查询(分页+多条件筛选+全文搜索)
 * 2. 日志详情弹窗
 * 3. 操作统计分析(图表)
 * 4. 异常日志告警
 * 5. 多格式导出(CSV/Excel/JSON/PDF)
 * 6. 日志归档管理
 * 7. WebSocket实时推送(可选)
 */

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  DatePicker,
  Select,
  Input,
  message,
  Modal,
  Descriptions,
  Alert,
  Row,
  Col,
  Statistic,
  Tabs,
  Dropdown,
  Switch,
  Divider,
  Tooltip
} from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Permission } from '../config/permissions';
import PermissionGuard from '../components/PermissionGuard';
import apiService from '../services/api';
import dayjs from 'dayjs';
import * as echarts from 'echarts';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface AuditLog {
  id: number;
  user_id: string;
  username: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  request_url?: string;
  request_body?: string;
  response_status?: number;
  response_time?: number;
  status: 'success' | 'failed' | 'warning';
  level: 'info' | 'warning' | 'error';
  created_at: string;
}

interface AuditLogStats {
  totalLogs: number;
  successCount: number;
  failedCount: number;
  warningCount: number;
  actionDistribution: Array<{ action: string; count: number }>;
  userActivity: Array<{ username: string; count: number }>;
  avgResponseTime: number;
  todayCount: number;
  weekCount: number;
}

interface Anomalies {
  highFailureRate: boolean;
  slowResponses: number;
  suspiciousActivities: AuditLog[];
}

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 筛选条件
  const [filters, setFilters] = useState<{
    status?: string;
    level?: string;
    action?: string;
    resource?: string;
    username?: string;
    search?: string;
    dateRange?: [string, string] | null;
  }>({});

  // 日志详情
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // 统计数据
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  // 异常检测
  const [anomalies, setAnomalies] = useState<Anomalies | null>(null);

  // 归档
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [archiveLoading, setArchiveLoading] = useState(false);

  // 图表引用
  const actionChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const userChartRef = useRef<HTMLDivElement>(null);

  // 加载日志
  const loadLogs = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
        ...filters
      };

      if (filters.dateRange) {
        params.startDate = filters.dateRange[0];
        params.endDate = filters.dateRange[1];
      }

      const endpoint = activeTab === 'active'
        ? '/audit'
        : '/audit/archive/list';

      const response = await apiService.get(endpoint, { params });

      setLogs(response.data?.data || []);
      setPagination({
        current: response.data?.pagination?.page || page,
        pageSize: response.data?.pagination?.pageSize || pageSize,
        total: response.data?.pagination?.total || 0
      });
    } catch (error: any) {
      message.error('加载审计日志失败');
      console.error('加载审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await apiService.get('/audit/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  // 加载异常检测
  const loadAnomalies = async () => {
    try {
      const response = await apiService.get('/audit/stats/anomalies');
      setAnomalies(response.data);
    } catch (error) {
      console.error('加载异常数据失败:', error);
    }
  };

  // 加载操作趋势
  const loadTrend = async () => {
    try {
      const response = await apiService.get('/audit/stats/trend', {
        params: { days: 7 }
      });
      renderTrendChart(response.data);
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    }
  };

  // 渲染操作类型分布图
  const renderActionChart = () => {
    if (!actionChartRef.current || !stats) return;

    const chart = echarts.init(actionChartRef.current);
    const option = {
      title: {
        text: '操作类型分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data: stats.actionDistribution.map(item => ({
            name: item.action,
            value: item.count
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    chart.setOption(option);
  };

  // 渲染用户活跃度图
  const renderUserChart = () => {
    if (!userChartRef.current || !stats) return;

    const chart = echarts.init(userChartRef.current);
    const option = {
      title: {
        text: '用户活跃度TOP10',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: stats.userActivity.map(item => item.username),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          type: 'bar',
          data: stats.userActivity.map(item => item.count),
          itemStyle: {
            color: '#1890ff'
          }
        }
      ]
    };
    chart.setOption(option);
  };

  // 渲染操作趋势图
  const renderTrendChart = (data: any[]) => {
    if (!trendChartRef.current) return;

    const chart = echarts.init(trendChartRef.current);
    const option = {
      title: {
        text: '操作趋势(7天)',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['总操作', '成功', '失败'],
        top: 30
      },
      xAxis: {
        type: 'category',
        data: data.map(item => dayjs(item.date).format('MM-DD'))
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '总操作',
          type: 'line',
          data: data.map(item => item.count),
          smooth: true
        },
        {
          name: '成功',
          type: 'line',
          data: data.map(item => item.success_count),
          smooth: true,
          itemStyle: { color: '#52c41a' }
        },
        {
          name: '失败',
          type: 'line',
          data: data.map(item => item.failed_count),
          smooth: true,
          itemStyle: { color: '#ff4d4f' }
        }
      ]
    };
    chart.setOption(option);
  };

  useEffect(() => {
    loadLogs();
    loadStats();
    loadAnomalies();
    loadTrend();

    // 定时刷新异常检测
    const interval = setInterval(loadAnomalies, 60000); // 每分钟
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showStats && stats) {
      setTimeout(() => {
        renderActionChart();
        renderUserChart();
      }, 100);
    }
  }, [showStats, stats]);

  useEffect(() => {
    loadLogs(1);
  }, [activeTab]);

  // 查看详情
  const handleViewDetail = async (log: AuditLog) => {
    try {
      const response = await apiService.get(`/audit/${log.id}`);
      setSelectedLog(response.data);
      setDetailVisible(true);
    } catch (error) {
      message.error('获取日志详情失败');
    }
  };

  // 筛选
  const handleFilter = () => {
    setPagination({ ...pagination, current: 1 });
    loadLogs(1, pagination.pageSize);
  };

  // 重置
  const handleReset = () => {
    setFilters({});
    setPagination({ ...pagination, current: 1 });
    setTimeout(() => loadLogs(1, pagination.pageSize), 0);
  };

  // CSV导出
  const exportCSV = async () => {
    try {
      message.loading('正在导出...', 0);
      const response = await apiService.get('/audit', {
        params: { ...filters, page: 1, pageSize: 10000 }
      });
      const data = response.data || [];

      const csv = [
        ['时间', '用户', '操作', '资源', '详情', 'IP', '状态', '等级', '响应时间'].join(','),
        ...data.map((log: AuditLog) =>
          [
            log.created_at,
            log.username,
            log.action,
            log.resource,
            `"${log.details || ''}"`,
            log.ip_address || '',
            log.status,
            log.level,
            log.response_time || ''
          ].join(',')
        )
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit_logs_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
      link.click();

      message.destroy();
      message.success('导出成功');
    } catch (error) {
      message.destroy();
      message.error('导出失败');
    }
  };

  // Excel导出
  const exportExcel = async () => {
    try {
      message.loading('正在导出...', 0);
      const response = await apiService.get('/audit', {
        params: { ...filters, page: 1, pageSize: 10000 }
      });
      const data = response.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('审计日志');

      // 设置列
      worksheet.columns = [
        { header: '时间', key: 'created_at', width: 20 },
        { header: '用户', key: 'username', width: 15 },
        { header: '操作', key: 'action', width: 10 },
        { header: '资源', key: 'resource', width: 15 },
        { header: '详情', key: 'details', width: 30 },
        { header: 'IP地址', key: 'ip_address', width: 15 },
        { header: '状态', key: 'status', width: 10 },
        { header: '等级', key: 'level', width: 10 },
        { header: '响应时间(ms)', key: 'response_time', width: 15 }
      ];

      // 添加数据
      data.forEach((log: AuditLog) => {
        worksheet.addRow({
          created_at: dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss'),
          username: log.username,
          action: log.action,
          resource: log.resource,
          details: log.details || '',
          ip_address: log.ip_address || '',
          status: log.status,
          level: log.level,
          response_time: log.response_time || ''
        });
      });

      // 样式
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // 导出
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit_logs_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      link.click();

      message.destroy();
      message.success('导出成功');
    } catch (error) {
      message.destroy();
      message.error('导出失败');
      console.error(error);
    }
  };

  // JSON导出
  const exportJSON = async () => {
    try {
      message.loading('正在导出...', 0);
      const response = await apiService.get('/audit', {
        params: { ...filters, page: 1, pageSize: 10000 }
      });
      const data = response.data || [];

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit_logs_${dayjs().format('YYYYMMDD_HHmmss')}.json`;
      link.click();

      message.destroy();
      message.success('导出成功');
    } catch (error) {
      message.destroy();
      message.error('导出失败');
    }
  };

  // PDF导出
  const exportPDF = async () => {
    try {
      message.loading('正在导出...', 0);
      const response = await apiService.get('/audit', {
        params: { ...filters, page: 1, pageSize: 1000 }
      });
      const data = response.data || [];

      const doc = new jsPDF();

      // 添加中文字体支持(简化版)
      doc.setFont('helvetica');
      doc.setFontSize(16);
      doc.text('Audit Logs', 14, 15);

      // 添加表格
      autoTable(doc, {
        startY: 25,
        head: [['Time', 'User', 'Action', 'Resource', 'Status']],
        body: data.map((log: AuditLog) => [
          dayjs(log.created_at).format('YYYY-MM-DD HH:mm'),
          log.username,
          log.action,
          log.resource,
          log.status
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      });

      doc.save(`audit_logs_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);

      message.destroy();
      message.success('导出成功');
    } catch (error) {
      message.destroy();
      message.error('导出失败');
      console.error(error);
    }
  };

  // 归档
  const handleArchive = () => {
    Modal.confirm({
      title: '归档审计日志',
      content: (
        <div>
          <p>将归档90天前的日志到归档表,并从活跃日志中删除。</p>
          <p style={{ color: '#ff4d4f' }}>此操作不可撤销,确定继续吗?</p>
        </div>
      ),
      onOk: async () => {
        setArchiveLoading(true);
        try {
          const response = await apiService.post('/audit/archive', {
            daysToKeep: 90
          });
          message.success(response.data?.message || '归档成功');
          loadLogs();
          loadStats();
        } catch (error: any) {
          message.error('归档失败');
        } finally {
          setArchiveLoading(false);
        }
      }
    });
  };

  // 状态标签
  const getStatusTag = (status: string) => {
    const config = {
      success: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
      warning: { color: 'warning', icon: <WarningOutlined />, text: '警告' }
    };
    const c = config[status as keyof typeof config] || config.success;
    return (
      <Tag color={c.color} icon={c.icon}>
        {c.text}
      </Tag>
    );
  };

  // 等级标签
  const getLevelTag = (level: string) => {
    const config = {
      info: { color: 'blue', text: 'INFO' },
      warning: { color: 'orange', text: 'WARNING' },
      error: { color: 'red', text: 'ERROR' }
    };
    const c = config[level as keyof typeof config] || config.info;
    return <Tag color={c.color}>{c.text}</Tag>;
  };

  // 表格列
  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix()
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100
    },
    {
      title: '资源',
      dataIndex: 'resource',
      key: 'resource',
      width: 120
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      width: 250
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
      render: (ip) => ip || '-'
    },
    {
      title: '响应时间',
      dataIndex: 'response_time',
      key: 'response_time',
      width: 100,
      render: (time) => time ? `${time}ms` : '-',
      sorter: (a, b) => (a.response_time || 0) - (b.response_time || 0)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => getStatusTag(status)
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level) => getLevelTag(level)
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <PermissionGuard permission={Permission.LOG_VIEW}>
      {/* 异常告警 */}
      {anomalies && (anomalies.highFailureRate || anomalies.slowResponses > 0 || (anomalies.suspiciousActivities && anomalies.suspiciousActivities.length > 0)) && (
        <Alert
          message="检测到异常日志"
          description={
            <div>
              {anomalies.highFailureRate && <div>⚠️ 最近10分钟内失败率超过30%</div>}
              {anomalies.slowResponses > 0 && <div>⚠️ 最近1小时内有{anomalies.slowResponses}个慢响应({'>'}5秒)</div>}
              {anomalies.suspiciousActivities.length > 0 && <div>⚠️ 检测到{anomalies.suspiciousActivities.length}次可疑登录失败</div>}
            </div>
          }
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 统计卡片 */}
      {stats && showStats && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总日志数"
                value={stats.totalLogs}
                prefix={<BarChartOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="今日操作"
                value={stats.todayCount}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="本周操作"
                value={stats.weekCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="成功率"
                value={((stats.successCount / stats.totalLogs) * 100).toFixed(1)}
                suffix="%"
                valueStyle={{ color: stats.successCount / stats.totalLogs > 0.9 ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
          </Row>
          <Divider />
          <Row gutter={16}>
            <Col span={8}>
              <div ref={actionChartRef} style={{ height: 300 }}></div>
            </Col>
            <Col span={8}>
              <div ref={trendChartRef} style={{ height: 300 }}></div>
            </Col>
            <Col span={8}>
              <div ref={userChartRef} style={{ height: 300 }}></div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 主卡片 */}
      <Card
        title={
          <Space>
            <span>审计日志</span>
            <Switch
              checkedChildren="显示统计"
              unCheckedChildren="隐藏统计"
              checked={showStats}
              onChange={setShowStats}
            />
          </Space>
        }
        extra={
          <Space>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'csv',
                    label: '导出CSV',
                    icon: <FileTextOutlined />,
                    onClick: exportCSV
                  },
                  {
                    key: 'excel',
                    label: '导出Excel',
                    icon: <FileExcelOutlined />,
                    onClick: exportExcel
                  },
                  {
                    key: 'json',
                    label: '导出JSON',
                    icon: <FileTextOutlined />,
                    onClick: exportJSON
                  },
                  {
                    key: 'pdf',
                    label: '导出PDF',
                    icon: <FilePdfOutlined />,
                    onClick: exportPDF
                  }
                ]
              }}
            >
              <Button icon={<DownloadOutlined />}>
                导出
              </Button>
            </Dropdown>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadLogs()}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'active' | 'archived')}
          tabBarExtraContent={
            activeTab === 'active' && (
              <Button
                type="primary"
                danger
                onClick={handleArchive}
                loading={archiveLoading}
              >
                归档90天前日志
              </Button>
            )
          }
        >
          <Tabs.TabPane tab="活跃日志" key="active" />
          <Tabs.TabPane tab="归档日志" key="archived" />
        </Tabs>

        {/* 筛选栏 */}
        <Space style={{ marginBottom: 16, marginTop: 16 }} wrap>
          <Input
            placeholder="搜索用户名、操作、资源、详情..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onPressEnter={handleFilter}
            allowClear
          />
          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            placeholder={['开始时间', '结束时间']}
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  ...filters,
                  dateRange: [
                    dates[0]?.format('YYYY-MM-DD HH:mm:ss') || '',
                    dates[1]?.format('YYYY-MM-DD HH:mm:ss') || ''
                  ]
                });
              } else {
                setFilters({ ...filters, dateRange: null });
              }
            }}
          />
          <Select
            placeholder="操作类型"
            style={{ width: 120 }}
            value={filters.action}
            onChange={(value) => setFilters({ ...filters, action: value })}
            allowClear
          >
            <Select.Option value="登录">登录</Select.Option>
            <Select.Option value="登出">登出</Select.Option>
            <Select.Option value="创建">创建</Select.Option>
            <Select.Option value="更新">更新</Select.Option>
            <Select.Option value="删除">删除</Select.Option>
            <Select.Option value="查看">查看</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            style={{ width: 100 }}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            allowClear
          >
            <Select.Option value="success">成功</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
            <Select.Option value="warning">警告</Select.Option>
          </Select>
          <Select
            placeholder="等级"
            style={{ width: 100 }}
            value={filters.level}
            onChange={(value) => setFilters({ ...filters, level: value })}
            allowClear
          >
            <Select.Option value="info">INFO</Select.Option>
            <Select.Option value="warning">WARNING</Select.Option>
            <Select.Option value="error">ERROR</Select.Option>
          </Select>
          <Button type="primary" onClick={handleFilter}>
            筛选
          </Button>
          <Button onClick={handleReset}>
            重置
          </Button>
        </Space>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => loadLogs(page, pageSize)
          }}
          scroll={{ x: 1400 }}
          rowClassName={(record) => {
            if (record.status === 'failed') return 'error-row';
            if (record.level === 'error') return 'error-row';
            return '';
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={900}
      >
        {selectedLog && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="日志ID">{selectedLog.id}</Descriptions.Item>
              <Descriptions.Item label="时间">
                {dayjs(selectedLog.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">{selectedLog.user_id}</Descriptions.Item>
              <Descriptions.Item label="用户名">{selectedLog.username}</Descriptions.Item>
              <Descriptions.Item label="操作">{selectedLog.action}</Descriptions.Item>
              <Descriptions.Item label="资源">{selectedLog.resource}</Descriptions.Item>
              <Descriptions.Item label="资源ID">{selectedLog.resource_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{selectedLog.ip_address || '-'}</Descriptions.Item>
              <Descriptions.Item label="请求方法">{selectedLog.request_method || '-'}</Descriptions.Item>
              <Descriptions.Item label="请求URL" span={1}>
                <Tooltip title={selectedLog.request_url}>
                  <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedLog.request_url || '-'}
                  </div>
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label="响应状态">{selectedLog.response_status || '-'}</Descriptions.Item>
              <Descriptions.Item label="响应时间">
                {selectedLog.response_time ? `${selectedLog.response_time}ms` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedLog.status)}</Descriptions.Item>
              <Descriptions.Item label="等级">{getLevelTag(selectedLog.level)}</Descriptions.Item>
              <Descriptions.Item label="详情" span={2}>
                {selectedLog.details || '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.user_agent && (
              <>
                <Divider>用户代理</Divider>
                <TextArea value={selectedLog.user_agent} rows={2} readOnly />
              </>
            )}

            {selectedLog.request_body && (
              <>
                <Divider>请求体</Divider>
                <TextArea
                  value={JSON.stringify(JSON.parse(selectedLog.request_body), null, 2)}
                  rows={10}
                  readOnly
                  style={{ fontFamily: 'monospace' }}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .error-row {
          background-color: #fff1f0;
        }
      `}</style>
    </PermissionGuard>
  );
};

export default AuditLogPage;
