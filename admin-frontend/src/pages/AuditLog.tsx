import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, DatePicker, Select, message } from 'antd'
import { DownloadOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  AuditLog,
  getLogsFromStorage,
  clearLogsFromStorage,
  exportLogsAsJSON,
  LogLevel,
  actionDescriptions,
} from '../utils/auditLog'
import { Permission } from '../config/permissions'
import PermissionGuard from '../components/PermissionGuard'
import dayjs from 'dayjs'

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, levelFilter, moduleFilter])

  const loadLogs = () => {
    const storedLogs = getLogsFromStorage()
    setLogs(storedLogs)
  }

  const filterLogs = () => {
    let filtered = logs

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter)
    }

    if (moduleFilter !== 'all') {
      filtered = filtered.filter(log => log.module === moduleFilter)
    }

    setFilteredLogs(filtered)
  }

  const handleClearLogs = () => {
    if (window.confirm('确定要清空所有日志吗？此操作不可恢复！')) {
      clearLogsFromStorage()
      setLogs([])
      message.success('日志已清空')
    }
  }

  const handleExportLogs = () => {
    exportLogsAsJSON()
    message.success('日志已导出')
  }

  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: LogLevel) => {
        const colors = {
          [LogLevel.INFO]: 'blue',
          [LogLevel.WARN]: 'orange',
          [LogLevel.ERROR]: 'red',
          [LogLevel.SUCCESS]: 'green',
        }
        const labels = {
          [LogLevel.INFO]: '信息',
          [LogLevel.WARN]: '警告',
          [LogLevel.ERROR]: '错误',
          [LogLevel.SUCCESS]: '成功',
        }
        return <Tag color={colors[level]}>{labels[level]}</Tag>
      },
      filters: [
        { text: '信息', value: LogLevel.INFO },
        { text: '警告', value: LogLevel.WARN },
        { text: '错误', value: LogLevel.ERROR },
        { text: '成功', value: LogLevel.SUCCESS },
      ],
      onFilter: (value, record) => record.level === value,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (module: string) => <Tag>{module}</Tag>,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => actionDescriptions[action as keyof typeof actionDescriptions] || action,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 150,
    },
  ]

  // 获取唯一的模块列表
  const modules = Array.from(new Set(logs.map(log => log.module)))

  return (
    <PermissionGuard permission={Permission.LOG_VIEW}>
      <Card
        title="操作日志"
        extra={
          <Space>
            <Select
              value={levelFilter}
              onChange={setLevelFilter}
              style={{ width: 120 }}
              options={[
                { label: '全部级别', value: 'all' },
                { label: '信息', value: LogLevel.INFO },
                { label: '警告', value: LogLevel.WARN },
                { label: '错误', value: LogLevel.ERROR },
                { label: '成功', value: LogLevel.SUCCESS },
              ]}
            />
            <Select
              value={moduleFilter}
              onChange={setModuleFilter}
              style={{ width: 120 }}
              options={[
                { label: '全部模块', value: 'all' },
                ...modules.map(m => ({ label: m, value: m })),
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={loadLogs}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportLogs}>
              导出
            </Button>
            <PermissionGuard permission={Permission.LOG_DELETE} noFallback>
              <Button danger icon={<DeleteOutlined />} onClick={handleClearLogs}>
                清空
              </Button>
            </PermissionGuard>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条日志`,
          }}
          expandable={{
            expandedRowRender: record => (
              <div style={{ padding: 16 }}>
                <p><strong>详细信息：</strong></p>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  {JSON.stringify(record.details, null, 2)}
                </pre>
                <p><strong>User Agent：</strong> {record.userAgent}</p>
              </div>
            ),
          }}
        />
      </Card>
    </PermissionGuard>
  )
}

export default AuditLogPage
