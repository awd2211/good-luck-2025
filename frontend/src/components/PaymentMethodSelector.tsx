import { useState, useEffect } from 'react'
import './PaymentMethodSelector.css'

interface PaymentMethod {
  id: string
  method_code: string
  method_name: string
  icon?: string
  description?: string
  min_amount: number
  max_amount?: number
  fee_type: 'none' | 'fixed' | 'percentage'
  fee_value: number
}

interface PaymentMethodSelectorProps {
  amount: number
  onSelect: (method: string) => void
  selectedMethod?: string
}

const PaymentMethodSelector = ({
  amount,
  onSelect,
  selectedMethod,
}: PaymentMethodSelectorProps) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success && result.data) {
        setMethods(result.data)
      } else {
        console.error('获取支付方式失败:', result.message)
        // 如果API失败,使用默认支付方式
        setMethods([
          {
            id: '1',
            method_code: 'balance',
            method_name: '余额支付',
            description: '使用账户余额支付',
            min_amount: 0.01,
            fee_type: 'none',
            fee_value: 0,
          },
          {
            id: '2',
            method_code: 'paypal',
            method_name: 'PayPal支付',
            description: '使用PayPal账户支付',
            min_amount: 0.01,
            fee_type: 'none',
            fee_value: 0,
          },
          {
            id: '3',
            method_code: 'stripe',
            method_name: '信用卡支付',
            description: '支持Visa、MasterCard等',
            min_amount: 0.01,
            fee_type: 'none',
            fee_value: 0,
          },
        ])
      }
    } catch (error) {
      console.error('获取支付方式失败:', error)
      // 如果API失败,使用默认支付方式
      setMethods([
        {
          id: '1',
          method_code: 'balance',
          method_name: '余额支付',
          description: '使用账户余额支付',
          min_amount: 0.01,
          fee_type: 'none',
          fee_value: 0,
        },
        {
          id: '2',
          method_code: 'paypal',
          method_name: 'PayPal支付',
          description: '使用PayPal账户支付',
          min_amount: 0.01,
          fee_type: 'none',
          fee_value: 0,
        },
        {
          id: '3',
          method_code: 'stripe',
          method_name: '信用卡支付',
          description: '支持Visa、MasterCard等',
          min_amount: 0.01,
          fee_type: 'none',
          fee_value: 0,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const calculateFee = (method: PaymentMethod): number => {
    if (method.fee_type === 'fixed') {
      return method.fee_value
    } else if (method.fee_type === 'percentage') {
      return (amount * method.fee_value) / 100
    }
    return 0
  }

  const calculateTotal = (method: PaymentMethod): number => {
    return amount + calculateFee(method)
  }

  const isMethodAvailable = (method: PaymentMethod): boolean => {
    if (amount < method.min_amount) return false
    if (method.max_amount && amount > method.max_amount) return false
    return true
  }

  if (loading) {
    return <div className="payment-method-selector loading">加载支付方式...</div>
  }

  return (
    <div className="payment-method-selector">
      <h3>选择支付方式</h3>
      <div className="payment-methods-list">
        {methods.map((method) => {
          const available = isMethodAvailable(method)
          const fee = calculateFee(method)
          const total = calculateTotal(method)

          return (
            <div
              key={method.id}
              className={`payment-method-item ${
                selectedMethod === method.method_code ? 'selected' : ''
              } ${!available ? 'disabled' : ''}`}
              onClick={() => available && onSelect(method.method_code)}
            >
              <div className="method-header">
                {method.icon && (
                  <img src={method.icon} alt={method.method_name} className="method-icon" />
                )}
                <div className="method-info">
                  <div className="method-name">{method.method_name}</div>
                  {method.description && (
                    <div className="method-description">{method.description}</div>
                  )}
                </div>
                {selectedMethod === method.method_code && (
                  <div className="selected-indicator">✓</div>
                )}
              </div>

              {available && (
                <div className="method-details">
                  <div className="detail-row">
                    <span>订单金额:</span>
                    <span>¥{amount.toFixed(2)}</span>
                  </div>
                  {fee > 0 && (
                    <div className="detail-row">
                      <span>手续费:</span>
                      <span>¥{fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="detail-row total">
                    <span>实付金额:</span>
                    <span>¥{total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {!available && (
                <div className="method-unavailable">
                  {amount < method.min_amount && `最低金额: ¥${method.min_amount}`}
                  {method.max_amount && amount > method.max_amount && `最高金额: ¥${method.max_amount}`}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PaymentMethodSelector
