import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Tag,
  Statistic,
  Row,
  Col,
  Select,
  Modal,
  Descriptions,
  Timeline,
  Tooltip
} from 'antd'
import {
  SwapOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/api'

const { Option } = Select

interface SessionTransfer {
  id: number
  session_id: number
  from_agent_id: number | null
  to_agent_id: number
  from_agent_name: string | null
  to_agent_name: string
  transfer_reason: string | null
  transfer_notes: string | null
  transfer_type: 'manual' | 'auto'
  status: 'pending' | 'accepted' | 'rejected'
  user_id: string
  session_status: string
  accepted_at: string | null
  created_at: string
}

interface TransferStatistics {
  totalTransfers: number
  pendingTransfers: number
  acceptedTransfers: number
  rejectedTransfers: number
  transfersThisWeek: number
  transfersThisMonth: number
  topTransferAgents: Array<{
    agentId: number
    agentName: string
    transferCount: number
    type: 'from' | 'to'
  }>
  recentTransfers: Array<{
    id: number
    sessionId: number
    fromAgentName: string | null
    toAgentName: string
    transferReason: string | null
    status: string
    createdAt: string
  }>
}

const SessionTransferManagement = () => {
  const [loading, setLoading] = useState(false)
  const [transfers, setTransfers] = useState<SessionTransfer[]>([])
  const [statistics, setStatistics] = useState<TransferStatistics | null>(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<SessionTransfer | null>(null)

  useEffect(() => {
    fetchStatistics()
    fetchTransfers()
  }, [pagination.current, pagination.pageSize, statusFilter, typeFilter])

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/session-transfers/statistics')
      setStatistics(response.data.data || null)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize
      }
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.transferType = typeFilter

      const response = await api.get('/session-transfers', { params })
      setTransfers(Array.isArray(response.data.data) ? response.data.data : [])
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0
      }))
    } catch (error) {
      message.error('获取转接列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTransfer = async (id: number) => {
    try {
      await api.post(`/session-transfers/${id}/accept`)
      message.success('已接受转接')
      fetchTransfers()
      fetchStatistics()
    } catch (error: any) {
      message.error(error.response?.data?.message || '接受转接失败')
    }
  }

  const handleRejectTransfer = async (id: number) => {
    Modal.confirm({
      title: '确认拒绝转接',
      content: '拒绝后该转接请求将被关闭',
      onOk: async () => {
        try {
          await api.post(`/session-transfers/${id}/reject`)
          message.success('已拒绝转接')
          fetchTransfers()
          fetchStatistics()
        } catch (error: any) {
          message.error(error.response?.data?.message || '拒绝转接失败')
        }
      }
    })
  }

  const handleCancelTransfer = async (id: number) => {
    Modal.confirm({
      title: '确认取消转接',
      content: '取消后该转接请求将被删除',
      onOk: async () => {
        try {
          await api.delete(`/session-transfers/${id}/cancel`)
          message.success('已取消转接')
          fetchTransfers()
          fetchStatistics()
        } catch (error: any) {
          message.error(error.response?.data?.message || '取消转接失败')
        }
      }
    })
  }

  const showTransferDetail = async (record: SessionTransfer) => {
    setSelectedTransfer(record)
    setDetailModalVisible(true)
  }

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'orange', text: '待处理' },
      accepted: { color: 'green', text: '已接受' },
      rejected: { color: 'red', text: '已拒绝' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getTypeTag = (type: string) => {
    return type === 'manual'
      ? <Tag color="blue">手动转接</Tag>
      : <Tag color="cyan">自动转接</Tag>
  }

  const columns: ColumnsType<SessionTransfer> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend'
    },
    {
      title: '会话ID',
      dataIndex: 'session_id',
      key: 'session_id',
      width: 100,
      sorter: (a, b) => a.session_id - b.session_id
    },
    {
      title: '转出客服',
      dataIndex: 'from_agent_name',
      key: 'from_agent_name',
      render: (name: string | null) => name || <Tag color="default">系统</Tag>,
      sorter: (a, b) => (a.from_agent_name || '').localeCompare(b.from_agent_name || '', 'zh-CN')
    },
    {
      title: '接收客服',
      dataIndex: 'to_agent_name',
      key: 'to_agent_name',
      sorter: (a, b) => a.to_agent_name.localeCompare(b.to_agent_name, 'zh-CN')
    },
    {
      title: '转接类型',
      dataIndex: 'transfer_type',
      key: 'transfer_type',
      render: (type: string) => getTypeTag(type),
      sorter: (a, b) => a.transfer_type.localeCompare(b.transfer_type, 'zh-CN')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '转接原因',
      dataIndex: 'transfer_reason',
      key: 'transfer_reason',
      ellipsis: true,
      render: (reason: string | null) => reason || '-',
      sorter: (a, b) => (a.transfer_reason || '').localeCompare(b.transfer_reason || '', 'zh-CN')
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: SessionTransfer) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => showTransferDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Tooltip title="接受转接">
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleAcceptTransfer(record.id)}
                >
                  接受
                </Button>
              </Tooltip>
              <Tooltip title="拒绝转接">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleRejectTransfer(record.id)}
                >
                  拒绝
                </Button>
              </Tooltip>
              <Tooltip title="取消转接">
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => handleCancelTransfer(record.id)}
                >
                  取消
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>会话转接管理</h2>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总转接数"
              value={statistics?.totalTransfers || 0}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理"
              value={statistics?.pendingTransfers || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已接受"
              value={statistics?.acceptedTransfers || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已拒绝"
              value={statistics?.rejectedTransfers || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="本周转接" size="small">
            <Statistic value={statistics?.transfersThisWeek || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="本月转接" size="small">
            <Statistic value={statistics?.transfersThisMonth || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="活跃客服" size="small">
            <Statistic
              value={statistics?.topTransferAgents?.length || 0}
              suffix="人"
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 转接列表 */}
      <Card
        title="转接记录"
        extra={
          <Space>
            <Select
              style={{ width: 120 }}
              placeholder="状态筛选"
              allowClear
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value || '')}
            >
              <Option value="pending">待处理</Option>
              <Option value="accepted">已接受</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
            <Select
              style={{ width: 120 }}
              placeholder="类型筛选"
              allowClear
              value={typeFilter || undefined}
              onChange={(value) => setTypeFilter(value || '')}
            >
              <Option value="manual">手动转接</Option>
              <Option value="auto">自动转接</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchTransfers()
                fetchStatistics()
              }}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={transfers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 20
              }))
            }
          }}
        />
      </Card>

      {/* 最近转接动态 */}
      {(statistics?.recentTransfers?.length ?? 0) > 0 && (
        <Card title="最近转接动态" style={{ marginTop: 16 }}>
          <Timeline
            items={statistics!.recentTransfers!.slice(0, 10).map(item => ({
              color: item.status === 'accepted' ? 'green' : item.status === 'rejected' ? 'red' : 'blue',
              children: (
                <div>
                  <div>
                    <strong>{item.fromAgentName || '系统'}</strong> → <strong>{item.toAgentName}</strong>
                    {' '}
                    {getStatusTag(item.status)}
                  </div>
                  {item.transferReason && (
                    <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      原因: {item.transferReason}
                    </div>
                  )}
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    {new Date(item.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              )
            }))}
          />
        </Card>
      )}

      {/* 热门转接客服 */}
      {(statistics?.topTransferAgents?.length ?? 0) > 0 && (
        <Card title="热门转接客服 TOP 5" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            {statistics!.topTransferAgents!.slice(0, 5).map((agent, index) => (
              <Col span={12} key={`${agent.agentId}-${agent.type}`} style={{ marginBottom: 16 }}>
                <Card size="small">
                  <Space>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: index < 3 ? '#ffd700' : '#ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{agent.agentName}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {agent.type === 'from' ? '转出' : '接收'}: {agent.transferCount} 次
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 转接详情弹窗 */}
      <Modal
        title="转接详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedTransfer && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="转接ID">{selectedTransfer.id}</Descriptions.Item>
            <Descriptions.Item label="会话ID">{selectedTransfer.session_id}</Descriptions.Item>
            <Descriptions.Item label="转出客服">
              {selectedTransfer.from_agent_name || <Tag color="default">系统</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="接收客服">
              {selectedTransfer.to_agent_name}
            </Descriptions.Item>
            <Descriptions.Item label="转接类型">
              {getTypeTag(selectedTransfer.transfer_type)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {getStatusTag(selectedTransfer.status)}
            </Descriptions.Item>
            <Descriptions.Item label="用户ID" span={2}>
              {selectedTransfer.user_id}
            </Descriptions.Item>
            <Descriptions.Item label="会话状态" span={2}>
              <Tag>{selectedTransfer.session_status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="转接原因" span={2}>
              {selectedTransfer.transfer_reason || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="转接备注" span={2}>
              {selectedTransfer.transfer_notes || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {new Date(selectedTransfer.created_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
            {selectedTransfer.accepted_at && (
              <Descriptions.Item label="接受时间" span={2}>
                {new Date(selectedTransfer.accepted_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default SessionTransferManagement
