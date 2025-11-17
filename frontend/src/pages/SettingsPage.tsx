import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { showToast } from '../components/ToastContainer'
import { useConfirm } from '../hooks/useConfirm'
import ConfirmDialog from '../components/ConfirmDialog'

const SettingsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { confirm, isOpen, confirmState } = useConfirm()

  if (!user) {
    navigate('/login')
    return null
  }

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: t('settings.logoutConfirmTitle'),
      message: t('settings.logoutConfirmMessage'),
      confirmText: t('settings.logoutConfirmButton'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    })

    if (confirmed) {
      logout()
      navigate('/login')
    }
  }

  const settingsSections = [
    {
      title: t('settings.notificationSettings'),
      items: [
        { label: t('settings.orderNotification'), type: 'toggle', value: true },
        { label: t('settings.marketingPush'), type: 'toggle', value: false },
      ]
    },
    {
      title: t('settings.privacySettings'),
      items: [
        { label: t('settings.profileVisibility'), type: 'select', value: t('settings.onlyMe') },
      ]
    },
    {
      title: t('settings.other'),
      items: [
        { label: t('settings.clearCache'), type: 'button', action: () => showToast({ title: t('common.success'), content: t('settings.cacheCleared'), type: 'success' }) },
        { label: t('settings.aboutUs'), type: 'link', path: '/about' },
        { label: t('settings.userAgreement'), type: 'link', path: '/user-agreement' },
        { label: t('settings.privacyPolicy'), type: 'link', path: '/privacy-policy' },
      ]
    }
  ]

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
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            background: '#fff',
            border: '1px solid #ddd',
            fontSize: '24px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            marginRight: '15px'
          }}
        >
          ‹
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>{t('settings.title')}</h1>
      </div>

      {settingsSections.map((section, idx) => (
        <div key={idx} style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
            {section.title}
          </h3>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {section.items.map((item, itemIdx) => (
              <div
                key={itemIdx}
                style={{
                  padding: '16px',
                  borderBottom: itemIdx < section.items.length - 1 ? '1px solid #f0f0f0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{item.label}</span>
                {item.type === 'toggle' && (
                  <div style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    background: item.value ? '#667eea' : '#ddd',
                    position: 'relative',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: item.value ? '22px' : '2px',
                      transition: 'left 0.2s'
                    }} />
                  </div>
                )}
                {item.type === 'link' && <span style={{ color: '#999' }}>›</span>}
                {item.type === 'button' && <span style={{ color: '#667eea' }}>{t('settings.execute')}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '14px',
          background: 'white',
          color: '#f44',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 500,
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        {t('settings.logout')}
      </button>
    </div>
    </>
  )
}

export default SettingsPage
