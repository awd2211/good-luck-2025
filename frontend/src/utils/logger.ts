/**
 * 统一的日志和错误处理工具
 * 在开发环境输出到控制台，在生产环境可以集成错误监控服务
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = import.meta.env.DEV

  /**
   * 记录信息日志
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context || '')
    }
    // 生产环境可以发送到日志服务
  }

  /**
   * 记录警告日志
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '')
    }
    // 生产环境可以发送到日志服务
  }

  /**
   * 记录错误日志
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    const errorInfo = this.formatError(error)

    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, {
        error: errorInfo,
        ...context
      })
    } else {
      // 生产环境：发送到错误监控服务（如 Sentry）
      // this.sendToMonitoring(message, errorInfo, context)

      // 仅在生产环境记录到控制台（简化版本，不暴露敏感信息）
      console.error(`[ERROR] ${message}`)
    }
  }

  /**
   * 格式化错误对象
   */
  private formatError(error: unknown): string | object {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      }
    }

    if (error && typeof error === 'object') {
      // 处理 Axios 错误
      if ('response' in error) {
        const axiosError = error as {
          response?: {
            status?: number
            statusText?: string
            data?: unknown
          }
          message?: string
        }
        return {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          message: axiosError.message
        }
      }
      return error
    }

    return String(error)
  }

  /**
   * 发送到错误监控服务（生产环境）
   * 可以集成 Sentry, LogRocket, 等服务
   */
  private sendToMonitoring(
    message: string,
    error: string | object,
    context?: LogContext
  ): void {
    // 示例：集成 Sentry
    // if (window.Sentry) {
    //   window.Sentry.captureException(new Error(message), {
    //     extra: { error, ...context }
    //   })
    // }

    // 或者发送到自定义的日志收集API
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ level: 'error', message, error, context })
    // }).catch(() => {
    //   // 静默失败，避免日志系统故障影响用户体验
    // })
  }
}

// 导出单例
export const logger = new Logger()

// 便捷方法
export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context)

export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context)

export const logError = (message: string, error?: unknown, context?: LogContext) =>
  logger.error(message, error, context)
