/**
 * JWT 模拟工具
 */

// Mock JWT 函数
export const mockJwtSign = jest.fn()
export const mockJwtVerify = jest.fn()

// 常用的 mock token
export const mockTokens = {
  validUserToken: 'valid.user.token.123',
  validAdminToken: 'valid.admin.token.456',
  expiredToken: 'expired.token.789',
  invalidToken: 'invalid.token.000',
}

// Mock JWT payload
export const mockPayloads = {
  user: {
    id: 'user_test_123',
    role: 'user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  },
  admin: {
    id: 'admin_test_456',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  },
}

// 重置所有 JWT mock
export const resetJwtMocks = () => {
  mockJwtSign.mockReset()
  mockJwtVerify.mockReset()
}
