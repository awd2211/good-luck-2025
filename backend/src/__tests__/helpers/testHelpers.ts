/**
 * 测试辅助函数
 */

import { Request, Response } from 'express'

/**
 * 创建 Mock Request 对象
 */
export const createMockRequest = (options: {
  body?: any
  params?: any
  query?: any
  headers?: any
  user?: any
}): Partial<Request> => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user || undefined,
  }
}

/**
 * 创建 Mock Response 对象
 */
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }
  return res
}

/**
 * 创建 Mock Next 函数
 */
export const createMockNext = () => {
  return jest.fn()
}

/**
 * 生成随机手机号
 */
export const generateRandomPhone = (): string => {
  const prefix = '139'
  const suffix = Math.floor(10000000 + Math.random() * 90000000)
  return prefix + suffix
}

/**
 * 生成随机用户 ID
 */
export const generateRandomUserId = (): string => {
  return `user_test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 等待指定时间（用于测试异步操作）
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 验证手机号格式
 */
export const isValidPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone)
}
