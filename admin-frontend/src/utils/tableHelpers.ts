/**
 * Table组件辅助函数
 * 确保dataSource始终是数组类型
 */

/**
 * 安全的dataSource转换
 * @param data 任意类型的数据
 * @returns 确保返回数组
 */
export function safeDataSource<T = any>(data: any): T[] {
  if (Array.isArray(data)) {
    return data
  }
  if (data === null || data === undefined) {
    return []
  }
  // 如果是对象，尝试提取常见的数组字段
  if (typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data
    if (Array.isArray(data.list)) return data.list
    if (Array.isArray(data.items)) return data.items
    if (Array.isArray(data.records)) return data.records
  }
  return []
}

/**
 * 从API响应中安全提取数据数组
 * @param response API响应对象
 * @returns 数组数据
 */
export function extractDataArray<T = any>(response: any): T[] {
  if (!response) return []

  // 尝试多种可能的数据路径
  const possiblePaths = [
    response.data?.data?.list,     // {success: true, data: {list: [...], pagination: {...}}}
    response.data?.data?.items,    // {success: true, data: {items: [...], pagination: {...}}}
    response.data?.data,           // {success: true, data: [...]}
    response.data?.list,           // {data: {list: [...]}}
    response.data?.items,          // {data: {items: [...]}}
    response.data,                 // {data: [...]}
    response.list,                 // {list: [...]}
    response.items,                // {items: [...]}
    response                       // [...]
  ]

  for (const path of possiblePaths) {
    if (Array.isArray(path)) {
      return path
    }
  }

  return []
}

/**
 * 从API响应中提取分页信息
 * @param response API响应对象
 * @returns 分页对象
 */
export function extractPagination(response: any) {
  const pagination = response?.data?.pagination || response?.pagination || {}

  return {
    current: pagination.page || pagination.current || 1,
    pageSize: pagination.pageSize || pagination.limit || pagination.per_page || 20,
    total: pagination.total || 0,
    totalPages: pagination.totalPages || pagination.total_pages || 0
  }
}
