import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './NotificationCenterPage.css';

interface Notification {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: number;
  is_read: boolean;
  is_clicked: boolean;
  created_at: string;
  link_url?: string;
}

const NotificationCenterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadNotifications();
  }, [user, filter, selectedType]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('unread_only', 'true');
      if (selectedType !== 'all') params.append('type', selectedType);

      const response = await fetch(`/api/notifications/user?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // 更新本地状态
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // 更新本地状态
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    if (!window.confirm('确定要删除这条通知吗？')) return;

    try {
      await fetch(`/api/notifications/${notificationId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // 从列表中移除
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // 标记为已读和已点击
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    try {
      await fetch(`/api/notifications/${notification.id}/click`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (error) {
      console.error('记录点击失败:', error);
    }

    // 如果有链接，跳转
    if (notification.link_url) {
      if (notification.link_url.startsWith('http')) {
        window.open(notification.link_url, '_blank');
      } else {
        navigate(notification.link_url);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      info: '💬',
      warning: '⚠️',
      error: '❌',
      success: '✅',
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getTypeClass = (type: string) => {
    return `notification-type-${type}`;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notification-center">
      <div className="notification-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1>通知中心</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} 条未读</span>
          )}
        </div>
        <div className="header-right">
          {unreadCount > 0 && (
            <button className="mark-all-read-btn" onClick={markAllAsRead}>
              全部标记为已读
            </button>
          )}
        </div>
      </div>

      <div className="notification-filters">
        <div className="filter-group">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部通知
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            未读通知
          </button>
        </div>

        <div className="type-filters">
          <button
            className={`type-btn ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            全部类型
          </button>
          <button
            className={`type-btn ${selectedType === 'info' ? 'active' : ''}`}
            onClick={() => setSelectedType('info')}
          >
            💬 消息
          </button>
          <button
            className={`type-btn ${selectedType === 'warning' ? 'active' : ''}`}
            onClick={() => setSelectedType('warning')}
          >
            ⚠️ 提醒
          </button>
          <button
            className={`type-btn ${selectedType === 'success' ? 'active' : ''}`}
            onClick={() => setSelectedType('success')}
          >
            ✅ 成功
          </button>
          <button
            className={`type-btn ${selectedType === 'error' ? 'active' : ''}`}
            onClick={() => setSelectedType('error')}
          >
            ❌ 警告
          </button>
        </div>
      </div>

      <div className="notification-list">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <div className="empty-text">
              {filter === 'unread' ? '暂无未读通知' : '暂无通知'}
            </div>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${getTypeClass(notification.type)} ${
                !notification.is_read ? 'unread' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {getTypeIcon(notification.type)}
              </div>
              <div className="notification-body">
                <div className="notification-header-row">
                  <h3 className="notification-title">{notification.title}</h3>
                  {notification.priority > 0 && (
                    <span className="priority-badge">
                      {notification.priority === 2 ? '紧急' : '重要'}
                    </span>
                  )}
                </div>
                <p className="notification-content">{notification.content}</p>
                <div className="notification-footer">
                  <span className="notification-time">
                    {new Date(notification.created_at).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {!notification.is_read && (
                    <span className="unread-dot">●</span>
                  )}
                </div>
              </div>
              <div className="notification-actions">
                {!notification.is_read && (
                  <button
                    className="mark-read-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    title="标记为已读"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  title="删除"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenterPage;
