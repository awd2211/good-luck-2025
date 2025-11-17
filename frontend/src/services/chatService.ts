import api from './api'
import { io, Socket } from 'socket.io-client'
import type { ApiResponse } from '../types'
import storage from '../utils/storage'

export interface ChatMessage {
  id: number
  sender_type: 'user' | 'agent' | 'system'
  content: string
  created_at: string
}

export interface ChatSession {
  id: number
  session_key: string
  status: string
  agent_id?: number
}

// 获取或创建聊天用户ID
export const getChatUserId = (): string => {
  let userId = storage.get('chat_user_id')
  if (!userId) {
    userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    storage.set('chat_user_id', userId)
  }
  return userId
}

// 创建聊天会话
export const createChatSession = (userId: string, channel: string = 'web') => {
  return api.post<ApiResponse<ChatSession>>('/chat/sessions', {
    userId,
    channel
  })
}

// 获取会话消息历史
export const getSessionMessages = (sessionId: number, params?: {
  page?: number
  limit?: number
}) => {
  return api.get<ApiResponse<ChatMessage[]>>(`/chat/sessions/${sessionId}/messages`, { params })
}

// 发送消息
export const sendMessage = (sessionId: number, content: string) => {
  return api.post<ApiResponse<ChatMessage>>(`/chat/sessions/${sessionId}/messages`, {
    content
  })
}

// 提交满意度评价
export interface SatisfactionRating {
  rating: number  // 1-5星
  comment?: string
  tags?: string[]
}

export const submitRating = (sessionId: number, data: SatisfactionRating) => {
  return api.post<ApiResponse>(`/chat/sessions/${sessionId}/rating`, data)
}

// 获取客服服务时间
export interface ServiceHourPeriod {
  day: string
  dayLabel: string
  startTime: string
  endTime: string
  available: boolean
}

export interface ServiceHoursData {
  serviceHours: ServiceHourPeriod[]
  currentTime: string
  isAvailable: boolean
  nextAvailableTime?: string
}

export const getServiceHours = () => {
  return api.get<ApiResponse<ServiceHoursData>>('/chat/service-hours')
}

// Socket.IO 连接管理类
export class ChatSocketManager {
  private socket: Socket | null = null
  private userId: string
  private sessionId: number | null = null

  constructor() {
    this.userId = getChatUserId()
  }

  // 连接到Socket.IO服务器
  connect(baseUrl?: string): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    // 使用环境变量中的 API URL，去掉 /api 后缀
    const socketUrl = baseUrl || (import.meta.env.VITE_API_URL || 'http://localhost:50301/api').replace('/api', '')

    this.socket = io(socketUrl, {
      auth: {
        role: 'user',
        userId: this.userId
      }
    })

    return this.socket
  }

  // 加入会话
  joinSession(sessionId: number) {
    this.sessionId = sessionId
    if (this.socket?.connected) {
      this.socket.emit('user:join_session', {
        sessionId,
        userId: this.userId
      })
    }
  }

  // 发送消息（通过Socket）
  sendMessage(content: string) {
    if (this.socket?.connected && this.sessionId) {
      this.socket.emit('user:send_message', {
        sessionId: this.sessionId,
        content
      })
    }
  }

  // 监听新消息
  onMessage(callback: (message: ChatMessage) => void) {
    if (this.socket) {
      this.socket.on('message:new', callback)
    }
  }

  // 监听客服正在输入
  onAgentTyping(callback: () => void) {
    if (this.socket) {
      this.socket.on('agent:typing', callback)
    }
  }

  // 监听连接状态
  onConnect(callback: () => void) {
    if (this.socket) {
      this.socket.on('connect', callback)
    }
  }

  onDisconnect(callback: () => void) {
    if (this.socket) {
      this.socket.on('disconnect', callback)
    }
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // 获取Socket实例
  getSocket(): Socket | null {
    return this.socket
  }
}
