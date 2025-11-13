import { useState } from 'react'
import { Card, Form, Input, Button, Select, message, Divider, Descriptions, Tag, Space } from 'antd'
import { UserOutlined, LockOutlined, GlobalOutlined, ClockCircleOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { roleNames } from '../config/permissions'
import api from '../services/apiService'
import dayjs from 'dayjs'

const ProfileSettings = () => {
  const { user, updateUser } = useAuth()
  const [passwordForm] = Form.useForm()
  const [profileForm] = Form.useForm()
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const handlePasswordChange = async () => {
    try {
      setLoadingPassword(true)
      const values = await passwordForm.validateFields()

      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致')
        return
      }

      await api.post('/auth/change-password', {
        old_password: values.oldPassword,
        new_password: values.newPassword,
      })

      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败')
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setLoadingProfile(true)
      const values = await profileForm.validateFields()

      await api.put('/auth/profile', {
        email: values.email,
        phone: values.phone,
        language: values.language,
        timezone: values.timezone,
      })

      // 更新本地用户信息
      if (updateUser) {
        updateUser({
          ...user!,
          email: values.email,
          phone: values.phone,
          language: values.language,
          timezone: values.timezone,
        })
      }

      message.success('个人信息更新成功')
    } catch (error: any) {
      message.error(error.response?.data?.message || '个人信息更新失败')
    } finally {
      setLoadingProfile(false)
    }
  }

  return (
    <div>
      {/* 账户信息 */}
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>账户信息</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="用户名">
            {user?.username}
          </Descriptions.Item>
          <Descriptions.Item label="用户ID">
            {user?.id}
          </Descriptions.Item>
          <Descriptions.Item label="角色">
            <Tag color="blue">{user?.role ? roleNames[user.role as keyof typeof roleNames] : '未知'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color="success">正常</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {user?.created_at ? dayjs(user.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最后登录">
            {user?.last_login ? dayjs(user.last_login).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 个人信息设置 */}
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>个人信息</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            email: user?.email || '',
            phone: user?.phone || '',
            language: user?.language || 'zh-CN',
            timezone: user?.timezone || 'Asia/Shanghai',
          }}
        >
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱地址"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="请输入手机号码"
              maxLength={11}
            />
          </Form.Item>

          <Form.Item
            label="语言偏好"
            name="language"
            rules={[{ required: true, message: '请选择语言' }]}
          >
            <Select
              prefix={<GlobalOutlined />}
              placeholder="请选择语言"
            >
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="zh-TW">繁體中文</Select.Option>
              <Select.Option value="en-US">English</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="时区"
            name="timezone"
            rules={[{ required: true, message: '请选择时区' }]}
          >
            <Select
              prefix={<ClockCircleOutlined />}
              placeholder="请选择时区"
              showSearch
            >
              <Select.Option value="Asia/Shanghai">中国标准时间 (UTC+8)</Select.Option>
              <Select.Option value="Asia/Hong_Kong">香港时间 (UTC+8)</Select.Option>
              <Select.Option value="Asia/Taipei">台北时间 (UTC+8)</Select.Option>
              <Select.Option value="Asia/Tokyo">东京时间 (UTC+9)</Select.Option>
              <Select.Option value="America/New_York">纽约时间 (UTC-5)</Select.Option>
              <Select.Option value="America/Los_Angeles">洛杉矶时间 (UTC-8)</Select.Option>
              <Select.Option value="Europe/London">伦敦时间 (UTC+0)</Select.Option>
              <Select.Option value="Europe/Paris">巴黎时间 (UTC+1)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              onClick={handleProfileUpdate}
              loading={loadingProfile}
            >
              保存个人信息
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 修改密码 */}
      <Card
        title={
          <Space>
            <LockOutlined />
            <span>修改密码</span>
          </Space>
        }
      >
        <Form
          form={passwordForm}
          layout="vertical"
        >
          <Form.Item
            label="当前密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
              { max: 50, message: '密码最多50个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入新密码(至少6个字符)"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            rules={[
              { required: true, message: '请再次输入新密码' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={handlePasswordChange}
                loading={loadingPassword}
              >
                修改密码
              </Button>
              <Button onClick={() => passwordForm.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ color: '#999', fontSize: 12 }}>
          <p>密码安全提示:</p>
          <ul style={{ marginLeft: 20 }}>
            <li>密码长度至少6个字符</li>
            <li>建议使用数字、字母和特殊字符的组合</li>
            <li>不要使用过于简单或容易被猜到的密码</li>
            <li>定期更换密码以确保账户安全</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default ProfileSettings
