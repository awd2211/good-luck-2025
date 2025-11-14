import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import './ChatWidget.css';

interface ChatMessage {
  id: number;
  sender_type: 'user' | 'agent' | 'system';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: number;
  session_key: string;
  status: string;
  agent_id?: number;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 预留用于"正在输入"功能

  // 获取用户ID (从localStorage或生成临时ID)
  const getUserId = () => {
    let userId = localStorage.getItem('chat_user_id');
    if (!userId) {
      userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_user_id', userId);
    }
    return userId;
  };

  // 初始化聊天会话
  const initializeSession = async () => {
    const userId = getUserId();

    try {
      const response = await fetch('http://localhost:3000/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          channel: 'web'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSession(data.data);
        initializeSocket(data.data.id, userId);
        loadMessages(data.data.id);
      }
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  };

  // 初始化Socket.IO
  const initializeSocket = (sessionId: number, userId: string) => {
    const socketInstance = io('http://localhost:3000', {
      auth: {
        role: 'user',
        userId
      }
    });

    socketInstance.on('connect', () => {
      console.log('✅ 聊天已连接');
      setConnected(true);

      // 加入会话房间
      socketInstance.emit('user:join_session', {
        sessionId,
        userId
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ 聊天已断开');
      setConnected(false);
    });

    // 监听新消息
    socketInstance.on('message:new', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();

      // 如果窗口未打开,增加未读数
      if (!isOpen && message.sender_type === 'agent') {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // 监听客服正在输入
    socketInstance.on('agent:typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    });

    // 监听会话关闭
    socketInstance.on('session:closed', () => {
      console.log('会话已关闭');
    });

    setSocket(socketInstance);
  };

  // 加载消息历史
  const loadMessages = async (sessionId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/chat/messages/${sessionId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
        scrollToBottom();
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!inputValue.trim() || !socket || !session) {
      return;
    }

    const userId = getUserId();

    // 通过Socket.IO发送消息
    socket.emit('message:send', {
      sessionId: session.id,
      senderType: 'user',
      senderId: userId,
      content: inputValue,
      messageType: 'text'
    });

    setInputValue('');
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // 发送正在输入事件
    if (socket && session) {
      socket.emit('user:typing', {
        sessionId: session.id,
        userId: getUserId()
      });
    }
  };

  // 打开/关闭聊天窗口
  const toggleChat = () => {
    setIsOpen(!isOpen);

    if (!isOpen) {
      setUnreadCount(0); // 清除未读数

      // 如果还没有会话,创建一个
      if (!session) {
        initializeSession();
      }
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 关闭会话
  const handleCloseSession = async () => {
    if (!session) return;

    try {
      await fetch(`http://localhost:3000/api/chat/sessions/${session.id}/close`, {
        method: 'POST'
      });

      setSession(null);
      setMessages([]);

      if (socket) {
        socket.close();
        setSocket(null);
      }
    } catch (error) {
      console.error('关闭会话失败:', error);
    }
  };

  // 组件卸载时关闭连接
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  // 渲染消息
  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.sender_type === 'user';
    const isSystem = msg.sender_type === 'system';

    if (isSystem) {
      return (
        <div key={msg.id} className="chat-message-system">
          <span>{msg.content}</span>
        </div>
      );
    }

    return (
      <div
        key={msg.id}
        className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-agent'}`}
      >
        <div className="chat-message-bubble">
          <div className="chat-message-content">{msg.content}</div>
          <div className="chat-message-time">
            {new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 聊天按钮 */}
      <div className="chat-widget-button" onClick={toggleChat}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
            fill="currentColor"
          />
        </svg>
        {unreadCount > 0 && <span className="chat-widget-badge">{unreadCount}</span>}
      </div>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="chat-widget-window">
          {/* 头部 */}
          <div className="chat-widget-header">
            <div>
              <div className="chat-widget-title">在线客服</div>
              <div className="chat-widget-status">
                {connected ? (
                  <>
                    <span className="chat-status-dot chat-status-online"></span>
                    <span>在线</span>
                  </>
                ) : (
                  <>
                    <span className="chat-status-dot chat-status-offline"></span>
                    <span>离线</span>
                  </>
                )}
              </div>
            </div>
            <button className="chat-widget-close" onClick={toggleChat}>
              ×
            </button>
          </div>

          {/* 消息列表 */}
          <div className="chat-widget-messages">
            {messages.length === 0 ? (
              <div className="chat-widget-empty">
                <p>您好!有什么可以帮助您的吗?</p>
              </div>
            ) : (
              <>
                {messages.map(renderMessage)}
                {isTyping && (
                  <div className="chat-message chat-message-agent">
                    <div className="chat-message-bubble">
                      <div className="chat-typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="chat-widget-input">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              placeholder="输入消息..."
              disabled={!connected}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !connected}
              className="chat-send-button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          {/* 底部工具栏 */}
          {session && (
            <div className="chat-widget-footer">
              <button
                className="chat-footer-button"
                onClick={handleCloseSession}
                title="结束咨询"
              >
                结束咨询
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
