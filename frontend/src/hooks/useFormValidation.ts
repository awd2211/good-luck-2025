import { useState, useCallback } from 'react'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  validate?: (value: string) => boolean | string
  message?: string
}

export interface FieldConfig {
  [key: string]: ValidationRule
}

export interface FieldErrors {
  [key: string]: string
}

export interface FieldTouched {
  [key: string]: boolean
}

export function useFormValidation<T extends Record<string, string>>(
  initialValues: T,
  validationRules: FieldConfig
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<FieldTouched>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 验证单个字段
  const validateField = useCallback(
    (name: string, value: string): string => {
      const rules = validationRules[name]
      if (!rules) return ''

      // 必填验证
      if (rules.required && !value.trim()) {
        return rules.message || `${name}不能为空`
      }

      // 最小长度验证
      if (rules.minLength && value.length < rules.minLength) {
        return rules.message || `${name}至少需要${rules.minLength}个字符`
      }

      // 最大长度验证
      if (rules.maxLength && value.length > rules.maxLength) {
        return rules.message || `${name}最多${rules.maxLength}个字符`
      }

      // 正则验证
      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.message || `${name}格式不正确`
      }

      // 自定义验证
      if (rules.validate) {
        const result = rules.validate(value)
        if (typeof result === 'string') return result
        if (result === false) return rules.message || `${name}验证失败`
      }

      return ''
    },
    [validationRules]
  )

  // 验证所有字段
  const validateAll = useCallback((): boolean => {
    const newErrors: FieldErrors = {}
    let hasError = false

    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, values[name] || '')
      if (error) {
        newErrors[name] = error
        hasError = true
      }
    })

    setErrors(newErrors)
    return !hasError
  }, [values, validationRules, validateField])

  // 处理字段变化
  const handleChange = useCallback(
    (name: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setValues((prev) => ({ ...prev, [name]: value }))

      // 如果字段已被触摸,实时验证
      if (touched[name as string]) {
        const error = validateField(name as string, value)
        setErrors((prev) => ({ ...prev, [name]: error }))
      }
    },
    [touched, validateField]
  )

  // 处理字段失焦
  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [name]: true }))
      const error = validateField(name as string, values[name] || '')
      setErrors((prev) => ({ ...prev, [name]: error }))
    },
    [values, validateField]
  )

  // 处理表单提交
  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) =>
      async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // 标记所有字段为已触摸
        const allTouched = Object.keys(validationRules).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        )
        setTouched(allTouched)

        // 验证所有字段
        if (!validateAll()) {
          setIsSubmitting(false)
          return
        }

        try {
          await onSubmit(values)
        } catch (error) {
          console.error('表单提交失败:', error)
        } finally {
          setIsSubmitting(false)
        }
      },
    [values, validationRules, validateAll]
  )

  // 重置表单
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // 设置字段值
  const setFieldValue = useCallback((name: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  // 设置字段错误
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }))
  }, [])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    validateAll,
  }
}

// 常用验证规则
export const commonValidations = {
  phone: {
    required: true,
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入正确的手机号',
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 20,
    message: '密码长度为6-20个字符',
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '请输入正确的邮箱地址',
  },
  verificationCode: {
    required: true,
    pattern: /^\d{6}$/,
    message: '请输入6位验证码',
  },
  username: {
    required: true,
    minLength: 2,
    maxLength: 20,
    pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/,
    message: '用户名为2-20位中文、字母、数字或下划线',
  },
}
