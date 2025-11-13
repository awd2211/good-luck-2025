import './Skeleton.css'

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
  count?: number
  className?: string
}

const Skeleton = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  count = 1,
  className = '',
}: SkeletonProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return {
          width: width || '40px',
          height: height || '40px',
          borderRadius: '50%',
        }
      case 'rectangular':
        return {
          width: width || '100%',
          height: height || '120px',
          borderRadius: '8px',
        }
      case 'card':
        return {
          width: width || '100%',
          height: height || '200px',
          borderRadius: '12px',
        }
      case 'text':
      default:
        return {
          width: width || '100%',
          height: height || '20px',
          borderRadius: '4px',
        }
    }
  }

  const skeletonClass = `skeleton skeleton-${animation} ${className}`

  if (count > 1) {
    return (
      <div className="skeleton-group">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={skeletonClass} style={getVariantStyles()} />
        ))}
      </div>
    )
  }

  return <div className={skeletonClass} style={getVariantStyles()} />
}

// Pre-built skeleton components for common use cases
export const SkeletonCard = () => (
  <div className="skeleton-card-wrapper">
    <div className="skeleton-card-content">
      <Skeleton variant="rectangular" width="64px" height="64px" />
      <div className="skeleton-card-info">
        <Skeleton variant="text" width="60%" height="16px" />
        <Skeleton variant="text" width="90%" height="14px" />
        <Skeleton variant="text" width="40%" height="18px" />
      </div>
    </div>
  </div>
)

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
)

export const SkeletonProfile = () => (
  <div className="skeleton-profile">
    <div className="skeleton-profile-header">
      <Skeleton variant="circular" width="80px" height="80px" />
      <div className="skeleton-profile-info">
        <Skeleton variant="text" width="120px" height="20px" />
        <Skeleton variant="text" width="180px" height="14px" />
      </div>
    </div>
    <div className="skeleton-stats">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton-stat-item">
          <Skeleton variant="text" width="40px" height="24px" />
          <Skeleton variant="text" width="60px" height="14px" />
        </div>
      ))}
    </div>
  </div>
)

export const SkeletonFortune = () => (
  <div className="skeleton-fortune">
    <div className="skeleton-fortune-hero">
      <Skeleton variant="circular" width="80px" height="80px" animation="wave" />
      <Skeleton variant="text" width="200px" height="28px" animation="wave" />
      <Skeleton variant="text" width="150px" height="16px" animation="wave" />
    </div>
    <div className="skeleton-fortune-content">
      <Skeleton variant="text" count={3} />
      <div style={{ marginTop: '20px' }}>
        <Skeleton variant="rectangular" height="200px" />
      </div>
    </div>
  </div>
)

export default Skeleton
