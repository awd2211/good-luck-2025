/**
 * 表单验证工具
 * 提供常用的表单验证规则
 */

export interface ValidationResult {
  valid: boolean
  message?: string
}

/**
 * 验证必填字段
 */
export const required = (value: any, fieldName: string = '此字段'): ValidationResult => {
  if (value === undefined || value === null || value === '') {
    return { valid: false, message: `${fieldName}不能为空` }
  }
  return { valid: true }
}

/**
 * 验证年份（1900-2100）
 */
export const validateYear = (year: number): ValidationResult => {
  if (!year) {
    return { valid: false, message: '请输入出生年份' }
  }
  if (year < 1900 || year > 2100) {
    return { valid: false, message: '年份必须在1900-2100之间' }
  }
  return { valid: true }
}

/**
 * 验证月份（1-12）
 */
export const validateMonth = (month: number): ValidationResult => {
  if (!month) {
    return { valid: false, message: '请输入出生月份' }
  }
  if (month < 1 || month > 12) {
    return { valid: false, message: '月份必须在1-12之间' }
  }
  return { valid: true }
}

/**
 * 验证日期（1-31）
 */
export const validateDay = (day: number, month?: number, year?: number): ValidationResult => {
  if (!day) {
    return { valid: false, message: '请输入出生日期' }
  }
  if (day < 1 || day > 31) {
    return { valid: false, message: '日期必须在1-31之间' }
  }

  // 如果提供了月份，验证该月的合法天数
  if (month) {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    // 闰年2月有29天
    if (year && month === 2) {
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
      if (isLeapYear && day > 29) {
        return { valid: false, message: `${year}年2月最多29天` }
      }
      if (!isLeapYear && day > 28) {
        return { valid: false, message: `${year}年2月最多28天` }
      }
    }

    if (day > daysInMonth[month - 1]) {
      return { valid: false, message: `${month}月最多${daysInMonth[month - 1]}天` }
    }
  }

  return { valid: true }
}

/**
 * 验证小时（0-23）
 */
export const validateHour = (hour: number): ValidationResult => {
  if (hour === undefined || hour === null) {
    return { valid: false, message: '请输入出生时辰' }
  }
  if (hour < 0 || hour > 23) {
    return { valid: false, message: '时辰必须在0-23之间' }
  }
  return { valid: true }
}

/**
 * 验证姓名
 */
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim() === '') {
    return { valid: false, message: '请输入姓名' }
  }
  if (name.length < 2) {
    return { valid: false, message: '姓名至少2个字符' }
  }
  if (name.length > 20) {
    return { valid: false, message: '姓名最多20个字符' }
  }
  // 验证是否包含中文或英文
  const validNameRegex = /^[\u4e00-\u9fa5a-zA-Z\s]+$/
  if (!validNameRegex.test(name)) {
    return { valid: false, message: '姓名只能包含中文、英文和空格' }
  }
  return { valid: true }
}

/**
 * 验证性别
 */
export const validateGender = (gender: string): ValidationResult => {
  if (!gender) {
    return { valid: false, message: '请选择性别' }
  }
  if (gender !== '男' && gender !== '女') {
    return { valid: false, message: '性别只能是"男"或"女"' }
  }
  return { valid: true }
}

/**
 * 验证目标年份
 */
export const validateTargetYear = (targetYear: number, birthYear: number): ValidationResult => {
  if (!targetYear) {
    return { valid: false, message: '请输入目标年份' }
  }
  if (targetYear < birthYear) {
    return { valid: false, message: '目标年份不能小于出生年份' }
  }
  if (targetYear > 2100) {
    return { valid: false, message: '目标年份不能大于2100' }
  }
  return { valid: true }
}

/**
 * 组合验证 - 生肖运势
 */
export const validateBirthAnimalForm = (data: {
  birthYear: number
  birthMonth: number
  birthDay: number
}): ValidationResult[] => {
  return [
    validateYear(data.birthYear),
    validateMonth(data.birthMonth),
    validateDay(data.birthDay, data.birthMonth, data.birthYear),
  ]
}

/**
 * 组合验证 - 八字精批
 */
export const validateBaziForm = (data: {
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  gender: string
}): ValidationResult[] => {
  return [
    validateYear(data.birthYear),
    validateMonth(data.birthMonth),
    validateDay(data.birthDay, data.birthMonth, data.birthYear),
    validateHour(data.birthHour),
    validateGender(data.gender),
  ]
}

/**
 * 组合验证 - 流年运势
 */
export const validateFlowYearForm = (data: {
  birthYear: number
  targetYear: number
}): ValidationResult[] => {
  return [
    validateYear(data.birthYear),
    validateTargetYear(data.targetYear, data.birthYear),
  ]
}

/**
 * 组合验证 - 姓名详批
 */
export const validateNameForm = (data: {
  name: string
  birthYear: number
  birthMonth: number
  birthDay: number
}): ValidationResult[] => {
  return [
    validateName(data.name),
    validateYear(data.birthYear),
    validateMonth(data.birthMonth),
    validateDay(data.birthDay, data.birthMonth, data.birthYear),
  ]
}

/**
 * 组合验证 - 婚姻分析
 */
export const validateMarriageForm = (data: {
  person1: { name: string; birthYear: number; birthMonth: number; birthDay: number }
  person2: { name: string; birthYear: number; birthMonth: number; birthDay: number }
}): ValidationResult[] => {
  return [
    { ...validateName(data.person1.name), message: `您的${validateName(data.person1.name).message || ''}` },
    { ...validateYear(data.person1.birthYear), message: `您的${validateYear(data.person1.birthYear).message || ''}` },
    { ...validateMonth(data.person1.birthMonth), message: `您的${validateMonth(data.person1.birthMonth).message || ''}` },
    { ...validateDay(data.person1.birthDay, data.person1.birthMonth, data.person1.birthYear), message: `您的${validateDay(data.person1.birthDay, data.person1.birthMonth, data.person1.birthYear).message || ''}` },
    { ...validateName(data.person2.name), message: `对方的${validateName(data.person2.name).message || ''}` },
    { ...validateYear(data.person2.birthYear), message: `对方的${validateYear(data.person2.birthYear).message || ''}` },
    { ...validateMonth(data.person2.birthMonth), message: `对方的${validateMonth(data.person2.birthMonth).message || ''}` },
    { ...validateDay(data.person2.birthDay, data.person2.birthMonth, data.person2.birthYear), message: `对方的${validateDay(data.person2.birthDay, data.person2.birthMonth, data.person2.birthYear).message || ''}` },
  ]
}

/**
 * 检查所有验证结果
 */
export const checkValidationResults = (results: ValidationResult[]): {
  valid: boolean
  errors: string[]
} => {
  const errors = results
    .filter(result => !result.valid)
    .map(result => result.message || '验证失败')

  return {
    valid: errors.length === 0,
    errors,
  }
}
