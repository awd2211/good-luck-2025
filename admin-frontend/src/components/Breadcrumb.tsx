import { useMemo } from 'react'
import { Breadcrumb as AntBreadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'

interface MenuItem {
  key: string
  label: string
  path?: string
  children?: MenuItem[]
}

interface BreadcrumbProps {
  menuConfig: MenuItem[]
}

const Breadcrumb = ({ menuConfig }: BreadcrumbProps) => {
  const location = useLocation()
  const navigate = useNavigate()

  const breadcrumbItems = useMemo(() => {
    const currentPath = location.pathname

    // 如果是首页，只显示首页
    if (currentPath === '/') {
      return [
        {
          title: (
            <span>
              <HomeOutlined style={{ marginRight: 4 }} />
              数据概览
            </span>
          ),
        },
      ]
    }

    // 查找当前路径在菜单中的位置
    let parentItem: MenuItem | null = null
    let currentItem: MenuItem | null = null

    for (const item of menuConfig) {
      if (item.children) {
        const found = item.children.find(child => child.key === currentPath)
        if (found) {
          parentItem = item
          currentItem = found
          break
        }
      } else if (item.path === currentPath) {
        currentItem = item
        break
      }
    }

    const items = [
      {
        title: (
          <a onClick={() => navigate('/')}>
            <HomeOutlined style={{ marginRight: 4 }} />
            首页
          </a>
        ),
      },
    ]

    if (parentItem) {
      items.push({
        title: <span>{parentItem.label}</span>,
      })
    }

    if (currentItem) {
      items.push({
        title: <span>{currentItem.label}</span>,
      })
    }

    return items
  }, [location.pathname, menuConfig, navigate])

  return <AntBreadcrumb items={breadcrumbItems} />
}

export default Breadcrumb
