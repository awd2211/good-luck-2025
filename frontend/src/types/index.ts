// 用户相关类型
export interface User {
  id: string
  phone: string
  nickname?: string
  avatar?: string
  balance: number
  created_at: string
}

export interface LoginData {
  phone: string
  password?: string
  code?: string  // 验证码
}

export interface RegisterData {
  phone: string
  code: string
  password: string
  nickname?: string
}

// 算命服务类型
export interface Fortune {
  id: string
  title: string
  description: string
  price: number
  original_price?: number
  icon: string
  category: string
  rating?: number
  review_count?: number
  sales_count?: number
}

// 购物车类型
export interface CartItem {
  id: string
  fortune_id: string
  fortune: Fortune
  quantity: number
  price: number
}

// 订单类型
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled' | 'refunded'

export const OrderStatus = {
  PENDING: 'pending' as const,           // 待支付
  PAID: 'paid' as const,                 // 已支付
  PROCESSING: 'processing' as const,     // 处理中
  COMPLETED: 'completed' as const,       // 已完成
  CANCELLED: 'cancelled' as const,       // 已取消
  REFUNDED: 'refunded' as const          // 已退款
}

export interface Order {
  id: string
  user_id: string
  order_no: string
  total_amount: number
  discount_amount: number
  final_amount: number
  status: OrderStatus
  items: OrderItem[]
  coupon_id?: string
  payment_method?: string
  payment_time?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  fortune_id: string
  fortune: Fortune
  quantity: number
  price: number
  subtotal: number
}

// 优惠券类型
export type CouponType = 'percentage' | 'fixed'

export const CouponType = {
  PERCENTAGE: 'percentage' as const,  // 百分比折扣
  FIXED: 'fixed' as const             // 固定金额
}

export interface Coupon {
  id: string
  code: string
  name: string
  type: CouponType
  value: number               // 折扣值（百分比或金额）
  min_amount: number          // 最低消费金额
  max_discount?: number       // 最大折扣金额（仅百分比类型）
  start_date: string
  end_date: string
  usage_limit: number
  used_count: number
  is_active: boolean
}

// 用户优惠券
export interface UserCoupon {
  id: string
  user_id: string
  coupon_id: string
  coupon: Coupon
  is_used: boolean
  used_at?: string
  created_at: string
}

// 评价类型
export interface Review {
  id: string
  user_id: string
  user: {
    nickname: string
    avatar?: string
  }
  fortune_id: string
  order_id: string
  rating: number
  content: string
  images?: string[]
  reply?: string
  reply_at?: string
  created_at: string
}

// 收藏类型
export interface Favorite {
  id: string
  user_id: string
  fortune_id: string
  fortune: Fortune
  created_at: string
}

// 浏览历史
export interface BrowseHistory {
  id: string
  user_id: string
  fortune_id: string
  fortune: Fortune
  created_at: string
}

// 算命结果类型
export interface FortuneResult {
  id: string
  result_id: string
  order_id?: string
  user_id: string
  fortune_id: string
  fortune_type: string
  input_data: Record<string, any>
  result_data: Record<string, any>
  created_at: string
  updated_at: string
  fortune_info?: {
    title: string
    subtitle?: string
    icon?: string
    bg_color?: string
    price: number
  }
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}
