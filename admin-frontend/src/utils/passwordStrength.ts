/**
 * 密码强度检查工具
 */

export interface PasswordStrength {
  score: number // 0-4 分
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  feedback: string[]
  color: string
  percentage: number
}

/**
 * 检查密码强度
 * @param password 密码字符串
 * @returns 密码强度信息
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      level: 'weak',
      feedback: ['请输入密码'],
      color: '#ff4d4f',
      percentage: 0,
    }
  }

  let score = 0
  const feedback: string[] = []

  // 长度检查
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('密码长度至少8位')
  }

  if (password.length >= 12) {
    score += 1
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('需要包含小写字母')
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('需要包含大写字母')
  }

  // 包含数字
  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('需要包含数字')
  }

  // 包含特殊字符
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    feedback.push('建议包含特殊字符')
  }

  // 检查常见弱密码
  const weakPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', 'admin', 'admin123', '111111', '000000'
  ]
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    score = Math.max(0, score - 2)
    feedback.push('不要使用常见弱密码')
  }

  // 计算最终得分 (0-4)
  const finalScore = Math.min(4, Math.max(0, Math.floor(score / 1.5)))

  // 确定强度等级
  let level: PasswordStrength['level'] = 'weak'
  let color = '#ff4d4f'
  let percentage = 0

  if (finalScore === 0) {
    level = 'weak'
    color = '#ff4d4f'
    percentage = 20
  } else if (finalScore === 1) {
    level = 'fair'
    color = '#faad14'
    percentage = 40
  } else if (finalScore === 2) {
    level = 'good'
    color = '#1890ff'
    percentage = 60
  } else if (finalScore === 3) {
    level = 'strong'
    color = '#52c41a'
    percentage = 80
  } else {
    level = 'very-strong'
    color = '#52c41a'
    percentage = 100
  }

  return {
    score: finalScore,
    level,
    feedback: feedback.length > 0 ? feedback : ['密码强度良好'],
    color,
    percentage,
  }
}

/**
 * 获取密码强度文本
 */
export function getPasswordStrengthText(level: PasswordStrength['level']): string {
  const textMap = {
    'weak': '弱',
    'fair': '一般',
    'good': '良好',
    'strong': '强',
    'very-strong': '非常强',
  }
  return textMap[level]
}

/**
 * 验证密码是否符合最低要求
 */
export function validatePasswordMinimum(password: string): boolean {
  const strength = checkPasswordStrength(password)
  return strength.score >= 1 && password.length >= 8
}
