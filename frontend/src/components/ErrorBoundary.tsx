import React, { Component, type ReactNode } from 'react'
import { logError } from '../utils/logger'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 捕获错误信息
    this.setState({
      error,
      errorInfo
    })

    // 使用统一的错误日志记录
    // 在生产环境中会自动上报到监控服务
    logError('Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义的 fallback UI，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认的错误 UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>哎呀，出错了</h1>
            <p className="error-message">
              页面遇到了一些问题，我们正在努力修复
            </p>

            {/* 开发环境显示错误详情 */}
            {import.meta.env.DEV && this.state.error && (
              <details className="error-details">
                <summary>查看错误详情</summary>
                <pre className="error-stack">
                  <strong>错误信息:</strong>
                  {this.state.error.toString()}

                  <strong>错误堆栈:</strong>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button
                className="btn-primary"
                onClick={this.handleReload}
              >
                刷新页面
              </button>
              <button
                className="btn-secondary"
                onClick={this.handleReset}
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
