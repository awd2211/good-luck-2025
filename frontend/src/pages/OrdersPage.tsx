import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { OrderStatus } from '../types'
import * as orderService from '../services/orderService'
import { SkeletonList } from '../components/Skeleton'
import { EmptyOrders } from '../components/EmptyState'
import { useConfirm } from '../hooks/useConfirm'
import ConfirmDialog from '../components/ConfirmDialog'
import { showToast } from '../components/ToastContainer'
import './OrdersPage.css'

const OrdersPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('status') || 'all')
  const { confirm, isOpen, confirmState } = useConfirm()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchOrders()
  }, [user, activeTab])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params: any = { page: 1, limit: 20 }
      if (activeTab !== 'all') {
        params.status = activeTab
      }
      const response = await orderService.getOrders(params)
      // 后端返回的是 { items, pagination }
      const orderData = response.data.data
      setOrders(orderData?.items || [])
    } catch (error) {
      console.error('获取订单失败:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (status: string) => {
    setActiveTab(status)
    if (status === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ status })
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = await confirm({
      title: '取消订单',
      message: '确定要取消订单吗？',
      confirmText: '取消订单',
      cancelText: '返回',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await orderService.cancelOrder(orderId)
      showToast({ title: '成功', content: '订单已取消', type: 'success' })
      fetchOrders()
    } catch (error) {
      showToast({ title: '错误', content: '取消订单失败，请重试', type: 'error' })
    }
  }

  const getStatusText = (status: OrderStatus) => {
    const statusMap = {
      [OrderStatus.PENDING]: '待支付',
      [OrderStatus.PAID]: '已支付',
      [OrderStatus.PROCESSING]: '处理中',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消',
      [OrderStatus.REFUNDED]: '已退款',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: OrderStatus) => {
    const colorMap = {
      [OrderStatus.PENDING]: '#ff9800',
      [OrderStatus.PAID]: '#2196f3',
      [OrderStatus.PROCESSING]: '#9c27b0',
      [OrderStatus.COMPLETED]: '#4caf50',
      [OrderStatus.CANCELLED]: '#9e9e9e',
      [OrderStatus.REFUNDED]: '#f44336',
    }
    return colorMap[status] || '#999'
  }

  const tabs = [
    { key: 'all', label: '全部' },
    { key: OrderStatus.PENDING, label: '待支付' },
    { key: OrderStatus.PROCESSING, label: '处理中' },
    { key: OrderStatus.COMPLETED, label: '已完成' },
  ]

  if (!user) {
    return null
  }

  return (
    <>
      <ConfirmDialog
        isOpen={isOpen}
        title={confirmState?.title}
        message={confirmState?.message || ''}
        confirmText={confirmState?.confirmText}
        cancelText={confirmState?.cancelText}
        variant={confirmState?.variant}
        onConfirm={confirmState?.onConfirm || (() => {})}
        onCancel={confirmState?.onCancel || (() => {})}
      />
      <div className="orders-page">
      <div className="orders-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ‹ 返回
        </button>
        <h1>我的订单</h1>
        <div style={{ width: '48px' }} />
      </div>

      <div className="orders-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="orders-content">
        {loading ? (
          <SkeletonList count={4} />
        ) : orders.length > 0 ? (
          <div className="orders-list">
            {orders.map(order => (
              <div
                key={order.id}
                className="order-card"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="order-header">
                  <span className="order-no">订单号: {order.order_no}</span>
                  <span
                    className="order-status"
                    style={{ color: getStatusColor(order.status) }}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div className="order-items">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="order-item">
                      <div className="item-icon">{item.fortune?.icon || '🔮'}</div>
                      <div className="item-info">
                        <div className="item-title">{item.fortune?.title}</div>
                        <div className="item-price">¥{item.price} × {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-time">
                    {new Date(order.created_at).toLocaleString('zh-CN')}
                  </div>
                  <div className="order-total">
                    合计: <span className="amount">¥{order.final_amount}</span>
                  </div>
                </div>

                {order.status === OrderStatus.PENDING && (
                  <div className="order-actions">
                    <button
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelOrder(order.id)
                      }}
                    >
                      取消订单
                    </button>
                    <button
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/payment/${order.id}`)
                      }}
                    >
                      立即支付
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyOrders onGoShopping={() => navigate('/')} />
        )}
      </div>
    </div>
    </>
  )
}

export default OrdersPage
