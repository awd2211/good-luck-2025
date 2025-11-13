import { useState, useEffect, useRef, CSSProperties } from 'react'
import { imageLazyLoader, getOptimizedImageUrl } from '../utils/imageOptimization'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  placeholder?: string
  className?: string
  style?: CSSProperties
  lazy?: boolean
  onLoad?: () => void
  onError?: () => void
}

/**
 * 优化的图片组件
 * - 支持 WebP 格式自动切换
 * - 支持懒加载
 * - 支持占位符
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3C/svg%3E',
  className = '',
  style = {},
  lazy = true,
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState(lazy ? placeholder : src)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const loadImage = async () => {
      try {
        // 获取优化后的图片URL
        const optimizedUrl = await getOptimizedImageUrl(src)

        if (lazy && imgRef.current) {
          // 使用懒加载
          imgRef.current.dataset.src = optimizedUrl
          imageLazyLoader.observe(imgRef.current)
        } else {
          // 直接加载
          setImageSrc(optimizedUrl)
        }
      } catch (error) {
        console.error('Failed to load image:', error)
        setImageSrc(src)
        setHasError(true)
      }
    }

    loadImage()

    return () => {
      if (imgRef.current && lazy) {
        imageLazyLoader.unobserve(imgRef.current)
      }
    }
  }, [src, lazy])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setImageSrc(src) // 回退到原始图片
    onError?.()
  }

  const imgStyle: CSSProperties = {
    ...style,
    width,
    height,
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`optimized-image ${className} ${isLoaded ? 'loaded' : ''} ${hasError ? 'error' : ''}`}
      style={imgStyle}
      onLoad={handleLoad}
      onError={handleError}
      loading={lazy ? 'lazy' : 'eager'}
    />
  )
}

export default OptimizedImage

/**
 * 使用示例:
 *
 * // 基本使用
 * <OptimizedImage
 *   src="/images/photo.jpg"
 *   alt="Photo"
 *   width={300}
 *   height={200}
 * />
 *
 * // 禁用懒加载（首屏图片）
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Hero"
 *   lazy={false}
 * />
 *
 * // 自定义占位符
 * <OptimizedImage
 *   src="/images/avatar.jpg"
 *   alt="Avatar"
 *   placeholder="/images/placeholder.png"
 * />
 *
 * // 监听加载事件
 * <OptimizedImage
 *   src="/images/photo.jpg"
 *   alt="Photo"
 *   onLoad={() => console.log('Image loaded')}
 *   onError={() => console.log('Image failed')}
 * />
 */
