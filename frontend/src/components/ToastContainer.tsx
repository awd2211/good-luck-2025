import { useState, useCallback, useEffect } from 'react';
import ToastNotification, { type ToastNotificationData } from './ToastNotification';
import './ToastContainer.css';

let toastIdCounter = 0;
let addToastCallback: ((toast: Omit<ToastNotificationData, 'id'>) => void) | null = null;

// 全局方法：显示 Toast 通知
export const showToast = (toast: Omit<ToastNotificationData, 'id'>) => {
  if (addToastCallback) {
    addToastCallback(toast);
  }
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastNotificationData[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotificationData, 'id'>) => {
    const newToast: ToastNotificationData = {
      ...toast,
      id: ++toastIdCounter,
    };

    setToasts((prev) => {
      // 最多显示 5 个通知
      const updated = [...prev, newToast];
      if (updated.length > 5) {
        return updated.slice(-5);
      }
      return updated;
    });
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // 注册全局回调
  useEffect(() => {
    addToastCallback = addToast;
    return () => {
      addToastCallback = null;
    };
  }, [addToast]);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          notification={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
