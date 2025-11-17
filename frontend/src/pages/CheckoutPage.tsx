import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../contexts/CartContext'
import PaymentMethodSelector from '../components/PaymentMethodSelector'
import PaymentTrustSection from '../components/PaymentTrustSection'
import { createOrder } from '../services/orderService'
import { createPayment } from '../services/paymentService'
import storage from '../utils/storage'
import { showToast } from '../components/ToastContainer'
import { logError } from '../utils/logger'
import './CheckoutPage.css'

interface CartItem {
  id: string
  fortune: {
    id: string
    title: string
    icon: string
    description: string
  }
  price: number
  quantity: number
}

interface LocationState {
  cartItemIds?: string[]
}

const CheckoutPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { items, refreshCart } = useCart()

  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)

  // 从购物车页面传来的选中商品ID
  const locationState = location.state as LocationState | null
  const cartItemIds = locationState?.cartItemIds || []

  // 筛选出选中的商品
  const checkoutItems: CartItem[] = items.filter(item =>
    cartItemIds.includes(item.id)
  )

  // 计算总价
  const subtotal = checkoutItems.reduce((sum, item) =>
    sum + item.price * item.quantity, 0
  )
  const total = subtotal - discount

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (checkoutItems.length === 0) {
      navigate('/cart')
    }
  }, [user, checkoutItems.length, navigate])

  // 应用优惠券
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showToast({ title: t('checkout.notice'), content: t('checkout.enterCouponCode'), type: 'warning' })
      return
    }

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storage.get('token')}`
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          amount: subtotal
        })
      })

      const result = await response.json()

      if (result.success && result.data.valid) {
        setDiscount(result.data.discount || 0)
        showToast({ title: t('checkout.success'), content: t('checkout.couponApplied', { discount: result.data.discount }), type: 'success' })
      } else {
        showToast({ title: t('checkout.failed'), content: result.data.message || t('checkout.couponInvalid'), type: 'error' })
        setDiscount(0)
      }
    } catch (error) {
      logError('验证优惠券失败', error, { couponCode, amount: subtotal })
      showToast({ title: t('checkout.error'), content: t('checkout.validateCouponFailed'), type: 'error' })
      setDiscount(0)
    }
  }

  // 提交订单并支付
  const handleSubmitOrder = async () => {
    if (!selectedMethod) {
      showToast({ title: t('checkout.notice'), content: t('checkout.selectPaymentMethod'), type: 'warning' })
      return
    }

    setIsProcessing(true)

    try {
      // 1. 创建订单
      const orderResponse = await createOrder({
        cart_item_ids: cartItemIds,
        coupon_id: couponCode || undefined,
      })

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || t('checkout.createOrderFailed'))
      }

      const orderId = orderResponse.data.data?.id
      if (!orderId) {
        throw new Error(t('checkout.noOrderId'))
      }

      // 2. 创建支付
      const paymentResponse = await createPayment({
        order_id: orderId,
        payment_method: selectedMethod,
        amount: total,
        return_url: `${window.location.origin}/payment-result?result=success`,
        cancel_url: `${window.location.origin}/payment-result?result=cancel`,
      })

      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.message || t('checkout.createPaymentFailed'))
      }

      const paymentData = paymentResponse.data.data

      // 3. 根据支付方式处理
      if (!paymentData) {
        throw new Error(t('checkout.paymentDataEmpty'))
      }

      if (selectedMethod === 'balance') {
        // 余额支付直接完成,跳转到结果页
        await refreshCart() // 刷新购物车
        navigate(`/payment-result?result=success&transaction_id=${paymentData.transaction_id || ''}&order_id=${orderId}`)
      } else if (selectedMethod === 'paypal') {
        // PayPal需要跳转到支付页面
        if (paymentData.payment_url) {
          window.location.href = paymentData.payment_url
        } else {
          throw new Error(t('checkout.noPaypalLink'))
        }
      } else if (selectedMethod === 'stripe') {
        // Stripe需要跳转到支付页面
        if (paymentData.payment_url) {
          window.location.href = paymentData.payment_url
        } else {
          throw new Error(t('checkout.noStripeLink'))
        }
      }

    } catch (error: unknown) {
      logError('提交订单失败', error, { selectedMethod, total, cartItemIds })
      const errorMessage = error instanceof Error ? error.message : t('checkout.submitOrderFailed')
      showToast({ title: t('checkout.error'), content: errorMessage, type: 'error' })
      setIsProcessing(false)
    }
  }

  if (!user || checkoutItems.length === 0) {
    return null
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ‹ {t('checkout.back')}
        </button>
        <h1>{t('checkout.title')}</h1>
      </div>

      <div className="checkout-content">
        {/* 商品列表 */}
        <div className="order-items-section">
          <h2>{t('checkout.orderItems')}</h2>
          <div className="items-list">
            {checkoutItems.map(item => (
              <div key={item.id} className="checkout-item">
                <img src={item.icon} alt={item.title} />
                <div className="item-info">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="item-meta">
                    <span className="price">¥{item.price}</span>
                    <span className="quantity">x{item.quantity}</span>
                  </div>
                </div>
                <div className="item-total">
                  ¥{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 优惠券 */}
        <div className="coupon-section">
          <h2>{t('checkout.coupon')}</h2>
          <div className="coupon-input-group">
            <input
              type="text"
              placeholder={t('checkout.couponPlaceholder')}
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={isProcessing}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isProcessing || !couponCode.trim()}
            >
              {t('checkout.apply')}
            </button>
          </div>
        </div>

        {/* 支付方式 */}
        <div className="payment-section">
          <PaymentMethodSelector
            amount={total}
            onSelect={setSelectedMethod}
            selectedMethod={selectedMethod}
          />
        </div>

        {/* 价格汇总 */}
        <div className="price-summary">
          <div className="summary-row">
            <span>{t('checkout.subtotal')}</span>
            <span>¥{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="summary-row discount">
              <span>{t('checkout.couponDiscount')}</span>
              <span>-¥{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>{t('checkout.totalAmount')}</span>
            <span className="total-amount">¥{total.toFixed(2)}</span>
          </div>
        </div>

        {/* 信任保障 */}
        <PaymentTrustSection />
      </div>

      {/* 底部提交按钮 */}
      <div className="checkout-footer">
        <div className="footer-info">
          <span className="total-label">{t('checkout.amountDue')}</span>
          <span className="total-price">¥{total.toFixed(2)}</span>
        </div>
        <button
          className="submit-btn"
          onClick={handleSubmitOrder}
          disabled={!selectedMethod || isProcessing}
        >
          {isProcessing ? t('checkout.processing') : t('checkout.submitOrder')}
        </button>
      </div>
    </div>
  )
}

export default CheckoutPage
