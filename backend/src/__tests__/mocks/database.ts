/**
 * 数据库模拟工具
 */

export const mockQuery = jest.fn()

// Mock 数据库查询函数
export const createMockQuery = () => {
  return mockQuery
}

// 重置所有 mock
export const resetDatabaseMocks = () => {
  mockQuery.mockReset()
}

// 常用的 mock 响应
export const mockQueryResponses = {
  // 空结果
  empty: { rows: [], rowCount: 0 },

  // 单个用户
  singleUser: {
    rows: [
      {
        id: 'user_test_123',
        phone: '13900000001',
        username: '13900000001',
        nickname: '测试用户',
        avatar: null,
        balance: 100,
        password_hash: '$2a$10$abc123hashexample',
        created_at: new Date('2025-01-01'),
      },
    ],
    rowCount: 1,
  },

  // 插入用户成功
  insertUser: {
    rows: [
      {
        id: 'user_test_new',
        phone: '13900000002',
        nickname: '新用户',
        avatar: null,
        balance: 0,
      },
    ],
    rowCount: 1,
  },

  // 更新成功
  updateUser: {
    rows: [
      {
        id: 'user_test_123',
        phone: '13900000001',
        nickname: '更新后的昵称',
        avatar: 'new-avatar.jpg',
        balance: 100,
      },
    ],
    rowCount: 1,
  },
}
