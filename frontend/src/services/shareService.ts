import api from './api'
import type { ApiResponse, PaginatedResponse } from '../types'

export type ShareType = 'fortune' | 'article' | 'service' | 'fortune_result'
export type SharePlatform = 'wechat' | 'qq' | 'weibo' | 'link'
export type ShareEventType = 'share' | 'view' | 'click' | 'register'

export interface ShareLink {
  id: string
  share_id: string
  share_url: string
  share_type: ShareType
  target_id: string
  platform: SharePlatform
  view_count: number
  click_count: number
  register_count: number
  created_at: string
}

export interface ShareStats {
  total_shares: number
  total_views: number
  total_clicks: number
  total_registers: number
  total_rewards: number
}

export interface ShareReward {
  id: string
  reward_type: string
  reward_amount: number
  status: string
  created_at: string
}

export interface LeaderboardItem {
  user_id: string
  username: string
  share_count: number
  view_count: number
  register_count: number
  rank: number
}

// 创建分享链接
export const createShare = (data: {
  shareType: ShareType
  targetId: string
  platform?: SharePlatform
}) => {
  return api.post<ApiResponse<{
    shareId: string
    shareUrl: string
  }>>('/share/create', {
    shareType: data.shareType,
    targetId: data.targetId,
    platform: data.platform || 'link'
  })
}

// 记录分享事件
export const recordShareEvent = (data: {
  shareId: string
  eventType: ShareEventType
  referrer?: string
}) => {
  return api.post<ApiResponse>('/share/event', data)
}

// 获取我的分享链接
export const getMyShareLinks = (params?: {
  page?: number
  limit?: number
  shareType?: ShareType
}) => {
  return api.get<PaginatedResponse<ShareLink>>('/share/my-links', { params })
}

// 获取我的分享统计
export const getMyShareStats = () => {
  return api.get<ApiResponse<ShareStats>>('/share/my-stats')
}

// 获取分享排行榜
export const getLeaderboard = (params?: {
  limit?: number
  period?: 'day' | 'week' | 'month' | 'all'
}) => {
  return api.get<ApiResponse<LeaderboardItem[]>>('/share/leaderboard', { params })
}

// 获取我的分享奖励
export const getMyRewards = (params?: {
  page?: number
  limit?: number
}) => {
  return api.get<PaginatedResponse<ShareReward>>('/share/my-rewards', { params })
}

// 领取奖励
export const claimReward = (rewardId: string) => {
  return api.post<ApiResponse>(`/share/rewards/${rewardId}/claim`)
}
