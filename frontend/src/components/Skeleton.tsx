import './Skeleton.css'

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  count?: number
  className?: string
}

const Skeleton = ({
  variant = 'rectangular',
  width,
  height,
  count = 1,
  className = '',
}: SkeletonProps) => {
  const getStyle = () => {
    const style: React.CSSProperties = {}

    if (width) {
      style.width = typeof width === 'number' ? `${width}px` : width
    }

    if (height) {
      style.height = typeof height === 'number' ? `${height}px` : height
    }

    return style
  }

  const renderSkeleton = () => (
    <div
      className={`skeleton skeleton-${variant} ${className}`}
      style={getStyle()}
    />
  )

  if (count === 1) {
    return renderSkeleton()
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{ marginBottom: '8px' }}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  )
}

// 预设组件
export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="skeleton-text-container">
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        width={index === lines - 1 ? '60%' : '100%'}
        height={16}
      />
    ))}
  </div>
)

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <Skeleton variant="rectangular" height={200} />
    <div className="skeleton-card-content">
      <Skeleton variant="text" height={24} />
      <Skeleton variant="text" height={16} width="80%" />
      <div className="skeleton-card-footer">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>
    </div>
  </div>
)

export const SkeletonList = ({ count = 5 }: { count?: number }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-list-item">
        <Skeleton variant="rectangular" width={80} height={80} />
        <div className="skeleton-list-content">
          <Skeleton variant="text" height={20} width="70%" />
          <Skeleton variant="text" height={16} width="50%" />
          <Skeleton variant="text" height={14} width="30%" />
        </div>
      </div>
    ))}
  </div>
)

export default Skeleton
