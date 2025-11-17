import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import * as couponService from '../services/couponService'
import { SkeletonList } from '../components/Skeleton'
import { showToast } from '../components/ToastContainer'
import './CouponsPage.css'

const CouponsPage = () => {
  const { t } = useTranslation()
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
        // getAvailableCoupons 直接返回数组
        setAvailableCoupons(response.data.data || [])
      } else {
        const response = await couponService.getMyCoupons()
        // getMyCoupons 返回 { items, pagination }
        const couponData = response.data.data
        setMyCoupons(couponData?.items || [])
      }
    } catch (error) {
      console.error('获取优惠券失败:', error)
      if (activeTab === 'available') {
        setAvailableCoupons([])
      } else {
        setMyCoupons([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async (couponId: string) => {
    try {
      await couponService.claimCoupon(couponId)
      showToast({ title: t('common.success'), content: t('coupons.claimSuccess'), type: 'success' })
      fetchCoupons()
    } catch (error: any) {
      showToast({ title: t('common.error'), content: error.response?.data?.message || t('coupons.claimFailed'), type: 'error' })
    }
  }

  const getCouponText = (coupon: any) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}${t('coupons.discount')}`
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
          ‹ {t('coupons.back')}
        </button>
        <h1>{t('coupons.title')}</h1>
        <div style={{ width: '48px' }} />
      </div>

      <div className="coupons-tabs">
        <button
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          {t('coupons.available')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          {t('coupons.myCoupons')}
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
                      {t('coupons.minAmount', { amount: coupon.min_amount })}
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
                      {coupon.usage_limit <= coupon.used_count ? t('coupons.soldOut') : t('coupons.claim')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-coupons">
              <div className="empty-icon">🎫</div>
              <p>{t('coupons.noAvailable')}</p>
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
                        {t('coupons.minAmount', { amount: coupon.min_amount })}
                      </div>
                    </div>
                    <div className="coupon-right">
                      <div className="coupon-name">{coupon.name}</div>
                      <div className="coupon-date">
                        {new Date(coupon.start_date).toLocaleDateString()} - {new Date(coupon.end_date).toLocaleDateString()}
                      </div>
                      {used ? (
                        <div className="coupon-status">{t('coupons.used')}</div>
                      ) : expired ? (
                        <div className="coupon-status">{t('coupons.expired')}</div>
                      ) : (
                        <button
                          className="use-btn"
                          onClick={() => navigate('/cart')}
                        >
                          {t('coupons.use')}
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
              <p>{t('coupons.noCoupons')}</p>
              <button
                className="go-claim-btn"
                onClick={() => setActiveTab('available')}
              >
                {t('coupons.goClaim')}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default CouponsPage
