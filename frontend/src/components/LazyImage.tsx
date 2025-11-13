import { useState, useEffect, useRef, CSSProperties } from 'react';
import './LazyImage.css';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
  className = '',
  style,
  width,
  height,
  onLoad,
  onError
}: LazyImageProps) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // 检查浏览器是否支持 IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      // 不支持则直接加载
      setImageSrc(src);
      return;
    }

    // 创建 IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 图片进入视口，开始加载
            setImageSrc(src);
            // 停止观察
            if (imageRef && observerRef.current) {
              observerRef.current.unobserve(imageRef);
            }
          }
        });
      },
      {
        // 提前 50px 开始加载
        rootMargin: '50px'
      }
    );

    // 开始观察
    if (imageRef) {
      observerRef.current.observe(imageRef);
    }

    // 清理
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [imageRef, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  return (
    <div
      className={`lazy-image-container ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
        ...style
      }}
    >
      <img
        ref={setImageRef}
        src={imageSrc}
        alt={alt}
        className={`lazy-image ${isLoaded ? 'loaded' : ''} ${isError ? 'error' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
      {!isLoaded && !isError && (
        <div className="lazy-image-placeholder">
          <div className="skeleton"></div>
        </div>
      )}
      {isError && (
        <div className="lazy-image-error">
          <span>图片加载失败</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
