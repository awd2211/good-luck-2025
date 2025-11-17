/**
 * WebChat Socket.IO 服务器
 * 负责实时通信、事件处理、房间管理
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData
} from '../types/webchat';
import * as csAgentService from '../services/webchat/csAgentService';
import * as chatSessionService from '../services/webchat/chatSessionService';
import * as chatMessageService from '../services/webchat/chatMessageService';
import * as quickReplyService from '../services/webchat/quickReplyService';
import configService from '../services/configService';

// WebSocket 配置（从数据库加载，默认值作为后备）
// PING_TIMEOUT 已迁移到数据库配置：websocket.pingTimeout（默认60000ms）
// PING_INTERVAL 已迁移到数据库配置：websocket.pingInterval（默认25000ms）
// TIMEOUT_CLEANER_INTERVAL 已迁移到数据库配置：websocket.timeoutCleanerInterval（默认5分钟）
let PING_TIMEOUT = 60000;
let PING_INTERVAL = 25000;
let TIMEOUT_CLEANER_INTERVAL = 5;

// 初始化WebSocket配置
const initWebSocketConfigs = async () => {
  try {
    PING_TIMEOUT = await configService.get<number>('websocket.pingTimeout', 60000);
    PING_INTERVAL = await configService.get<number>('websocket.pingInterval', 25000);
    TIMEOUT_CLEANER_INTERVAL = await configService.get<number>('websocket.timeoutCleanerInterval', 5);
    console.log(`[WebSocket] 配置已加载: pingTimeout=${PING_TIMEOUT}ms, pingInterval=${PING_INTERVAL}ms, cleanerInterval=${TIMEOUT_CLEANER_INTERVAL}分钟`);
  } catch (error) {
    console.error('[WebSocket] 配置加载失败，使用默认值:', error);
  }
};

// 立即加载配置
initWebSocketConfigs();

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * 初始化Socket.IO服务器
 */
export const initializeSocketServer = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: PING_TIMEOUT,
    pingInterval: PING_INTERVAL
  });

  // 连接认证中间件
  io.use(async (socket, next) => {
    try {
      const { role, userId, agentId } = socket.handshake.auth;

      if (!role || (role !== 'user' && role !== 'agent' && role !== 'admin')) {
        return next(new Error('Invalid role'));
      }

      if (role === 'user' && !userId) {
        return next(new Error('User ID required'));
      }

      if ((role === 'agent' || role === 'admin') && !agentId) {
        return next(new Error('Agent ID required'));
      }

      // 保存到socket数据
      socket.data.role = role;
      socket.data.userId = userId;
      socket.data.agentId = agentId;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // 连接事件
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}, role: ${socket.data.role}`);

    // 注册事件监听器
    registerAgentEvents(socket);
    registerUserEvents(socket);
    registerMessageEvents(socket);
    registerSessionEvents(socket);

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      handleDisconnect(socket);
    });
  });

  // 定期清理超时会话
  startTimeoutCleaner();

  console.log('[Socket] Socket.IO server initialized');
  return io;
};

/**
 * 注册客服相关事件
 */
const registerAgentEvents = (socket: Socket) => {
  // 客服上线
  socket.on('agent:online', async (data) => {
    try {
      const { agentId } = data;

      // 验证 agentId 是否为有效整数
      const numericAgentId = parseInt(agentId);
      if (isNaN(numericAgentId)) {
        console.log(`[Agent] Invalid agentId: ${agentId}, skipping status update`);
        return;
      }

      // 更新客服状态
      await csAgentService.updateAgentStatus(numericAgentId, 'online');

      // 加入客服房间
      socket.join(`agent:${agentId}`);

      // 广播状态变更
      io.emit('agent:status_changed', { agentId, status: 'online' });

      console.log(`[Agent] Agent ${agentId} is now online`);
    } catch (error) {
      console.error('[Agent] Error setting online:', error);
    }
  });

  // 客服离线
  socket.on('agent:offline', async (data) => {
    try {
      const { agentId } = data;

      // 验证 agentId 是否为有效整数
      const numericAgentId = parseInt(agentId);
      if (isNaN(numericAgentId)) {
        console.log(`[Agent] Invalid agentId: ${agentId}, skipping status update`);
        return;
      }

      // 更新客服状态
      await csAgentService.updateAgentStatus(numericAgentId, 'offline');

      // 离开客服房间
      socket.leave(`agent:${agentId}`);

      // 广播状态变更
      io.emit('agent:status_changed', { agentId, status: 'offline' });

      console.log(`[Agent] Agent ${agentId} is now offline`);
    } catch (error) {
      console.error('[Agent] Error setting offline:', error);
    }
  });

  // 客服忙碌
  socket.on('agent:busy', async (data) => {
    try {
      const { agentId } = data;

      // 验证 agentId 是否为有效整数
      const numericAgentId = parseInt(agentId);
      if (isNaN(numericAgentId)) {
        console.log(`[Agent] Invalid agentId: ${agentId}, skipping status update`);
        return;
      }

      // 更新客服状态
      await csAgentService.updateAgentStatus(numericAgentId, 'busy');

      // 广播状态变更
      io.emit('agent:status_changed', { agentId, status: 'busy' });

      console.log(`[Agent] Agent ${agentId} is now busy`);
    } catch (error) {
      console.error('[Agent] Error setting busy:', error);
    }
  });

  // 客服加入会话
  socket.on('agent:join_session', async (data) => {
    try {
      const { sessionId, agentId } = data;

      // 加入会话房间
      socket.join(`session:${sessionId}`);

      console.log(`[Agent] Agent ${agentId} joined session ${sessionId}`);
    } catch (error) {
      console.error('[Agent] Error joining session:', error);
    }
  });

  // 客服正在输入
  socket.on('agent:typing', async (data) => {
    try {
      const { sessionId, agentId } = data;

      // 向会话房间广播(除了自己)
      socket.to(`session:${sessionId}`).emit('agent:typing', { sessionId, agentId });
    } catch (error) {
      console.error('[Agent] Error broadcasting typing:', error);
    }
  });
};

/**
 * 注册用户相关事件
 */
const registerUserEvents = (socket: Socket) => {
  // 用户加入会话
  socket.on('user:join_session', async (data) => {
    try {
      const { sessionId, userId } = data;

      // 加入会话房间
      socket.join(`session:${sessionId}`);

      // 广播用户加入
      socket.to(`session:${sessionId}`).emit('user:joined', { sessionId, userId });

      console.log(`[User] User ${userId} joined session ${sessionId}`);
    } catch (error) {
      console.error('[User] Error joining session:', error);
    }
  });

  // 用户正在输入
  socket.on('user:typing', async (data) => {
    try {
      const { sessionId, userId } = data;

      // 向会话房间广播(除了自己)
      socket.to(`session:${sessionId}`).emit('user:typing', { sessionId, userId });
    } catch (error) {
      console.error('[User] Error broadcasting typing:', error);
    }
  });
};

/**
 * 注册消息相关事件
 */
const registerMessageEvents = (socket: Socket) => {
  // 发送消息
  socket.on('message:send', async (data) => {
    try {
      const {
        sessionId,
        senderType,
        senderId,
        content,
        messageType = 'text',
        attachments = []
      } = data;

      // 创建消息
      const message = await chatMessageService.createMessage({
        sessionId,
        senderType,
        senderId,
        content,
        messageType,
        attachments
      });

      // 向会话房间广播新消息
      io.to(`session:${sessionId}`).emit('message:new', message);

      console.log(`[Message] New message in session ${sessionId} from ${senderType}`);

      // 如果是使用快捷回复,增加使用次数
      if (messageType === 'quick_reply' && message.metadata?.template_id) {
        await quickReplyService.incrementUsageCount(message.metadata.template_id);
      }
    } catch (error) {
      console.error('[Message] Error sending message:', error);
      socket.emit('notification', {
        type: 'error',
        message: '发送消息失败',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  });

  // 标记消息已读
  socket.on('message:mark_read', async (data) => {
    try {
      const { sessionId, messageId } = data;

      // 标记消息为已读
      await chatMessageService.markAsRead(messageId);

      // 向会话房间广播已读状态
      io.to(`session:${sessionId}`).emit('message:read', { sessionId, messageId });

      console.log(`[Message] Message ${messageId} marked as read`);
    } catch (error) {
      console.error('[Message] Error marking message as read:', error);
    }
  });
};

/**
 * 注册会话相关事件
 */
const registerSessionEvents = (socket: Socket) => {
  // 关闭会话
  socket.on('session:close', async (data) => {
    try {
      const { sessionId, reason } = data;

      // 关闭会话
      const session = await chatSessionService.closeSession(
        sessionId,
        reason as any
      );

      if (session) {
        // 向会话房间广播关闭事件
        io.to(`session:${sessionId}`).emit('session:closed', session);

        console.log(`[Session] Session ${sessionId} closed, reason: ${reason}`);
      }
    } catch (error) {
      console.error('[Session] Error closing session:', error);
    }
  });

  // 转接会话
  socket.on('session:transfer', async (data) => {
    try {
      const { sessionId, fromAgentId, toAgentId, reason } = data;

      // 转接会话
      const session = await chatSessionService.transferSession(
        sessionId,
        fromAgentId,
        toAgentId,
        reason
      );

      if (session) {
        // 获取新客服信息
        const newAgent = await csAgentService.getAgentById(toAgentId);

        if (newAgent) {
          // 向会话房间广播转接事件
          io.to(`session:${sessionId}`).emit('session:transferred', {
            session,
            newAgent
          });

          // 通知新客服
          io.to(`agent:${toAgentId}`).emit('session:assigned', session);

          console.log(`[Session] Session ${sessionId} transferred from ${fromAgentId} to ${toAgentId}`);
        }
      }
    } catch (error) {
      console.error('[Session] Error transferring session:', error);
      socket.emit('notification', {
        type: 'error',
        message: '转接会话失败',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  });
};

/**
 * 处理断开连接
 */
const handleDisconnect = async (socket: Socket) => {
  try {
    const { role, agentId, userId } = socket.data;

    // 如果是客服断开连接,更新状态为离线
    if (role === 'agent' && agentId) {
      // 验证 agentId 是否为有效整数
      const numericAgentId = parseInt(agentId);
      if (!isNaN(numericAgentId)) {
        await csAgentService.updateAgentStatus(numericAgentId, 'offline');
        io.emit('agent:status_changed', { agentId, status: 'offline' });
        console.log(`[Agent] Agent ${agentId} disconnected and set to offline`);
      } else {
        console.log(`[Agent] Invalid agentId on disconnect: ${agentId}, skipping status update`);
      }
    }

    // 如果是用户断开连接,广播离开事件
    if (role === 'user' && userId) {
      // 获取用户的活跃会话
      const sessions = await chatSessionService.getSessions({
        userId,
        status: 'active',
        limit: 10
      });

      // 向所有活跃会话广播用户离开
      sessions.sessions.forEach(session => {
        socket.to(`session:${session.id}`).emit('user:left', {
          sessionId: session.id,
          userId
        });
      });

      console.log(`[User] User ${userId} disconnected`);
    }
  } catch (error) {
    console.error('[Socket] Error handling disconnect:', error);
  }
};

/**
 * 获取Socket.IO实例
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
};

/**
 * 向指定客服发送通知
 */
export const notifyAgent = (
  agentId: number,
  type: string,
  message: string,
  data?: any
): void => {
  if (!io) return;

  io.to(`agent:${agentId}`).emit('notification', {
    type,
    message,
    data
  });
};

/**
 * 向指定会话发送通知
 */
export const notifySession = (
  sessionId: number,
  type: string,
  message: string,
  data?: any
): void => {
  if (!io) return;

  io.to(`session:${sessionId}`).emit('notification', {
    type,
    message,
    data
  });
};

/**
 * 广播系统通知
 */
export const broadcastNotification = (
  type: string,
  message: string,
  data?: any
): void => {
  if (!io) return;

  io.emit('notification', {
    type,
    message,
    data
  });
};

/**
 * 通知客服有新会话分配
 */
export const notifyNewSession = async (
  agentId: number,
  sessionId: number
): Promise<void> => {
  try {
    const session = await chatSessionService.getSessionById(sessionId);

    if (session && io) {
      io.to(`agent:${agentId}`).emit('session:assigned', session);
      console.log(`[Notification] New session ${sessionId} assigned to agent ${agentId}`);
    }
  } catch (error) {
    console.error('[Notification] Error notifying new session:', error);
  }
};

/**
 * 定期清理超时会话（间隔从数据库配置读取）
 */
const startTimeoutCleaner = (): void => {
  const intervalMs = TIMEOUT_CLEANER_INTERVAL * 60 * 1000;

  setInterval(async () => {
    try {
      const closedCount = await chatSessionService.closeTimeoutSessions();

      if (closedCount > 0) {
        console.log(`[Timeout] Closed ${closedCount} timeout sessions`);
      }
    } catch (error) {
      console.error('[Timeout] Error closing timeout sessions:', error);
    }
  }, intervalMs);

  console.log(`[Timeout] Timeout cleaner started, checking every ${TIMEOUT_CLEANER_INTERVAL} minutes`);
};

/**
 * 获取在线客服列表
 */
export const getOnlineAgents = async (): Promise<number[]> => {
  if (!io) return [];

  const sockets = await io.fetchSockets();
  const agentIds = new Set<number>();

  sockets.forEach(socket => {
    if (socket.data.role === 'agent' && socket.data.agentId) {
      agentIds.add(socket.data.agentId);
    }
  });

  return Array.from(agentIds);
};

/**
 * 获取会话中的在线用户
 */
export const getSessionParticipants = async (
  sessionId: number
): Promise<{ users: string[]; agents: number[] }> => {
  if (!io) return { users: [], agents: [] };

  const roomName = `session:${sessionId}`;
  const sockets = await io.in(roomName).fetchSockets();

  const users = new Set<string>();
  const agents = new Set<number>();

  sockets.forEach(socket => {
    if (socket.data.role === 'user' && socket.data.userId) {
      users.add(socket.data.userId);
    } else if (socket.data.role === 'agent' && socket.data.agentId) {
      agents.add(socket.data.agentId);
    }
  });

  return {
    users: Array.from(users),
    agents: Array.from(agents)
  };
};

/**
 * 关闭Socket.IO服务器
 */
export const closeSocketServer = async (): Promise<void> => {
  if (io) {
    // 设置所有客服为离线
    await csAgentService.setAllAgentsOffline();

    // 关闭所有连接
    io.close(() => {
      console.log('[Socket] Socket.IO server closed');
    });
  }
};
