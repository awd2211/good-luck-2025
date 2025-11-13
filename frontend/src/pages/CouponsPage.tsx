import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import * as couponService from '../services/couponService'
import { SkeletonList } from '../components/Skeleton'
import './CouponsPage.css'

const CouponsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'available' | 'my'>('available')
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([])
  const [myCoupons, setMyCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchCoupons()
  }, [user, activeTab])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      if (activeTab === 'available') {
        const response = await couponService.getAvailableCoupons()
        setAvailableCoupons(response.data || [])
      } else {
        const response = await couponService.getMyCoupons()
        setMyCoupons(response.data || [])
      }
    } catch (error) {
      console.error('获取优惠券失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async (couponId: string) => {
    try {
      await couponService.claimCoupon(couponId)
      alert('领取成功！')
      fetchCoupons()
    } catch (error: any) {
      alert(error.response?.data?.message || '领取失败')
    }
  }

  const getCouponText = (coupon: any) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}折`
    }
    return `¥${coupon.value}`
  }

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date()
  }

  if (!user) {
    return null
  }

  return (
    <div className="coupons-page">
      <div className="coupons-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ‹ 返回
        </button>
        <h1>优惠券</h1>
        <div style={{ width: '48px' }} />
      </div>

      <div className="coupons-tabs">
        <button
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          可领取
        </button>
        <button
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          我的优惠券
        </button>
      </div>

      <div className="coupons-content">
        {loading ? (
          <SkeletonList count={3} />
        ) : activeTab === 'available' ? (
          availableCoupons.length > 0 ? (
            <div className="coupons-list">
              {availableCoupons.map(coupon => (
                <div key={coupon.id} className="coupon-card">
                  <div className="coupon-left">
                    <div className="coupon-value">{getCouponText(coupon)}</div>
                    <div className="coupon-condition">
                      满{coupon.min_amount}元可用
                    </div>
                  </div>
                  <div className="coupon-right">
                    <div className="coupon-name">{coupon.name}</div>
                    <div className="coupon-date">
                      {new Date(coupon.start_date).toLocaleDateString()} - {new Date(coupon.end_date).toLocaleDateString()}
                    </div>
                    <button
                      className="claim-btn"
                      onClick={() => handleClaim(coupon.id)}
                      disabled={!coupon.is_active || coupon.usage_limit <= coupon.used_count}
                    >
                      {coupon.usage_limit <= coupon.used_count ? '已抢光' : '立即领取'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-coupons">
              <div className="empty-icon">🎫</div>
              <p>暂无可领取的优惠券</p>
            </div>
          )
        ) : (
          myCoupons.length > 0 ? (
            <div className="coupons-list">
              {myCoupons.map(userCoupon => {
                const coupon = userCoupon.coupon
                const expired = isExpired(coupon.end_date)
                const used = userCoupon.is_used

                return (
                  <div
                    key={userCoupon.id}
                    className={`coupon-card ${used || expired ? 'disabled' : ''}`}
                  >
                    <div className="coupon-left">
                      <div className="coupon-value">{getCouponText(coupon)}</div>
                      <div className="coupon-condition">
                        满{coupon.min_amount}元可用
                      </div>
                    </div>
                    <div className="coupon-right">
                      <div className="coupon-name">{coupon.name}</div>
                      <div className="coupon-date">
                        {new Date(coupon.start_date).toLocaleDateString()} - {new Date(coupon.end_date).toLocaleDateString()}
                      </div>
                      {used ? (
                        <div className="coupon-status">已使用</div>
                      ) : expired ? (
                        <div className="coupon-status">已过期</div>
                      ) : (
                        <button
                          className="use-btn"
                          onClick={() => navigate('/cart')}
                        >
                          去使用
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-coupons">
              <div className="empty-icon">🎫</div>
              <p>还没有优惠券</p>
              <button
                className="go-claim-btn"
                onClick={() => setActiveTab('available')}
              >
                去领取
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default CouponsPage
