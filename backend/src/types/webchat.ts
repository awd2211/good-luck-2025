// WebChat系统类型定义

export interface CSAgent {
  id: number;
  admin_id: string;
  display_name: string;
  avatar_url?: string;
  role: 'manager' | 'agent';
  status: 'online' | 'busy' | 'offline';
  max_concurrent_chats: number;
  current_chat_count: number;
  specialty_tags?: string[];
  manager_id?: number;
  is_active: boolean;
  last_online_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ChatSession {
  id: number;
  user_id: string;
  agent_id?: number;
  session_key: string;
  status: 'pending' | 'queued' | 'active' | 'closed' | 'transferred';
  channel: 'web' | 'mobile' | 'app';
  priority: number;
  queued_at?: Date;
  assigned_at?: Date;
  started_at?: Date;
  closed_at?: Date;
  close_reason?: 'user_left' | 'agent_closed' | 'timeout' | 'resolved' | 'transferred';
  user_satisfaction_rating?: number;
  user_feedback?: string;
  tags?: string[];
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  sender_type: 'user' | 'agent' | 'system';
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'link' | 'quick_reply' | 'system';
  attachments?: any[];
  is_read: boolean;
  read_at?: Date;
  metadata?: any;
  created_at: Date;
}

export interface QuickReplyTemplate {
  id: number;
  agent_id?: number;
  category: string;
  title: string;
  content: string;
  shortcut_key?: string;
  usage_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CSAgentStatistics {
  id: number;
  agent_id: number;
  stat_date: Date;
  total_sessions: number;
  avg_response_time_seconds?: number;
  avg_session_duration_seconds?: number;
  avg_satisfaction_rating?: number;
  total_messages_sent: number;
  online_duration_seconds: number;
  created_at: Date;
  updated_at: Date;
}

export interface ChatTransferLog {
  id: number;
  session_id: number;
  from_agent_id?: number;
  to_agent_id?: number;
  transfer_reason?: string;
  transferred_at: Date;
}

// Socket.IO事件类型
export interface ServerToClientEvents {
  // 消息事件
  'message:new': (message: ChatMessage) => void;
  'message:read': (data: { sessionId: number; messageId: number }) => void;

  // 会话事件
  'session:assigned': (session: ChatSession) => void;
  'session:started': (session: ChatSession) => void;
  'session:closed': (session: ChatSession) => void;
  'session:transferred': (data: { session: ChatSession; newAgent: CSAgent }) => void;

  // 客服状态事件
  'agent:status_changed': (data: { agentId: number; status: string }) => void;
  'agent:typing': (data: { sessionId: number; agentId: number }) => void;

  // 用户状态事件
  'user:typing': (data: { sessionId: number; userId: string }) => void;
  'user:joined': (data: { sessionId: number; userId: string }) => void;
  'user:left': (data: { sessionId: number; userId: string }) => void;

  // 系统通知
  'notification': (data: { type: string; message: string; data?: any }) => void;
}

export interface ClientToServerEvents {
  // 客服事件
  'agent:online': (data: { agentId: number }) => void;
  'agent:offline': (data: { agentId: number }) => void;
  'agent:busy': (data: { agentId: number }) => void;
  'agent:join_session': (data: { sessionId: number; agentId: number }) => void;
  'agent:typing': (data: { sessionId: number; agentId: number }) => void;

  // 用户事件
  'user:join_session': (data: { sessionId: number; userId: string }) => void;
  'user:typing': (data: { sessionId: number; userId: string }) => void;

  // 消息事件
  'message:send': (data: {
    sessionId: number;
    senderType: 'user' | 'agent' | 'system';
    senderId: string;
    content: string;
    messageType?: string;
    attachments?: any[];
  }) => void;
  'message:mark_read': (data: { sessionId: number; messageId: number }) => void;

  // 会话事件
  'session:close': (data: { sessionId: number; reason: string }) => void;
  'session:transfer': (data: {
    sessionId: number;
    fromAgentId: number;
    toAgentId: number;
    reason: string;
  }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  agentId?: number;
  role?: 'user' | 'agent' | 'admin';
}
