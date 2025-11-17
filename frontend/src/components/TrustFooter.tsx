import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheckIcon, UsersIcon, StarIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import './TrustFooter.css'

interface TrustStats {
  totalUsers: number
  totalOrders: number
  averageRating: number
  yearEstablished: number
  totalReviews?: number
}

const TrustFooter = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState<TrustStats>({
    totalUsers: 108650,
    totalOrders: 256380,
    averageRating: 4.8,
    yearEstablished: 2015
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/public/stats')
        const result = await response.json()
        if (result.success && result.data) {
          setStats(result.data)
        }
      } catch (error) {
        console.error('获取平台统计数据失败:', error)
        // 保持默认值
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const currentYear = new Date().getFullYear()
  const yearsInBusiness = currentYear - stats.yearEstablished

  return (
    <div className="trust-footer">
      <div className="trust-container">
        {/* 标题 */}
        <div className="trust-header">
          <h3>{t('trust.header')}</h3>
          <p>{t('trust.subtitle')}</p>
        </div>

        {/* 统计数据 */}
        <div className="trust-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <UsersIcon className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{(stats.totalUsers / 10000).toFixed(1)}万+</div>
              <div className="stat-label">{t('trust.users')}</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <StarIcon className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.averageRating}</div>
              <div className="stat-label">{t('trust.rating')}</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <ShieldCheckIcon className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{yearsInBusiness}年</div>
              <div className="stat-label">{t('trust.experience')}</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">
              <LockClosedIcon className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-number">SSL</div>
              <div className="stat-label">{t('trust.encryption')}</div>
            </div>
          </div>
        </div>

        {/* 专家资质 */}
        <div className="trust-certifications">
          <h4>{t('trust.certifications')}</h4>
          <div className="cert-list">
            <div className="cert-item">
              <div className="cert-badge">✓</div>
              <span>{t('trust.nationalCert')}</span>
            </div>
            <div className="cert-item">
              <div className="cert-badge">✓</div>
              <span>{t('trust.experiencedTeam')}</span>
            </div>
            <div className="cert-item">
              <div className="cert-badge">✓</div>
              <span>{t('trust.association')}</span>
            </div>
          </div>
        </div>

        {/* 隐私安全保障 */}
        <div className="trust-security">
          <h4>{t('trust.securityTitle')}</h4>
          <div className="security-features">
            <div className="security-item">
              <ShieldCheckIcon className="security-icon" />
              <div>
                <div className="security-title">{t('trust.dataEncryption')}</div>
                <div className="security-desc">{t('trust.dataEncryptionDesc')}</div>
              </div>
            </div>
            <div className="security-item">
              <LockClosedIcon className="security-icon" />
              <div>
                <div className="security-title">{t('trust.privacyProtection')}</div>
                <div className="security-desc">{t('trust.privacyProtectionDesc')}</div>
              </div>
            </div>
            <div className="security-item">
              <ShieldCheckIcon className="security-icon" />
              <div>
                <div className="security-title">{t('trust.refundGuarantee')}</div>
                <div className="security-desc">{t('trust.refundGuaranteeDesc')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="trust-contact">
          <p>{t('trust.contactHotline')}: 400-888-8888 | {t('trust.serviceHours')}</p>
          <p className="trust-links">
            <a href="/privacy-policy">{t('trust.privacyPolicy')}</a>
            <span className="separator">|</span>
            <a href="/user-agreement">{t('trust.userAgreement')}</a>
            <span className="separator">|</span>
            <a href="/help-center">{t('trust.helpCenter')}</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default TrustFooter
