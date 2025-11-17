/**
 * 用户个人资料服务
 */

import api from './api'

/**
 * 用户标签接口
 */
export interface UserTag {
  id: number
  tag_name: string
  tag_color: string
  description: string
  assigned_at: string
}

/**
 * 用户画像数据
 */
export interface UserPortrait {
  profile: {
    vipLevel: number
    vipLabel: string
    totalSessions: number
    totalMessages: number
    avgSatisfactionRating: string | null
    lastContactAt: string | null
    lifetimeValue: number
    memberSince: string
  }
  tags: Array<{
    tag_name: string
    tag_color: string
    description: string
    assigned_at: string
  }>
  sessionStats: {
    total: number
    completed: number
    active: number
  }
}

/**
 * 获取用户标签
 */
export const getUserTags = async (): Promise<UserTag[]> => {
  const response = await api.get('/profile/tags')
  return response.data.data
}

/**
 * 获取用户画像
 */
export const getUserPortrait = async (): Promise<UserPortrait> => {
  const response = await api.get('/profile/portrait')
  return response.data.data
}

/**
 * 更新用户个人资料
 */
export interface UpdateProfileData {
  nickname?: string
  email?: string
  avatar?: string
}

export const updateProfile = async (data: UpdateProfileData): Promise<any> => {
  const response = await api.put('/profile', data)
  return response.data.data
}
