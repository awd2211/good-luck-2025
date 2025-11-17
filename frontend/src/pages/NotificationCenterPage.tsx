import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as notificationService from '../services/notificationService';
import type { Notification } from '../services/notificationService';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonList } from '../components/Skeleton';
import './NotificationCenterPage.css';

const NotificationCenterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const { confirm, isOpen, confirmState } = useConfirm();

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
      const params: any = {};
      if (filter === 'unread') params.is_read = false;
      if (selectedType !== 'all') params.type = selectedType;

      const response = await notificationService.getUserNotifications(params);
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);

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
      await notificationService.markAllAsRead();

      // 更新本地状态
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    const confirmed = await confirm({
      title: '删除通知',
      message: '确定要删除这条通知吗？',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await notificationService.deleteNotification(notificationId);

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
      await notificationService.recordClick(notification.id);
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
    <>
      <ConfirmDialog
        isOpen={isOpen}
        title={confirmState?.title}
        message={confirmState?.message || ''}
        confirmText={confirmState?.confirmText}
        cancelText={confirmState?.cancelText}
        variant={confirmState?.variant}
        onConfirm={confirmState?.onConfirm || (() => {})}
        onCancel={confirmState?.onCancel || (() => {})}
      />
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
          <SkeletonList count={6} />
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
    </>
  );
};

export default NotificationCenterPage;
