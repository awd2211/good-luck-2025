import { useState, useMemo, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme, Dropdown, Avatar, ConfigProvider, Switch, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  StarOutlined,
  BarChartOutlined,
  SettingOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  BellOutlined,
  DollarOutlined,
  TransactionOutlined,
  MessageOutlined,
  LikeOutlined,
  GiftOutlined,
  AppstoreOutlined,
  FundOutlined,
  RocketOutlined,
  CustomerServiceOutlined,
  ToolOutlined,
  BulbOutlined,
  BulbFilled,
  TagsOutlined,
  ApiOutlined,
  FileOutlined,
  CalendarOutlined,
  FormOutlined,
  RobotOutlined,
  FunnelPlotOutlined,
  MailOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { Permission } from '../config/permissions'
import { useTheme } from '../contexts/ThemeContext'
import Breadcrumb from '../components/Breadcrumb'
import MenuSearch from '../components/MenuSearch'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>([])
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const checkPermission = usePermission()
  const { theme: currentTheme, toggleTheme } = useTheme()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  // 定义菜单结构及权限
  const menuConfig = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '数据概览',
      path: '/',
      permission: null,
    },
    {
      key: 'operations',
      icon: <AppstoreOutlined />,
      label: '运营管理',
      children: [
        {
          key: '/users',
          icon: <UserOutlined />,
          label: '用户管理',
          permission: Permission.USER_VIEW,
        },
        {
          key: '/orders',
          icon: <ShoppingOutlined />,
          label: '订单管理',
          permission: Permission.ORDER_VIEW,
        },
        {
          key: '/attribution',
          icon: <FunnelPlotOutlined />,
          label: '归因统计',
          permission: Permission.STATS_VIEW,
        },
      ],
    },
    {
      key: 'fortune',
      icon: <StarOutlined />,
      label: '算命管理',
      children: [
        {
          key: '/fortunes',
          icon: <StarOutlined />,
          label: '算命记录',
          permission: Permission.FORTUNE_VIEW,
        },
        {
          key: '/fortune-categories',
          icon: <TagsOutlined />,
          label: '分类管理',
          permission: Permission.FORTUNE_CATEGORY_VIEW,
        },
        {
          key: '/fortune-services',
          icon: <ApiOutlined />,
          label: '服务管理',
          permission: Permission.FORTUNE_SERVICE_VIEW,
        },
        {
          key: '/fortune-templates',
          icon: <FormOutlined />,
          label: '模板管理',
          permission: Permission.FORTUNE_CONTENT_VIEW,
        },
        {
          key: '/daily-horoscopes',
          icon: <CalendarOutlined />,
          label: '每日运势',
          permission: Permission.FORTUNE_CONTENT_VIEW,
        },
        {
          key: '/articles',
          icon: <FileOutlined />,
          label: '文章管理',
          permission: Permission.FORTUNE_CONTENT_VIEW,
        },
      ],
    },
    {
      key: 'financial',
      icon: <FundOutlined />,
      label: '财务中心',
      children: [
        {
          key: '/statistics',
          icon: <BarChartOutlined />,
          label: '统计分析',
          permission: Permission.STATS_VIEW,
        },
        {
          key: '/financial',
          icon: <DollarOutlined />,
          label: '财务管理',
          permission: Permission.FINANCIAL_VIEW,
        },
        {
          key: '/payment-transactions',
          icon: <TransactionOutlined />,
          label: '支付交易',
          permission: Permission.FINANCIAL_VIEW,
        },
        {
          key: '/payment-methods',
          icon: <DollarOutlined />,
          label: '支付方式',
          permission: Permission.FINANCIAL_VIEW,
        },
        {
          key: '/payment-configs',
          icon: <SettingOutlined />,
          label: '支付配置',
          permission: Permission.FINANCIAL_VIEW,
        },
        {
          key: '/refunds',
          icon: <TransactionOutlined />,
          label: '退款管理',
          permission: Permission.REFUND_VIEW,
        },
      ],
    },
    {
      key: 'marketing',
      icon: <RocketOutlined />,
      label: '营销管理',
      children: [
        {
          key: '/coupons',
          icon: <GiftOutlined />,
          label: '优惠券管理',
          permission: Permission.COUPON_VIEW,
        },
        {
          key: '/banners',
          icon: <PictureOutlined />,
          label: '轮播图管理',
          permission: Permission.BANNER_VIEW,
        },
        {
          key: '/notifications',
          icon: <BellOutlined />,
          label: '通知管理',
          permission: Permission.NOTIFICATION_VIEW,
        },
        {
          key: '/notification-templates',
          icon: <FileTextOutlined />,
          label: '通知模板',
          permission: Permission.NOTIFICATION_VIEW,
        },
        {
          key: '/share-analytics',
          icon: <ShareAltOutlined />,
          label: '分享统计',
          permission: Permission.STATS_VIEW,
        },
      ],
    },
    {
      key: 'service',
      icon: <CustomerServiceOutlined />,
      label: '客户服务',
      children: [
        {
          key: '/feedbacks',
          icon: <MessageOutlined />,
          label: '用户反馈',
          permission: Permission.FEEDBACK_VIEW,
        },
        {
          key: '/reviews',
          icon: <LikeOutlined />,
          label: '评价管理',
          permission: Permission.REVIEW_VIEW,
        },
      ],
    },
    {
      key: 'customer-service',
      icon: <MessageOutlined />,
      label: '客服系统',
      children: [
        {
          key: '/customer-service',
          icon: <TeamOutlined />,
          label: '客服管理',
          permission: Permission.CS_AGENT_VIEW,
        },
        {
          key: '/cs-workbench',
          icon: <MessageOutlined />,
          label: '客服工作台',
          permission: Permission.CS_WORKBENCH_VIEW,
        },
      ],
    },
    {
      key: 'system',
      icon: <ToolOutlined />,
      label: '系统管理',
      children: [
        {
          key: '/admins',
          icon: <TeamOutlined />,
          label: '管理员管理',
          permission: Permission.ADMIN_VIEW,
        },
        {
          key: '/roles',
          icon: <TeamOutlined />,
          label: '角色管理',
          permission: Permission.ADMIN_VIEW,
        },
        {
          key: '/ai-models',
          icon: <RobotOutlined />,
          label: 'AI模型管理',
          permission: Permission.SYSTEM_CONFIG_VIEW,
        },
        {
          key: '/system-configs',
          icon: <SettingOutlined />,
          label: '系统配置',
          permission: Permission.SYSTEM_CONFIG_VIEW,
        },
        {
          key: '/email-templates',
          icon: <MailOutlined />,
          label: '邮件模板',
          permission: Permission.SYSTEM_CONFIG_VIEW,
        },
        {
          key: '/audit-log',
          icon: <FileTextOutlined />,
          label: '操作日志',
          permission: Permission.LOG_VIEW,
        },
      ],
    },
  ]

  // 过滤菜单项并构建 Ant Design Menu 数据结构
  const buildMenuItems = (items: any[]): MenuItem[] => {
    return items
      .map((item) => {
        // 如果是分组菜单
        if (item.children) {
          const children = buildMenuItems(item.children)
          // 如果过滤后没有子菜单，则不显示该分组
          if (children.length === 0) return null
          return {
            key: item.key,
            icon: item.icon,
            label: item.label,
            children,
          }
        }

        // 如果是叶子菜单项
        if (item.permission && !checkPermission.has(item.permission)) {
          return null
        }

        return {
          key: item.path || item.key,
          icon: item.icon,
          label: item.label,
        }
      })
      .filter(Boolean) as MenuItem[]
  }

  const menuItems = useMemo(() => {
    return buildMenuItems(menuConfig)
  }, [user, checkPermission])

  // 自动展开当前路由所在的子菜单
  useEffect(() => {
    const currentPath = location.pathname
    const parentKey = menuConfig.find(group =>
      group.children?.some(child => child.key === currentPath)
    )?.key

    if (parentKey && !openKeys.includes(parentKey)) {
      setOpenKeys([parentKey])
    }
  }, [location.pathname])

  // 控制子菜单展开/收起 - 手风琴模式（一次只展开一个）
  const onOpenChange = (keys: string[]) => {
    const latestOpenKey = keys.find(key => !openKeys.includes(key))
    // 如果是新打开的key，则关闭其他的
    if (latestOpenKey) {
      setOpenKeys([latestOpenKey])
    } else {
      setOpenKeys(keys)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人设置',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'theme',
      icon: currentTheme === 'dark' ? <BulbFilled /> : <BulbOutlined />,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          主题切换
          <Switch
            size="small"
            checked={currentTheme === 'dark'}
            onChange={toggleTheme}
            style={{ marginLeft: 8 }}
          />
        </span>
      ),
      onClick: (e: any) => {
        e.domEvent.stopPropagation()
      },
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <Tooltip title={collapsed ? '算命平台管理' : ''} placement="right">
            <div style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: collapsed ? 18 : 20,
              fontWeight: 'bold',
              transition: 'all 0.3s',
              cursor: 'default',
            }}>
              {collapsed ? '管理' : '算命平台管理'}
            </div>
          </Tooltip>

          {/* 菜单搜索 */}
          <MenuSearch
            menuConfig={menuConfig}
            onSelect={(key) => navigate(key)}
            collapsed={collapsed}
          />

          {/* 主菜单 */}
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={onOpenChange}
            items={menuItems}
            onClick={({ key }) => {
              // 只有点击叶子节点才导航
              const isGroup = menuConfig.some(item => item.key === key && item.children)
              if (!isGroup) {
                navigate(key)
              }
            }}
            style={{
              borderRight: 0,
            }}
          />
        </Sider>
        <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
          <Header style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <Tooltip title={collapsed ? '展开菜单' : '收起菜单'}>
              {collapsed ? (
                <MenuUnfoldOutlined
                  style={{
                    fontSize: 18,
                    cursor: 'pointer',
                    transition: 'color 0.3s',
                  }}
                  onClick={() => setCollapsed(!collapsed)}
                />
              ) : (
                <MenuFoldOutlined
                  style={{
                    fontSize: 18,
                    cursor: 'pointer',
                    transition: 'color 0.3s',
                  }}
                  onClick={() => setCollapsed(!collapsed)}
                />
              )}
            </Tooltip>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 8,
                transition: 'all 0.3s',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = currentTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <Avatar icon={<UserOutlined />} />
                <span>{user?.username || '管理员'}</span>
              </div>
            </Dropdown>
          </Header>
          <Content
            style={{
              margin: '24px 16px',
              minHeight: 280,
            }}
          >
            {/* 面包屑导航 */}
            <div style={{
              marginBottom: 16,
              padding: '12px 16px',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}>
              <Breadcrumb menuConfig={menuConfig} />
            </div>

            {/* 主内容区 */}
            <div style={{
              padding: 24,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              minHeight: 'calc(100vh - 200px)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default MainLayout
