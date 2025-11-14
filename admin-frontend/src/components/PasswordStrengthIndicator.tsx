import React, { useEffect, useState } from 'react'
import { Progress, Space, Tag } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { checkPasswordStrength, getPasswordStrengthText, PasswordStrength } from '../utils/passwordStrength'

interface PasswordStrengthIndicatorProps {
  password: string
  showFeedback?: boolean
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showFeedback = true
}) => {
  const [strength, setStrength] = useState<PasswordStrength | null>(null)

  useEffect(() => {
    if (password) {
      const result = checkPasswordStrength(password)
      setStrength(result)
    } else {
      setStrength(null)
    }
  }, [password])

  if (!strength || !password) {
    return null
  }

  return (
    <div style={{ marginTop: 8 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Space align="center">
          <span style={{ fontSize: 12, color: '#666' }}>密码强度:</span>
          <Tag color={strength.color}>
            {getPasswordStrengthText(strength.level)}
          </Tag>
          <Progress
            percent={strength.percentage}
            strokeColor={strength.color}
            showInfo={false}
            size="small"
            style={{ width: 120 }}
          />
        </Space>

        {showFeedback && strength.feedback.length > 0 && (
          <div style={{ fontSize: 12 }}>
            {strength.feedback.map((item, index) => (
              <div key={index} style={{ color: strength.score >= 3 ? '#52c41a' : '#ff4d4f', marginTop: 4 }}>
                {strength.score >= 3 ? (
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                ) : (
                  <CloseCircleOutlined style={{ marginRight: 4 }} />
                )}
                {item}
              </div>
            ))}
          </div>
        )}
      </Space>
    </div>
  )
}

export default PasswordStrengthIndicator
