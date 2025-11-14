import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  List,
  Input,
  Button,
  Badge,
  Avatar,
  Space,
  Tag,
  message,
  Empty,
  Tabs,
  Tooltip,
  Popover,
  Modal
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  CloseOutlined,
  SmileOutlined
} from '@ant-design/icons';
import { io, Socket } from 'socket.io-client';
import apiService from '../services/apiService';

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface ChatSession {
  id: number;
  user_id: string;
  agent_id?: number;
  session_key: string;
  status: string;
  channel: string;
  created_at: string;
  started_at?: string;
}

interface ChatMessage {
  id: number;
  session_id: number;
  sender_type: 'user' | 'agent' | 'system';
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
}

interface QuickReply {
  id: number;
  title: string;
  content: string;
  shortcut_key?: string;
}

const CSWorkbench: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [agentId, setAgentId] = useState<number | null>(null);
  // @ts-ignore - 保留供未来使用
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [queuedSessions, setQueuedSessions] = useState<ChatSession[]>([]);
  const [closedSessions, setClosedSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化Socket.IO连接
  useEffect(() => {
    // 从localStorage获取当前用户信息
    const userStr = localStorage.getItem('admin_user');
    if (!userStr) {
      message.error('请先登录');
      return;
    }

    const user = JSON.parse(userStr);
    // 使用管理员ID作为客服ID（因为使用统一用户体系）
    const csAgentId = user.id; // 使用管理员的ID
    setAgentId(csAgentId);

    // 连接Socket.IO (使用正确的后端端口)
    const socketInstance = io('http://localhost:50301', {
      auth: {
        role: 'agent',
        agentId: csAgentId
      }
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket.IO已连接');
      setConnected(true);
      message.success('实时通信已连接');

      // 客服上线
      socketInstance.emit('agent:online', { agentId: csAgentId });
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket.IO已断开');
      setConnected(false);
      message.warning('实时通信已断开');
    });

    // 监听新消息
    socketInstance.on('message:new', (newMessage: ChatMessage) => {
      if (selectedSession && newMessage.session_id === selectedSession.id) {
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
      }

      // 更新会话列表(显示未读消息)
      loadSessions();
    });

    // 监听新会话分配
    socketInstance.on('session:assigned', (session: ChatSession) => {
      message.info(`新会话已分配: 用户 ${session.user_id}`);
      loadSessions();
    });

    // 监听会话关闭
    socketInstance.on('session:closed', (session: ChatSession) => {
      message.info(`会话已关闭: ${session.id}`);
      loadSessions();
      if (selectedSession?.id === session.id) {
        setSelectedSession(null);
      }
    });

    setSocket(socketInstance);

    return () => {
      // 客服离线
      socketInstance.emit('agent:offline', { agentId: csAgentId });
      socketInstance.close();
    };
  }, []);

  // 加载会话列表
  const loadSessions = async () => {
    if (!agentId) return;

    try {
      const response = await apiService.get('/cs/sessions', {
        params: {
          agentId,
          page: 1,
          limit: 100
        }
      });

      if (response.data.success) {
        const allSessions = response.data.data;
        setSessions(allSessions);

        // 分类会话
        setActiveSessions(allSessions.filter((s: ChatSession) => s.status === 'active'));
        setQueuedSessions(allSessions.filter((s: ChatSession) => s.status === 'queued'));
        setClosedSessions(allSessions.filter((s: ChatSession) => s.status === 'closed'));
      }
    } catch (error: any) {
      console.error('加载会话失败:', error);
    }
  };

  // 加载快捷回复
  const loadQuickReplies = async () => {
    if (!agentId) return;

    try {
      const response = await apiService.get('/chat/quick-replies', {
        params: {
          agentId,
          isActive: true
        }
      });

      if (response.data.success) {
        setQuickReplies(response.data.data);
      }
    } catch (error: any) {
      console.error('加载快捷回复失败:', error);
    }
  };

  useEffect(() => {
    if (agentId) {
      loadSessions();
      loadQuickReplies();

      // 每30秒刷新会话列表
      const interval = setInterval(loadSessions, 30000);
      return () => clearInterval(interval);
    }
  }, [agentId]);

  // 选择会话
  const handleSelectSession = async (session: ChatSession) => {
    setSelectedSession(session);

    // 加载消息历史
    try {
      const response = await apiService.get(`/chat/messages/${session.id}`, {
        params: {
          limit: 100
        }
      });

      if (response.data.success) {
        setMessages(response.data);
        scrollToBottom();
      }

      // 加入会话房间
      if (socket && agentId) {
        socket.emit('agent:join_session', {
          sessionId: session.id,
          agentId
        });
      }

      // 标记所有消息为已读
      await apiService.post(`/chat/sessions/${session.id}/read`, {
        readerType: 'agent'
      });
    } catch (error: any) {
      message.error('加载消息失败');
    }
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedSession || !socket || !agentId) {
      return;
    }

    // 通过Socket.IO发送消息
    socket.emit('message:send', {
      sessionId: selectedSession.id,
      senderType: 'agent',
      senderId: agentId.toString(),
      content: inputValue,
      messageType: 'text'
    });

    setInputValue('');
  };

  // 使用快捷回复
  const handleUseQuickReply = (reply: QuickReply) => {
    setInputValue(reply.content);
    setShowQuickReply(false);
  };

  // 关闭会话
  const handleCloseSession = async () => {
    if (!selectedSession) return;

    try {
      const response = await apiService.post(`/cs/sessions/${selectedSession.id}/close`, {
        reason: 'agent_closed'
      });

      if (response.data.success) {
        message.success('会话已关闭');
        setSelectedSession(null);
        loadSessions();
      }
    } catch (error: any) {
      message.error('关闭会话失败');
    }
  };

  // 转接会话
  const handleTransferSession = () => {
    if (!selectedSession || !agentId) return;

    Modal.confirm({
      title: '转接会话',
      content: (
        <div>
          <p>请输入目标客服ID:</p>
          <Input id="target-agent-id" type="number" placeholder="目标客服ID" />
        </div>
      ),
      onOk: async () => {
        const targetAgentId = (document.getElementById('target-agent-id') as HTMLInputElement)?.value;

        if (!targetAgentId) {
          message.error('请输入目标客服ID');
          return;
        }

        try {
          const response = await apiService.post(`/cs/sessions/${selectedSession.id}/transfer`, {
            fromAgentId: agentId,
            toAgentId: parseInt(targetAgentId),
            reason: '客服转接'
          });

          if (response.data.success) {
            message.success('转接成功');
            setSelectedSession(null);
            loadSessions();
          }
        } catch (error: any) {
          message.error('转接失败');
        }
      }
    });
  };

  // 滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 渲染会话列表项
  const renderSessionItem = (session: ChatSession) => (
    <List.Item
      key={session.id}
      onClick={() => handleSelectSession(session)}
      style={{
        cursor: 'pointer',
        backgroundColor: selectedSession?.id === session.id ? '#e6f7ff' : 'transparent',
        padding: '12px 16px'
      }}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={
          <Space>
            <span>用户 {session.user_id}</span>
            {session.status === 'queued' && <Badge status="processing" text="队列中" />}
            {session.status === 'active' && <Badge status="success" text="进行中" />}
            {session.status === 'closed' && <Badge status="default" text="已结束" />}
          </Space>
        }
        description={
          <Space direction="vertical" size="small">
            <span style={{ fontSize: 12, color: '#999' }}>
              <ClockCircleOutlined /> {new Date(session.created_at).toLocaleString()}
            </span>
            {session.started_at && (
              <span style={{ fontSize: 12, color: '#999' }}>
                开始于 {new Date(session.started_at).toLocaleString()}
              </span>
            )}
          </Space>
        }
      />
    </List.Item>
  );

  // 渲染消息
  const renderMessage = (msg: ChatMessage) => {
    const isAgent = msg.sender_type === 'agent';
    const isSystem = msg.sender_type === 'system';

    if (isSystem) {
      return (
        <div key={msg.id} style={{ textAlign: 'center', margin: '12px 0' }}>
          <Tag color="default">{msg.content}</Tag>
        </div>
      );
    }

    return (
      <div
        key={msg.id}
        style={{
          display: 'flex',
          justifyContent: isAgent ? 'flex-end' : 'flex-start',
          marginBottom: 12
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: isAgent ? '#1890ff' : '#f0f0f0',
            color: isAgent ? '#fff' : '#000'
          }}
        >
          <div>{msg.content}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            {new Date(msg.created_at).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout style={{ height: 'calc(100vh - 64px)' }}>
      {/* 左侧会话列表 */}
      <Sider width={320} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <h3>
            会话列表
            <Badge
              count={activeSessions.length}
              style={{ marginLeft: 8, backgroundColor: '#52c41a' }}
            />
          </h3>
          <Tag color={connected ? 'success' : 'default'}>
            {connected ? '在线' : '离线'}
          </Tag>
        </div>

        <Tabs defaultActiveKey="active" style={{ padding: '0 16px' }}>
          <TabPane tab={`进行中 (${activeSessions.length})`} key="active">
            <List
              dataSource={activeSessions}
              renderItem={renderSessionItem}
              locale={{ emptyText: <Empty description="暂无进行中的会话" /> }}
            />
          </TabPane>
          <TabPane tab={`队列 (${queuedSessions.length})`} key="queued">
            <List
              dataSource={queuedSessions}
              renderItem={renderSessionItem}
              locale={{ emptyText: <Empty description="队列为空" /> }}
            />
          </TabPane>
          <TabPane tab={`已结束 (${closedSessions.length})`} key="closed">
            <List
              dataSource={closedSessions}
              renderItem={renderSessionItem}
              locale={{ emptyText: <Empty description="暂无已结束的会话" /> }}
            />
          </TabPane>
        </Tabs>
      </Sider>

      {/* 右侧聊天区域 */}
      <Content>
        {selectedSession ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 聊天头部 */}
            <div
              style={{
                padding: 16,
                borderBottom: '1px solid #f0f0f0',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Space>
                <Avatar icon={<UserOutlined />} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>用户 {selectedSession.user_id}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    会话ID: {selectedSession.id}
                  </div>
                </div>
              </Space>

              <Space>
                <Tooltip title="转接">
                  <Button icon={<SwapOutlined />} onClick={handleTransferSession} />
                </Tooltip>
                <Tooltip title="关闭会话">
                  <Button icon={<CloseOutlined />} onClick={handleCloseSession} danger />
                </Tooltip>
              </Space>
            </div>

            {/* 消息列表 */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: 16,
                background: '#fafafa'
              }}
            >
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div
              style={{
                padding: 16,
                background: '#fff',
                borderTop: '1px solid #f0f0f0'
              }}
            >
              <Space.Compact style={{ width: '100%' }}>
                <Popover
                  content={
                    <List
                      dataSource={quickReplies.slice(0, 10)}
                      renderItem={(item) => (
                        <List.Item
                          onClick={() => handleUseQuickReply(item)}
                          style={{ cursor: 'pointer' }}
                        >
                          <List.Item.Meta
                            title={item.title}
                            description={item.content.substring(0, 50) + '...'}
                          />
                        </List.Item>
                      )}
                      style={{ maxHeight: 300, overflow: 'auto' }}
                    />
                  }
                  title="快捷回复"
                  trigger="click"
                  open={showQuickReply}
                  onOpenChange={setShowQuickReply}
                  placement="topLeft"
                >
                  <Button icon={<SmileOutlined />} />
                </Popover>

                <TextArea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="输入消息... (Enter发送, Shift+Enter换行)"
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{ flex: 1 }}
                />

                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                >
                  发送
                </Button>
              </Space.Compact>
            </div>
          </div>
        ) : (
          <Empty
            description="请从左侧选择一个会话开始聊天"
            style={{ marginTop: '20%' }}
          />
        )}
      </Content>
    </Layout>
  );
};

export default CSWorkbench;
