/**
 * 开发环境日志工具
 * 在生产环境自动禁用所有日志输出
 */

const isDevelopment = import.meta.env.DEV

/**
 * 开发环境日志 - 仅在开发环境输出
 */
export const devLog = (...args: unknown[]): void => {
  if (isDevelopment) {
    console.log(...args)
  }
}

/**
 * 开发环境警告 - 仅在开发环境输出
 */
export const devWarn = (...args: unknown[]): void => {
  if (isDevelopment) {
    console.warn(...args)
  }
}

/**
 * 开发环境信息 - 仅在开发环境输出
 */
export const devInfo = (...args: unknown[]): void => {
  if (isDevelopment) {
    console.info(...args)
  }
}

/**
 * 开发环境调试 - 仅在开发环境输出
 */
export const devDebug = (...args: unknown[]): void => {
  if (isDevelopment) {
    console.debug(...args)
  }
}

/**
 * 开发环境表格 - 仅在开发环境输出
 */
export const devTable = (data: unknown): void => {
  if (isDevelopment) {
    console.table(data)
  }
}

/**
 * 开发环境分组 - 仅在开发环境输出
 */
export const devGroup = (label: string): void => {
  if (isDevelopment) {
    console.group(label)
  }
}

/**
 * 开发环境分组结束 - 仅在开发环境输出
 */
export const devGroupEnd = (): void => {
  if (isDevelopment) {
    console.groupEnd()
  }
}

/**
 * 性能计时开始 - 仅在开发环境工作
 */
export const devTime = (label: string): void => {
  if (isDevelopment) {
    console.time(label)
  }
}

/**
 * 性能计时结束 - 仅在开发环境工作
 */
export const devTimeEnd = (label: string): void => {
  if (isDevelopment) {
    console.timeEnd(label)
  }
}
