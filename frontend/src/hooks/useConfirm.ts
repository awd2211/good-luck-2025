import { useState, useCallback } from 'react'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

interface ConfirmState extends ConfirmOptions {
  onConfirm: () => void
  onCancel: () => void
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        title: opts.title || '确认',
        message: opts.message,
        confirmText: opts.confirmText || '确定',
        cancelText: opts.cancelText || '取消',
        variant: opts.variant || 'default',
        onConfirm: () => {
          setIsOpen(false)
          resolve(true)
        },
        onCancel: () => {
          setIsOpen(false)
          resolve(false)
        }
      })
      setIsOpen(true)
    })
  }, [])

  return {
    confirm,
    isOpen,
    confirmState,
    setIsOpen
  }
}
