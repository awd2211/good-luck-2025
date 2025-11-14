import { useState, useEffect } from 'react';
import './ToastNotification.css';

export interface ToastNotificationData {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  duration?: number;  // 显示时长（毫秒），0表示不自动关闭
  onClose?: () => void;
  onClick?: () => void;
}

interface ToastNotificationProps {
  notification: ToastNotificationData;
  onRemove: (id: number) => void;
}

const ToastNotification = ({ notification, onRemove }: ToastNotificationProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = notification.duration ?? 5000; // 默认5秒

    if (duration > 0) {
      // 进度条动画
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 50));
          return newProgress > 0 ? newProgress : 0;
        });
      }, 50);

      // 自动关闭定时器
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(timer);
      };
    }
  }, [notification]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onRemove(notification.id);
      notification.onClose?.();
    }, 300); // 等待关闭动画完成
  };

  const handleClick = () => {
    if (notification.onClick) {
      notification.onClick();
      handleClose();
    }
  };

  const getIcon = () => {
    const icons = {
      info: '💬',
      warning: '⚠️',
      error: '❌',
      success: '✅',
    };
    return icons[notification.type] || '📢';
  };

  return (
    <div
      className={`toast-notification toast-${notification.type} ${
        isClosing ? 'closing' : ''
      }`}
      onClick={handleClick}
      style={{ cursor: notification.onClick ? 'pointer' : 'default' }}
    >
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        <div className="toast-title">{notification.title}</div>
        <div className="toast-message">{notification.content}</div>
      </div>
      <button className="toast-close" onClick={(e) => {
        e.stopPropagation();
        handleClose();
      }}>
        ✕
      </button>
      {(notification.duration ?? 5000) > 0 && (
        <div
          className="toast-progress"
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
};

export default ToastNotification;
