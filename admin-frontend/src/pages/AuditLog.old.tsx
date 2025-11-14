import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, DatePicker, Select, message } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Permission } from '../config/permissions'
import PermissionGuard from '../components/PermissionGuard'
import { getAuditLogs } from '../services/apiService'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface AuditLog {
  id: string
  userId: string
  username: string
  action: string
  resource: string
  details: string
  ip?: string
  userAgent?: string
  status: string
  timestamp: string
}

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>()
  const [actionFilter, setActionFilter] = useState<string>()
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    try {
      const params: any = {
        page,
        pageSize,
        status: statusFilter || undefined,
        action: actionFilter || undefined,
        startDate: dateRange?.[0] || undefined,
        endDate: dateRange?.[1] || undefined
      }

      const response = await getAuditLogs(params)

      setLogs(response.data || [])
      setPagination({
        current: response.pagination?.page || page,
        pageSize: response.pagination?.pageSize || pageSize,
        total: response.pagination?.total || 0
      })
    } catch (error: any) {
      message.error('加载审计日志失败')
      console.error('加载审计日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    setPagination({ ...pagination, current: 1 })
    loadLogs(1, pagination.pageSize)
  }

  const handleExport = async () => {
    try {
      message.loading('正在导出...', 0)
      const params: any = {
        status: statusFilter || undefined,
        action: actionFilter || undefined,
        startDate: dateRange?.[0] || undefined,
        endDate: dateRange?.[1] || undefined
      }

      // 简单导出为CSV
      const response = await getAuditLogs(params)
      const data = response.data || []

      const csv = [
        ['时间', '用户', '操作', '资源', '详情', 'IP', '状态'].join(','),
        ...data.map((log: AuditLog) =>
          [
            log.timestamp,
            log.username,
            log.action,
            log.resource,
            `"${log.details}"`,
            log.ip || '',
            log.status
          ].join(',')
        )
      ].join('\n')

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `audit_logs_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
      link.click()

      message.destroy()
      message.success('导出成功')
    } catch (error) {
      message.destroy()
      message.error('导出失败')
    }
  }

  const getStatusTag = (status: string) => {
    return status === 'success' ? (
      <Tag color="success">成功</Tag>
    ) : (
      <Tag color="error">失败</Tag>
    )
  }

  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix()
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
      width: 100,
      filters: [
        { text: '登录', value: '登录' },
        { text: '登出', value: '登出' },
        { text: '创建', value: '创建' },
        { text: '更新', value: '更新' },
        { text: '删除', value: '删除' }
      ],
      onFilter: (value, record) => record.action === value
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
      width: 300
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (ip) => ip || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => getStatusTag(status),
      filters: [
        { text: '成功', value: 'success' },
        { text: '失败', value: 'failed' }
      ],
      onFilter: (value, record) => record.status === value
    }
  ]

  return (
    <PermissionGuard permission={Permission.LOG_VIEW}>
      <Card
        title="审计日志"
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={logs.length === 0}
            >
              导出
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadLogs()}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            placeholder={['开始时间', '结束时间']}
            onChange={(dates) => {
              if (dates) {
                setDateRange([
                  dates[0]?.format('YYYY-MM-DD HH:mm:ss') || '',
                  dates[1]?.format('YYYY-MM-DD HH:mm:ss') || ''
                ])
              } else {
                setDateRange(null)
              }
            }}
          />
          <Select
            placeholder="操作类型"
            style={{ width: 120 }}
            value={actionFilter}
            onChange={setActionFilter}
            allowClear
          >
            <Select.Option value="登录">登录</Select.Option>
            <Select.Option value="登出">登出</Select.Option>
            <Select.Option value="创建">创建</Select.Option>
            <Select.Option value="更新">更新</Select.Option>
            <Select.Option value="删除">删除</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            style={{ width: 100 }}
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
          >
            <Select.Option value="success">成功</Select.Option>
            <Select.Option value="failed">失败</Select.Option>
          </Select>
          <Button type="primary" onClick={handleFilter}>
            筛选
          </Button>
          <Button
            onClick={() => {
              setStatusFilter(undefined)
              setActionFilter(undefined)
              setDateRange(null)
              setPagination({ ...pagination, current: 1 })
              loadLogs(1, pagination.pageSize)
            }}
          >
            重置
          </Button>
        </Space>

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
          scroll={{ x: 1200 }}
        />
      </Card>
    </PermissionGuard>
  )
}

export default AuditLogPage
