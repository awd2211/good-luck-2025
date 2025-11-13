import { useState, useMemo } from 'react'
import { Input, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

interface MenuSearchProps {
  menuConfig: any[]
  onSelect: (key: string) => void
  collapsed: boolean
}

const MenuSearch = ({ menuConfig, onSelect, collapsed }: MenuSearchProps) => {
  const [searchValue, setSearchValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // 扁平化菜单项，便于搜索
  const flatMenuItems = useMemo(() => {
    const items: Array<{ key: string; label: string; parentLabel?: string }> = []

    menuConfig.forEach(item => {
      if (item.children) {
        item.children.forEach((child: any) => {
          items.push({
            key: child.key,
            label: child.label,
            parentLabel: item.label,
          })
        })
      } else if (item.path) {
        items.push({
          key: item.path,
          label: item.label,
        })
      }
    })

    return items
  }, [menuConfig])

  // 根据搜索值过滤菜单项
  const filteredItems = useMemo(() => {
    if (!searchValue.trim()) return []

    return flatMenuItems.filter(item =>
      item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.parentLabel?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [searchValue, flatMenuItems])

  const handleSelect = (key: string) => {
    onSelect(key)
    setSearchValue('')
    setIsFocused(false)
  }

  if (collapsed) {
    return null
  }

  return (
    <div style={{ padding: '12px 12px 8px' }}>
      <Input
        placeholder="搜索菜单..."
        prefix={<SearchOutlined />}
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        allowClear
        style={{ marginBottom: 8 }}
      />

      {/* 搜索结果下拉 */}
      {isFocused && searchValue && (
        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            top: 56,
            background: '#1f1f1f',
            borderRadius: 4,
            zIndex: 1000,
            maxHeight: 300,
            overflowY: 'auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
          }}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div
                key={item.key}
                onClick={() => handleSelect(item.key)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ color: '#fff', fontSize: 14 }}>
                  {item.label}
                </div>
                {item.parentLabel && (
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>
                    {item.parentLabel}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="无匹配结果"
                style={{ margin: 0 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MenuSearch
