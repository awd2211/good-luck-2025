import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as chatService from '../services/chatService';
import type { ChatMessage, ChatSession, ServiceHoursData } from '../services/chatService';
import './ChatWidget.css';

const ChatWidget: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [serviceHours, setServiceHours] = useState<ServiceHoursData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketManagerRef = useRef<chatService.ChatSocketManager | null>(null);

  // 在客服页面时隐藏浮动聊天按钮
  if (location.pathname === '/customer-service') {
    return null;
  }

  // 初始化聊天会话
  const initializeSession = async () => {
    const userId = chatService.getChatUserId();

    try {
      const response = await chatService.createChatSession(userId, 'web');

      if (response.data.success && response.data.data) {
        setSession(response.data.data);
        initializeSocket(response.data.data.id);
        loadMessages(response.data.data.id);
      }
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  };

  // 初始化Socket.IO
  const initializeSocket = (sessionId: number) => {
    if (!socketManagerRef.current) {
      socketManagerRef.current = new chatService.ChatSocketManager();
    }

    const manager = socketManagerRef.current;
    manager.connect();
    manager.joinSession(sessionId);

    // 监听连接状态
    manager.onConnect(() => {
      console.log('✅ 聊天已连接');
      setConnected(true);
    });

    manager.onDisconnect(() => {
      console.log('❌ 聊天已断开');
      setConnected(false);
    });

    // 监听新消息
    manager.onMessage((message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();

      // 如果窗口未打开,增加未读数
      if (!isOpen && message.sender_type === 'agent') {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // 监听客服正在输入
    manager.onAgentTyping(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    });
  };

  // 加载消息历史
  const loadMessages = async (sessionId: number) => {
    try {
      const response = await chatService.getSessionMessages(sessionId);

      if (response.data.success && response.data.data) {
        setMessages(response.data.data);
        scrollToBottom();
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!inputValue.trim() || !socketManagerRef.current || !session) {
      return;
    }

    // 通过Socket.IO发送消息
    socketManagerRef.current.sendMessage(inputValue);

    setInputValue('');
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // 发送正在输入事件
    if (socketManagerRef.current && session) {
      const socket = socketManagerRef.current.getSocket();
      socket?.emit('user:typing', {
        sessionId: session.id,
        userId: chatService.getChatUserId()
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

  // 关闭会话 - 显示评价对话框
  const handleCloseSession = () => {
    if (!session) return;
    setShowRating(true);
  };

  // 提交评价
  const handleSubmitRating = async () => {
    if (!session) return;

    try {
      await chatService.submitRating(session.id, {
        rating,
        comment: comment.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined
      });

      // 关闭评价对话框并结束会话
      finalizeCloseSession();
    } catch (error) {
      console.error('提交评价失败:', error);
      // 即使失败也关闭会话
      finalizeCloseSession();
    }
  };

  // 跳过评价
  const handleSkipRating = () => {
    finalizeCloseSession();
  };

  // 最终关闭会话
  const finalizeCloseSession = () => {
    setShowRating(false);
    setRating(0);
    setSelectedTags([]);
    setComment('');
    setSession(null);
    setMessages([]);

    if (socketManagerRef.current) {
      socketManagerRef.current.disconnect();
    }
  };

  // 切换标签选择
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // 加载服务时间
  const loadServiceHours = async () => {
    try {
      const response = await chatService.getServiceHours();
      if (response.data.success && response.data.data) {
        setServiceHours(response.data.data);
      }
    } catch (error) {
      console.error('加载服务时间失败:', error);
    }
  };

  // 组件挂载时加载服务时间
  useEffect(() => {
    loadServiceHours();
  }, []);

  // 组件卸载时关闭连接
  useEffect(() => {
    return () => {
      if (socketManagerRef.current) {
        socketManagerRef.current.disconnect();
      }
    };
  }, []);

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
            <div className="chat-header-content">
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
              {/* 服务时间 */}
              {serviceHours && serviceHours.serviceHours.length > 0 && (
                <div className="chat-service-hours">
                  <span className="service-hours-icon">🕐</span>
                  <span className="service-hours-text">
                    {serviceHours.serviceHours[0].dayLabel}{' '}
                    {serviceHours.serviceHours[0].startTime}-
                    {serviceHours.serviceHours[0].endTime}
                  </span>
                  {!serviceHours.isAvailable && serviceHours.nextAvailableTime && (
                    <span className="service-hours-next">
                      {serviceHours.nextAvailableTime}开始服务
                    </span>
                  )}
                </div>
              )}
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
          {session && !showRating && (
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

          {/* 满意度评价弹窗 */}
          {showRating && (
            <div className="chat-rating-modal">
              <div className="chat-rating-content">
                <h3 className="chat-rating-title">为本次服务评分</h3>
                <p className="chat-rating-subtitle">您的反馈将帮助我们提供更好的服务</p>

                {/* 星级评分 */}
                <div className="chat-rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`chat-rating-star ${rating >= star ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* 评价标签 */}
                {rating > 0 && (
                  <div className="chat-rating-tags">
                    {['专业', '耐心', '高效', '友好', '热情'].map((tag) => (
                      <button
                        key={tag}
                        className={`chat-rating-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* 文字评价 */}
                {rating > 0 && (
                  <div className="chat-rating-comment">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="说说您的想法（可选）"
                      rows={3}
                      maxLength={200}
                    />
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="chat-rating-actions">
                  <button
                    className="chat-rating-skip"
                    onClick={handleSkipRating}
                  >
                    跳过
                  </button>
                  <button
                    className="chat-rating-submit"
                    onClick={handleSubmitRating}
                    disabled={rating === 0}
                  >
                    提交评价
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
