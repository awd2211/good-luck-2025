import api from './api'
import type { CartItem } from '../types'
import type { ApiResponse } from '../types'

// 获取购物车
export const getCart = () => {
  return api.get<ApiResponse<CartItem[]>>('/cart')
}

// 添加到购物车
export const addToCart = (fortuneId: string, quantity = 1) => {
  return api.post<ApiResponse<CartItem>>('/cart', {
    fortune_id: fortuneId,
    quantity,
  })
}

// 更新购物车项数量
export const updateCartItem = (itemId: string, quantity: number) => {
  return api.put<ApiResponse<CartItem>>(`/cart/${itemId}`, { quantity })
}

// 删除购物车项
export const removeFromCart = (itemId: string) => {
  return api.delete<ApiResponse>(`/cart/${itemId}`)
}

// 批量删除购物车项
export const batchRemoveFromCart = (itemIds: string[]) => {
  return api.post<ApiResponse>('/cart/batch-delete', { item_ids: itemIds })
}

// 清空购物车
export const clearCart = () => {
  return api.delete<ApiResponse>('/cart')
}

// 选中购物车项（用于结算）
export const selectCartItems = (itemIds: string[]) => {
  return api.post<ApiResponse>('/cart/select', { item_ids: itemIds })
}
