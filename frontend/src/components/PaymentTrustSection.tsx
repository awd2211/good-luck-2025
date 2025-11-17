import { useTranslation } from 'react-i18next'
import { ShieldCheckIcon, LockClosedIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline'
import './PaymentTrustSection.css'

const PaymentTrustSection = () => {
  const { t } = useTranslation()

  return (
    <div className="payment-trust-section">
      <div className="trust-badges">
        <div className="trust-badge">
          <ShieldCheckIcon className="badge-icon" />
          <div className="badge-content">
            <div className="badge-title">{t('paymentTrust.refund')}</div>
            <div className="badge-desc">{t('paymentTrust.refundDesc')}</div>
          </div>
        </div>

        <div className="trust-badge">
          <LockClosedIcon className="badge-icon" />
          <div className="badge-content">
            <div className="badge-title">{t('paymentTrust.privacy')}</div>
            <div className="badge-desc">{t('paymentTrust.privacyDesc')}</div>
          </div>
        </div>

        <div className="trust-badge">
          <ClockIcon className="badge-icon" />
          <div className="badge-content">
            <div className="badge-title">{t('paymentTrust.instant')}</div>
            <div className="badge-desc">{t('paymentTrust.instantDesc')}</div>
          </div>
        </div>

        <div className="trust-badge">
          <StarIcon className="badge-icon" />
          <div className="badge-content">
            <div className="badge-title">{t('paymentTrust.highRating')}</div>
            <div className="badge-desc">{t('paymentTrust.highRatingDesc')}</div>
          </div>
        </div>
      </div>

      <div className="trust-footer-note">
        <ShieldCheckIcon className="note-icon" />
        <span>{t('paymentTrust.securityNote')}</span>
      </div>
    </div>
  )
}

export default PaymentTrustSection
