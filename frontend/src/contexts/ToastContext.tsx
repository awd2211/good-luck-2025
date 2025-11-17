import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import Toast, { ToastType } from '../components/Toast'

interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null)

  const showToast = useCallback((options: ToastOptions) => {
    setToast(options)
  }, [])

  const success = useCallback((message: string, duration = 3000) => {
    showToast({ message, type: 'success', duration })
  }, [showToast])

  const error = useCallback((message: string, duration = 3000) => {
    showToast({ message, type: 'error', duration })
  }, [showToast])

  const warning = useCallback((message: string, duration = 3000) => {
    showToast({ message, type: 'warning', duration })
  }, [showToast])

  const info = useCallback((message: string, duration = 3000) => {
    showToast({ message, type: 'info', duration })
  }, [showToast])

  const handleClose = useCallback(() => {
    setToast(null)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast 必须在 ToastProvider 中使用')
  }
  return context
}
