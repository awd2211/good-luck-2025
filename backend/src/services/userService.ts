// 用户管理服务（使用内存数据模拟）

export interface User {
  id: string
  username: string
  phone: string
  email?: string
  registerDate: string
  status: 'active' | 'inactive'
  orderCount: number
  totalSpent: number
  lastLoginDate?: string
}

// 模拟用户数据
let users: User[] = [
  {
    id: 'user-001',
    username: '张三',
    phone: '13800138001',
    email: 'zhangsan@example.com',
    registerDate: '2024-01-15',
    status: 'active',
    orderCount: 5,
    totalSpent: 298,
    lastLoginDate: '2025-01-10'
  },
  {
    id: 'user-002',
    username: '李四',
    phone: '13800138002',
    email: 'lisi@example.com',
    registerDate: '2024-02-20',
    status: 'active',
    orderCount: 3,
    totalSpent: 178,
    lastLoginDate: '2025-01-08'
  },
  {
    id: 'user-003',
    username: '王五',
    phone: '13800138003',
    registerDate: '2024-03-10',
    status: 'inactive',
    orderCount: 1,
    totalSpent: 58,
    lastLoginDate: '2024-12-01'
  }
]

let nextUserId = 4

/**
 * 获取所有用户（支持分页和搜索）
 */
export const getAllUsers = (params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}) => {
  let filteredUsers = [...users]

  // 搜索过滤
  if (params?.search) {
    const search = params.search.toLowerCase()
    filteredUsers = filteredUsers.filter(
      u =>
        u.username.toLowerCase().includes(search) ||
        u.phone.includes(search) ||
        u.email?.toLowerCase().includes(search)
    )
  }

  // 状态过滤
  if (params?.status && params.status !== 'all') {
    filteredUsers = filteredUsers.filter(u => u.status === params.status)
  }

  // 分页
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const total = filteredUsers.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedUsers = filteredUsers.slice(start, end)

  return {
    data: paginatedUsers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

/**
 * 根据ID获取用户
 */
export const getUserById = (id: string): User | null => {
  return users.find(u => u.id === id) || null
}

/**
 * 创建用户
 */
export const createUser = (userData: Omit<User, 'id' | 'registerDate' | 'orderCount' | 'totalSpent'>): User => {
  const newUser: User = {
    ...userData,
    id: `user-${String(nextUserId++).padStart(3, '0')}`,
    registerDate: new Date().toISOString().split('T')[0],
    orderCount: 0,
    totalSpent: 0
  }
  users.push(newUser)
  return newUser
}

/**
 * 更新用户
 */
export const updateUser = (id: string, userData: Partial<User>): User | null => {
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return null

  users[index] = {
    ...users[index],
    ...userData,
    id: users[index].id, // 确保ID不被修改
    registerDate: users[index].registerDate // 确保注册日期不被修改
  }
  return users[index]
}

/**
 * 删除用户
 */
export const deleteUser = (id: string): boolean => {
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return false

  users.splice(index, 1)
  return true
}

/**
 * 批量更新用户状态
 */
export const batchUpdateUserStatus = (ids: string[], status: 'active' | 'inactive'): number => {
  let count = 0
  ids.forEach(id => {
    const user = users.find(u => u.id === id)
    if (user) {
      user.status = status
      count++
    }
  })
  return count
}

/**
 * 获取用户统计信息
 */
export const getUserStats = () => {
  const total = users.length
  const active = users.filter(u => u.status === 'active').length
  const inactive = users.filter(u => u.status === 'inactive').length
  const totalSpent = users.reduce((sum, u) => sum + u.totalSpent, 0)
  const totalOrders = users.reduce((sum, u) => sum + u.orderCount, 0)

  return {
    total,
    active,
    inactive,
    totalSpent,
    totalOrders,
    averageSpent: total > 0 ? totalSpent / total : 0
  }
}
