import { Card, Descriptions, Tag, Button, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { login } from '../services/authService'

const DiagnosticPage = () => {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const testLogin = async () => {
    setTesting(true)
    try {
      console.log('🧪 开始测试登录...')
      const result = await login({
        username: 'admin',
        password: 'admin123'
      })
      console.log('✅ 登录测试成功:', result)
      setTestResult({ success: true, data: result })
      message.success('登录测试成功！')
    } catch (error: any) {
      console.error('❌ 登录测试失败:', error)
      setTestResult({
        success: false,
        error: error.message,
        response: error.response?.data
      })
      message.error('登录测试失败: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title="🔍 管理后台诊断页面" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="环境变量 - BASE_URL">
            <code>{import.meta.env.VITE_API_BASE_URL || '未设置'}</code>
          </Descriptions.Item>
          <Descriptions.Item label="运行模式">
            <Tag color={import.meta.env.DEV ? 'blue' : 'green'}>
              {import.meta.env.MODE}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="是否开发模式">
            {import.meta.env.DEV ? (
              <Tag icon={<CheckCircleOutlined />} color="success">是</Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="error">否</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="前端地址">
            <code>{window.location.origin}</code>
          </Descriptions.Item>
          <Descriptions.Item label="预期API地址">
            <code>http://localhost:50301/api/manage</code>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="🧪 API连通性测试">
        <Button
          type="primary"
          onClick={testLogin}
          loading={testing}
          style={{ marginBottom: 16 }}
        >
          测试登录 API
        </Button>

        {testResult && (
          <Card
            size="small"
            title={testResult.success ? '✅ 测试成功' : '❌ 测试失败'}
            style={{
              marginTop: 16,
              borderColor: testResult.success ? '#52c41a' : '#ff4d4f'
            }}
          >
            <pre style={{
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 4,
              overflow: 'auto',
              maxHeight: 400
            }}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </Card>
        )}
      </Card>

      <Card title="📋 环境变量完整列表" style={{ marginTop: 16 }}>
        <pre style={{
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 4,
          overflow: 'auto',
          maxHeight: 300
        }}>
          {JSON.stringify(import.meta.env, null, 2)}
        </pre>
      </Card>

      <Card title="💡 故障排查提示" style={{ marginTop: 16 }}>
        <ol style={{ paddingLeft: 20 }}>
          <li>检查 <code>admin-frontend/.env</code> 文件是否存在</li>
          <li>确认文件内容: <code>VITE_API_BASE_URL=http://localhost:50301/api/manage</code></li>
          <li>修改 .env 后需要重启前端服务 (Ctrl+C 然后 npm run dev)</li>
          <li>打开浏览器控制台查看 "🔧 API配置信息" 日志</li>
          <li>检查后端服务是否运行: <code>curl http://localhost:50301/health</code></li>
        </ol>
      </Card>
    </div>
  )
}

export default DiagnosticPage
