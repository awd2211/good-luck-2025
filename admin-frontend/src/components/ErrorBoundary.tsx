import React, { Component, ReactNode } from 'react'
import { Button, Result } from 'antd'

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
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // 在生产环境中，应该将错误日志上报到监控服务
    if (import.meta.env.PROD) {
      // TODO: 集成错误监控服务（如 Sentry）
      console.error('Error Boundary caught an error:', error, errorInfo)
    } else {
      console.error('Error Boundary caught an error:')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    // 返回首页
    window.location.href = '/'
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

      // 使用 Ant Design 的 Result 组件
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f2f5',
          padding: '20px'
        }}>
          <Result
            status="error"
            title="页面出现错误"
            subTitle="抱歉，页面遇到了一些问题。请尝试刷新页面或返回首页。"
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                刷新页面
              </Button>,
              <Button key="home" onClick={this.handleReset}>
                返回首页
              </Button>,
            ]}
          >
            {/* 开发环境显示错误详情 */}
            {import.meta.env.DEV && this.state.error && (
              <div style={{
                marginTop: 24,
                textAlign: 'left',
                padding: 16,
                background: '#fff',
                borderRadius: 4,
                border: '1px solid #d9d9d9',
                maxWidth: 800
              }}>
                <details>
                  <summary style={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#ff4d4f',
                    marginBottom: 12
                  }}>
                    查看错误详情（仅开发环境）
                  </summary>
                  <pre style={{
                    marginTop: 16,
                    padding: 12,
                    background: '#f5f5f5',
                    borderRadius: 4,
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 400,
                    overflowY: 'auto'
                  }}>
                    <strong style={{ color: '#ff4d4f' }}>错误信息:</strong>
                    {'\n'}
                    {this.state.error.toString()}
                    {'\n\n'}
                    <strong style={{ color: '#ff4d4f' }}>错误堆栈:</strong>
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </Result>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
