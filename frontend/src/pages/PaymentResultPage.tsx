import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './PaymentResultPage.css'

const PaymentResultPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'success' | 'fail' | 'processing'>('processing')
  const [message, setMessage] = useState('')

  const transactionId = searchParams.get('transaction_id')
  // const orderId = searchParams.get('order_id') // 预留用于显示订单详情

  useEffect(() => {
    // 从URL参数判断支付结果
    const result = searchParams.get('result')
    const paypalOrderId = searchParams.get('token')

    if (result === 'success' || paypalOrderId) {
      // 支付成功,验证支付状态
      verifyPayment()
    } else if (result === 'cancel') {
      setStatus('fail')
      setMessage('支付已取消')
    } else {
      // 默认显示处理中
      verifyPayment()
    }
  }, [searchParams])

  const verifyPayment = async () => {
    try {
      // 这里应该调用后端API验证支付状态
      // 暂时模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1500))

      setStatus('success')
      setMessage('支付成功!')
    } catch (error) {
      setStatus('fail')
      setMessage('支付失败,请重试')
    }
  }

  const handleViewOrder = () => {
    navigate(`/orders`)
  }

  const handleBackHome = () => {
    navigate('/')
  }

  return (
    <div className="payment-result-page">
      <div className="result-container">
        {status === 'processing' && (
          <div className="result-content processing">
            <div className="spinner"></div>
            <h2>处理中...</h2>
            <p>正在确认支付结果,请稍候</p>
          </div>
        )}

        {status === 'success' && (
          <div className="result-content success">
            <div className="success-icon">✓</div>
            <h2>支付成功!</h2>
            <p>{message}</p>

            {transactionId && (
              <div className="detail-info">
                <div className="detail-row">
                  <span>交易号:</span>
                  <span className="mono">{transactionId}</span>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button className="btn-primary" onClick={handleViewOrder}>
                查看订单
              </button>
              <button className="btn-secondary" onClick={handleBackHome}>
                返回首页
              </button>
            </div>
          </div>
        )}

        {status === 'fail' && (
          <div className="result-content fail">
            <div className="fail-icon">✕</div>
            <h2>支付失败</h2>
            <p>{message}</p>

            <div className="action-buttons">
              <button className="btn-primary" onClick={() => navigate(-1)}>
                重新支付
              </button>
              <button className="btn-secondary" onClick={handleBackHome}>
                返回首页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentResultPage
