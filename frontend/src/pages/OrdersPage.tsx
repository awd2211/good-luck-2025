import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      title: t('orders.cancelConfirmTitle'),
      message: t('orders.cancelConfirmMessage'),
      confirmText: t('orders.cancelConfirmButton'),
      cancelText: t('common.back'),
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await orderService.cancelOrder(orderId)
      showToast({ title: t('common.success'), content: t('orders.cancelSuccess'), type: 'success' })
      fetchOrders()
    } catch (error) {
      showToast({ title: t('common.error'), content: t('orders.cancelFailed'), type: 'error' })
    }
  }

  const getStatusText = (status: OrderStatus) => {
    const statusMap = {
      [OrderStatus.PENDING]: t('orders.pending'),
      [OrderStatus.PAID]: t('orders.paid'),
      [OrderStatus.PROCESSING]: t('orders.processing'),
      [OrderStatus.COMPLETED]: t('orders.completed'),
      [OrderStatus.CANCELLED]: t('orders.cancelled'),
      [OrderStatus.REFUNDED]: t('orders.refunded'),
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
    { key: 'all', label: t('orders.all') },
    { key: OrderStatus.PENDING, label: t('orders.pending') },
    { key: OrderStatus.PROCESSING, label: t('orders.processing') },
    { key: OrderStatus.COMPLETED, label: t('orders.completed') },
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
          ‹ {t('orders.back')}
        </button>
        <h1>{t('orders.title')}</h1>
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
                  <span className="order-no">{t('orders.orderNo')}: {order.order_no}</span>
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
                    {t('orders.total')}: <span className="amount">¥{order.final_amount}</span>
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
                      {t('orders.cancelOrder')}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/payment/${order.id}`)
                      }}
                    >
                      {t('orders.payNow')}
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
