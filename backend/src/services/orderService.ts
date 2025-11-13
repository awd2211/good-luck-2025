// 订单管理服务（使用内存数据模拟）

export interface Order {
  id: string
  orderId: string
  userId: string
  username: string
  fortuneType: string
  fortuneName: string
  amount: number
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  createTime: string
  updateTime: string
  payMethod?: string
}

// 模拟订单数据
let orders: Order[] = [
  {
    id: 'order-001',
    orderId: 'ORD20250113001',
    userId: 'user-001',
    username: '张三',
    fortuneType: 'birth-animal',
    fortuneName: '生肖运势',
    amount: 58,
    status: 'completed',
    createTime: '2025-01-13 10:30:00',
    updateTime: '2025-01-13 10:31:00',
    payMethod: '微信支付'
  },
  {
    id: 'order-002',
    orderId: 'ORD20250113002',
    userId: 'user-002',
    username: '李四',
    fortuneType: 'bazi',
    fortuneName: '八字精批',
    amount: 88,
    status: 'completed',
    createTime: '2025-01-13 11:20:00',
    updateTime: '2025-01-13 11:22:00',
    payMethod: '支付宝'
  },
  {
    id: 'order-003',
    orderId: 'ORD20250113003',
    userId: 'user-001',
    username: '张三',
    fortuneType: 'marriage',
    fortuneName: '八字合婚',
    amount: 128,
    status: 'pending',
    createTime: '2025-01-13 14:15:00',
    updateTime: '2025-01-13 14:15:00'
  }
]

let nextOrderId = 4

/**
 * 生成订单号
 */
const generateOrderId = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const seq = String(nextOrderId++).padStart(3, '0')
  return `ORD${year}${month}${day}${seq}`
}

/**
 * 获取所有订单（支持分页和筛选）
 */
export const getAllOrders = (params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  startDate?: string
  endDate?: string
}) => {
  let filteredOrders = [...orders]

  // 搜索过滤
  if (params?.search) {
    const search = params.search.toLowerCase()
    filteredOrders = filteredOrders.filter(
      o =>
        o.orderId.toLowerCase().includes(search) ||
        o.username.toLowerCase().includes(search) ||
        o.fortuneName.toLowerCase().includes(search)
    )
  }

  // 状态过滤
  if (params?.status && params.status !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.status === params.status)
  }

  // 日期过滤
  if (params?.startDate) {
    filteredOrders = filteredOrders.filter(o => o.createTime >= params.startDate!)
  }
  if (params?.endDate) {
    filteredOrders = filteredOrders.filter(o => o.createTime <= params.endDate!)
  }

  // 按时间倒序排序
  filteredOrders.sort((a, b) => b.createTime.localeCompare(a.createTime))

  // 分页
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const total = filteredOrders.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedOrders = filteredOrders.slice(start, end)

  return {
    data: paginatedOrders,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

/**
 * 根据ID获取订单
 */
export const getOrderById = (id: string): Order | null => {
  return orders.find(o => o.id === id) || null
}

/**
 * 创建订单
 */
export const createOrder = (orderData: Omit<Order, 'id' | 'orderId' | 'createTime' | 'updateTime'>): Order => {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const newOrder: Order = {
    ...orderData,
    id: `order-${String(nextOrderId).padStart(3, '0')}`,
    orderId: generateOrderId(),
    createTime: now,
    updateTime: now
  }
  orders.push(newOrder)
  return newOrder
}

/**
 * 更新订单
 */
export const updateOrder = (id: string, orderData: Partial<Order>): Order | null => {
  const index = orders.findIndex(o => o.id === id)
  if (index === -1) return null

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
  orders[index] = {
    ...orders[index],
    ...orderData,
    id: orders[index].id,
    orderId: orders[index].orderId,
    createTime: orders[index].createTime,
    updateTime: now
  }
  return orders[index]
}

/**
 * 更新订单状态
 */
export const updateOrderStatus = (id: string, status: Order['status']): Order | null => {
  return updateOrder(id, { status })
}

/**
 * 删除订单
 */
export const deleteOrder = (id: string): boolean => {
  const index = orders.findIndex(o => o.id === id)
  if (index === -1) return false

  orders.splice(index, 1)
  return true
}

/**
 * 获取订单统计
 */
export const getOrderStats = (params?: { startDate?: string; endDate?: string }) => {
  let filteredOrders = [...orders]

  // 日期过滤
  if (params?.startDate) {
    filteredOrders = filteredOrders.filter(o => o.createTime >= params.startDate!)
  }
  if (params?.endDate) {
    filteredOrders = filteredOrders.filter(o => o.createTime <= params.endDate!)
  }

  const total = filteredOrders.length
  const completed = filteredOrders.filter(o => o.status === 'completed').length
  const pending = filteredOrders.filter(o => o.status === 'pending').length
  const cancelled = filteredOrders.filter(o => o.status === 'cancelled').length
  const refunded = filteredOrders.filter(o => o.status === 'refunded').length

  const totalRevenue = filteredOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0)

  const averageAmount = completed > 0 ? totalRevenue / completed : 0

  // 按服务类型统计
  const byFortuneType: Record<string, { count: number; revenue: number }> = {}
  filteredOrders
    .filter(o => o.status === 'completed')
    .forEach(o => {
      if (!byFortuneType[o.fortuneName]) {
        byFortuneType[o.fortuneName] = { count: 0, revenue: 0 }
      }
      byFortuneType[o.fortuneName].count++
      byFortuneType[o.fortuneName].revenue += o.amount
    })

  return {
    total,
    completed,
    pending,
    cancelled,
    refunded,
    totalRevenue,
    averageAmount,
    byFortuneType
  }
}

/**
 * 获取今日订单统计
 */
export const getTodayOrderStats = () => {
  const today = new Date().toISOString().split('T')[0]
  const todayOrders = orders.filter(o => o.createTime.startsWith(today))

  const total = todayOrders.length
  const revenue = todayOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0)

  return {
    total,
    revenue
  }
}
