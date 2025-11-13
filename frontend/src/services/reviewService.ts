import api from './api'
import type { ApiResponse, PaginatedResponse, Review } from '../types'

// 获取服务评价列表
export const getReviews = (fortuneId: string, params?: {
  page?: number
  limit?: number
  rating?: number
}) => {
  return api.get<PaginatedResponse<Review>>(`/fortunes/${fortuneId}/reviews`, {
    params,
  })
}

// 获取我的评价
export const getMyReviews = (params?: {
  page?: number
  limit?: number
}) => {
  return api.get<PaginatedResponse<Review>>('/reviews/my', { params })
}

// 创建评价
export const createReview = (data: {
  order_id: string
  fortune_id: string
  rating: number
  content: string
  images?: string[]
}) => {
  return api.post<ApiResponse<Review>>('/reviews', data)
}

// 上传评价图片
export const uploadReviewImage = (file: File) => {
  const formData = new FormData()
  formData.append('image', file)

  return api.post<ApiResponse<{ url: string }>>('/reviews/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 删除评价（仅限自己的评价）
export const deleteReview = (reviewId: string) => {
  return api.delete<ApiResponse>(`/reviews/${reviewId}`)
}
