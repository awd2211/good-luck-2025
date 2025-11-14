/**
 * Jest 测试环境配置文件
 * 在所有测试运行前执行
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.REDIS_ENABLED = 'false'

// 全局测试超时设置
jest.setTimeout(10000)

// 清理函数
afterAll(async () => {
  // 在所有测试完成后清理资源
  await new Promise(resolve => setTimeout(resolve, 500))
})
