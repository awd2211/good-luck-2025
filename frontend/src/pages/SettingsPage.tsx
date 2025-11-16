import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { showToast } from '../components/ToastContainer'
import { useConfirm } from '../hooks/useConfirm'
import ConfirmDialog from '../components/ConfirmDialog'

const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { confirm, isOpen, confirmState } = useConfirm()

  if (!user) {
    navigate('/login')
    return null
  }

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: '退出登录',
      message: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      variant: 'danger'
    })

    if (confirmed) {
      logout()
      navigate('/login')
    }
  }

  const settingsSections = [
    {
      title: '通知设置',
      items: [
        { label: '订单通知', type: 'toggle', value: true },
        { label: '营销推送', type: 'toggle', value: false },
      ]
    },
    {
      title: '隐私设置',
      items: [
        { label: '个人资料可见性', type: 'select', value: '仅自己可见' },
      ]
    },
    {
      title: '其他',
      items: [
        { label: '清除缓存', type: 'button', action: () => showToast({ title: '成功', content: '缓存已清除', type: 'success' }) },
        { label: '关于我们', type: 'link', path: '/about' },
        { label: '用户协议', type: 'link', path: '/user-agreement' },
        { label: '隐私政策', type: 'link', path: '/privacy-policy' },
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
        <h1 style={{ fontSize: '24px', margin: 0 }}>设置</h1>
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
                {item.type === 'button' && <span style={{ color: '#667eea' }}>执行</span>}
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
        退出登录
      </button>
    </div>
    </>
  )
}

export default SettingsPage
