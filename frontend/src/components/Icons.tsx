/**
 * SVG图标组件
 * 替换emoji为专业图标
 */

interface IconProps {
  size?: number
  color?: string
  className?: string
}

// 生肖图标
export const BirthAnimalIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
)

// 八字图标
export const BaziIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <path d="M8 8h8M8 16h8" />
  </svg>
)

// 流年运势图标
export const FlowYearIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </svg>
)

// 姓名详批图标
export const NameDetailIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <path d="M12 3v4M12 11v10" />
  </svg>
)

// 婚姻分析图标
export const MarriageIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

// 测终生运图标
export const LifeFortuneIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

// 事业图标
export const CareerIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)

// 桃花运图标
export const PeachBlossomIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="8" r="6" />
    <path d="M12 14v7M9 21h6M15 8a3 3 0 0 0-6 0" />
  </svg>
)

// 取名改名图标
export const NameChangeIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

// 图标映射
export const FortuneIcons: { [key: string]: React.FC<IconProps> } = {
  'birth-animal': BirthAnimalIcon,
  'bazi': BaziIcon,
  'flow-year': FlowYearIcon,
  'name-detail': NameDetailIcon,
  'marriage': MarriageIcon,
  'life-fortune': LifeFortuneIcon,
  'career': CareerIcon,
  'year-2025': FlowYearIcon,
  'zodiac-2025': BirthAnimalIcon,
  'peach-blossom': PeachBlossomIcon,
  'marriage-calculation': MarriageIcon,
  'pre-marriage': MarriageIcon,
  'name-change': NameChangeIcon,
}

/**
 * 使用示例:
 *
 * import { BirthAnimalIcon, FortuneIcons } from './components/Icons'
 *
 * // 直接使用
 * <BirthAnimalIcon size={32} color="#ff6b6b" />
 *
 * // 通过映射使用
 * const Icon = FortuneIcons['birth-animal']
 * <Icon size={24} color="#666" />
 */
