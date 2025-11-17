/**
 * 客服在线状态管理服务
 * 使用内存存储（可迁移到Redis以支持分布式部署）
 */

import configService from './configService';

interface AgentStatus {
  agentId: string
  status: 'online' | 'busy' | 'offline'
  currentChatCount: number
  lastOnlineAt: Date
  lastActivityAt: Date
}

// 内存存储（生产环境建议使用Redis）
const agentStatusMap = new Map<string, AgentStatus>()

// 配置缓存（从数据库加载，默认值作为后备）
// MAX_CONCURRENT_CHATS 已迁移到数据库配置：cs.maxConcurrentChats（默认5）
// INACTIVE_TIMEOUT_MINUTES 已迁移到数据库配置：cs.inactiveTimeoutMinutes（默认30）
// CLEANUP_INTERVAL_MINUTES 已迁移到数据库配置：cs.cleanupIntervalMinutes（默认10）
let MAX_CONCURRENT_CHATS = 5;
let INACTIVE_TIMEOUT_MINUTES = 30;
let CLEANUP_INTERVAL_MINUTES = 10;

// 初始化配置（从数据库加载）
const initConfigs = async () => {
  try {
    MAX_CONCURRENT_CHATS = await configService.get<number>('cs.maxConcurrentChats', 5);
    INACTIVE_TIMEOUT_MINUTES = await configService.get<number>('cs.inactiveTimeoutMinutes', 30);
    CLEANUP_INTERVAL_MINUTES = await configService.get<number>('cs.cleanupIntervalMinutes', 10);
    console.log(`[CS Status] 配置已加载: 最大并发=${MAX_CONCURRENT_CHATS}, 超时=${INACTIVE_TIMEOUT_MINUTES}分钟, 清理间隔=${CLEANUP_INTERVAL_MINUTES}分钟`);
  } catch (error) {
    console.error('[CS Status] 配置加载失败，使用默认值:', error);
  }
};

// 立即加载配置
initConfigs();

/**
 * 设置客服在线状态
 */
export function setAgentStatus(agentId: string, status: 'online' | 'busy' | 'offline'): AgentStatus {
  const now = new Date()
  const existing = agentStatusMap.get(agentId)

  const agentStatus: AgentStatus = {
    agentId,
    status,
    currentChatCount: existing?.currentChatCount || 0,
    lastOnlineAt: status === 'online' ? now : (existing?.lastOnlineAt || now),
    lastActivityAt: now
  }

  agentStatusMap.set(agentId, agentStatus)
  return agentStatus
}

/**
 * 获取客服状态
 */
export function getAgentStatus(agentId: string): AgentStatus | null {
  return agentStatusMap.get(agentId) || null
}

/**
 * 获取所有在线客服
 */
export function getOnlineAgents(): AgentStatus[] {
  const agents: AgentStatus[] = []
  agentStatusMap.forEach(agent => {
    if (agent.status === 'online') {
      agents.push(agent)
    }
  })
  return agents
}

/**
 * 获取所有忙碌客服
 */
export function getBusyAgents(): AgentStatus[] {
  const agents: AgentStatus[] = []
  agentStatusMap.forEach(agent => {
    if (agent.status === 'busy') {
      agents.push(agent)
    }
  })
  return agents
}

/**
 * 增加客服当前聊天数
 */
export function incrementChatCount(agentId: string): number {
  const agent = agentStatusMap.get(agentId)
  if (!agent) {
    return 0
  }

  agent.currentChatCount++
  agent.lastActivityAt = new Date()

  // 自动更新为忙碌状态（如果达到上限）
  if (agent.currentChatCount >= MAX_CONCURRENT_CHATS) {
    agent.status = 'busy'
  }

  agentStatusMap.set(agentId, agent)
  return agent.currentChatCount
}

/**
 * 减少客服当前聊天数
 */
export function decrementChatCount(agentId: string): number {
  const agent = agentStatusMap.get(agentId)
  if (!agent) {
    return 0
  }

  agent.currentChatCount = Math.max(0, agent.currentChatCount - 1)
  agent.lastActivityAt = new Date()

  // 如果之前是忙碌状态，现在有空闲了，自动改为在线
  if (agent.status === 'busy' && agent.currentChatCount < MAX_CONCURRENT_CHATS) {
    agent.status = 'online'
  }

  agentStatusMap.set(agentId, agent)
  return agent.currentChatCount
}

/**
 * 移除客服状态（断开连接时）
 */
export function removeAgentStatus(agentId: string): void {
  const agent = agentStatusMap.get(agentId)
  if (agent) {
    agent.status = 'offline'
    agent.lastActivityAt = new Date()
    agentStatusMap.set(agentId, agent)
  }
}

/**
 * 获取统计数据
 */
export function getAgentStatusStats(): {
  onlineAgents: number
  busyAgents: number
  offlineAgents: number
  totalAgents: number
} {
  let online = 0
  let busy = 0
  let offline = 0

  agentStatusMap.forEach(agent => {
    switch (agent.status) {
      case 'online':
        online++
        break
      case 'busy':
        busy++
        break
      case 'offline':
        offline++
        break
    }
  })

  return {
    onlineAgents: online,
    busyAgents: busy,
    offlineAgents: offline,
    totalAgents: agentStatusMap.size
  }
}

/**
 * 清理长时间未活动的状态（定时任务）
 */
export function cleanupInactiveAgents(timeoutMinutes?: number): number {
  const timeout = (timeoutMinutes || INACTIVE_TIMEOUT_MINUTES) * 60 * 1000
  const now = new Date()
  let cleanedCount = 0

  agentStatusMap.forEach((agent, agentId) => {
    const inactiveTime = now.getTime() - agent.lastActivityAt.getTime()
    if (inactiveTime > timeout && agent.status !== 'offline') {
      agent.status = 'offline'
      agentStatusMap.set(agentId, agent)
      cleanedCount++
    }
  })

  return cleanedCount
}

// 启动定时清理任务（间隔从数据库配置读取）
setInterval(() => {
  const cleaned = cleanupInactiveAgents()
  if (cleaned > 0) {
    console.log(`[CS Status] Cleaned up ${cleaned} inactive agents`)
  }
}, CLEANUP_INTERVAL_MINUTES * 60 * 1000)
